/**
 * Lazy Resources Section
 *
 * Dynamically imports the ResourcesSection to defer loading until needed.
 * This component is below-the-fold, so lazy loading improves initial LCP.
 */

"use client";

import dynamic from "next/dynamic";
import { ResourcesErrorBoundary } from "./resources-error-boundary";

// Lazy load the resources section - it's below the fold
const ResourcesSection = dynamic(
  () => import("./resources-section").then((m) => ({ default: m.ResourcesSection })),
  {
    ssr: true, // Still SSR for SEO, but defer hydration
    loading: () => (
      <div className="border-t border-gray-200 dark:border-[#1a1a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="h-8 w-16 mx-auto bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="h-4 w-24 mx-auto bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

export function LazyResourcesSection() {
  return (
    <ResourcesErrorBoundary>
      <ResourcesSection />
    </ResourcesErrorBoundary>
  );
}
