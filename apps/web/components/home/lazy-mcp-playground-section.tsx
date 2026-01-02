'use client';

/**
 * Lazy-loaded MCP Playground Section
 *
 * Uses dynamic import for code splitting to improve homepage LCP.
 * Shows skeleton while loading.
 */

import dynamic from 'next/dynamic';
import { cn } from '@/lib/design-system';

// Skeleton component for loading state
function MCPPlaygroundSkeleton() {
  return (
    <section className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-white dark:from-[#0a0a0a] to-gray-50 dark:to-[#111111]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side skeleton */}
          <div className="space-y-6">
            {/* Badge skeleton */}
            <div className="h-7 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />

            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-10 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-full max-w-lg rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-5 w-3/4 max-w-lg rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>

            {/* Features grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-[#262626]">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA skeleton */}
            <div className="flex gap-4">
              <div className="h-12 w-40 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-12 w-36 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          </div>

          {/* Right side - Editor skeleton */}
          <div className={cn(
            'rounded-2xl overflow-hidden',
            'bg-[#1e1e1e]',
            'border border-[#333]',
            'shadow-2xl shadow-black/30'
          )}>
            {/* Header skeleton */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                </div>
                <div className="h-4 w-24 ml-2 rounded bg-gray-700 animate-pulse" />
              </div>
            </div>

            {/* Code content skeleton */}
            <div className="p-4 space-y-2" style={{ minHeight: '280px' }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-700 animate-pulse" />
                  <div
                    className="h-4 rounded bg-gray-700 animate-pulse"
                    style={{ width: `${40 + (i % 4) * 20}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Dynamic import with loading skeleton
const MCPPlaygroundSection = dynamic(
  () => import('./mcp-playground-section'),
  {
    loading: () => <MCPPlaygroundSkeleton />,
    ssr: true
  }
);

export function LazyMCPPlaygroundSection() {
  return <MCPPlaygroundSection />;
}

export default LazyMCPPlaygroundSection;
