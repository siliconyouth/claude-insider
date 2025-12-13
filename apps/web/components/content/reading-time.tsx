"use client";

/**
 * Reading Time Component
 *
 * Displays estimated reading time for content.
 */

import { cn } from "@/lib/design-system";
import { type ReadingTimeResult } from "@/lib/content-utils";

interface ReadingTimeProps {
  readingTime: ReadingTimeResult;
  className?: string;
  variant?: "default" | "compact" | "detailed";
  showIcon?: boolean;
}

export function ReadingTime({
  readingTime,
  className,
  variant = "default",
  showIcon = true,
}: ReadingTimeProps) {
  if (variant === "compact") {
    return (
      <span className={cn("text-xs text-gray-500", className)}>
        {readingTime.text}
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg",
          "bg-gray-50 dark:bg-gray-800/50",
          "border border-gray-200 dark:border-[#262626]",
          className
        )}
      >
        {showIcon && (
          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {readingTime.minutes} min read
          </div>
          <div className="text-xs text-gray-500">
            {readingTime.words.toLocaleString()} words
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-1.5 text-sm text-gray-500", className)}>
      {showIcon && (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <span>{readingTime.text}</span>
    </div>
  );
}

// Simple hook version for inline usage
export function useReadingTimeDisplay(content: string): string {
  const wordCount = content
    .replace(/```[\s\S]*?```/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes <= 1 ? "1 min read" : `${minutes} min read`;
}
