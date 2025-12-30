"use client";

/**
 * Dashboard Error Page
 *
 * Global error boundary for all dashboard pages.
 * Catches both server-side and client-side errors using Next.js conventions.
 *
 * Features:
 * - Styled to match dashboard design
 * - Retry functionality with error reset
 * - Link back to dashboard home
 * - Development-only error details
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/design-system";
import Link from "next/link";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[Dashboard Error]:", error);
    }
  }, [error]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      reset();
    }
  };

  const canRetry = retryCount < maxRetries;
  const isNetworkError =
    error.message?.includes("fetch") ||
    error.message?.includes("network") ||
    error.message?.includes("Failed to fetch");
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div
        className={cn(
          "w-full max-w-lg rounded-xl border ui-border",
          "bg-white dark:bg-[#111111] p-6 shadow-sm"
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <AlertCircleIcon className="h-6 w-6 text-red-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isNetworkError ? "Connection Error" : "Something went wrong"}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {isNetworkError
                ? "Unable to connect to the server. Please check your connection and try again."
                : "We encountered an error loading this page. Please try again or return to the dashboard."}
            </p>

            {/* Error details (dev only) */}
            {isDev && error && (
              <div className="mt-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-3">
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-1 text-xs text-gray-500">
                    Digest: {error.digest}
                  </p>
                )}
                {error.stack && (
                  <>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                    >
                      {showDetails ? "Hide stack trace" : "Show stack trace"}
                    </button>
                    {showDetails && (
                      <pre className="mt-2 max-h-40 overflow-auto text-xs text-gray-500 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Retry count */}
            {retryCount > 0 && canRetry && (
              <p className="mt-2 text-xs text-gray-500">
                Retry attempt {retryCount} of {maxRetries}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              {canRetry ? (
                <button
                  onClick={handleRetry}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2",
                    "text-sm font-medium text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  )}
                >
                  <RefreshIcon className="h-4 w-4" />
                  Try Again
                </button>
              ) : (
                <p className="text-sm text-red-500">
                  Maximum retries reached. Please refresh the page.
                </p>
              )}

              <Link
                href="/dashboard"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2",
                  "text-sm font-medium text-gray-700 dark:text-gray-300",
                  "bg-gray-100 dark:bg-[#1a1a1a]",
                  "hover:bg-gray-200 dark:hover:bg-[#262626]",
                  "transition-colors"
                )}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}
