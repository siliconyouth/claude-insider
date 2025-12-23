"use client";

/**
 * Chat Error Boundary
 *
 * Specialized error boundary for the unified chat system.
 * Provides graceful degradation when chat components fail,
 * allowing the rest of the app to continue functioning.
 *
 * Performance Impact:
 * - Isolates chat failures from the main application
 * - Prevents full-page crashes from chat-related errors
 * - Improves INP by allowing quick recovery from errors
 */

import { Component, ReactNode } from "react";
import { cn } from "@/lib/design-system";

interface ChatErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ChatErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ChatErrorBoundary extends Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChatErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ChatErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ChatErrorFallback onRetry={this.handleRetry} error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Compact error fallback for chat components
 * Styled to match the chat window aesthetic
 */
function ChatErrorFallback({
  onRetry,
  error,
}: {
  onRetry: () => void;
  error: Error | null;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full p-6 text-center",
        "bg-white dark:bg-[#111111]"
      )}
    >
      {/* Error Icon */}
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Chat Unavailable
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
        Something went wrong with the chat. Don&apos;t worry, your conversation history is safe.
      </p>

      {/* Error details in dev */}
      {process.env.NODE_ENV === "development" && error && (
        <p className="text-xs text-red-500 mb-4 font-mono max-w-xs truncate">
          {error.message}
        </p>
      )}

      {/* Retry button */}
      <button
        onClick={onRetry}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-gradient-to-r from-violet-600 to-blue-600",
          "text-white text-sm font-medium",
          "hover:from-violet-700 hover:to-blue-700",
          "transition-all duration-200"
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Try Again
      </button>
    </div>
  );
}

/**
 * Inline error for individual chat messages
 * Shows when a single message fails to render
 */
export function ChatMessageError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
      <svg
        className="w-4 h-4 text-red-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm text-red-700 dark:text-red-400">
        Failed to load message
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ChatErrorBoundary;
