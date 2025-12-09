"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for detecting when an element enters the viewport
 * Uses Intersection Observer API for efficient lazy loading
 *
 * @example
 * ```tsx
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 *   triggerOnce: true,
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isIntersecting ? <ActualContent /> : <Placeholder />}
 *   </div>
 * );
 * ```
 */
export function useIntersectionObserver({
  threshold = 0,
  rootMargin = "50px",
  triggerOnce = false,
  enabled = true,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Don't observe if disabled or already triggered with triggerOnce
      if (!enabled || (triggerOnce && hasTriggeredRef.current)) {
        elementRef.current = node;
        return;
      }

      if (node) {
        elementRef.current = node;

        // Create new observer
        observerRef.current = new IntersectionObserver(
          ([observerEntry]) => {
            if (observerEntry) {
              setEntry(observerEntry);
              setIsIntersecting(observerEntry.isIntersecting);

              // If triggerOnce and now intersecting, mark as triggered and disconnect
              if (triggerOnce && observerEntry.isIntersecting) {
                hasTriggeredRef.current = true;
                observerRef.current?.disconnect();
              }
            }
          },
          {
            threshold,
            rootMargin,
          }
        );

        observerRef.current.observe(node);
      }
    },
    [enabled, rootMargin, threshold, triggerOnce]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isIntersecting, entry };
}

/**
 * Hook for detecting multiple elements in viewport
 * Useful for staggered animations
 */
export function useIntersectionObserverArray(
  count: number,
  options: UseIntersectionObserverOptions = {}
): {
  refs: ((node: Element | null) => void)[];
  isIntersecting: boolean[];
} {
  const observers = Array.from({ length: count }, () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIntersectionObserver(options)
  );

  return {
    refs: observers.map((o) => o.ref),
    isIntersecting: observers.map((o) => o.isIntersecting),
  };
}
