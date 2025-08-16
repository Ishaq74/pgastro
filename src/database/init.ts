/**
 * Initialiseur de base de données pour Better Auth
 * Vérifie et crée les tables si elles n'existent pas
 */

import { Pool } from 'pg';
import Database from 'better-sqlite3';

/**
 * Obtient une connexion à la base de données selon l'environnement
 */
function getDatabaseConnection() {
  // Essayer PostgreSQL d'abord si les variables d'environnement sont configurées
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== 'localhost') {
    return new Pool({
      connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
    });
  }
  
  // Sinon utiliser SQLite pour le développement/test
  console.log('🔧 Utilisation de SQLite pour Better Auth (mode développement)');
  return new Database("./better-auth.db");
};

/**
 * Schéma des tables Better Auth pour PostgreSQL
 * Basé sur la documentation officielle de Better Auth
 */
const BETTER_AUTH_TABLES_POSTGRESQL = `
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    name TEXT,
    image TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des comptes (pour l'authentification)
CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "expiresAt" TIMESTAMPTZ,
    "password" TEXT,
    UNIQUE("userId", "providerId")
);

-- Table des sessions
CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "activeExpires" BIGINT NOT NULL,
    "idleExpires" BIGINT NOT NULL
);

-- Table pour la vérification email
CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user"("email");
CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification"("identifier");
`;

/**
 * Schéma des tables Better Auth pour SQLite
 */
const BETTER_AUTH_TABLES_SQLITE = `
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    name TEXT,
    image TEXT,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Table des comptes (pour l'authentification)
CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt INTEGER,
    password TEXT,
    FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(userId, providerId)
);

-- Table des sessions
CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    activeExpires INTEGER NOT NULL,
    idleExpires INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Table pour la vérification email
CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch())
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"(userId);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"(userId);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);
`;

/**
 * Vérifie si les tables Better Auth existent
 */
async function checkTablesExist(db: any, isPostgreSQL: boolean): Promise<boolean> {
  try {
    if (isPostgreSQL) {
      // PostgreSQL - vérifier l'existence de la table user
      const client = await db.connect();
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user'
          );
        `);
        return result.rows[0].exists;
      } finally {
        client.release();
      }
    } else {
      // SQLite - vérifier l'existence de la table user
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='user';
      `).get();
      return !!result;
    }
  } catch (error) {
    console.log('🔍 Tables non trouvées, initialisation nécessaire');
    return false;
  }
}

/**
 * Crée les tables Better Auth si elles n'existent pas
 */
async function createTablesIfNotExist(db: any, isPostgreSQL: boolean): Promise<void> {
  try {
    const tablesExist = await checkTablesExist(db, isPostgreSQL);
    
    if (tablesExist) {
      console.log('✅ Tables Better Auth déjà présentes');
      return;
    }
    
    console.log('🔧 Création des tables Better Auth...');
    
    if (isPostgreSQL) {
      const client = await db.connect();
      try {
        await client.query(BETTER_AUTH_TABLES_POSTGRESQL);
        console.log('✅ Tables Better Auth créées avec succès (PostgreSQL)');
      } finally {
        client.release();
      }
    } else {
      // SQLite - exécuter chaque statement séparément
      const statements = BETTER_AUTH_TABLES_SQLITE.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement.trim());
        }
      }
      console.log('✅ Tables Better Auth créées avec succès (SQLite)');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
}

/**
 * Initialise la base de données Better Auth
 * Crée les tables si elles n'existent pas déjà
 */
export async function initializeBetterAuthDatabase(): Promise<void> {
  console.log('🚀 Initialisation de la base de données Better Auth...');
  
  const db = getDatabaseConnection();
  const isPostgreSQL = db instanceof Pool;
  
  try {
    await createTablesIfNotExist(db, isPostgreSQL);
    console.log('🎉 Base de données Better Auth initialisée avec succès!');
  } catch (error) {
    console.error('💥 Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  } finally {
    // Fermer la connexion si c'est SQLite
    if (!isPostgreSQL && typeof db.close === 'function') {
      db.close();
    }
  }
}

/**
 * Script CLI pour l'initialisation manuelle
 */
if (process.argv[1]?.includes('init.ts') || process.argv[1]?.includes('init.js')) {
  initializeBetterAuthDatabase()
    .then(() => {
      console.log('✨ Initialisation terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Échec de l\'initialisation:', error);
      process.exit(1);
    });
}