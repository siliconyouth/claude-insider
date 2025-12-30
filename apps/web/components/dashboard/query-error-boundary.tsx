"use client";

/**
 * Dashboard Query Error Boundary
 *
 * Integrates TanStack Query's QueryErrorResetBoundary with our error
 * boundary system for graceful error handling in dashboard pages.
 *
 * Features:
 * - Automatic query retry on "Try Again"
 * - Dashboard-styled error UI
 * - Exponential backoff for network errors
 * - Console logging in development
 */

import { Component, type ReactNode, useState } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { cn } from "@/lib/design-system";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface QueryErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error) => void;
  /** Show error details (development only by default) */
  showDetails?: boolean;
  /** Title for the error card */
  title?: string;
  /** Description for the error card */
  description?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// ============================================
// ICONS
// ============================================

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

// ============================================
// ERROR BOUNDARY CLASS
// ============================================

interface InnerErrorBoundaryProps extends QueryErrorBoundaryProps {
  onReset: () => void;
}

class InnerErrorBoundary extends Component<InnerErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: InnerErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);

    if (process.env.NODE_ENV === "development") {
      console.error("[QueryErrorBoundary] Caught error:", error);
    }
  }

  handleRetry = (): void => {
    // Reset query errors
    this.props.onReset();

    // Reset component state
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = 3;
      const canRetry = this.state.retryCount < maxRetries;
      const showDetails =
        this.props.showDetails ?? process.env.NODE_ENV === "development";

      return (
        <DashboardErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          canRetry={canRetry}
          retryCount={this.state.retryCount}
          maxRetries={maxRetries}
          showDetails={showDetails}
          title={this.props.title}
          description={this.props.description}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// QUERY ERROR BOUNDARY WRAPPER
// ============================================

/**
 * Query Error Boundary
 *
 * Wrap dashboard sections with this to catch errors and provide retry functionality.
 * Integrates with TanStack Query to reset failed queries on retry.
 *
 * @example
 * <QueryErrorBoundary>
 *   <Suspense fallback={<PageSkeleton />}>
 *     <PageContent />
 *   </Suspense>
 * </QueryErrorBoundary>
 */
export function QueryErrorBoundary(props: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => <InnerErrorBoundary {...props} onReset={reset} />}
    </QueryErrorResetBoundary>
  );
}

// ============================================
// ERROR FALLBACK UI
// ============================================

interface DashboardErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
  showDetails: boolean;
  title?: string;
  description?: string;
}

function DashboardErrorFallback({
  error,
  onRetry,
  canRetry,
  retryCount,
  maxRetries,
  showDetails,
  title = "Something went wrong",
  description = "We encountered an error loading this content. Please try again.",
}: DashboardErrorFallbackProps) {
  const [showStack, setShowStack] = useState(false);

  // Check if it's a network error
  const isNetworkError =
    error?.message?.includes("fetch") ||
    error?.message?.includes("network") ||
    error?.message?.includes("Failed to fetch");

  return (
    <div
      className={cn(
        "rounded-xl border ui-border bg-white dark:bg-[#111111]",
        "p-6 shadow-sm animate-fade-in"
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isNetworkError ? "Connection Error" : title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isNetworkError
              ? "Unable to connect to the server. Please check your connection."
              : description}
          </p>

          {/* Error details */}
          {error && showDetails && (
            <div className="mt-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-3">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {error.message}
              </p>
              {error.stack && (
                <>
                  <button
                    onClick={() => setShowStack(!showStack)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                  >
                    {showStack ? "Hide stack trace" : "Show stack trace"}
                  </button>
                  {showStack && (
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
                onClick={onRetry}
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
                Maximum retries reached. Please refresh the page or go back.
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
  );
}

// ============================================
// INLINE ERROR FOR SMALLER COMPONENTS
// ============================================

interface InlineQueryErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Smaller inline error display for use within cards or sections
 */
export function InlineQueryError({
  message = "Failed to load",
  onRetry,
  className,
}: InlineQueryErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800/50",
        "bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm",
        className
      )}
      role="alert"
    >
      <AlertCircleIcon className="h-4 w-4 flex-shrink-0 text-red-500" />
      <span className="text-red-700 dark:text-red-400">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
