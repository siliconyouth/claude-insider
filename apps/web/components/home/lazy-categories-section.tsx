/**
 * Lazy Categories Section
 *
 * Dynamically imports the CategoriesSection to defer loading until needed.
 * Moves ~8KB of JavaScript (CATEGORIES array + SVG icons) out of initial bundle.
 *
 * Performance Impact:
 * - Defers 7 category cards with complex SVG icons until after LCP
 * - Uses SSR for SEO but defers JavaScript hydration
 * - Shows skeleton placeholder during load
 */

"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";

// Lazy load the categories section - it's below the fold
const CategoriesSection = dynamic(
  () => import("./categories-section").then((m) => ({ default: m.CategoriesSection })),
  {
    ssr: true, // Still SSR for SEO, but defer hydration
    loading: () => (
      <div className="relative border-t border-gray-200 dark:border-[#1a1a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          {/* Header skeleton */}
          <div className="text-center mb-16">
            <div className="inline-flex h-8 w-48 mx-auto bg-gray-200 dark:bg-gray-800 rounded-full mb-6 animate-pulse" />
            <div className="h-10 w-80 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 animate-pulse" />
            <div className="h-6 w-96 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>

          {/* Category grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl overflow-hidden",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "animate-pulse"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-5" />
                  <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-4">
                    <div className="space-y-2.5">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

export function LazyCategoriesSection() {
  return <CategoriesSection />;
}
