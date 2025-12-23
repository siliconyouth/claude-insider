/**
 * Better Auth API Route Handler
 *
 * Handles all authentication routes:
 * - POST /api/auth/sign-up - Create new account
 * - POST /api/auth/sign-in - Login with credentials
 * - POST /api/auth/sign-out - Logout
 * - GET  /api/auth/get-session - Get current session
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

// Timeout wrapper to prevent hanging requests
const AUTH_TIMEOUT_MS = 8000; // 8 seconds (less than Vercel's 10s default)

function withTimeout<T>(promise: Promise<T>, ms: number, path: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Auth request timed out after ${ms}ms for ${path}`)), ms)
    ),
  ]);
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const startTime = Date.now();

  try {
    console.log(`[Auth GET] Starting: ${path}`);
    const response = await withTimeout(handler.GET(request), AUTH_TIMEOUT_MS, path);
    console.log(`[Auth GET] Completed: ${path} in ${Date.now() - startTime}ms`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Auth GET Error] ${path} after ${duration}ms:`, error);

    // Check if it's a timeout
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Authentication timeout', message: 'Request took too long. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const startTime = Date.now();

  try {
    console.log(`[Auth POST] Starting: ${path}`);
    const response = await withTimeout(handler.POST(request), AUTH_TIMEOUT_MS, path);
    console.log(`[Auth POST] Completed: ${path} in ${Date.now() - startTime}ms`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Auth POST Error] ${path} after ${duration}ms:`, error);

    // Check if it's a timeout
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Authentication timeout', message: 'Request took too long. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
