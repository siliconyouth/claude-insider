"use client";

/**
 * Resources Error Boundary
 *
 * Specialized error boundary for the resources section on the homepage.
 * Provides graceful degradation when resource loading fails.
 *
 * Performance Impact:
 * - Isolates resource section failures from the rest of the homepage
 * - Allows users to continue browsing even if resources fail to load
 * - Provides retry functionality without full page refresh
 */

import { Component, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";

interface ResourcesErrorBoundaryProps {
  children: ReactNode;
}

interface ResourcesErrorBoundaryState {
  hasError: boolean;
  retryCount: number;
}

export class ResourcesErrorBoundary extends Component<
  ResourcesErrorBoundaryProps,
  ResourcesErrorBoundaryState
> {
  constructor(props: ResourcesErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(): Partial<ResourcesErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("ResourcesErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="border-t border-gray-200 dark:border-[#1a1a1a]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div
              className={cn(
                "flex flex-col items-center justify-center text-center py-12",
                "rounded-2xl border border-gray-200 dark:border-[#262626]",
                "bg-gray-50 dark:bg-[#0d0d0d]"
              )}
            >
              {/* Error Icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-violet-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>

              {/* Message */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Resources Temporarily Unavailable
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                We couldn&apos;t load the resources section. You can try again or browse resources directly.
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg",
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

                <Link
                  href="/resources"
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg",
                    "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                    "text-sm font-medium",
                    "hover:bg-gray-200 dark:hover:bg-[#262626]",
                    "transition-colors"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Browse All Resources
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResourcesErrorBoundary;
