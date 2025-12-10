"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";

/**
 * Route-Specific Error Pages
 * Styled error states for 404, 500, and other HTTP errors
 *
 * Part of the UX System - Pillar 5: Error Boundaries with Style
 */

// ============================================
// ICONS
// ============================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

// ============================================
// SHARED STYLES
// ============================================

const containerStyles = cn(
  "min-h-[60vh] flex items-center justify-center",
  "px-4 py-16 sm:px-6 lg:px-8"
);

const cardStyles = cn(
  "max-w-md w-full text-center",
  "bg-white dark:bg-ds-surface-2",
  "rounded-2xl border border-gray-200 dark:border-ds-border-1",
  "shadow-lg p-8 sm:p-12",
  "animate-fade-in-up"
);

const buttonPrimary = cn(
  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5",
  "text-sm font-medium text-white",
  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
  "transition-colors focus:outline-none focus-visible:ring-2",
  "focus-visible:ring-blue-500 focus-visible:ring-offset-2"
);

const buttonSecondary = cn(
  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5",
  "text-sm font-medium text-gray-700 dark:text-gray-300",
  "bg-gray-100 dark:bg-ds-surface-3",
  "hover:bg-gray-200 dark:hover:bg-ds-contrast-1",
  "transition-colors"
);

// ============================================
// 404 NOT FOUND
// ============================================

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showSearch?: boolean;
}

export function NotFoundPage({
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
  showSearch = true,
}: NotFoundPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Trigger global search
      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
      document.dispatchEvent(event);
    }
  };

  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        {/* Animated 404 */}
        <div className="relative mb-6">
          <span className="text-8xl font-bold text-gray-200 dark:text-ds-surface-3 select-none error-glitch">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <SearchIcon className="h-16 w-16 text-blue-500 animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>

        {/* Search input */}
        {showSearch && (
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className={cn(
                  "w-full rounded-lg border border-gray-200 dark:border-ds-border-1",
                  "bg-gray-50 dark:bg-ds-background-1 px-4 py-3 pr-10",
                  "text-sm text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "focus:border-transparent"
                )}
              />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </form>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className={buttonPrimary}>
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className={buttonSecondary}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Suggested links */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-ds-border-1">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
            Popular pages:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/docs/getting-started" className="text-xs text-blue-600 dark:text-cyan-400 hover:underline">
              Getting Started
            </Link>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <Link href="/docs/configuration" className="text-xs text-blue-600 dark:text-cyan-400 hover:underline">
              Configuration
            </Link>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <Link href="/docs/api" className="text-xs text-blue-600 dark:text-cyan-400 hover:underline">
              API Reference
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 500 SERVER ERROR
// ============================================

interface ServerErrorPageProps {
  error?: Error;
  reset?: () => void;
  showDetails?: boolean;
}

export function ServerErrorPage({
  error,
  reset,
  showDetails = false,
}: ServerErrorPageProps) {
  const [countdown, setCountdown] = useState(30);
  const [autoRetry, setAutoRetry] = useState(true);

  useEffect(() => {
    if (!autoRetry || !reset) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          reset();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRetry, reset]);

  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        {/* Animated 500 */}
        <div className="relative mb-6">
          <span className="text-8xl font-bold text-gray-200 dark:text-ds-surface-3 select-none">
            500
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <ServerIcon className="h-16 w-16 text-red-500 error-shake" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Server Error
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Something went wrong on our end. Our team has been notified.
        </p>

        {/* Error details */}
        {showDetails && error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4">
            <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Auto-retry countdown */}
        {reset && autoRetry && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <span>Auto-retrying in {countdown}s</span>
            <button
              onClick={() => setAutoRetry(false)}
              className="text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reset && (
            <button onClick={reset} className={buttonPrimary}>
              <RefreshIcon className="h-4 w-4" />
              Try Again
            </button>
          )}
          <Link href="/" className={buttonSecondary}>
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 403 FORBIDDEN
// ============================================

interface ForbiddenPageProps {
  message?: string;
}

export function ForbiddenPage({
  message = "You don't have permission to access this resource.",
}: ForbiddenPageProps) {
  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        {/* Animated 403 */}
        <div className="relative mb-6">
          <span className="text-8xl font-bold text-gray-200 dark:text-ds-surface-3 select-none">
            403
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldIcon className="h-16 w-16 text-amber-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className={buttonPrimary}>
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className={buttonSecondary}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAINTENANCE MODE
// ============================================

interface MaintenancePageProps {
  estimatedTime?: string;
  message?: string;
}

export function MaintenancePage({
  estimatedTime,
  message = "We're performing scheduled maintenance. We'll be back shortly.",
}: MaintenancePageProps) {
  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        {/* Maintenance icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="h-10 w-10 text-amber-500 animate-spin-slow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Under Maintenance
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>

        {estimatedTime && (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            <ClockIcon className="h-4 w-4" />
            Estimated time: {estimatedTime}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className={buttonPrimary}
          >
            <RefreshIcon className="h-4 w-4" />
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// GENERIC ERROR PAGE
// ============================================

interface GenericErrorPageProps {
  statusCode: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function GenericErrorPage({
  statusCode,
  title,
  description,
  icon,
  actions,
}: GenericErrorPageProps) {
  return (
    <div className={containerStyles}>
      <div className={cardStyles}>
        <div className="relative mb-6">
          <span className="text-8xl font-bold text-gray-200 dark:text-ds-surface-3 select-none">
            {statusCode}
          </span>
          {icon && (
            <div className="absolute inset-0 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>

        {actions || (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className={buttonPrimary}>
              <HomeIcon className="h-4 w-4" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className={buttonSecondary}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
