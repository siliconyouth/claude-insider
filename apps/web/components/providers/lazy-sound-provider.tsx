/**
 * Lazy Sound Provider
 *
 * Defers Web Audio API initialization until after hydration.
 * Sounds aren't needed for initial page render, so this improves LCP.
 */

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Lazy load the sound provider - sounds don't play on initial render
const SoundProvider = dynamic(
  () => import("@/hooks/use-sound-effects").then((m) => ({ default: m.SoundProvider })),
  {
    ssr: false, // Web Audio API is client-only
  }
);

export function LazySoundProvider({ children }: { children: ReactNode }) {
  return <SoundProvider>{children}</SoundProvider>;
}
