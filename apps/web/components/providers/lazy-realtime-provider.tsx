/**
 * Lazy Realtime Provider
 *
 * Dynamically imports the realtime provider to defer Supabase realtime connection (~16KB).
 * Uses the shared DeferredLoadingContext to synchronize with other lazy providers,
 * preventing flickering from multiple re-renders.
 *
 * Performance Impact:
 * - Defers realtime connection until after critical rendering
 * - Prevents unnecessary WebSocket connections on initial load
 * - Synchronized with other providers for single re-render
 */

"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useDeferredLoading } from "./deferred-loading-context";

// Lazy load the realtime provider
const RealtimeProvider = dynamic(
  () => import("@/lib/realtime/realtime-context").then((m) => ({ default: m.RealtimeProvider })),
  {
    ssr: false,
  }
);

interface LazyRealtimeProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers realtime connection until browser is idle.
 * Components using useRealtime() will gracefully handle the "not yet connected" state.
 */
export function LazyRealtimeProvider({ children }: LazyRealtimeProviderProps) {
  const isReady = useDeferredLoading();

  // Render children immediately, only wrap with provider when ready
  if (!isReady) {
    return <>{children}</>;
  }

  return <RealtimeProvider>{children}</RealtimeProvider>;
}
