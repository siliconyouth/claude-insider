/**
 * Lazy Highlights Section
 *
 * Dynamically imports the HighlightsSection to defer loading until needed.
 * This section is at the very bottom of the homepage.
 *
 * Performance Impact:
 * - Defers ~2KB of JavaScript until after LCP
 * - Uses SSR for SEO but defers JavaScript hydration
 * - Shows skeleton placeholder during load
 */

"use client";

import dynamic from "next/dynamic";

// Lazy load the highlights section - it's at the bottom of the page
const HighlightsSection = dynamic(
  () => import("./highlights-section").then((m) => ({ default: m.HighlightsSection })),
  {
    ssr: true, // Still SSR for SEO, but defer hydration
    loading: () => (
      <div className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#111111]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          {/* Header skeleton */}
          <div className="h-7 w-72 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg mb-10 animate-pulse" />

          {/* Grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-center animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="mx-auto w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 mb-3" />
                <div className="h-4 w-20 mx-auto bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="h-3 w-16 mx-auto bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

export function LazyHighlightsSection() {
  return <HighlightsSection />;
}
