"use client";

/**
 * Error Boundary for Main Route Group
 *
 * Catches client-side errors and displays a user-friendly error page
 * instead of the default "Application error" screen.
 */

import { useEffect } from "react";
import { cn } from "@/lib/design-system";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("[App Error]:", error);
    console.error("[Error Stack]:", error.stack);
    console.error("[Error Digest]:", error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-gray-100 antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div
            className={cn(
              "max-w-lg w-full p-8 rounded-2xl",
              "bg-[#111111] border border-[#262626]",
              "text-center"
            )}
          >
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
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

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-3">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. This has been logged and we&apos;ll
              look into it.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-left mb-6 p-4 rounded-lg bg-[#0a0a0a] border border-[#333]">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-3 text-xs text-red-400 overflow-auto whitespace-pre-wrap">
                  {error.message}
                  {"\n\n"}
                  {error.stack}
                </pre>
              </details>
            )}

            {/* Production error hint */}
            {process.env.NODE_ENV === "production" && error.message && (
              <p className="text-xs text-gray-500 mb-6 font-mono bg-[#0a0a0a] p-3 rounded-lg">
                {error.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-lg shadow-blue-500/25",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Try Again
              </button>
              <a
                href="/"
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium",
                  "border border-[#333]",
                  "text-gray-300 hover:text-white hover:border-[#444]",
                  "transition-colors"
                )}
              >
                Go Home
              </a>
            </div>

            {/* Error ID */}
            {error.digest && (
              <p className="mt-6 text-xs text-gray-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
