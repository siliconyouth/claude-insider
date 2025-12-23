/**
 * Prefetch Provider
 *
 * Client component that integrates route prefetching into the app.
 * - Records page visits for analytics
 * - Auto-prefetches popular routes after initial load
 * - Prefetches critical routes on homepage immediately
 *
 * Part of the UX System - Pillar 4: Smart Prefetching
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { prefetchQueue, getRoutePriority } from "@/lib/prefetch-queue";

// Critical routes that should be prefetched on homepage
const HOMEPAGE_CRITICAL_ROUTES = [
  "/docs/getting-started",
  "/resources",
  "/docs",
  "/playground",
];

// Routes that should be prefetched on all pages (navigation destinations)
const GLOBAL_PRIORITY_ROUTES = [
  "/docs/getting-started",
  "/resources",
];

export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initialize prefetch queue with router.prefetch
    prefetchQueue.setPrefetchFn((url) => {
      router.prefetch(url);
    });

    // Record current page visit
    prefetchQueue.recordVisit(pathname);

    // Prefetch routes based on current page
    const prefetchTimeout = setTimeout(() => {
      if (pathname === "/") {
        // On homepage: prefetch critical routes with high priority
        for (const route of HOMEPAGE_CRITICAL_ROUTES) {
          if (!prefetchQueue.isPrefetched(route)) {
            prefetchQueue.add(route, "critical");
          }
        }
      } else {
        // On other pages: prefetch global priority routes
        for (const route of GLOBAL_PRIORITY_ROUTES) {
          if (route !== pathname && !prefetchQueue.isPrefetched(route)) {
            prefetchQueue.add(route, "high");
          }
        }
      }

      // Also prefetch popular routes from visit history
      const popularRoutes = prefetchQueue.getPopularRoutes(3);
      for (const route of popularRoutes) {
        if (route !== pathname && !prefetchQueue.isPrefetched(route)) {
          prefetchQueue.add(route, "normal");
        }
      }
    }, 1500); // Delay to not compete with initial page load

    return () => clearTimeout(prefetchTimeout);
  }, [pathname, router]);

  return <>{children}</>;
}
