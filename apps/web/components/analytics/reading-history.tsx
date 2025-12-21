"use client";

/**
 * Reading History Component
 *
 * Paginated list of user's reading history with clear functionality.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  BookOpenIcon,
  ClockIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ViewHistoryItem {
  id: string;
  resourceType: "doc" | "resource";
  slug: string;
  title: string;
  category?: string;
  viewedAt: string;
}

interface ReadingHistoryProps {
  history: ViewHistoryItem[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearHistory: () => void;
  isClearing?: boolean;
  className?: string;
}

export function ReadingHistory({
  history,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  onClearHistory,
  isClearing = false,
  className,
}: ReadingHistoryProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    setShowConfirm(false);
    onClearHistory();
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 bg-[#111111] border border-[#262626]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Reading History</h3>
          {totalItems > 0 && (
            <span className="text-sm text-gray-400">
              ({totalItems} items)
            </span>
          )}
        </div>

        {totalItems > 0 && (
          <div className="relative">
            {showConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Clear all?</span>
                <button
                  onClick={handleClear}
                  disabled={isClearing}
                  className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {isClearing ? "Clearing..." : "Yes"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 text-sm bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Clear History
              </button>
            )}
          </div>
        )}
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-2">No reading history yet</p>
          <p className="text-sm text-gray-500">
            Start exploring docs and resources to build your history
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {history.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#262626]">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
                  currentPage <= 1
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
              </button>

              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
                  currentPage >= totalPages
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HistoryItem({ item }: { item: ViewHistoryItem }) {
  const href =
    item.resourceType === "doc"
      ? `/docs/${item.slug}`
      : `/resources/${item.slug}`;

  const typeLabel = item.resourceType === "doc" ? "📖" : "🔗";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
    >
      {/* Type icon */}
      <span className="text-lg">{typeLabel}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
            {item.title}
          </span>
          <ExternalLinkIcon className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
        {item.category && (
          <span className="text-xs text-gray-500">{item.category}</span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
        <ClockIcon className="w-3 h-3" />
        <span>{formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true })}</span>
      </div>
    </Link>
  );
}
