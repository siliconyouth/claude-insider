/**
 * Lazy Sound Provider
 *
 * Defers Web Audio API initialization until browser is idle.
 * Uses requestIdleCallback to prevent competition with LCP and TTI.
 *
 * Performance Impact:
 * - Defers ~12KB of sound synthesis code until after critical rendering
 * - Delays AudioContext creation (which can be expensive)
 * - Falls back to 1s timeout for browsers without requestIdleCallback
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// Lazy load the sound provider - sounds don't play on initial render
const SoundProvider = dynamic(
  () => import("@/hooks/use-sound-effects").then((m) => ({ default: m.SoundProvider })),
  {
    ssr: false, // Web Audio API is client-only
  }
);

export function LazySoundProvider({ children }: { children: ReactNode }) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer until browser is truly idle
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 2000 } // Max 2s delay
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback: delay 1s after hydration (sounds needed earlier than others)
      const timeout = setTimeout(() => setShouldLoad(true), 1000);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Render children immediately, only wrap with provider when ready
  if (!shouldLoad) {
    return <>{children}</>;
  }

  return <SoundProvider>{children}</SoundProvider>;
}
