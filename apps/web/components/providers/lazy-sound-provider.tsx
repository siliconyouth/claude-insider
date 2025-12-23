/**
 * Lazy Sound Provider
 *
 * Dynamically imports the sound provider to defer Web Audio API initialization (~12KB).
 * Uses the shared DeferredLoadingContext to synchronize with other lazy providers,
 * preventing flickering from multiple re-renders.
 *
 * Performance Impact:
 * - Defers Web Audio API initialization until after critical rendering
 * - Sounds don't play on initial load anyway, so no UX impact
 * - Synchronized with other providers for single re-render
 */

"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useDeferredLoading } from "./deferred-loading-context";

// Lazy load the sound provider
const SoundProvider = dynamic(
  () => import("@/hooks/use-sound-effects").then((m) => ({ default: m.SoundProvider })),
  {
    ssr: false,
  }
);

interface LazySoundProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers sound system loading until browser is idle.
 * Components using useSound() will gracefully handle the "not yet loaded" state.
 */
export function LazySoundProvider({ children }: LazySoundProviderProps) {
  const isReady = useDeferredLoading();

  // Render children immediately, only wrap with provider when ready
  if (!isReady) {
    return <>{children}</>;
  }

  return <SoundProvider>{children}</SoundProvider>;
}
