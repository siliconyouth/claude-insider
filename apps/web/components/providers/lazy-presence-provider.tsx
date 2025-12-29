"use client";

/**
 * Lazy Presence Provider
 *
 * Defers presence tracking initialization until after critical page load.
 * Uses DeferredLoadingProvider for synchronized loading with other lazy providers.
 */

import { useDeferredLoading } from "./deferred-loading-context";
import { PresenceProvider, usePresence } from "./presence-provider";

// Re-export hook
export { usePresence };

export function LazyPresenceProvider({ children }: { children: React.ReactNode }) {
  const isDeferredReady = useDeferredLoading();

  if (!isDeferredReady) {
    // Before deferred loading, just render children without presence tracking
    return <>{children}</>;
  }

  return <PresenceProvider>{children}</PresenceProvider>;
}
