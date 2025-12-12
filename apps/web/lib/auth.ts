/**
 * Better Auth Server Configuration
 *
 * Central authentication configuration for Claude Insider.
 * Uses PostgreSQL (Supabase) for session storage with JWT tokens.
 *
 * Features:
 * - Email/Password authentication
 * - GitHub and Google OAuth
 * - Rate limiting
 * - Email verification
 *
 * @see https://www.better-auth.com/docs/installation
 */

import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { Pool } from 'pg';

// Create a PostgreSQL pool for Better Auth
// Supabase requires SSL connections in production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // SSL is required for Supabase connections
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  // Database configuration - pass Pool directly for PostgreSQL
  database: pool,

  // Application info
  appName: 'Claude Insider',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    // Temporarily disable email verification until Resend is configured
    requireEmailVerification: false,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      // TODO: Implement with Resend when ready
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] Verification email for ${user.email}: ${url}`);
      }
    },
    sendResetPasswordEmail: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      // TODO: Implement with Resend when ready
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] Password reset for ${user.email}: ${url}`);
      }
    },
  },

  // Social OAuth providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  // User fields extension
  user: {
    additionalFields: {
      displayName: {
        type: 'string',
        required: false,
      },
      bio: {
        type: 'string',
        required: false,
      },
      avatarUrl: {
        type: 'string',
        required: false,
      },
      isBetaTester: {
        type: 'boolean',
        defaultValue: false,
      },
      isVerified: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },

  // Account linking
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github', 'google'],
    },
  },

  // Advanced options
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'ci_auth',
  },

  // Plugins - nextCookies must be last for server action cookie support
  plugins: [nextCookies()],
});

/**
 * Get session in Server Components or Server Actions
 *
 * @example
 * ```tsx
 * import { getSession } from '@/lib/auth';
 * import { headers } from 'next/headers';
 *
 * export default async function Page() {
 *   const session = await getSession();
 *   if (!session) redirect('/sign-in');
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 */
export async function getSession() {
  const { headers } = await import('next/headers');
  return auth.api.getSession({
    headers: await headers(),
  });
}
