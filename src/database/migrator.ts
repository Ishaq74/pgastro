/**
 * Système de migrations pour la base de données
 * Gestion versionnée et sécurisée des changements de schéma
 */

import { db } from '../db.js';

export interface Migration {
  version: string;
  description: string;
  up: string;
  down: string;
}

// Table de tracking des migrations
const createMigrationsTable = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  checksum TEXT NOT NULL
);
`;

// Import des migrations
import * as migration001 from './migrations/001_initial_auth_structure.js';

const migrations: Migration[] = [
  {
    version: '001',
    description: 'Structure d\'authentification enterprise initiale',
    up: migration001.up,
    down: migration001.down,
  },
];

/**
 * Calcule le checksum d'une migration pour détecter les modifications
 */
function calculateChecksum(sql: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(sql).digest('hex');
}

/**
 * Récupère les migrations appliquées
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  try {
    const result = await db.query('SELECT version FROM schema_migrations ORDER BY version');
    return new Set(result.rows.map(row => row.version));
  } catch (error) {
    // Table n'existe pas encore
    return new Set();
  }
}

/**
 * Applique une migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`🔄 Application de la migration ${migration.version}: ${migration.description}`);
    
    // Exécuter la migration
    await client.query(migration.up);
    
    // Enregistrer dans la table de tracking
    const checksum = calculateChecksum(migration.up);
    await client.query(
      'INSERT INTO schema_migrations (version, description, checksum) VALUES ($1, $2, $3)',
      [migration.version, migration.description, checksum]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Migration ${migration.version} appliquée avec succès`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`❌ Erreur lors de l'application de la migration ${migration.version}: ${errorMessage}`);
  } finally {
    await client.end();
  }
}

/**
 * Annule une migration
 */
async function rollbackMigration(migration: Migration): Promise<void> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`🔄 Annulation de la migration ${migration.version}: ${migration.description}`);
    
    // Exécuter le rollback
    await client.query(migration.down);
    
    // Supprimer de la table de tracking
    await client.query('DELETE FROM schema_migrations WHERE version = $1', [migration.version]);
    
    await client.query('COMMIT');
    console.log(`✅ Migration ${migration.version} annulée avec succès`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`❌ Erreur lors de l'annulation de la migration ${migration.version}: ${errorMessage}`);
  } finally {
    await client.end();
  }
}

/**
 * Exécute toutes les migrations en attente
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('🚀 Démarrage des migrations de base de données...');
    
    // Créer la table de tracking des migrations
    await db.query(createMigrationsTable);
    
    // Récupérer les migrations déjà appliquées
    const appliedMigrations = await getAppliedMigrations();
    
    let appliedCount = 0;
    
    // Appliquer les migrations manquantes
    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.version)) {
        await applyMigration(migration);
        appliedCount++;
      } else {
        // Vérifier le checksum pour détecter les modifications
        const result = await db.query(
          'SELECT checksum FROM schema_migrations WHERE version = $1',
          [migration.version]
        );
        
        if (result.rows.length > 0) {
          const storedChecksum = result.rows[0].checksum;
          const currentChecksum = calculateChecksum(migration.up);
          
          if (storedChecksum !== currentChecksum) {
            console.warn(`⚠️  Migration ${migration.version} a été modifiée après application`);
          }
        }
      }
    }
    
    if (appliedCount === 0) {
      console.log('✅ Base de données à jour, aucune migration nécessaire');
    } else {
      console.log(`✅ ${appliedCount} migration(s) appliquée(s) avec succès`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur lors des migrations:', errorMessage);
    throw error;
  }
}

/**
 * Annule la dernière migration
 */
export async function rollbackLastMigration(): Promise<void> {
  try {
    console.log('🔄 Annulation de la dernière migration...');
    
    // Récupérer la dernière migration appliquée
    const result = await db.query(
      'SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('ℹ️  Aucune migration à annuler');
      return;
    }
    
    const lastVersion = result.rows[0].version;
    const migration = migrations.find(m => m.version === lastVersion);
    
    if (!migration) {
      throw new Error(`Migration ${lastVersion} introuvable dans le code`);
    }
    
    await rollbackMigration(migration);
    console.log('✅ Dernière migration annulée avec succès');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur lors de l\'annulation:', errorMessage);
    throw error;
  }
}

/**
 * Affiche le statut des migrations
 */
export async function getMigrationStatus(): Promise<void> {
  try {
    console.log('📊 Statut des migrations:\n');
    
    const appliedMigrations = await getAppliedMigrations();
    
    for (const migration of migrations) {
      const isApplied = appliedMigrations.has(migration.version);
      const status = isApplied ? '✅ Appliquée' : '⏳ En attente';
      console.log(`${migration.version}: ${migration.description} - ${status}`);
    }
    
    const totalMigrations = migrations.length;
    const appliedCount = appliedMigrations.size;
    const pendingCount = totalMigrations - appliedCount;
    
    console.log(`\n📈 Résumé: ${appliedCount}/${totalMigrations} appliquées, ${pendingCount} en attente`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur lors de la récupération du statut:', errorMessage);
    throw error;
  }
}

/**
 * Réinitialise complètement la base de données (DANGER)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Réinitialisation interdite en production');
  }
  
  try {
    console.log('⚠️  DANGER: Réinitialisation complète de la base de données...');
    
    // Annuler toutes les migrations dans l'ordre inverse
    const appliedMigrations = await getAppliedMigrations();
    const migrationsToRollback = migrations
      .filter(m => appliedMigrations.has(m.version))
      .reverse();
    
    for (const migration of migrationsToRollback) {
      await rollbackMigration(migration);
    }
    
    // Supprimer la table de migrations
    await db.query('DROP TABLE IF EXISTS schema_migrations');
    
    console.log('✅ Base de données réinitialisée');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur lors de la réinitialisation:', errorMessage);
    throw error;
  }
}
