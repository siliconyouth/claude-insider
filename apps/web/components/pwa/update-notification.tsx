"use client";

/**
 * Update Notification Component
 *
 * Shows a banner when a new version of the app is available.
 */

import { cn } from "@/lib/design-system";
import { usePWA } from "@/hooks/use-pwa";

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const { isUpdating } = usePWA();

  if (!isUpdating) {
    return null;
  }

  const handleUpdate = () => {
    // Tell service worker to skip waiting and activate new version
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    // Reload the page to use the new service worker
    window.location.reload();
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "bg-blue-50 dark:bg-blue-900/20",
          "border border-blue-200 dark:border-blue-900/50",
          "shadow-xl"
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Update available
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            A new version is ready to use
          </p>
        </div>

        {/* Action */}
        <button
          onClick={handleUpdate}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold",
            "bg-blue-600 text-white",
            "hover:bg-blue-700",
            "transition-colors"
          )}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
