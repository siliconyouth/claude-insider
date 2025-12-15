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
import { sendVerificationEmailWithCode, sendPasswordResetEmail } from './email';
import { notifyAdminsNewUser } from './admin-notifications';

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    // Enable email verification when RESEND_API_KEY is configured
    requireEmailVerification: !!process.env.RESEND_API_KEY,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string; name?: string; id?: string };
      url: string;
    }) => {
      // Generate a 6-digit verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] Verification email for ${user.email}: ${url}`);
        console.log(`[Auth] Verification code: ${code}`);
      }

      // Store the code in database (async, don't block)
      try {
        await pool.query(
          `INSERT INTO email_verification_codes (user_id, email, code, expires_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [user.id || null, user.email.toLowerCase(), code, expiresAt]
        );
      } catch (err) {
        console.error('[Auth] Failed to store verification code:', err);
      }

      // Send via Resend if API key is configured
      if (process.env.RESEND_API_KEY) {
        const result = await sendVerificationEmailWithCode(user.email, url, code, user.name);
        if (!result.success) {
          console.error('[Auth] Failed to send verification email:', result.error);
        }
      }
    },
    sendResetPasswordEmail: async ({
      user,
      url,
    }: {
      user: { email: string; name?: string };
      url: string;
    }) => {
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] Password reset for ${user.email}: ${url}`);
      }

      // Send via Resend if API key is configured
      if (process.env.RESEND_API_KEY) {
        const result = await sendPasswordResetEmail(user.email, url, user.name);
        if (!result.success) {
          console.error('[Auth] Failed to send password reset email:', result.error);
        }
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
      maxAge: 60 * 30, // 30 minutes cache - reduces DB lookups significantly
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
      hasCompletedOnboarding: {
        type: 'boolean',
        defaultValue: false,
      },
      hasPassword: {
        type: 'boolean',
        defaultValue: false,
      },
      onboardingStep: {
        type: 'number',
        defaultValue: 0,
      },
      role: {
        type: 'string',
        defaultValue: 'user',
      },
      // Note: socialLinks is stored as JSONB in DB and managed via direct SQL
      // Not declared here as Better Auth doesn't support object types
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

  // Database hooks for lifecycle events
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Notify admins about new user signup (async, don't block)
          notifyAdminsNewUser({
            id: user.id,
            email: user.email,
            name: user.name,
          }).catch((err) => console.error('[Auth] Admin notification error:', err));
        },
      },
    },
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
