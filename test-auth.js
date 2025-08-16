/**
 * Script de test complet du système d'authentification
 * Initialise la DB et teste inscription/login/admin
 */

import { createConnection } from './src/db.js';

async function initDB() {
  console.log('🚀 Initialisation de la base de données...');
  const client = await createConnection();
  
  try {
    // Vérifier si les tables existent
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'roles', 'permissions', 'user_roles')
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('📋 Création des tables...');
      
      // Créer les tables de base
      await client.query(`
        -- Extension UUID
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Table users
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          failed_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TIMESTAMPTZ,
          last_login_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Table roles
        CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Table permissions
        CREATE TABLE IF NOT EXISTS permissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          resource VARCHAR(100) NOT NULL,
          action VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Table user_roles
        CREATE TABLE IF NOT EXISTS user_roles (
          user_id UUID NOT NULL,
          role_id UUID NOT NULL,
          assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, role_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        );
        
        -- Table role_permissions
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id UUID NOT NULL,
          permission_id UUID NOT NULL,
          PRIMARY KEY (role_id, permission_id),
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        );
        
        -- Table user_sessions
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          refresh_token_hash VARCHAR(255) NOT NULL,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      
      console.log('✅ Tables créées');
    } else {
      console.log('✅ Tables déjà existantes');
    }
    
    // Insérer les rôles de base
    await client.query(`
      INSERT INTO roles (name, display_name, description) VALUES
      ('admin', 'Administrateur', 'Accès administrateur complet'),
      ('user', 'Utilisateur', 'Utilisateur standard')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insérer les permissions de base
    await client.query(`
      INSERT INTO permissions (name, display_name, resource, action) VALUES
      ('users.read', 'Lire utilisateurs', 'users', 'read'),
      ('users.write', 'Modifier utilisateurs', 'users', 'write'),
      ('admin.access', 'Accès admin', 'admin', 'access')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Associer permissions aux rôles
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'admin'
      ON CONFLICT DO NOTHING;
      
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'user' AND p.name = 'users.read'
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Base de données initialisée');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
    return false;
  } finally {
    await client.end();
  }
}

async function testAuth() {
  console.log('\n🧪 Test du système d\'authentification...');
  
  const baseUrl = 'http://localhost:4321';
  
  try {
    // Test 1: Inscription utilisateur normal
    console.log('\n1️⃣ Test inscription utilisateur...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'TestPassword123!',
        full_name: 'Utilisateur Test'
      })
    });
    
    if (registerResponse.ok) {
      console.log('✅ Inscription utilisateur réussie');
    } else {
      const error = await registerResponse.text();
      console.log('⚠️ Inscription utilisateur:', error);
    }
    
    // Test 2: Inscription admin
    console.log('\n2️⃣ Test inscription admin...');
    const adminRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'AdminPassword123!',
        full_name: 'Admin Test'
      })
    });
    
    if (adminRegisterResponse.ok) {
      console.log('✅ Inscription admin réussie');
    } else {
      const error = await adminRegisterResponse.text();
      console.log('⚠️ Inscription admin:', error);
    }
    
    // Test 3: Login utilisateur
    console.log('\n3️⃣ Test login utilisateur...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'TestPassword123!'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login utilisateur réussi');
      console.log('   Token:', loginData.accessToken ? 'OK' : 'Manquant');
      
      // Test 4: Accès dashboard utilisateur
      console.log('\n4️⃣ Test accès dashboard...');
      const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`
        }
      });
      
      if (dashboardResponse.ok) {
        console.log('✅ Accès dashboard utilisateur OK');
      } else {
        console.log('❌ Accès dashboard échoué:', dashboardResponse.status);
      }
    } else {
      const error = await loginResponse.text();
      console.log('❌ Login utilisateur échoué:', error);
    }
    
    // Test 5: Login admin
    console.log('\n5️⃣ Test login admin...');
    const adminLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'AdminPassword123!'
      })
    });
    
    if (adminLoginResponse.ok) {
      const adminLoginData = await adminLoginResponse.json();
      console.log('✅ Login admin réussi');
      
      // Assigner le rôle admin manuellement
      console.log('\n6️⃣ Attribution rôle admin...');
      const client = await createConnection();
      try {
        const adminUser = await client.query('SELECT id FROM users WHERE email = $1', ['admin@test.com']);
        const adminRole = await client.query('SELECT id FROM roles WHERE name = $1', ['admin']);
        
        if (adminUser.rows.length > 0 && adminRole.rows.length > 0) {
          await client.query(`
            INSERT INTO user_roles (user_id, role_id) 
            VALUES ($1, $2) 
            ON CONFLICT DO NOTHING
          `, [adminUser.rows[0].id, adminRole.rows[0].id]);
          console.log('✅ Rôle admin attribué');
        }
      } finally {
        await client.end();
      }
      
      // Test 6: Accès admin
      console.log('\n7️⃣ Test accès admin...');
      const adminResponse = await fetch(`${baseUrl}/admin`, {
        headers: {
          'Authorization': `Bearer ${adminLoginData.accessToken}`
        }
      });
      
      if (adminResponse.ok) {
        console.log('✅ Accès admin OK');
      } else {
        console.log('❌ Accès admin échoué:', adminResponse.status);
      }
    } else {
      const error = await adminLoginResponse.text();
      console.log('❌ Login admin échoué:', error);
    }
    
    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécution
async function main() {
  const dbOk = await initDB();
  if (dbOk) {
    // Attendre que le serveur soit prêt
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testAuth();
  }
}

main().catch(console.error);
