/**
 * Better Auth Client
 *
 * Client-side authentication utilities for Claude Insider.
 * Use this in React components to access auth state and methods.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { authClient } from '@/lib/auth-client';
 *
 * function AuthButton() {
 *   const { data: session, isPending } = authClient.useSession();
 *
 *   if (isPending) return <Skeleton />;
 *   if (session) return <button onClick={() => authClient.signOut()}>Sign Out</button>;
 *   return <button onClick={() => authClient.signIn.email(...)}>Sign In</button>;
 * }
 * ```
 *
 * @see https://www.better-auth.com/docs/integrations/next#create-a-client
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Base URL is optional when running on the same domain
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
});

// Export individual methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Re-export types for convenience
export type Session = ReturnType<typeof useSession>['data'];
export type User = NonNullable<Session>['user'];

/**
 * Custom hook to check authentication status
 *
 * @example
 * ```tsx
 * const { isAuthenticated, isLoading, user } = useIsAuthenticated();
 * ```
 */
export function useIsAuthenticated() {
  const { data: session, isPending } = useSession();
  return {
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    user: session?.user ?? null,
  };
}
