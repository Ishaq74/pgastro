import { beforeAll, afterAll, beforeEach } from 'vitest';

let serverUrl = 'http://localhost:4321';

beforeAll(async () => {
  // Vérifier que le serveur est démarré
  try {
    const response = await fetch(serverUrl);
    if (!response.ok) {
      throw new Error('Serveur non accessible');
    }
    console.log('✅ Serveur Astro détecté sur', serverUrl);
  } catch (error) {
    console.error('❌ ERREUR: Serveur Astro non accessible sur', serverUrl);
    console.error('Assurez-vous que le serveur est démarré avec: npm run dev');
    process.exit(1);
  }
});

beforeEach(async () => {
  // Reset de base avant chaque test
});

afterAll(async () => {
  console.log('🏁 Tests terminés');
});

// Déclaration des types globaux
declare global {
  var testUtils: {
    serverUrl: string;
    waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<boolean>;
  };
}

// Utilitaires globaux pour les tests
(globalThis as any).testUtils = {
  serverUrl,
  async waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }
};
