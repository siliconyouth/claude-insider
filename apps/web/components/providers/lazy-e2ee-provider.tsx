/**
 * Lazy E2EE Provider
 *
 * Dynamically imports the E2EE provider to defer loading the Matrix WASM (~157KB).
 * Uses safe defaults during loading - E2EE features are non-critical for initial page load.
 */

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Lazy load the actual E2EE provider
const E2EEProvider = dynamic(
  () => import("./e2ee-provider").then((m) => ({ default: m.E2EEProvider })),
  {
    ssr: false,
    // No loading state - provider returns safe defaults internally
  }
);

interface LazyE2EEProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers E2EE loading until after initial render.
 * The E2EEProvider internally handles the "not yet loaded" case by returning safe defaults,
 * so components using useE2EEContext() will work correctly during the loading period.
 */
export function LazyE2EEProvider({ children }: LazyE2EEProviderProps) {
  return <E2EEProvider>{children}</E2EEProvider>;
}
