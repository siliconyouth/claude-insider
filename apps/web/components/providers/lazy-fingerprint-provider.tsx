/**
 * Lazy Fingerprint Provider
 *
 * Dynamically imports the fingerprint provider to defer loading FingerprintJS (~32KB).
 * Fingerprinting is non-critical for initial page load - it runs after hydration.
 */

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Lazy load the fingerprint provider - it's not needed for initial render
const FingerprintProvider = dynamic(
  () => import("./fingerprint-provider").then((m) => ({ default: m.FingerprintProvider })),
  {
    ssr: false,
    // No loading state needed - children render immediately
    // Provider internally handles the loading case with safe defaults
  }
);

interface LazyFingerprintProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that defers fingerprint loading until after initial render.
 * Since fingerprinting is for analytics/security tracking, it doesn't block UI.
 */
export function LazyFingerprintProvider({ children }: LazyFingerprintProviderProps) {
  return <FingerprintProvider>{children}</FingerprintProvider>;
}
