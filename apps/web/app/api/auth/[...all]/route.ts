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
import { NextRequest, NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  try {
    return await handler.GET(request);
  } catch (error) {
    console.error('[Auth GET Error]:', error);
    return NextResponse.json(
      { error: 'Authentication error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handler.POST(request);
  } catch (error) {
    console.error('[Auth POST Error]:', error);
    return NextResponse.json(
      { error: 'Authentication error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
