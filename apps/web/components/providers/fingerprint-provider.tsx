/**
 * Fingerprint Provider
 *
 * Context provider for browser fingerprinting.
 * Wraps the app to provide visitor identification and
 * automatically inject X-Visitor-ID header into fetch requests.
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useFingerprint, type FingerprintResult } from "@/hooks/use-fingerprint";

// Context
const FingerprintContext = createContext<FingerprintResult | null>(null);

// Provider props
interface FingerprintProviderProps {
  children: ReactNode;
}

/**
 * Fingerprint Provider Component
 *
 * Provides fingerprint context to the app and sets up
 * fetch interceptor to include X-Visitor-ID header.
 */
export function FingerprintProvider({ children }: FingerprintProviderProps) {
  const fingerprint = useFingerprint();

  // Set up fetch interceptor when visitorId is available
  useEffect(() => {
    if (!fingerprint.visitorId || typeof window === "undefined") {
      return;
    }

    // Store the original fetch
    const originalFetch = window.fetch;

    // Create intercepted fetch
    const interceptedFetch: typeof fetch = async (input, init) => {
      // Get current visitor ID from window (in case it changed)
      const visitorId = (window as unknown as { __visitorId?: string }).__visitorId;

      // Create new headers with X-Visitor-ID
      const headers = new Headers(init?.headers);

      if (visitorId && !headers.has("X-Visitor-ID")) {
        headers.set("X-Visitor-ID", visitorId);
      }

      // Call original fetch with modified headers
      return originalFetch(input, {
        ...init,
        headers,
      });
    };

    // Replace global fetch
    window.fetch = interceptedFetch;

    // Cleanup: restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [fingerprint.visitorId]);

  return (
    <FingerprintContext.Provider value={fingerprint}>
      {children}
    </FingerprintContext.Provider>
  );
}

/**
 * Hook to access fingerprint context
 */
export function useFingerprintContext(): FingerprintResult {
  const context = useContext(FingerprintContext);

  if (!context) {
    // Return a safe default if used outside provider
    return {
      visitorId: null,
      confidence: 0,
      components: {},
      isLoading: true,
      error: null,
      refresh: async () => {},
    };
  }

  return context;
}

/**
 * HOC to wrap components with fingerprint provider
 */
export function withFingerprintProvider<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function WithFingerprintProvider(props: P) {
    return (
      <FingerprintProvider>
        <WrappedComponent {...props} />
      </FingerprintProvider>
    );
  };
}
