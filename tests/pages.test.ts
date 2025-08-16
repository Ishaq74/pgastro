import { describe, it, expect, beforeEach } from 'vitest';

describe('Pages d\'authentification', () => {
  let serverUrl: string;

  beforeEach(() => {
    serverUrl = globalThis.testUtils.serverUrl;
  });

  it('devrait charger la page d\'accueil', async () => {
    const response = await fetch(`${serverUrl}/`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('devrait charger la page de connexion', async () => {
    const response = await fetch(`${serverUrl}/login`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Connexion');
    expect(html).toContain('email');
    expect(html).toContain('password');
  });

  it('devrait charger la page d\'inscription', async () => {
    const response = await fetch(`${serverUrl}/register`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Inscription');
    expect(html).toContain('email');
    expect(html).toContain('password');
  });

  it('devrait protéger la page dashboard', async () => {
    const response = await fetch(`${serverUrl}/dashboard`, {
      redirect: 'manual'
    });
    
    // Doit rediriger vers login ou retourner 401/403
    expect([302, 401, 403]).toContain(response.status);
  });

  it('devrait protéger la page admin', async () => {
    const response = await fetch(`${serverUrl}/admin`, {
      redirect: 'manual'
    });
    
    // Doit rediriger vers login ou retourner 401/403
    expect([302, 401, 403]).toContain(response.status);
  });

  it('devrait protéger la page profile', async () => {
    const response = await fetch(`${serverUrl}/profile`, {
      redirect: 'manual'
    });
    
    // Doit rediriger vers login ou retourner 401/403
    expect([302, 401, 403]).toContain(response.status);
  });
});
