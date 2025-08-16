/**
 * Configuration Better Auth avec stockage en mémoire pour démo
 */

import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins";
import Database from "better-sqlite3";
import { sendEmail } from "./smtp.js";

// Create an in-memory SQLite database for demo
const db = new Database(':memory:');

// Initialize Better Auth tables
try {
  // Create basic Better Auth tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER DEFAULT 0,
      name TEXT,
      image TEXT,
      role TEXT DEFAULT 'user',
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
    CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
    CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
    CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
  `);
  console.log('✅ Better Auth SQLite tables created successfully');
} catch (error) {
  console.error('❌ Error creating Better Auth tables:', error);
}

export const auth = betterAuth({
  database: db,
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      console.log(`Verification email would be sent to ${user.email} with URL: ${url}`);
      // Only send email if SMTP is configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Vérifiez votre adresse email",
            text: `Cliquez sur le lien pour vérifier votre email: ${url}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Vérification de votre adresse email</h2>
                <p>Bonjour,</p>
                <p>Merci de vous être inscrit ! Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
                <a href="${url}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vérifier mon email</a>
                <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
                <p>Cordialement,<br>L'équipe pgastro</p>
              </div>
            `,
          });
        } catch (error) {
          console.error('Failed to send verification email:', error);
        }
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for demo
    sendResetPassword: async ({ user, url }, request) => {
      console.log(`Reset password email would be sent to ${user.email} with URL: ${url}`);
      // Only send email if SMTP is configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Réinitialisation de votre mot de passe",
            text: `Cliquez sur le lien pour réinitialiser votre mot de passe: ${url}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Réinitialisation de votre mot de passe</h2>
                <p>Bonjour,</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
                <a href="${url}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Réinitialiser mon mot de passe</a>
                <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                <p>Cordialement,<br>L'équipe pgastro</p>
              </div>
            `,
          });
        } catch (error) {
          console.error('Failed to send reset password email:', error);
        }
      }
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },
  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key-for-development-only-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
})
