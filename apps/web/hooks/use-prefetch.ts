"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  prefetchQueue,
  getRoutePriority,
  extractInternalLinks,
} from "@/lib/prefetch-queue";

export type { PrefetchPriority } from "@/lib/prefetch-queue";

interface UsePrefetchOptions {
  /**
   * Enable prefetching on hover
   * @default true
   */
  onHover?: boolean;

  /**
   * Enable prefetching on focus
   * @default true
   */
  onFocus?: boolean;

  /**
   * Delay before prefetching on hover (ms)
   * @default 100
   */
  hoverDelay?: number;

  /**
   * Enable intersection-based prefetching for visible links
   * @default true
   */
  onIntersection?: boolean;

  /**
   * Root margin for intersection observer
   * @default "100px"
   */
  intersectionMargin?: string;

  /**
   * Override priority for this link
   */
  priority?: PrefetchPriority;
}

interface UsePrefetchReturn {
  /**
   * Ref callback to attach to the link element
   */
  ref: (node: HTMLElement | null) => void;

  /**
   * Whether the link is being prefetched
   */
  isPrefetching: boolean;

  /**
   * Whether the link has been prefetched
   */
  isPrefetched: boolean;

  /**
   * Manually trigger prefetch
   */
  prefetch: () => void;
}

/**
 * Hook for prefetching a single route with hover/focus/intersection triggers
 *
 * Part of the UX System - Pillar 4: Smart Prefetching
 *
 * @example
 * ```tsx
 * const { ref, isPrefetched } = usePrefetch("/docs/getting-started");
 *
 * return (
 *   <a ref={ref} href="/docs/getting-started">
 *     Getting Started {isPrefetched && "✓"}
 *   </a>
 * );
 * ```
 */
export function usePrefetch(
  url: string,
  options: UsePrefetchOptions = {}
): UsePrefetchReturn {
  const {
    onHover = true,
    onFocus = true,
    hoverDelay = 100,
    onIntersection = true,
    intersectionMargin = "100px",
    priority,
  } = options;

  const router = useRouter();
  const elementRef = useRef<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);

  // Initialize queue with router prefetch function
  useEffect(() => {
    prefetchQueue.setPrefetchFn((routeUrl) => {
      router.prefetch(routeUrl);
    });
  }, [router]);

  // Check initial prefetch state
  useEffect(() => {
    setIsPrefetched(prefetchQueue.isPrefetched(url));
    setIsPrefetching(prefetchQueue.isLoading(url));
  }, [url]);

  // Prefetch function
  const prefetch = useCallback(() => {
    if (isPrefetched || isPrefetching) return;

    const routePriority = priority || getRoutePriority(url);
    setIsPrefetching(true);
    prefetchQueue.add(url, routePriority);

    // Update state after prefetch completes
    setTimeout(() => {
      setIsPrefetching(false);
      setIsPrefetched(prefetchQueue.isPrefetched(url));
    }, 150);
  }, [url, priority, isPrefetched, isPrefetching]);

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    if (!onHover || isPrefetched) return;

    hoverTimeoutRef.current = setTimeout(() => {
      prefetch();
    }, hoverDelay);
  }, [onHover, hoverDelay, isPrefetched, prefetch]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Focus handler
  const handleFocus = useCallback(() => {
    if (!onFocus || isPrefetched) return;
    prefetch();
  }, [onFocus, isPrefetched, prefetch]);

  // Ref callback
  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Cleanup previous
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (elementRef.current) {
        elementRef.current.removeEventListener("mouseenter", handleMouseEnter);
        elementRef.current.removeEventListener("mouseleave", handleMouseLeave);
        elementRef.current.removeEventListener("focus", handleFocus);
      }

      elementRef.current = node;

      if (node) {
        // Add event listeners
        node.addEventListener("mouseenter", handleMouseEnter);
        node.addEventListener("mouseleave", handleMouseLeave);
        node.addEventListener("focus", handleFocus);

        // Setup intersection observer
        if (onIntersection && !isPrefetched) {
          observerRef.current = new IntersectionObserver(
            ([entry]) => {
              if (entry?.isIntersecting) {
                // Delay prefetch for visible links (lower priority)
                setTimeout(() => {
                  if (!prefetchQueue.isPrefetched(url)) {
                    prefetchQueue.add(url, "low");
                  }
                }, 500);

                // Stop observing after first intersection
                observerRef.current?.disconnect();
              }
            },
            {
              rootMargin: intersectionMargin,
              threshold: 0,
            }
          );

          observerRef.current.observe(node);
        }
      }
    },
    [
      handleMouseEnter,
      handleMouseLeave,
      handleFocus,
      onIntersection,
      intersectionMargin,
      isPrefetched,
      url,
    ]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref,
    isPrefetching,
    isPrefetched,
    prefetch,
  };
}

/**
 * Hook to record page visits and prefetch popular routes on mount
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * export default function Layout({ children }) {
 *   usePageVisitTracker();
 *   return <>{children}</>;
 * }
 * ```
 */
export function usePageVisitTracker(): void {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Initialize prefetch function
    prefetchQueue.setPrefetchFn((url) => {
      router.prefetch(url);
    });

    // Record current page visit
    prefetchQueue.recordVisit(pathname);

    // Prefetch popular routes after a delay
    const timeout = setTimeout(() => {
      const popularRoutes = prefetchQueue.getPopularRoutes(3);
      for (const route of popularRoutes) {
        if (route !== pathname) {
          prefetchQueue.add(route, "high");
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [pathname, router]);
}

/**
 * Hook to prefetch all visible links on a page
 *
 * @example
 * ```tsx
 * function DocsPage() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   usePrefetchVisibleLinks(containerRef);
 *
 *   return <div ref={containerRef}>...</div>;
 * }
 * ```
 */
export function usePrefetchVisibleLinks(
  containerRef: React.RefObject<HTMLElement | null>
): void {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Initialize prefetch function
    prefetchQueue.setPrefetchFn((url) => {
      router.prefetch(url);
    });

    if (!containerRef.current) return;

    // Extract all internal links
    const links = extractInternalLinks(containerRef.current);

    // Create observer for visible links
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const href = (entry.target as HTMLAnchorElement).getAttribute("href");
            if (href && !prefetchQueue.isPrefetched(href)) {
              const priority = getRoutePriority(href);
              prefetchQueue.add(href, priority === "critical" ? "high" : "normal");
            }
          }
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    // Observe all links
    const linkElements = containerRef.current.querySelectorAll('a[href^="/"]');
    linkElements.forEach((link) => {
      observerRef.current?.observe(link);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [containerRef, router]);
}
