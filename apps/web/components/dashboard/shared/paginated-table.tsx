/**
 * PaginatedTable Component
 *
 * Generic table with loading state, empty state, and pagination.
 * Designed for dashboard list views.
 */

"use client";

import { cn } from "@/lib/design-system";
import { EmptyState, EmptyStateInline } from "./empty-state";
import type { TableColumn } from "@/lib/dashboard/types";

interface PaginatedTableProps<T> {
  /** Table columns configuration */
  columns: TableColumn<T>[];
  /** Data items to display */
  items: T[];
  /** Loading state */
  isLoading: boolean;
  /** Key extractor function */
  getKey: (item: T) => string;
  /** Current page (1-indexed) */
  page: number;
  /** Total pages */
  totalPages: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Additional row className */
  rowClassName?: string | ((item: T) => string);
  /** Additional className */
  className?: string;
}

export function PaginatedTable<T>({
  columns,
  items,
  isLoading,
  getKey,
  page,
  totalPages,
  onPageChange,
  emptyMessage = "No items found",
  emptyDescription,
  emptyIcon,
  onRowClick,
  rowClassName,
  className,
}: PaginatedTableProps<T>) {
  // Loading skeleton
  if (isLoading && items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-gray-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        message={emptyMessage}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {items.map((item) => {
              const key = getKey(item);
              const rowClass = typeof rowClassName === "function"
                ? rowClassName(item)
                : rowClassName;

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-gray-900/50",
                    rowClass
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={`${key}-${String(column.key)}`}
                      className={cn(
                        "px-4 py-4 text-sm",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Loading overlay for refetching */}
      {isLoading && items.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

/**
 * Pagination controls
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);

    // Adjust if at the edges
    if (page <= 2) {
      end = Math.min(totalPages - 1, 4);
    } else if (page >= totalPages - 1) {
      start = Math.max(2, totalPages - 3);
    }

    // Add ellipsis and pages
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) pages.push("...");

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p className="text-sm text-gray-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className={cn(
            "px-3 py-1.5 text-sm rounded-lg transition-colors",
            canGoPrev
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 cursor-not-allowed"
          )}
        >
          Previous
        </button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "min-w-[32px] px-2 py-1 text-sm rounded-lg transition-colors",
                  page === pageNum
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className={cn(
            "px-3 py-1.5 text-sm rounded-lg transition-colors",
            canGoNext
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Simple card-based list (alternative to table)
 */
interface CardListProps<T> {
  items: T[];
  isLoading: boolean;
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function CardList<T>({
  items,
  isLoading,
  getKey,
  renderCard,
  page,
  totalPages,
  onPageChange,
  emptyMessage = "No items found",
  columns = 1,
  className,
}: CardListProps<T>) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  if (isLoading && items.length === 0) {
    return (
      <div className={cn("grid gap-4", gridCols[columns], className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-gray-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return <EmptyStateInline message={emptyMessage} className={className} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("grid gap-4", gridCols[columns])}>
        {items.map((item) => (
          <div key={getKey(item)}>{renderCard(item)}</div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
