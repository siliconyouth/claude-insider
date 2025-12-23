/**
 * Lazy E2EE Provider
 *
 * Dynamically imports the E2EE provider to defer loading the Matrix WASM (~157KB).
 * Uses requestIdleCallback to defer loading until the browser is truly idle,
 * preventing competition with LCP and TTI.
 *
 * Performance Impact:
 * - Defers ~157KB of WASM until after critical rendering
 * - Uses idle callback to avoid blocking main thread
 * - Falls back to 2.5s timeout for browsers without requestIdleCallback
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// Lazy load the actual E2EE provider
const E2EEProvider = dynamic(
  () => import("./e2ee-provider").then((m) => ({ default: m.E2EEProvider })),
  {
    ssr: false,
  }
);

interface LazyE2EEProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers E2EE loading until browser is idle.
 * The E2EEProvider internally handles the "not yet loaded" case by returning safe defaults,
 * so components using useE2EEContext() will work correctly during the loading period.
 */
export function LazyE2EEProvider({ children }: LazyE2EEProviderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer until browser is truly idle
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 4000 } // Max 4s delay (E2EE is less critical)
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback: delay 2.5s after hydration
      const timeout = setTimeout(() => setShouldLoad(true), 2500);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Render children immediately, only wrap with provider when ready
  if (!shouldLoad) {
    return <>{children}</>;
  }

  return <E2EEProvider>{children}</E2EEProvider>;
}
