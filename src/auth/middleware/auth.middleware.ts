/**
 * Middleware d'authentification enterprise avec sécurité avancée
 * Inclut : Validation JWT, RBAC, rate limiting, audit logging
 */

import type { MiddlewareHandler } from 'astro';
import { validateAccessToken } from '../crypto/jwt.js';
import { authConfig } from '../config.js';
import { hashIP, hashUserAgent } from '../crypto/password.js';
import { db } from '../../db.js';
import type { User, Role, Permission, SecurityEvent } from '../types.js';

// ==================== INTERFACES ====================

interface AuthContext {
  user: User;
  roles: Role[];
  permissions: Permission[];
  sessionId: string;
  deviceId: string;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
}

interface SecurityHeaders extends Record<string, string> {
  'X-Content-Type-Options': 'nosniff';
  'X-Frame-Options': 'DENY';
  'X-XSS-Protection': '1; mode=block';
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains';
  'Content-Security-Policy': string;
  'Referrer-Policy': 'strict-origin-when-cross-origin';
  'Permissions-Policy': string;
}

// ==================== CACHE ET RATE LIMITING ====================

// Cache en mémoire pour les permissions (Redis en production)
const permissionsCache = new Map<string, { data: Permission[]; expires: number }>();
const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Rate limiting par IP avec sliding window
 */
function checkRateLimit(ipHash: string, endpoint: string): boolean {
  const key = `${ipHash}:${endpoint}`;
  const now = Date.now();
  const windowMs = authConfig.security.rateLimitWindow * 1000;
  const maxRequests = authConfig.security.rateLimitMax;
  
  const entry = rateLimitCache.get(key);
  
  if (!entry) {
    rateLimitCache.set(key, {
      count: 1,
      windowStart: now,
      blocked: false
    });
    return true;
  }
  
  // Reset window si expirée
  if (now - entry.windowStart > windowMs) {
    entry.count = 1;
    entry.windowStart = now;
    entry.blocked = false;
    return true;
  }
  
  // Incrémenter le compteur
  entry.count++;
  
  if (entry.count > maxRequests) {
    entry.blocked = true;
    return false;
  }
  
  return true;
}

/**
 * Récupère les permissions utilisateur avec cache
 */
async function getUserPermissions(userId: string): Promise<Permission[]> {
  const cacheKey = `perms:${userId}`;
  const cached = permissionsCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const result = await db.query(`
    SELECT DISTINCT p.id, p.name, p.resource, p.action, p.conditions
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = $1 AND ur.is_active = true
  `, [userId]);
  
  const permissions: Permission[] = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    resource: row.resource,
    action: row.action,
    conditions: row.conditions ? JSON.parse(row.conditions) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  
  // Cache for 5 minutes
  permissionsCache.set(cacheKey, {
    data: permissions,
    expires: Date.now() + (5 * 60 * 1000)
  });
  
  return permissions;
}

/**
 * Invalide le cache des permissions
 */
export function invalidatePermissionsCache(userId: string): void {
  const cacheKey = `perms:${userId}`;
  permissionsCache.delete(cacheKey);
}

// ==================== HEADERS DE SÉCURITÉ ====================

/**
 * Génère les headers de sécurité enterprise
 */
function getSecurityHeaders(): SecurityHeaders {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()"
  };
}

// ==================== LOGGING SÉCURISÉ ====================

/**
 * Log un événement de sécurité middleware
 */
async function logMiddlewareEvent(event: SecurityEvent): Promise<void> {
  const ipHash = event.ipAddress ? hashIP(event.ipAddress) : null;
  const userAgentHash = event.userAgent ? hashUserAgent(event.userAgent) : null;
  
  try {
    await db.query(`
      INSERT INTO audit_logs (
        user_id, session_id, action, resource, 
        ip_hash, user_agent_hash, success, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      event.userId || null,
      event.sessionId || null,
      event.type,
      'middleware',
      ipHash,
      userAgentHash,
      !event.type.includes('failure') && !event.type.includes('denied'),
      JSON.stringify(event.details || {})
    ]);
  } catch (error) {
    console.error('❌ Erreur lors du logging middleware:', error);
  }
}

// ==================== MIDDLEWARE PRINCIPAL ====================

/**
 * Middleware d'authentification principal
 */
export const authMiddleware: MiddlewareHandler = async (context, next) => {
  const { request, url } = context;
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipHash = hashIP(clientIP);
  
  // Ajouter les headers de sécurité
  const securityHeaders = getSecurityHeaders();
  
  try {
    // ==================== RATE LIMITING ====================
    
    const endpoint = url.pathname;
    if (!checkRateLimit(ipHash, endpoint)) {
      await logMiddlewareEvent({
        type: 'suspicious_location',
        ipAddress: clientIP,
        userAgent,
        details: { reason: 'rate_limit_exceeded', endpoint },
        severity: 'high'
      });
      
      return new Response('Trop de requêtes', { 
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': '60'
        }
      });
    }
    
    // ==================== ROUTES PUBLIQUES ====================
    
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/'];
    const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/jwks'];
    
    if (publicRoutes.includes(url.pathname) || publicApiRoutes.includes(url.pathname)) {
      const response = await next();
      
      // Ajouter les headers de sécurité
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
    
    // ==================== AUTHENTIFICATION ====================
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Token d\'authentification manquant', { 
        status: 401,
        headers: securityHeaders 
      });
    }
    
    const token = authHeader.slice(7);
    
    try {
      // Valider le JWT
      const payload = await validateAccessToken(token);
      
      // Récupérer les informations utilisateur complètes
      const userResult = await db.query(`
        SELECT 
          u.id, u.email, u.first_name as "firstName", u.last_name as "lastName",
          u.is_active as "isActive", u.created_at as "createdAt", u.updated_at as "updatedAt"
        FROM users u 
        WHERE u.id = $1 AND u.is_active = true
      `, [payload.sub]);
      
      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur introuvable ou inactif');
      }
      
      const user: User = userResult.rows[0];
      
      // Récupérer les rôles
      const rolesResult = await db.query(`
        SELECT r.id, r.name, r.description, r.level
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND ur.is_active = true
      `, [user.id]);
      
      const roles: Role[] = rolesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        level: row.level,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      // Récupérer les permissions
      const permissions = await getUserPermissions(user.id);
      
      // Créer le contexte d'authentification
      const authContext: AuthContext = {
        user,
        roles,
        permissions,
        sessionId: payload.sid || '',
        deviceId: payload.deviceId || ''
      };
      
      // Ajouter le contexte à la requête
      (context as any).auth = authContext;
      
      // Log de succès
      await logMiddlewareEvent({
        type: 'login_success',
        userId: user.id,
        sessionId: authContext.sessionId,
        ipAddress: clientIP,
        userAgent,
        details: { endpoint, method: request.method },
        severity: 'low'
      });
      
    } catch (jwtError) {
      const errorMessage = jwtError instanceof Error ? jwtError.message : 'Token invalide';
      
      await logMiddlewareEvent({
        type: 'login_failure',
        ipAddress: clientIP,
        userAgent,
        details: { 
          reason: 'invalid_token', 
          error: errorMessage,
          endpoint 
        },
        severity: 'medium'
      });
      
      return new Response('Token d\'authentification invalide', { 
        status: 401,
        headers: securityHeaders 
      });
    }
    
    // Continuer vers la route suivante
    const response = await next();
    
    // Ajouter les headers de sécurité à la réponse
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur middleware auth:', errorMessage);
    
    await logMiddlewareEvent({
      type: 'login_failure',
      ipAddress: clientIP,
      userAgent,
      details: { 
        reason: 'middleware_error', 
        error: errorMessage,
        endpoint: url.pathname 
      },
      severity: 'high'
    });
    
    return new Response('Erreur d\'authentification', { 
      status: 500,
      headers: getSecurityHeaders()
    });
  }
};

// ==================== MIDDLEWARE DE PERMISSIONS ====================

/**
 * Middleware pour vérifier les permissions RBAC/ABAC
 */
export function requirePermission(resource: string, action: string) {
  return async (context: any, next: () => Promise<Response>) => {
    const authContext: AuthContext = context.auth;
    
    if (!authContext) {
      return new Response('Non authentifié', { status: 401 });
    }
    
    // Vérifier si l'utilisateur a la permission
    const hasPermission = authContext.permissions.some(permission => 
      permission.resource === resource && 
      permission.action === action
    );
    
    if (!hasPermission) {
      await logMiddlewareEvent({
        type: 'login_failure',
        userId: authContext.user.id,
        sessionId: authContext.sessionId,
        details: { 
          reason: 'permission_denied',
          resource,
          action,
          endpoint: context.url.pathname
        },
        severity: 'medium'
      });
      
      return new Response('Permission insuffisante', { status: 403 });
    }
    
    return await next();
  };
}

/**
 * Middleware pour vérifier les rôles
 */
export function requireRole(roleName: string) {
  return async (context: any, next: () => Promise<Response>) => {
    const authContext: AuthContext = context.auth;
    
    if (!authContext) {
      return new Response('Non authentifié', { status: 401 });
    }
    
    const hasRole = authContext.roles.some(role => role.name === roleName);
    
    if (!hasRole) {
      await logMiddlewareEvent({
        type: 'login_failure',
        userId: authContext.user.id,
        sessionId: authContext.sessionId,
        details: { 
          reason: 'role_denied',
          requiredRole: roleName,
          userRoles: authContext.roles.map(r => r.name),
          endpoint: context.url.pathname
        },
        severity: 'medium'
      });
      
      return new Response('Rôle insuffisant', { status: 403 });
    }
    
    return await next();
  };
}

// ==================== UTILITAIRES ====================

/**
 * Extrait le contexte d'authentification depuis Astro context
 */
export function getAuthContext(context: any): AuthContext | null {
  return context.auth || null;
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(
  authContext: AuthContext, 
  resource: string, 
  action: string
): boolean {
  return authContext.permissions.some(permission => 
    permission.resource === resource && 
    permission.action === action
  );
}

/**
 * Vérifie si un utilisateur a un rôle spécifique
 */
export function hasRole(authContext: AuthContext, roleName: string): boolean {
  return authContext.roles.some(role => role.name === roleName);
}

/**
 * Nettoyage périodique des caches
 */
setInterval(() => {
  const now = Date.now();
  
  // Nettoyer le cache des permissions
  for (const [key, value] of permissionsCache.entries()) {
    if (value.expires < now) {
      permissionsCache.delete(key);
    }
  }
  
  // Nettoyer le cache de rate limiting
  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.windowStart > authConfig.security.rateLimitWindow * 1000) {
      rateLimitCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Toutes les 5 minutes
