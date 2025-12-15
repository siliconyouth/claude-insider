/**
 * FingerprintJS Hook
 *
 * Client-side hook for browser fingerprinting.
 * Provides visitorId that persists across sessions.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import FingerprintJS, { type GetResult } from "@fingerprintjs/fingerprintjs";

export interface FingerprintResult {
  visitorId: string | null;
  confidence: number;
  components: Record<string, unknown>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Storage key for caching fingerprint
const FINGERPRINT_STORAGE_KEY = "fp_visitor_id";
const FINGERPRINT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedFingerprint {
  visitorId: string;
  confidence: number;
  components: Record<string, unknown>;
  timestamp: number;
}

/**
 * Hook for browser fingerprinting
 * Initializes FingerprintJS and returns visitor identification
 */
export function useFingerprint(): FingerprintResult {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [components, setComponents] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFingerprint = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for cached fingerprint (unless forcing refresh)
      if (!forceRefresh) {
        const cached = getCachedFingerprint();
        if (cached) {
          setVisitorId(cached.visitorId);
          setConfidence(cached.confidence);
          setComponents(cached.components);
          setIsLoading(false);
          return;
        }
      }

      // Initialize FingerprintJS
      const fp = await FingerprintJS.load();

      // Get the visitor identifier
      const result: GetResult = await fp.get();

      // Extract visitor ID and confidence
      const fpVisitorId = result.visitorId;
      const fpConfidence = result.confidence.score;

      // Convert components to a simpler object for storage
      const fpComponents: Record<string, unknown> = {};
      for (const [key, component] of Object.entries(result.components)) {
        // Only include components that have a value (not errors)
        if ("value" in component) {
          fpComponents[key] = component.value;
        }
      }

      // Update state
      setVisitorId(fpVisitorId);
      setConfidence(fpConfidence);
      setComponents(fpComponents);

      // Cache the result
      cacheFingerprint({
        visitorId: fpVisitorId,
        confidence: fpConfidence,
        components: fpComponents,
        timestamp: Date.now(),
      });

      // Store in global for fetch interceptor
      if (typeof window !== "undefined") {
        (window as unknown as { __visitorId: string }).__visitorId = fpVisitorId;
      }
    } catch (err) {
      console.error("[Fingerprint] Error:", err);
      setError(err instanceof Error ? err : new Error("Fingerprint failed"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load fingerprint on mount
  useEffect(() => {
    loadFingerprint();
  }, [loadFingerprint]);

  // Refresh function for manual updates
  const refresh = useCallback(async () => {
    await loadFingerprint(true);
  }, [loadFingerprint]);

  return {
    visitorId,
    confidence,
    components,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Get cached fingerprint from localStorage
 */
function getCachedFingerprint(): CachedFingerprint | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (!cached) {
      return null;
    }

    const parsed: CachedFingerprint = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - parsed.timestamp > FINGERPRINT_CACHE_DURATION) {
      localStorage.removeItem(FINGERPRINT_STORAGE_KEY);
      return null;
    }

    // Restore to global
    if (typeof window !== "undefined") {
      (window as unknown as { __visitorId: string }).__visitorId = parsed.visitorId;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Cache fingerprint to localStorage
 */
function cacheFingerprint(data: CachedFingerprint): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full or disabled
  }
}

/**
 * Get current visitor ID (for use outside React)
 */
export function getVisitorIdFromCache(): string | null {
  if (typeof window !== "undefined") {
    const cached = (window as unknown as { __visitorId?: string }).__visitorId;
    if (cached) {
      return cached;
    }
  }

  const stored = getCachedFingerprint();
  return stored?.visitorId || null;
}

/**
 * Clear cached fingerprint
 */
export function clearFingerprintCache(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(FINGERPRINT_STORAGE_KEY);
    delete (window as unknown as { __visitorId?: string }).__visitorId;
  }
}
