"use client";

/**
 * Lazy Presence Provider
 *
 * Defers presence tracking initialization until after critical page load.
 * Uses DeferredLoadingProvider for synchronized loading with other lazy providers.
 *
 * Error Handling (v1.18.5):
 * - Wrapped in ErrorBoundary for graceful degradation on chunk load failures
 * - If provider fails to load, renders children without presence tracking (no crash)
 */

import { useDeferredLoading } from "./deferred-loading-context";
import { PresenceProvider, usePresence } from "./presence-provider";
import { ErrorBoundary } from "@/components/error-boundary";

// Re-export hook
export { usePresence };

export function LazyPresenceProvider({ children }: { children: React.ReactNode }) {
  const isDeferredReady = useDeferredLoading();

  if (!isDeferredReady) {
    // Before deferred loading, just render children without presence tracking
    return <>{children}</>;
  }

  // Wrap in ErrorBoundary for graceful degradation
  return (
    <ErrorBoundary
      fallback={<>{children}</>}
      onError={(error) => {
        console.warn("[LazyPresenceProvider] Failed to load, continuing without presence:", error.message);
      }}
    >
      <PresenceProvider>{children}</PresenceProvider>
    </ErrorBoundary>
  );
}
