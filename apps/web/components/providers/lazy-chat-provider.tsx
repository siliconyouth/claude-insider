/**
 * Lazy Chat Provider
 *
 * Dynamically imports the ChatProvider to defer chat engine initialization.
 * Uses the shared DeferredLoadingContext to synchronize with other lazy providers,
 * preventing flickering from multiple re-renders.
 *
 * Performance Impact:
 * - Defers IndexedDB initialization until after critical rendering
 * - Prevents sync engine from running on initial page load
 * - Synchronized with other providers for single re-render
 *
 * Authentication:
 * - Only initializes when user is authenticated
 * - Gracefully renders children without provider for unauthenticated users
 */

"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useDeferredLoading } from "./deferred-loading-context";
import { useSession } from "@/lib/auth-client";

// Lazy load the chat provider
const ChatProvider = dynamic(
  () => import("@/lib/chat/provider").then((m) => ({ default: m.ChatProvider })),
  {
    ssr: false,
  }
);

interface LazyChatProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers chat engine initialization until browser is idle.
 * Components using useChat() will gracefully handle the "not yet initialized" state.
 */
export function LazyChatProvider({ children }: LazyChatProviderProps) {
  const isReady = useDeferredLoading();
  const { data: session, isPending: isSessionPending } = useSession();

  // Don't initialize until deferred loading is ready
  if (!isReady) {
    return <>{children}</>;
  }

  // Don't initialize while session is loading
  if (isSessionPending) {
    return <>{children}</>;
  }

  // Don't initialize for unauthenticated users
  if (!session?.user?.id) {
    return <>{children}</>;
  }

  // Initialize chat provider with authenticated user
  return (
    <ChatProvider
      userId={session.user.id}
      debug={process.env.NODE_ENV === "development"}
    >
      {children}
    </ChatProvider>
  );
}
