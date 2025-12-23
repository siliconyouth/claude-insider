/**
 * Lazy Fingerprint Provider
 *
 * Dynamically imports the fingerprint provider to defer loading FingerprintJS (~32KB).
 * Uses requestIdleCallback to defer loading until the browser is truly idle,
 * preventing competition with LCP and TTI.
 *
 * Performance Impact:
 * - Defers ~32KB of JavaScript until after critical rendering
 * - Uses idle callback to avoid blocking main thread
 * - Falls back to 2s timeout for browsers without requestIdleCallback
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

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
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer until browser is truly idle
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 3000 } // Max 3s delay
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback: delay 2s after hydration
      const timeout = setTimeout(() => setShouldLoad(true), 2000);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Render children immediately, only wrap with provider when ready
  if (!shouldLoad) {
    return <>{children}</>;
  }

  return <FingerprintProvider>{children}</FingerprintProvider>;
}
