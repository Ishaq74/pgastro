/**
 * Test simple de connexion PostgreSQL et validation de configuration
 */

import { testConnection } from './src/db.js';

async function main() {
  try {
    console.log('🔗 Test de connexion PostgreSQL...');
    
    const { success, client, error } = await testConnection();
    
    if (success && client) {
      console.log('✅ Connexion PostgreSQL réussie !');
      
      // Test d'une requête simple
      const result = await client.query('SELECT version();');
      console.log('📊 Version PostgreSQL:', result.rows[0].version);
      
      // Tester les extensions
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        console.log('✅ Extensions PostgreSQL disponibles');
      } catch (extError) {
        console.warn('⚠️  Certaines extensions PostgreSQL peuvent ne pas être disponibles');
      }
      
      await client.end();
      console.log('🎉 PostgreSQL prêt pour l\'authentification enterprise !');
      
    } else {
      console.error('❌ Connexion PostgreSQL échouée:', error?.message);
      console.log('🔧 Vérifiez vos variables d\'environnement dans .env');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur:', errorMessage);
  }
}

main();
