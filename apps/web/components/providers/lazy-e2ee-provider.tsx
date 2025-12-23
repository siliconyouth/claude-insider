/**
 * Lazy E2EE Provider
 *
 * Dynamically imports the E2EE provider to defer loading the Matrix WASM (~157KB).
 * Uses the shared DeferredLoadingContext to synchronize with other lazy providers,
 * preventing flickering from multiple re-renders.
 *
 * Performance Impact:
 * - Defers ~157KB of WASM until after critical rendering
 * - Synchronized with other providers for single re-render
 */

"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useDeferredLoading } from "./deferred-loading-context";

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
  const isReady = useDeferredLoading();

  // Render children immediately, only wrap with provider when ready
  if (!isReady) {
    return <>{children}</>;
  }

  return <E2EEProvider>{children}</E2EEProvider>;
}
