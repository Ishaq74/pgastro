/**
 * Test direct de connexion PostgreSQL (sans imports TypeScript)
 */

import pg from 'pg';

const config = {
  host: 'localhost',
  port: 5432,
  database: 'pgastro',
  user: 'postgres',
  password: 'pgsql+74',
};

async function main() {
  let client;
  
  try {
    console.log('🔗 Test de connexion PostgreSQL...');
    console.log('📊 Configuration:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
    });
    
    client = new pg.Client(config);
    await client.connect();
    
    console.log('✅ Connexion PostgreSQL réussie !');
    
    // Test d'une requête simple
    const result = await client.query('SELECT version();');
    console.log('📊 Version PostgreSQL:', result.rows[0].version.split(',')[0]);
    
    // Tester les extensions nécessaires
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('✅ Extension uuid-ossp disponible');
      
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      console.log('✅ Extension pgcrypto disponible');
      
      // Test de génération UUID
      const uuidResult = await client.query('SELECT gen_random_uuid() as test_uuid;');
      console.log('🔐 Test UUID:', uuidResult.rows[0].test_uuid);
      
    } catch (extError) {
      console.warn('⚠️  Erreur extensions:', extError.message);
    }
    
    console.log('🎉 PostgreSQL prêt pour l\'authentification enterprise !');
    
  } catch (error) {
    console.error('❌ Erreur connexion PostgreSQL:', error.message);
    console.log('🔧 Vérifiez que PostgreSQL est démarré et accessible');
    console.log('💡 Commandes utiles:');
    console.log('   - Démarrer PostgreSQL: net start postgresql-x64-14');
    console.log('   - Créer DB: createdb -U postgres pgastro');
  } finally {
    if (client) {
      await client.end();
    }
  }
}

main();
