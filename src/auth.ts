/**
 * Configuration Better Auth selon la documentation officielle
 */

import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { admin } from "better-auth/plugins";
import { captcha } from "better-auth/plugins";
import { sendEmail } from "./smtp";
import Database from "better-sqlite3";
import { initializeBetterAuthDatabase } from "./database/init";

// Database configuration with fallback to SQLite for testing
const getDatabaseConfig = () => {
  // Try PostgreSQL first if environment variables are set properly
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== 'localhost') {
    return new Pool({
      connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
    });
  }
  
  // Otherwise use SQLite for local development/testing
  console.log('Using SQLite database for Better Auth (development mode)');
  return new Database("./better-auth.db");
};

// Initialize database tables if they don't exist (async, non-blocking)
initializeBetterAuthDatabase().catch(error => {
  console.warn('⚠️  Could not initialize database automatically:', error instanceof Error ? error.message : 'Unknown error');
  console.warn('💡 Try running: npm run init-db');
});

export const auth = betterAuth({
  database: getDatabaseConfig(),
  secret: process.env.BETTER_AUTH_SECRET || 'this-is-a-very-secure-secret-key-for-better-auth-minimum-32-chars',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4321',
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
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
    ...(process.env.TURNSTILE_SECRET_KEY ? [captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.TURNSTILE_SECRET_KEY,
    })] : []),
  ],
})
