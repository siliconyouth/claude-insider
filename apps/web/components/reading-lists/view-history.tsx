"use client";

/**
 * View History Component
 *
 * Display recently viewed resources.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getViewHistory, clearViewHistory } from "@/app/actions/reading-lists";
import type { ViewHistoryEntry } from "@/app/actions/reading-lists";

interface ViewHistoryProps {
  limit?: number;
  showClearButton?: boolean;
  className?: string;
}

export function ViewHistory({
  limit = 20,
  showClearButton = true,
  className,
}: ViewHistoryProps) {
  const [history, setHistory] = useState<ViewHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const result = await getViewHistory(limit);
    if (result.history) {
      setHistory(result.history);
    }
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
     
    loadHistory();
  }, [loadHistory]);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your view history?")) return;

    setIsClearing(true);
    const result = await clearViewHistory();
    if (!result.error) {
      setHistory([]);
    }
    setIsClearing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-[#111111]">
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No viewing history yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Resources you view will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      {showClearButton && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            View History
          </h3>
          <button
            onClick={handleClear}
            disabled={isClearing}
            className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            {isClearing ? "Clearing..." : "Clear History"}
          </button>
        </div>
      )}

      {/* History list */}
      <div className="space-y-2">
        {history.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              "bg-gray-50 dark:bg-[#111111]",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            {/* Type icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {entry.url ? (
                <Link
                  href={entry.url}
                  className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 line-clamp-1"
                >
                  {entry.title}
                </Link>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {entry.title}
                </span>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(entry.viewed_at)}</span>
                {entry.view_count > 1 && (
                  <span>• Viewed {entry.view_count} times</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
