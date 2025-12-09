"use client";

import { Component, ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/design-system";

/**
 * Error Boundary System
 * Graceful error handling with styled fallback UI
 *
 * Part of the UX System - Pillar 5: Error Boundaries with Style
 */

// ============================================
// TYPES
// ============================================

export type ErrorSeverity = "warning" | "error" | "critical";
export type ErrorCategory = "network" | "render" | "data" | "auth" | "unknown";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  showDetails?: boolean;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

// ============================================
// ICONS
// ============================================

function WarningIcon({ className }: { className?: string }) {
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
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
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
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

function HomeIcon({ className }: { className?: string }) {
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
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function WifiOffIcon({ className }: { className?: string }) {
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
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>
  );
}

// ============================================
// SEVERITY STYLES
// ============================================

const severityStyles: Record<ErrorSeverity, {
  container: string;
  icon: string;
  iconBg: string;
  title: string;
  button: string;
}> = {
  warning: {
    container: "border-amber-200 dark:border-amber-800/50",
    icon: "text-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "text-amber-700 dark:text-amber-400",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  error: {
    container: "border-red-200 dark:border-red-800/50",
    icon: "text-red-500",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    title: "text-red-700 dark:text-red-400",
    button: "bg-red-500 hover:bg-red-600",
  },
  critical: {
    container: "border-red-300 dark:border-red-700",
    icon: "text-red-600",
    iconBg: "bg-red-200 dark:bg-red-900/50",
    title: "text-red-800 dark:text-red-300",
    button: "bg-red-600 hover:bg-red-700",
  },
};

// ============================================
// ERROR MESSAGES
// ============================================

const categoryMessages: Record<ErrorCategory, { title: string; description: string }> = {
  network: {
    title: "Connection Error",
    description: "Unable to connect to the server. Please check your internet connection.",
  },
  render: {
    title: "Display Error",
    description: "Something went wrong while displaying this content.",
  },
  data: {
    title: "Data Error",
    description: "There was a problem loading the requested data.",
  },
  auth: {
    title: "Authentication Error",
    description: "Your session may have expired. Please try again.",
  },
  unknown: {
    title: "Unexpected Error",
    description: "Something unexpected happened. We're working on it.",
  },
};

// ============================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.props.severity || "error";
      const category = this.props.category || "unknown";
      const styles = severityStyles[severity];
      const messages = categoryMessages[category];

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          severity={severity}
          category={category}
          styles={styles}
          messages={messages}
          showDetails={this.props.showDetails}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// ERROR FALLBACK COMPONENT
// ============================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
  severity: ErrorSeverity;
  category: ErrorCategory;
  styles: typeof severityStyles.error;
  messages: typeof categoryMessages.unknown;
  showDetails?: boolean;
  retryCount: number;
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  severity,
  category,
  styles,
  messages,
  showDetails = false,
  retryCount,
}: ErrorFallbackProps) {
  const [showStack, setShowStack] = useState(false);
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  const Icon = severity === "warning" ? WarningIcon : ErrorIcon;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-ds-surface-2 p-6 shadow-lg",
        "animate-fade-in-up",
        styles.container
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("flex-shrink-0 rounded-full p-3", styles.iconBg)}>
          {category === "network" ? (
            <WifiOffIcon className={cn("h-6 w-6", styles.icon)} />
          ) : (
            <Icon className={cn("h-6 w-6", styles.icon)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-lg font-semibold", styles.title)}>
            {messages.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {messages.description}
          </p>

          {/* Error message */}
          {error && showDetails && (
            <div className="mt-3 rounded-lg bg-gray-100 dark:bg-ds-surface-3 p-3">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {error.message}
              </p>
              {errorInfo && (
                <button
                  onClick={() => setShowStack(!showStack)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                >
                  {showStack ? "Hide stack trace" : "Show stack trace"}
                </button>
              )}
              {showStack && errorInfo && (
                <pre className="mt-2 max-h-40 overflow-auto text-xs text-gray-500 dark:text-gray-500">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          {/* Retry count warning */}
          {retryCount > 0 && canRetry && (
            <p className="mt-2 text-xs text-gray-500">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            {canRetry ? (
              <button
                onClick={onReset}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2",
                  "text-sm font-medium text-white transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  styles.button
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

            <a
              href="/"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2",
                "text-sm font-medium text-gray-700 dark:text-gray-300",
                "bg-gray-100 dark:bg-ds-surface-3 hover:bg-gray-200 dark:hover:bg-ds-contrast-1",
                "transition-colors"
              )}
            >
              <HomeIcon className="h-4 w-4" />
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// INLINE ERROR COMPONENT
// ============================================

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800/50",
        "bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm",
        className
      )}
      role="alert"
    >
      <ErrorIcon className="h-4 w-4 flex-shrink-0 text-red-500" />
      <span className="text-red-700 dark:text-red-400">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-red-600 dark:text-red-400 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================
// ASYNC ERROR BOUNDARY (WITH SUSPENSE)
// ============================================

interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  loadingFallback?: ReactNode;
}

export function AsyncErrorBoundary({
  children,
  loadingFallback,
  ...props
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary {...props}>
      {loadingFallback ? (
        <React.Suspense fallback={loadingFallback}>{children}</React.Suspense>
      ) : (
        children
      )}
    </ErrorBoundary>
  );
}

// Need to import React for Suspense
import React from "react";

// ============================================
// OFFLINE DETECTOR
// ============================================

interface OfflineDetectorProps {
  children: ReactNode;
  offlineFallback?: ReactNode;
}

export function OfflineDetector({ children, offlineFallback }: OfflineDetectorProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      offlineFallback || (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-ds-surface-2 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
              <WifiOffIcon className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                You&apos;re Offline
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Please check your internet connection to continue.
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// ============================================
// ERROR TOAST (for transient errors)
// ============================================

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
  duration?: number;
}

export function ErrorToast({
  message,
  onDismiss,
  onRetry,
  duration = 5000,
}: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm",
        "rounded-lg border border-red-200 dark:border-red-800/50",
        "bg-white dark:bg-ds-surface-2 p-4 shadow-lg",
        "animate-slide-in-right"
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <ErrorIcon className="h-5 w-5 flex-shrink-0 text-red-500" />
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-white">{message}</p>
          <div className="mt-2 flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
