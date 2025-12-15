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
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const hasTrackedInitial = useRef(false);

  // Track page views
  useEffect(() => {
    // Only track when we have a visitorId and haven't tracked this path yet
    if (
      !fingerprint.visitorId ||
      fingerprint.isLoading ||
      typeof window === "undefined"
    ) {
      return;
    }

    // Avoid duplicate tracking for same path
    if (lastTrackedPath.current === pathname && hasTrackedInitial.current) {
      return;
    }

    lastTrackedPath.current = pathname;
    hasTrackedInitial.current = true;

    // Send tracking request (fire and forget)
    fetch("/api/security/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId: fingerprint.visitorId,
        endpoint: pathname,
        method: "GET",
        eventType: "page_view",
        fingerprint: {
          confidence: fingerprint.confidence,
          components: fingerprint.components,
        },
        isBot: false,
      }),
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, [fingerprint.visitorId, fingerprint.isLoading, fingerprint.confidence, fingerprint.components, pathname]);

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
