"use client";

/**
 * Save for Offline Button
 *
 * Allows users to cache a page for offline reading.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { usePWA } from "@/hooks/use-pwa";

interface SaveOfflineButtonProps {
  url: string;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function SaveOfflineButton({
  url,
  className,
  size = "md",
  showLabel = true,
}: SaveOfflineButtonProps) {
  const { cachePage, isOnline } = usePWA();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if URL is already cached
  useEffect(() => {
    if (typeof window === "undefined" || !("caches" in window)) return;

    caches.open("claude-insider-offline-v3").then((cache) => {
      cache.match(url).then((response) => {
        setIsSaved(!!response);
      });
    });
  }, [url]);

  const handleSave = async () => {
    setIsSaving(true);
    cachePage(url);

    // Optimistically mark as saved after a short delay
    setTimeout(() => {
      setIsSaved(true);
      setIsSaving(false);
    }, 1000);
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  if (!isOnline || isSaved) {
    if (!isSaved) return null;

    return (
      <div
        className={cn(
          "flex items-center rounded-lg font-medium",
          "text-green-600 dark:text-green-400",
          "bg-green-50 dark:bg-green-900/20",
          sizeClasses[size],
          className
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={iconSizes[size]}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        {showLabel && <span>Saved offline</span>}
      </div>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className={cn(
        "flex items-center rounded-lg font-medium transition-colors",
        "text-gray-600 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
    >
      {isSaving ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(iconSizes[size], "animate-spin")}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="60"
            strokeDashoffset="20"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={iconSizes[size]}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      )}
      {showLabel && <span>{isSaving ? "Saving..." : "Save offline"}</span>}
    </button>
  );
}

/**
 * Save multiple pages for offline
 */
export function SaveAllOfflineButton({
  urls,
  label = "Save all offline",
  className,
}: {
  urls: string[];
  label?: string;
  className?: string;
}) {
  const { cachePages, isOnline } = usePWA();
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  if (!isOnline) {
    return null;
  }

  const handleSaveAll = () => {
    setIsSaving(true);
    cachePages(urls);

    // Optimistically update
    setTimeout(() => {
      setSavedCount(urls.length);
      setIsSaving(false);
    }, 2000);
  };

  if (savedCount === urls.length) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
          "text-green-600 dark:text-green-400",
          "bg-green-50 dark:bg-green-900/20",
          className
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        All saved offline ({urls.length})
      </div>
    );
  }

  return (
    <button
      onClick={handleSaveAll}
      disabled={isSaving}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
        "text-gray-600 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors",
        className
      )}
    >
      {isSaving ? (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4 animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
          Saving {urls.length} pages...
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
