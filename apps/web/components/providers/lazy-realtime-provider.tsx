/**
 * Lazy Realtime Provider
 *
 * Defers Supabase realtime connection establishment until browser is idle.
 * Uses requestIdleCallback to prevent competition with LCP and TTI.
 *
 * Performance Impact:
 * - Defers ~16KB of Supabase realtime code until after critical rendering
 * - Delays WebSocket connection establishment
 * - Falls back to 1.5s timeout for browsers without requestIdleCallback
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// Lazy load the realtime provider - it's not needed for initial page render
const RealtimeProvider = dynamic(
  () => import("@/lib/realtime/realtime-context").then((m) => ({ default: m.RealtimeProvider })),
  {
    ssr: false, // Realtime features are client-only
  }
);

export function LazyRealtimeProvider({ children }: { children: ReactNode }) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer until browser is truly idle
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 2500 } // Max 2.5s delay
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback: delay 1.5s after hydration
      const timeout = setTimeout(() => setShouldLoad(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Render children immediately, only wrap with provider when ready
  if (!shouldLoad) {
    return <>{children}</>;
  }

  return <RealtimeProvider>{children}</RealtimeProvider>;
}
