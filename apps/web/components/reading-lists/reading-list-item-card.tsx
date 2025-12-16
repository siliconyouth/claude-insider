"use client";

/**
 * Reading List Item Card Component
 *
 * Display an item in a reading list with progress controls.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { updateReadingProgress, removeFromReadingList } from "@/app/actions/reading-lists";
import type { ReadingListItem } from "@/app/actions/reading-lists";

interface ReadingListItemCardProps {
  item: ReadingListItem;
  onRemove?: (id: string) => void;
  onStatusChange?: (id: string, status: "unread" | "reading" | "completed") => void;
  className?: string;
}

export function ReadingListItemCard({
  item,
  onRemove,
  onStatusChange,
  className,
}: ReadingListItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(item.status);

  const handleStatusChange = async (newStatus: "unread" | "reading" | "completed") => {
    if (isUpdating || localStatus === newStatus) return;

    setIsUpdating(true);
    setLocalStatus(newStatus); // Optimistic update

    try {
      const result = await updateReadingProgress(item.id, { status: newStatus });
      if (result.error) {
        setLocalStatus(item.status); // Revert on error
      } else {
        onStatusChange?.(item.id, newStatus);
      }
    } catch {
      setLocalStatus(item.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await removeFromReadingList(item.id);
      if (!result.error) {
        onRemove?.(item.id);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors = {
    unread: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    reading: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  };

  const statusLabels = {
    unread: "Unread",
    reading: "Reading",
    completed: "Completed",
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl p-4",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "hover:border-gray-300 dark:hover:border-[#333]",
        "transition-all duration-200",
        localStatus === "completed" && "opacity-75",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Status indicator */}
        <button
          onClick={() => {
            const nextStatus = localStatus === "unread" ? "reading" : localStatus === "reading" ? "completed" : "unread";
            handleStatusChange(nextStatus);
          }}
          disabled={isUpdating}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            localStatus === "completed"
              ? "bg-green-500 border-green-500 text-white"
              : localStatus === "reading"
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-500",
            isUpdating && "opacity-50"
          )}
          title={`Mark as ${localStatus === "unread" ? "reading" : localStatus === "reading" ? "completed" : "unread"}`}
        >
          {localStatus === "completed" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {localStatus === "reading" && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {item.url ? (
            <Link
              href={item.url}
              className={cn(
                "font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 line-clamp-2",
                localStatus === "completed" && "line-through"
              )}
            >
              {item.title}
            </Link>
          ) : (
            <span className={cn(
              "font-medium text-gray-900 dark:text-white line-clamp-2",
              localStatus === "completed" && "line-through"
            )}>
              {item.title}
            </span>
          )}

          {item.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {item.notes}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {/* Status badge */}
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              statusColors[localStatus]
            )}>
              {statusLabels[localStatus]}
            </span>

            {/* Resource type */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.resource_type}
            </span>

            {/* Dates */}
            {localStatus === "completed" && item.completed_at && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Completed {new Date(item.completed_at).toLocaleDateString()}
              </span>
            )}
            {localStatus === "reading" && item.started_at && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Started {new Date(item.started_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick status buttons */}
          <div className="flex items-center gap-1 mr-2">
            {localStatus !== "unread" && (
              <button
                onClick={() => handleStatusChange("unread")}
                disabled={isUpdating}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                title="Mark as unread"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            )}
            {localStatus !== "completed" && (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={isUpdating}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Mark as completed"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Remove from list"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar (for reading items) */}
      {localStatus === "reading" && item.progress > 0 && item.progress < 100 && (
        <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
