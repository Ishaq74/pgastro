/**
 * Configuration Better Auth selon la documentation officielle
 */

import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { admin } from "better-auth/plugins";
import { captcha } from "better-auth/plugins";
import { sendEmail } from "./smtp";

export const auth = betterAuth({
  database: new Pool({
    connectionString: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'pgsql+74'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'pgastro'}`,
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'your-super-secret-key-at-least-32-characters-long',
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
