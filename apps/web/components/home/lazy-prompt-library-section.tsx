'use client';

/**
 * Lazy-loaded Prompt Library Section
 *
 * Uses dynamic import for code splitting to improve homepage LCP.
 * Shows skeleton while loading.
 */

import dynamic from 'next/dynamic';
import { cn } from '@/lib/design-system';

// Skeleton component for loading state
function PromptLibrarySkeleton() {
  return (
    <section className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#111111]/50 to-white dark:to-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left side skeleton */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Badge skeleton */}
            <div className="h-7 w-48 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />

            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-10 w-72 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-8 w-56 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-full max-w-lg rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-5 w-3/4 max-w-lg rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>

            {/* Features skeleton */}
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 w-full max-w-xs rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats skeleton */}
            <div className="flex flex-wrap gap-6 p-4 rounded-xl border border-gray-200 dark:border-[#262626]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-8 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
              ))}
            </div>

            {/* CTA skeleton */}
            <div className="flex gap-4">
              <div className="h-12 w-40 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-12 w-36 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          </div>

          {/* Right side - Demo card skeleton */}
          <div className={cn(
            'rounded-2xl overflow-hidden order-1 lg:order-2',
            'bg-white dark:bg-[#111111]',
            'border border-gray-200 dark:border-[#262626]',
            'shadow-2xl shadow-black/10 dark:shadow-black/30',
            'p-6'
          )}>
            <div className="min-h-[380px] space-y-4">
              {/* Card header skeleton */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </div>
                  <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
                <div className="h-5 w-10 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>

              {/* Content skeleton */}
              <div className={cn(
                'p-4 rounded-xl',
                'bg-gray-50 dark:bg-[#0a0a0a]',
                'border border-gray-200 dark:border-[#262626]'
              )}>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
              </div>

              {/* Button skeleton */}
              <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />

              {/* Variable inputs skeleton */}
              <div className="space-y-4 mt-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline indicator skeleton */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-6 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Dynamic import with loading skeleton
const PromptLibrarySection = dynamic(
  () => import('./prompt-library-section'),
  {
    loading: () => <PromptLibrarySkeleton />,
    ssr: true
  }
);

export function LazyPromptLibrarySection() {
  return <PromptLibrarySection />;
}

export default LazyPromptLibrarySection;
