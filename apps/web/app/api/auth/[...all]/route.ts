/**
 * Better Auth API Route Handler
 *
 * Handles all authentication routes:
 * - POST /api/auth/sign-up - Create new account
 * - POST /api/auth/sign-in - Login with credentials
 * - POST /api/auth/sign-out - Logout
 * - GET  /api/auth/session - Get current session
 * - POST /api/auth/forgot-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 * - GET  /api/auth/callback/:provider - OAuth callbacks
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
