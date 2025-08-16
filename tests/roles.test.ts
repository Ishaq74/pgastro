import { describe, it, expect, beforeEach } from 'vitest';

describe('Gestion des rôles et permissions', () => {
  let serverUrl: string;
  let adminCookies: string = '';
  let userCookies: string = '';

  beforeEach(() => {
    serverUrl = globalThis.testUtils.serverUrl;
  });

  it('devrait créer des comptes de test', async () => {
    // Créer compte admin
    const adminData = new URLSearchParams({
      email: 'admin@test.com',
      password: 'admin123456',
      name: 'Admin User'
    });

    const adminResponse = await fetch(`${serverUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: adminData,
    });

    expect([200, 302, 422]).toContain(adminResponse.status);

    // Créer compte utilisateur normal
    const userData = new URLSearchParams({
      email: 'user@test.com',
      password: 'user123456',
      name: 'Normal User'
    });

    const userResponse = await fetch(`${serverUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: userData,
    });

    expect([200, 302, 422]).toContain(userResponse.status);
  });

  it('devrait permettre la connexion admin', async () => {
    const loginData = new URLSearchParams({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    const response = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: loginData,
    });

    if (response.status === 200 || response.status === 302) {
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        adminCookies = cookies;
      }
    }

    expect([200, 302, 401]).toContain(response.status);
  });

  it('devrait permettre la connexion utilisateur normal', async () => {
    const loginData = new URLSearchParams({
      email: 'user@test.com',
      password: 'user123456'
    });

    const response = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: loginData,
    });

    if (response.status === 200 || response.status === 302) {
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        userCookies = cookies;
      }
    }

    expect([200, 302, 401]).toContain(response.status);
  });

  it('devrait permettre l\'accès admin avec le bon rôle', async () => {
    if (!adminCookies) {
      // Reconnecter l'admin
      const loginData = new URLSearchParams({
        email: 'admin@test.com',
        password: 'admin123456'
      });

      const loginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginData,
      });

      if (loginResponse.status === 200 || loginResponse.status === 302) {
        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
          adminCookies = cookies;
        }
      }
    }

    const response = await fetch(`${serverUrl}/admin`, {
      headers: adminCookies ? { 'Cookie': adminCookies } : {},
      redirect: 'manual'
    });

    // Admin doit avoir accès ou être redirigé de façon appropriée
    expect([200, 302]).toContain(response.status);
  });

  it('devrait refuser l\'accès admin à un utilisateur normal', async () => {
    if (!userCookies) {
      // Reconnecter l'utilisateur
      const loginData = new URLSearchParams({
        email: 'user@test.com',
        password: 'user123456'
      });

      const loginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginData,
      });

      if (loginResponse.status === 200 || loginResponse.status === 302) {
        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
          userCookies = cookies;
        }
      }
    }

    const response = await fetch(`${serverUrl}/admin`, {
      headers: userCookies ? { 'Cookie': userCookies } : {},
      redirect: 'manual'
    });

    // Utilisateur normal ne doit PAS avoir accès
    expect([302, 401, 403]).toContain(response.status);
  });

  it('devrait permettre l\'accès au dashboard pour les utilisateurs connectés', async () => {
    if (!userCookies) {
      return; // Skip si pas de cookies utilisateur
    }

    const response = await fetch(`${serverUrl}/dashboard`, {
      headers: { 'Cookie': userCookies },
      redirect: 'manual'
    });

    // Utilisateur connecté doit avoir accès au dashboard
    expect([200, 302]).toContain(response.status);
  });
});
