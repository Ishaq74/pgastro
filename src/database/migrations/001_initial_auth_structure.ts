/**
 * Migration 001 - Structure de base enterprise avec sécurité renforcée
 * PostgreSQL + UUIDs + Chiffrement + RGPD compliance
 */

import { db } from '../../db.js';

export const up = `
-- Extensions PostgreSQL requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== 1. UTILISATEURS (données métier) ====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 2. AUTHENTIFICATION (séparée + chiffrée) ====================
CREATE TABLE user_auth (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  two_fa_secret_encrypted TEXT, -- chiffré avec pgcrypto
  two_fa_enabled BOOLEAN DEFAULT false,
  backup_codes_hash TEXT[] -- codes de secours hashés
);

-- ==================== 3. SESSIONS avec binding appareil + famille tokens ====================
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rt_hash_current TEXT NOT NULL, -- hash du refresh token actuel
  rt_family_id UUID NOT NULL,    -- famille de tokens pour reuse-detection
  device_id TEXT NOT NULL,       -- binding appareil
  device_info_hash TEXT,         -- UA hashé (RGPD)
  ip_address_hash TEXT,          -- IP pseudonymisée
  asn INTEGER,                   -- ASN pour détection géo
  country_code CHAR(2),          -- pays pour alertes
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 4. CLÉS JWT (métadonnées seulement - clés dans KMS) ====================
CREATE TABLE jwt_keys (
  kid TEXT PRIMARY KEY,
  algorithm TEXT NOT NULL DEFAULT 'RS256',
  kms_key_id TEXT NOT NULL,      -- référence KMS/HSM
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  retired_at TIMESTAMPTZ,       -- période de grâce
  CONSTRAINT valid_algorithm CHECK (algorithm IN ('RS256', 'EdDSA'))
);

-- ==================== 5. DENYLIST tokens pour logout global ====================
CREATE TABLE revoked_tokens (
  jti TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT NOT NULL
);

-- ==================== 6. RÔLES RBAC + ABAC ====================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions JSONB, -- ABAC conditions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ==================== 7. RESET PASSWORD sécurisé ====================
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,    -- hash du token, pas token en clair
  used_at TIMESTAMPTZ,
  ip_hash TEXT,               -- IP pseudonymisée
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 8. AUDIT LOGS RGPD-compliant ====================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  ip_hash TEXT,              -- pseudonymisé
  user_agent_hash TEXT,      -- pseudonymisé
  success BOOLEAN NOT NULL,
  details JSONB,             -- données techniques sans PII
  retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 9. FILTRES IP avec CIDR ====================
CREATE TABLE ip_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr_range INET NOT NULL,   -- support IPv4/IPv6 + CIDR
  filter_type TEXT NOT NULL,  -- 'allow' ou 'deny'
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_filter_type CHECK (filter_type IN ('allow', 'deny'))
);

-- ==================== 10. ALERTES SÉCURITÉ ====================
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hash TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDICES CRITIQUES pour performance ====================

-- Sessions actives par utilisateur (le plus important)
CREATE INDEX CONCURRENTLY idx_sessions_user_active 
  ON sessions(user_id, revoked_at) WHERE revoked_at IS NULL;

-- Famille de tokens pour reuse-detection
CREATE INDEX CONCURRENTLY idx_sessions_family 
  ON sessions(rt_family_id);

-- Sessions expirées pour cleanup automatique
CREATE INDEX CONCURRENTLY idx_sessions_expired 
  ON sessions(expires_at) WHERE expires_at < NOW();

-- Audit logs par utilisateur et date (requêtes fréquentes)
CREATE INDEX CONCURRENTLY idx_audit_logs_user_time 
  ON audit_logs(user_id, created_at);

-- Audit logs pour rétention RGPD
CREATE INDEX CONCURRENTLY idx_audit_logs_retention 
  ON audit_logs(retention_until) WHERE retention_until < NOW();

-- Tokens révoqués actifs pour vérification rapide
CREATE INDEX CONCURRENTLY idx_revoked_tokens_exp 
  ON revoked_tokens(expires_at) WHERE expires_at > NOW();

-- Index unique pour user_auth (FK optimisé)
CREATE UNIQUE INDEX CONCURRENTLY idx_user_auth_user_id 
  ON user_auth(user_id);

-- Email users pour login rapide
CREATE UNIQUE INDEX CONCURRENTLY idx_users_email_active 
  ON users(email) WHERE is_active = true;

-- Clés JWT actives
CREATE INDEX CONCURRENTLY idx_jwt_keys_active 
  ON jwt_keys(kid, is_active) WHERE is_active = true;

-- Password resets valides
CREATE INDEX CONCURRENTLY idx_password_resets_valid 
  ON password_resets(user_id, expires_at) WHERE used_at IS NULL AND expires_at > NOW();

-- ==================== TRIGGERS pour updated_at ====================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger sur users
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== RLS (Row Level Security) pour multi-tenant ====================

-- Activer RLS sur les tables sensibles
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateurs ne voient que leurs propres données
CREATE POLICY user_own_audit_logs ON audit_logs 
  FOR ALL TO authenticated_user 
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_own_sessions ON sessions 
  FOR ALL TO authenticated_user 
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_own_alerts ON security_alerts 
  FOR ALL TO authenticated_user 
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- ==================== RÔLES DE BASE ====================

-- Insérer les rôles de base
INSERT INTO roles (name, description) VALUES 
  ('super_admin', 'Accès complet au système'),
  ('admin', 'Administration des utilisateurs et contenu'),
  ('editor', 'Édition du contenu'),
  ('user', 'Utilisateur standard');

-- Permissions de base
INSERT INTO permissions (name, resource, action) VALUES 
  ('admin_full', '*', '*'),
  ('users_read', 'users', 'read'),
  ('users_write', 'users', 'write'),
  ('users_delete', 'users', 'delete'),
  ('content_read', 'content', 'read'),
  ('content_write', 'content', 'write'),
  ('content_publish', 'content', 'publish'),
  ('smtp_config', 'smtp', 'config'),
  ('smtp_test', 'smtp', 'test');

-- Associer permissions aux rôles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'super_admin' AND p.name = 'admin_full';

-- ==================== FONCTIONS UTILITAIRES ====================

-- Fonction pour hasher une IP (RGPD)
CREATE OR REPLACE FUNCTION hash_ip(ip_address TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(ip_address || current_setting('app.ip_salt', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les données expirées
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Nettoyer tokens révoqués expirés
  DELETE FROM revoked_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Nettoyer sessions expirées
  DELETE FROM sessions WHERE expires_at < NOW();
  
  -- Nettoyer audit logs selon rétention RGPD
  DELETE FROM audit_logs WHERE retention_until < NOW();
  
  -- Nettoyer password resets expirés
  DELETE FROM password_resets WHERE expires_at < NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== MONITORING & HEALTH ====================

-- Vue pour monitoring des sessions actives
CREATE VIEW active_sessions_summary AS
SELECT 
  COUNT(*) as total_active_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT country_code) as countries,
  AVG(EXTRACT(EPOCH FROM (NOW() - last_used_at))/60) as avg_idle_minutes
FROM sessions 
WHERE revoked_at IS NULL AND expires_at > NOW();

-- Vue pour monitoring sécurité
CREATE VIEW security_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  action,
  success,
  COUNT(*) as event_count
FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action, success
ORDER BY hour DESC;
`;

export const down = `
-- Supprimer dans l'ordre inverse pour respecter les contraintes FK
DROP VIEW IF EXISTS security_summary;
DROP VIEW IF EXISTS active_sessions_summary;
DROP FUNCTION IF EXISTS cleanup_expired_data();
DROP FUNCTION IF EXISTS hash_ip(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS ip_filters CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS revoked_tokens CASCADE;
DROP TABLE IF EXISTS jwt_keys CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_auth CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les extensions si plus utilisées
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";
`;

/**
 * Exécute la migration initiale
 */
export async function runInitialMigration(): Promise<void> {
  const client = await db.connect();
  
  try {
    console.log('🔧 Exécution de la migration initiale...');
    await client.query(up);
    console.log('✅ Migration initiale terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration initiale:', error);
    throw error;
  } finally {
    await client.end();
  }
}
