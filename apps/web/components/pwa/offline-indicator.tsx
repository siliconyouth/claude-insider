"use client";

/**
 * Offline Indicator Component
 *
 * Shows a banner when the user is offline.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { usePWA } from "@/hooks/use-pwa";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline } = usePWA();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
       
      setWasOffline(true);
    } else if (wasOffline) {
      // Just came back online
      setShowReconnected(true);
      const timeout = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-16 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-sm z-50",
        "animate-in slide-in-from-top-2 fade-in duration-300",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "shadow-lg",
          isOnline
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50"
            : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isOnline
              ? "bg-green-100 dark:bg-green-900/40"
              : "bg-amber-100 dark:bg-amber-900/40"
          )}
        >
          {isOnline ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-green-600 dark:text-green-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0"
              />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-amber-600 dark:text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3l18 18M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              isOnline
                ? "text-green-800 dark:text-green-200"
                : "text-amber-800 dark:text-amber-200"
            )}
          >
            {isOnline ? "Back online" : "You're offline"}
          </p>
          <p
            className={cn(
              "text-xs",
              isOnline
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {isOnline
              ? "Connection restored"
              : "Some features may be limited"}
          </p>
        </div>

        {/* Dismiss */}
        {!isOnline && (
          <button
            className={cn(
              "flex-shrink-0 p-1 rounded-lg",
              "text-amber-600 dark:text-amber-400",
              "hover:bg-amber-100 dark:hover:bg-amber-900/40",
              "transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact offline status badge
 */
export function OfflineStatusBadge({ className }: { className?: string }) {
  const { isOnline } = usePWA();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        isOnline
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isOnline ? "bg-green-500 animate-pulse" : "bg-amber-500"
        )}
      />
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}
