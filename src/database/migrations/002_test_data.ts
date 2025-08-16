/**
 * Migration pour ajouter des données de test
 * Rôles et permissions de base
 */

import { db } from '../../db.js';
import { generateUUID } from '../../auth/crypto/password.js';

export async function runTestDataMigration(): Promise<void> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📝 Création des rôles de base...');
    
    // Créer les rôles de base
    const adminRoleId = generateUUID();
    const userRoleId = generateUUID();
    
    await client.query(`
      INSERT INTO roles (id, name, description, level) VALUES
      ($1, 'admin', 'Administrateur avec tous les droits', 100),
      ($2, 'user', 'Utilisateur standard', 10)
      ON CONFLICT (name) DO NOTHING
    `, [adminRoleId, userRoleId]);
    
    console.log('🔐 Création des permissions de base...');
    
    // Créer les permissions de base
    const permissions = [
      { name: 'users.read', resource: 'users', action: 'read', description: 'Lire les utilisateurs' },
      { name: 'users.write', resource: 'users', action: 'write', description: 'Modifier les utilisateurs' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Supprimer les utilisateurs' },
      { name: 'roles.read', resource: 'roles', action: 'read', description: 'Lire les rôles' },
      { name: 'roles.write', resource: 'roles', action: 'write', description: 'Modifier les rôles' },
      { name: 'dashboard.read', resource: 'dashboard', action: 'read', description: 'Accéder au dashboard' },
      { name: 'profile.read', resource: 'profile', action: 'read', description: 'Lire son profil' },
      { name: 'profile.write', resource: 'profile', action: 'write', description: 'Modifier son profil' },
    ];
    
    for (const perm of permissions) {
      const permId = generateUUID();
      await client.query(`
        INSERT INTO permissions (id, name, resource, action, description) VALUES
        ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING
      `, [permId, perm.name, perm.resource, perm.action, perm.description]);
    }
    
    console.log('🔗 Association des permissions aux rôles...');
    
    // Associer toutes les permissions à l'admin
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 
        (SELECT id FROM roles WHERE name = 'admin'),
        p.id
      FROM permissions p
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
    
    // Associer les permissions de base à l'utilisateur
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 
        (SELECT id FROM roles WHERE name = 'user'),
        p.id
      FROM permissions p
      WHERE p.name IN ('dashboard.read', 'profile.read', 'profile.write')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
    
    await client.query('COMMIT');
    console.log('✅ Données de test créées avec succès');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la création des données de test:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Si le script est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestDataMigration()
    .then(() => {
      console.log('🎉 Migration des données de test terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}
