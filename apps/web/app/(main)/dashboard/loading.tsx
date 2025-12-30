/**
 * Dashboard Loading Skeleton
 *
 * Global loading state for dashboard pages.
 * Provides a consistent skeleton that matches common dashboard layouts:
 * - Page header with title and description
 * - Stats cards grid
 * - Filter/tab controls
 * - Content table or card grid
 */

import { cn } from "@/lib/design-system";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header */}
      <div>
        <div className="h-8 w-48 ui-bg-skeleton rounded" />
        <div className="h-4 w-72 ui-bg-skeleton rounded mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tab/Filter Buttons */}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-28 ui-bg-skeleton rounded-lg"
            />
          ))}
        </div>

        {/* Search/Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 ui-bg-skeleton rounded-lg" />
          <div className="h-10 w-10 ui-bg-skeleton rounded-lg" />
        </div>
      </div>

      {/* Content Table */}
      <TableSkeleton />
    </div>
  );
}

/**
 * Stat Card Skeleton
 */
function StatCardSkeleton() {
  return (
    <div
      className={cn(
        "rounded-xl p-4 border ui-border",
        "ui-bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg ui-bg-skeleton" />
        <div className="flex-1">
          <div className="h-3 w-16 ui-bg-skeleton rounded mb-2" />
          <div className="h-6 w-12 ui-bg-skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 */
function TableSkeleton() {
  return (
    <div className="rounded-xl ui-bg-card border ui-border overflow-hidden">
      {/* Table Header */}
      <div className="h-12 border-b ui-border flex items-center px-4 gap-4">
        <div className="h-3 w-24 ui-bg-skeleton rounded" />
        <div className="h-3 w-20 ui-bg-skeleton rounded ml-auto" />
        <div className="h-3 w-16 ui-bg-skeleton rounded" />
        <div className="h-3 w-16 ui-bg-skeleton rounded" />
      </div>

      {/* Table Rows */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={cn(
            "h-16 border-b ui-border flex items-center px-4 gap-4",
            i % 2 === 0 ? "ui-bg-skeleton" : ""
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full ui-bg-skeleton shrink-0" />
            <div>
              <div className="h-4 w-32 ui-bg-skeleton rounded mb-1" />
              <div className="h-3 w-24 ui-bg-skeleton rounded" />
            </div>
          </div>
          <div className="h-4 w-16 ui-bg-skeleton rounded" />
          <div className="h-6 w-16 ui-bg-skeleton rounded-full" />
          <div className="h-8 w-20 ui-bg-skeleton rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * Card Grid Skeleton (alternative to table)
 * Export for pages that use card grids instead of tables
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl ui-bg-card border ui-border p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg ui-bg-skeleton" />
            <div className="flex-1">
              <div className="h-4 w-32 ui-bg-skeleton rounded mb-1" />
              <div className="h-3 w-24 ui-bg-skeleton rounded" />
            </div>
          </div>
          <div className="h-16 ui-bg-skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 ui-bg-skeleton rounded-full" />
            <div className="h-6 w-16 ui-bg-skeleton rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple List Skeleton (for notifications, logs, etc.)
 * Export for pages that use simple lists
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl ui-bg-card border ui-border p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg ui-bg-skeleton shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-48 ui-bg-skeleton rounded mb-2" />
            <div className="h-3 w-32 ui-bg-skeleton rounded" />
          </div>
          <div className="h-8 w-20 ui-bg-skeleton rounded-lg" />
        </div>
      ))}
    </div>
  );
}
