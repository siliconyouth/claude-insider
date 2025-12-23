/**
 * Deferred Loading Coordinator
 *
 * Coordinates the loading of multiple lazy providers to prevent flickering.
 * Instead of each provider having its own requestIdleCallback, this context
 * provides a single "ready" signal that all providers consume.
 *
 * Problem it solves:
 * - 4 lazy providers with separate requestIdleCallback calls = 4 re-renders
 * - Users see flickering as each provider mounts at different times
 *
 * Solution:
 * - Single requestIdleCallback fires once
 * - All providers become ready simultaneously
 * - ONE re-render instead of 4
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 */

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface DeferredLoadingContextValue {
  /** True when browser is idle and deferred content should load */
  isReady: boolean;
}

const DeferredLoadingContext = createContext<DeferredLoadingContextValue>({
  isReady: false,
});

/**
 * Hook to check if deferred providers should load.
 * Used by LazyFingerprintProvider, LazyRealtimeProvider, etc.
 */
export function useDeferredLoading(): boolean {
  return useContext(DeferredLoadingContext).isReady;
}

interface DeferredLoadingProviderProps {
  children: ReactNode;
  /**
   * Maximum time to wait before loading deferred content (ms).
   * After this timeout, content loads even if browser isn't idle.
   * @default 2000
   */
  timeout?: number;
}

/**
 * Provider that coordinates deferred loading across all lazy providers.
 * Place this high in the component tree, above all lazy providers.
 *
 * @example
 * ```tsx
 * <DeferredLoadingProvider timeout={2000}>
 *   <LazyFingerprintProvider>
 *     <LazyRealtimeProvider>
 *       <App />
 *     </LazyRealtimeProvider>
 *   </LazyFingerprintProvider>
 * </DeferredLoadingProvider>
 * ```
 */
export function DeferredLoadingProvider({
  children,
  timeout = 2000,
}: DeferredLoadingProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer until browser is truly idle
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => setIsReady(true),
        { timeout } // Max delay before forcing load
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback for Safari and older browsers
      const timeoutId = setTimeout(() => setIsReady(true), Math.min(timeout, 1500));
      return () => clearTimeout(timeoutId);
    }
  }, [timeout]);

  return (
    <DeferredLoadingContext.Provider value={{ isReady }}>
      {children}
    </DeferredLoadingContext.Provider>
  );
}
