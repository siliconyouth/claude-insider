/**
 * Search Analytics Loading Skeleton
 */

import { cn } from "@/lib/design-system";

export default function SearchAnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-48 bg-gray-700 rounded" />
        <div className="h-4 w-72 bg-gray-800 rounded mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl p-4 border bg-gray-800/50 border-gray-700"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-700" />
              <div>
                <div className="h-3 w-16 bg-gray-700 rounded mb-2" />
                <div className="h-6 w-12 bg-gray-600 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-28 bg-gray-800 rounded-lg"
          />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden">
        <div className="h-12 border-b border-gray-700 flex items-center px-4 gap-4">
          <div className="h-3 w-16 bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-700 rounded ml-auto" />
          <div className="h-3 w-16 bg-gray-700 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-14 border-b border-gray-700/50 flex items-center px-4 gap-4",
              i % 2 === 0 ? "bg-gray-800/30" : ""
            )}
          >
            <div className="h-4 w-32 bg-gray-700 rounded" />
            <div className="h-4 w-12 bg-gray-700 rounded ml-auto" />
            <div className="h-4 w-16 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
