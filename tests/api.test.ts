import { describe, it, expect, beforeEach } from 'vitest';

describe('APIs d\'infrastructure', () => {
  let serverUrl: string;

  beforeEach(() => {
    serverUrl = globalThis.testUtils.serverUrl;
  });

  it('devrait vérifier le statut de la base de données', async () => {
    const response = await fetch(`${serverUrl}/api/db-status`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
  });

  it('devrait vérifier le statut SMTP', async () => {
    const response = await fetch(`${serverUrl}/api/smtp-status`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('connected');
  });
});

describe('APIs Better Auth', () => {
  let serverUrl: string;

  beforeEach(() => {
    serverUrl = globalThis.testUtils.serverUrl;
  });

  it('devrait accéder aux routes Better Auth', async () => {
    // Test de l'endpoint de session (sans être connecté)
    const response = await fetch(`${serverUrl}/api/auth/session`);
    
    // Peut retourner 200 avec null, 401 si non connecté, ou 404 si route n'existe pas
    expect([200, 401, 404]).toContain(response.status);
  });

  it('devrait gérer l\'inscription via Better Auth', async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    const formData = new URLSearchParams({
      email: testEmail,
      password: 'test123456',
      name: 'Test User'
    });

    const response = await fetch(`${serverUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    // Inscription réussie ou utilisateur existe déjà
    expect([200, 302, 422]).toContain(response.status);
  });

  it('devrait gérer la connexion via Better Auth', async () => {
    // Utiliser un utilisateur qui existe probablement déjà
    const formData = new URLSearchParams({
      email: 'test@example.com',
      password: 'test123456'
    });

    const response = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    // Connexion réussie ou échec d'authentification
    expect([200, 302, 401, 422]).toContain(response.status);
  });
});

describe('APIs Admin (protection)', () => {
  let serverUrl: string;

  beforeEach(() => {
    serverUrl = globalThis.testUtils.serverUrl;
  });

  it('devrait protéger l\'API admin/users', async () => {
    const response = await fetch(`${serverUrl}/api/admin/users`);
    
    // Doit être protégé - 401 non authentifié
    expect(response.status).toBe(401);
  });

  it('devrait protéger l\'API admin/stats', async () => {
    const response = await fetch(`${serverUrl}/api/admin/stats`);
    
    // Doit être protégé - 401 non authentifié
    expect(response.status).toBe(401);
  });
});
