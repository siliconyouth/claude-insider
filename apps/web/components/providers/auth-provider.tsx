"use client";

/**
 * Auth Provider
 *
 * Provides authentication context throughout the application.
 * Wraps the app to provide user session state to all components.
 *
 * Known issue: Better Auth's useSession() hook doesn't always update after
 * OAuth callbacks due to nanostores reactivity. We force a refetch on mount
 * to ensure the session is properly recognized.
 *
 * @see https://github.com/better-auth/better-auth/issues/1006
 *
 * @example
 * ```tsx
 * // In a component
 * const { user, isAuthenticated, isLoading } = useAuth();
 *
 * if (isLoading) return <Skeleton />;
 * if (!isAuthenticated) return <SignInPrompt />;
 * return <Dashboard user={user} />;
 * ```
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession, signOut as authSignOut } from "@/lib/auth-client";
import type { UserRole } from "@/lib/roles";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isBetaTester?: boolean;
  isVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  hasPassword?: boolean;
  onboardingStep?: number;
  role?: UserRole;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    bluesky?: string;
    mastodon?: string;
    discord?: string;
    website?: string;
  };
}

interface Session {
  user: User;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showSignIn: () => void;
  showSignUp: () => void;
  hideAuthModal: () => void;
  signOut: () => Promise<void>;
  authModalState: "closed" | "signin" | "signup";
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  showSignIn: () => {},
  showSignUp: () => {},
  hideAuthModal: () => {},
  signOut: async () => {},
  authModalState: "closed",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData, isPending } = useSession();
  const [authModalState, setAuthModalState] = useState<"closed" | "signin" | "signup">("closed");
  const [manualSession, setManualSession] = useState<Session | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const hasCheckedSession = useRef(false);

  // Force session fetch only for OAuth callback scenarios
  // This works around the Better Auth useSession reactivity issue
  // Optimized: only call fallback API when useSession definitively returns null
  useEffect(() => {
    // Skip if already checked or still loading
    if (hasCheckedSession.current || isPending) return;

    // If useSession has data, skip the API call entirely
    if (sessionData) {
      hasCheckedSession.current = true;
      return;
    }

    // Debounce to let useSession settle (OAuth callback edge case)
    const timeoutId = setTimeout(async () => {
      // Double-check still no session after debounce
      if (hasCheckedSession.current) return;
      hasCheckedSession.current = true;

      // Only fetch if we still have no session
      setIsRefetching(true);
      try {
        const response = await fetch("/api/auth/get-session", {
          credentials: "include",
          // Use cache to avoid redundant network requests
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.session && data?.user) {
            console.log("[Auth] Session found via fallback API call");
            setManualSession({
              user: data.user,
              session: data.session,
            });
          }
        }
      } catch (error) {
        console.error("[Auth] Session refresh failed:", error);
      } finally {
        setIsRefetching(false);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [isPending, sessionData]);

  // Use sessionData from hook if available, otherwise use manual session
  const effectiveSession = sessionData || manualSession;

  const showSignIn = useCallback(() => setAuthModalState("signin"), []);
  const showSignUp = useCallback(() => setAuthModalState("signup"), []);
  const hideAuthModal = useCallback(() => setAuthModalState("closed"), []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setManualSession(null); // Clear manual session on sign out
  }, []);

  const value: AuthContextValue = {
    user: effectiveSession?.user ?? null,
    session: effectiveSession ?? null,
    isLoading: isPending || isRefetching,
    isAuthenticated: !!effectiveSession?.user,
    showSignIn,
    showSignUp,
    hideAuthModal,
    signOut,
    authModalState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 *
 * @returns Auth context with user, session, loading state, and modal controls
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to require authentication
 * Shows sign-in modal if not authenticated
 *
 * @returns User if authenticated, null otherwise
 */
export function useRequireAuth() {
  const { user, isAuthenticated, isLoading, showSignIn } = useAuth();

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (!isAuthenticated && !isLoading) {
        showSignIn();
        return false;
      }
      if (callback && isAuthenticated) {
        callback();
      }
      return isAuthenticated;
    },
    [isAuthenticated, isLoading, showSignIn]
  );

  return { user, isAuthenticated, isLoading, requireAuth };
}
