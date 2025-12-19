/**
 * Lazy Realtime Provider
 *
 * Defers Supabase realtime connection establishment until after hydration.
 * This improves LCP by reducing initial JS execution.
 */

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Lazy load the realtime provider - it's not needed for initial page render
const RealtimeProvider = dynamic(
  () => import("@/lib/realtime/realtime-context").then((m) => ({ default: m.RealtimeProvider })),
  {
    ssr: false, // Realtime features are client-only
  }
);

export function LazyRealtimeProvider({ children }: { children: ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}
