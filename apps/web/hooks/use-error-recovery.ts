"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Error Recovery Hooks
 * Retry mechanisms with exponential backoff and circuit breaker patterns
 *
 * Part of the UX System - Pillar 5: Error Boundaries with Style
 */

// ============================================
// TYPES
// ============================================

export type RetryState = "idle" | "pending" | "success" | "error" | "exhausted";

interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier (default: 2 for exponential) */
  backoffFactor?: number;
  /** Add random jitter to delays */
  jitter?: boolean;
  /** Callback when retry starts */
  onRetry?: (attempt: number, delay: number) => void;
  /** Callback when all retries exhausted */
  onExhausted?: (error: Error) => void;
  /** Callback on success */
  onSuccess?: () => void;
}

interface UseRetryReturn<T> {
  /** Execute the async function with retry logic */
  execute: () => Promise<T | null>;
  /** Current state of the retry operation */
  state: RetryState;
  /** Current retry attempt (0 = first try) */
  attempt: number;
  /** Last error that occurred */
  error: Error | null;
  /** Time until next retry (ms), or null if not waiting */
  nextRetryIn: number | null;
  /** Manually reset the retry state */
  reset: () => void;
  /** Cancel pending retry */
  cancel: () => void;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Result data on success */
  data: T | null;
}

// ============================================
// useRetry Hook
// ============================================

/**
 * Hook for executing async operations with automatic retry and exponential backoff
 *
 * @example
 * ```tsx
 * const { execute, state, attempt, error, nextRetryIn } = useRetry(
 *   async () => {
 *     const response = await fetch("/api/data");
 *     if (!response.ok) throw new Error("Failed to fetch");
 *     return response.json();
 *   },
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 *
 * // In component
 * {state === "pending" && <Loading />}
 * {state === "error" && nextRetryIn && <p>Retrying in {nextRetryIn}ms...</p>}
 * {state === "exhausted" && <p>Failed after multiple attempts</p>}
 * ```
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
    onRetry,
    onExhausted,
    onSuccess,
  } = options;

  const [state, setState] = useState<RetryState>("idle");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
  const [data, setData] = useState<T | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  // Calculate delay with exponential backoff and optional jitter
  const calculateDelay = useCallback(
    (attemptNum: number): number => {
      const baseDelay = Math.min(
        initialDelay * Math.pow(backoffFactor, attemptNum),
        maxDelay
      );
      if (jitter) {
        // Add random jitter between 0% and 25% of base delay
        return baseDelay + Math.random() * baseDelay * 0.25;
      }
      return baseDelay;
    },
    [initialDelay, backoffFactor, maxDelay, jitter]
  );

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    clearTimers();
    cancelledRef.current = false;
    setState("idle");
    setAttempt(0);
    setError(null);
    setNextRetryIn(null);
    setData(null);
  }, [clearTimers]);

  // Cancel pending retry
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    clearTimers();
    setNextRetryIn(null);
  }, [clearTimers]);

  // Execute with retry logic
  const execute = useCallback(async (): Promise<T | null> => {
    cancelledRef.current = false;
    setState("pending");
    setError(null);

    let currentAttempt = 0;

    const tryExecute = async (): Promise<T | null> => {
      if (cancelledRef.current) {
        setState("idle");
        return null;
      }

      try {
        const result = await asyncFn();
        setState("success");
        setData(result);
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (currentAttempt >= maxRetries) {
          setState("exhausted");
          onExhausted?.(error);
          return null;
        }

        // Schedule retry
        const delay = calculateDelay(currentAttempt);
        currentAttempt++;
        setAttempt(currentAttempt);
        onRetry?.(currentAttempt, delay);

        // Countdown timer
        setNextRetryIn(delay);
        let remaining = delay;
        countdownRef.current = setInterval(() => {
          remaining -= 100;
          setNextRetryIn(Math.max(0, remaining));
        }, 100);

        // Wait and retry
        return new Promise((resolve) => {
          timeoutRef.current = setTimeout(async () => {
            clearTimers();
            if (!cancelledRef.current) {
              const result = await tryExecute();
              resolve(result);
            } else {
              resolve(null);
            }
          }, delay);
        });
      }
    };

    return tryExecute();
  }, [asyncFn, maxRetries, calculateDelay, onRetry, onExhausted, onSuccess, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    execute,
    state,
    attempt,
    error,
    nextRetryIn,
    reset,
    cancel,
    isRetrying: state === "pending" && attempt > 0,
    data,
  };
}

// ============================================
// useCircuitBreaker Hook
// ============================================

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time to keep circuit open (ms) */
  resetTimeout?: number;
  /** Number of successful calls to close circuit from half-open */
  successThreshold?: number;
  /** Callback when circuit opens */
  onOpen?: () => void;
  /** Callback when circuit closes */
  onClose?: () => void;
}

interface UseCircuitBreakerReturn<T> {
  /** Execute the async function (returns null if circuit is open) */
  execute: () => Promise<T | null>;
  /** Current circuit state */
  circuitState: CircuitState;
  /** Number of consecutive failures */
  failureCount: number;
  /** Whether the circuit is allowing requests */
  isAllowed: boolean;
  /** Manually reset the circuit */
  reset: () => void;
}

/**
 * Hook implementing the circuit breaker pattern
 * Prevents cascading failures by temporarily blocking requests
 *
 * @example
 * ```tsx
 * const { execute, circuitState, isAllowed } = useCircuitBreaker(
 *   () => fetch("/api/fragile"),
 *   { failureThreshold: 3, resetTimeout: 30000 }
 * );
 *
 * // In component
 * {!isAllowed && <p>Service temporarily unavailable</p>}
 * ```
 */
export function useCircuitBreaker<T>(
  asyncFn: () => Promise<T>,
  options: CircuitBreakerOptions = {}
): UseCircuitBreakerReturn<T> {
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    successThreshold = 2,
    onOpen,
    onClose,
  } = options;

  const [circuitState, setCircuitState] = useState<CircuitState>("closed");
  const [failureCount, setFailureCount] = useState(0);
  const [_successCount, setSuccessCount] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAllowed = circuitState !== "open";

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCircuitState("closed");
    setFailureCount(0);
    setSuccessCount(0);
    onClose?.();
  }, [onClose]);

  const openCircuit = useCallback(() => {
    setCircuitState("open");
    onOpen?.();

    // Schedule transition to half-open
    timeoutRef.current = setTimeout(() => {
      setCircuitState("half-open");
      setSuccessCount(0);
    }, resetTimeout);
  }, [resetTimeout, onOpen]);

  const execute = useCallback(async (): Promise<T | null> => {
    if (circuitState === "open") {
      return null;
    }

    try {
      const result = await asyncFn();

      if (circuitState === "half-open") {
        setSuccessCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= successThreshold) {
            reset();
          }
          return newCount;
        });
      } else {
        // Reset failure count on success
        setFailureCount(0);
      }

      return result;
    } catch (err) {
      setFailureCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= failureThreshold || circuitState === "half-open") {
          openCircuit();
        }
        return newCount;
      });

      throw err;
    }
  }, [asyncFn, circuitState, failureThreshold, successThreshold, openCircuit, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    execute,
    circuitState,
    failureCount,
    isAllowed,
    reset,
  };
}

// ============================================
// useNetworkStatus Hook
// ============================================

interface UseNetworkStatusReturn {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Whether the connection appears slow */
  isSlow: boolean;
  /** Connection effective type (4g, 3g, 2g, slow-2g) */
  effectiveType: string | null;
  /** Downlink speed in Mbps */
  downlink: number | null;
  /** Round-trip time in ms */
  rtt: number | null;
}

/**
 * Hook for monitoring network status
 *
 * @example
 * ```tsx
 * const { isOnline, isSlow, effectiveType } = useNetworkStatus();
 *
 * if (!isOnline) return <OfflineBanner />;
 * if (isSlow) return <SlowConnectionWarning />;
 * ```
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<UseNetworkStatusReturn>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSlow: false,
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection =
        (navigator as Navigator & { connection?: NetworkInformation }).connection;

      setStatus({
        isOnline: navigator.onLine,
        isSlow: connection
          ? connection.effectiveType === "slow-2g" || connection.effectiveType === "2g"
          : false,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
      });
    };

    // Initial update
    updateStatus();

    // Listen for changes
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    const connection =
      (navigator as Navigator & { connection?: NetworkInformation }).connection;
    connection?.addEventListener?.("change", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      connection?.removeEventListener?.("change", updateStatus);
    };
  }, []);

  return status;
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// ============================================
// useFallback Hook
// ============================================

interface UseFallbackOptions<T, F> {
  /** Primary data fetcher */
  primary: () => Promise<T>;
  /** Fallback data fetcher */
  fallback: () => Promise<F>;
  /** Timeout before falling back (ms) */
  timeout?: number;
}

interface UseFallbackReturn<T, F> {
  /** The result (from primary or fallback) */
  data: T | F | null;
  /** Whether using fallback data */
  isFallback: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error from both primary and fallback */
  error: Error | null;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Hook for graceful degradation with fallback data sources
 *
 * @example
 * ```tsx
 * const { data, isFallback, isLoading } = useFallback({
 *   primary: () => fetch("/api/live-data").then(r => r.json()),
 *   fallback: () => Promise.resolve(cachedData),
 *   timeout: 5000
 * });
 *
 * {isFallback && <Banner>Showing cached data</Banner>}
 * ```
 */
export function useFallback<T, F>({
  primary,
  fallback,
  timeout = 5000,
}: UseFallbackOptions<T, F>): UseFallbackReturn<T, F> {
  const [data, setData] = useState<T | F | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Race primary against timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), timeout);
    });

    try {
      const result = await Promise.race([primary(), timeoutPromise]);
      setData(result);
      setIsFallback(false);
    } catch {
      // Primary failed, try fallback
      try {
        const fallbackResult = await fallback();
        setData(fallbackResult);
        setIsFallback(true);
      } catch (fallbackErr) {
        setError(
          fallbackErr instanceof Error
            ? fallbackErr
            : new Error("Both primary and fallback failed")
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [primary, fallback, timeout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isFallback,
    isLoading,
    error,
    refetch: fetchData,
  };
}
