"use client";

/**
 * Read Later Button Component
 *
 * Quick action button to add resources to reading list.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { quickAddToReadLater, removeFromReadingList, isInReadingList } from "@/app/actions/reading-lists";
import { useEffect } from "react";

interface ReadLaterButtonProps {
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ReadLaterButton({
  resourceType,
  resourceId,
  title,
  url,
  size = "md",
  showLabel = true,
  className,
}: ReadLaterButtonProps) {
  const [isInList, setIsInList] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if already in list
  useEffect(() => {
    async function checkStatus() {
      const result = await isInReadingList(resourceType, resourceId);
      if (result.inList) {
        setIsInList(true);
        setItemId(result.itemId || null);
      }
    }
    checkStatus();
  }, [resourceType, resourceId]);

  const handleClick = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      if (isInList && itemId) {
        // Remove from list
        const result = await removeFromReadingList(itemId);
        if (!result.error) {
          setIsInList(false);
          setItemId(null);
        }
      } else {
        // Add to list
        const result = await quickAddToReadLater({
          resourceType,
          resourceId,
          title,
          url,
        });
        if (result.item) {
          setIsInList(true);
          setItemId(result.item.id);
        }
      }
    } catch (error) {
      console.error("Read later action failed:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isLoading, isInList, itemId, resourceType, resourceId, title, url]);

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      title={isInList ? "Remove from reading list" : "Add to reading list"}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg transition-all duration-200",
        sizeClasses[size],
        isInList
          ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
          : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill={isInList ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={cn(
          iconSizes[size],
          isAnimating && "animate-bounce"
        )}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
      {showLabel && (
        <span className="text-sm font-medium">
          {isInList ? "Saved" : "Read Later"}
        </span>
      )}
    </button>
  );
}
