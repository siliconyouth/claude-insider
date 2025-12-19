"use client";

/**
 * Virtualized User Grid
 *
 * High-performance grid for displaying user cards using TanStack Virtual.
 * Only renders visible rows + overscan for smooth scrolling with large datasets.
 *
 * Features:
 * - Responsive columns (1/2/3 based on container width)
 * - Dynamic row height estimation
 * - Overscan for smooth scrolling
 * - ResizeObserver for responsive column count
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/design-system";

// ============================================================================
// Types
// ============================================================================

interface VirtualizedUserGridProps<T> {
  /** Items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor for React */
  keyExtractor: (item: T) => string;
  /** Estimated row height in pixels */
  estimatedRowHeight?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Number of extra rows to render above/below viewport */
  overscan?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Loading skeleton to show */
  loadingSkeleton?: React.ReactNode;
  /** Empty state to show */
  emptyState?: React.ReactNode;
  /** Additional className for container */
  className?: string;
  /** Height of the scrolling container (required for virtualization) */
  height?: number | string;
  /** Fixed column count (overrides responsive) */
  columns?: 1 | 2 | 3;
}

// ============================================================================
// Constants
// ============================================================================

// Breakpoints for responsive columns (in pixels)
const BREAKPOINTS = {
  md: 768,
  lg: 1024,
};

// Estimated heights for different layouts
const ROW_HEIGHT_ESTIMATES = {
  1: 180, // Single column - full card with bio
  2: 160, // Two columns
  3: 150, // Three columns - more compact
};

// ============================================================================
// Component
// ============================================================================

export function VirtualizedUserGrid<T>({
  items,
  renderItem,
  keyExtractor,
  estimatedRowHeight,
  gap = 16,
  overscan = 3,
  isLoading = false,
  loadingSkeleton,
  emptyState,
  className,
  height = "100%",
  columns: fixedColumns,
}: VirtualizedUserGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(fixedColumns || 3);

  // Calculate rows from items based on column count
  const rowCount = Math.ceil(items.length / columnCount);
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const startIdx = rowIndex * columnCount;
    return items.slice(startIdx, startIdx + columnCount);
  });

  // Responsive column count based on container width
  useEffect(() => {
    if (fixedColumns) {
      setColumnCount(fixedColumns);
      return;
    }

    const container = parentRef.current;
    if (!container) return;

    const updateColumns = () => {
      const width = container.offsetWidth;
      if (width < BREAKPOINTS.md) {
        setColumnCount(1);
      } else if (width < BREAKPOINTS.lg) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }
    };

    // Initial check
    updateColumns();

    // Watch for resize
    const observer = new ResizeObserver(updateColumns);
    observer.observe(container);

    return () => observer.disconnect();
  }, [fixedColumns]);

  // Estimate row size based on column count
  const estimateSize = useCallback(() => {
    return estimatedRowHeight || ROW_HEIGHT_ESTIMATES[columnCount as 1 | 2 | 3] || 160;
  }, [estimatedRowHeight, columnCount]);

  // Virtual list for rows
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
    // Re-measure when column count changes
    getItemKey: (index) => `row-${index}-${columnCount}`,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("overflow-hidden", className)} style={{ height }}>
        {loadingSkeleton || (
          <div
            className={cn(
              "grid gap-4",
              columnCount === 1 && "grid-cols-1",
              columnCount === 2 && "grid-cols-2",
              columnCount === 3 && "grid-cols-3"
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#262626]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-[#262626] rounded" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-[#262626] rounded" />
                    <div className="h-3 w-full bg-gray-200 dark:bg-[#262626] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn("overflow-hidden", className)} style={{ height }}>
        {emptyState || (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      {/* Total height container */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* Virtual rows */}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={cn(
                  "grid",
                  columnCount === 1 && "grid-cols-1",
                  columnCount === 2 && "grid-cols-2",
                  columnCount === 3 && "grid-cols-3"
                )}
                style={{ gap: `${gap}px` }}
              >
                {row.map((item, colIndex) => (
                  <div key={keyExtractor(item)} className="min-w-0">
                    {renderItem(item, virtualRow.index * columnCount + colIndex)}
                  </div>
                ))}
                {/* Fill empty cells to maintain grid alignment */}
                {row.length < columnCount &&
                  Array.from({ length: columnCount - row.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-w-0" />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
