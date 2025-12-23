/**
 * Lazy Fingerprint Provider
 *
 * Dynamically imports the fingerprint provider to defer loading FingerprintJS (~32KB).
 * Uses the shared DeferredLoadingContext to synchronize with other lazy providers,
 * preventing flickering from multiple re-renders.
 *
 * Performance Impact:
 * - Defers ~32KB of JavaScript until after critical rendering
 * - Synchronized with other providers for single re-render
 */

"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useDeferredLoading } from "./deferred-loading-context";

// Lazy load the fingerprint provider - it's not needed for initial render
const FingerprintProvider = dynamic(
  () => import("./fingerprint-provider").then((m) => ({ default: m.FingerprintProvider })),
  {
    ssr: false,
  }
);

interface LazyFingerprintProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers fingerprint loading until browser is idle.
 * Since fingerprinting is for analytics/security tracking, it doesn't block UI.
 */
export function LazyFingerprintProvider({ children }: LazyFingerprintProviderProps) {
  const isReady = useDeferredLoading();

  // Render children immediately, only wrap with provider when ready
  if (!isReady) {
    return <>{children}</>;
  }

  return <FingerprintProvider>{children}</FingerprintProvider>;
}
