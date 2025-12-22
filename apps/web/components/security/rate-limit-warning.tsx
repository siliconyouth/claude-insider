"use client";

/**
 * Rate Limit Warning Banner
 *
 * Shows users when they're approaching rate limits.
 * Provides proactive feedback before limits are hit.
 *
 * Features:
 * - Countdown timer until reset
 * - Request count indicator
 * - Collapsible for minimal disruption
 * - Auto-hides when limits reset
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { AlertTriangleIcon, XIcon, ClockIcon, ActivityIcon } from "lucide-react";

interface RateLimitWarningProps {
  /** Current request count */
  currentRequests: number;
  /** Maximum allowed requests */
  maxRequests: number;
  /** Seconds until rate limit resets */
  resetInSeconds: number;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Whether to auto-show based on thresholds */
  autoShow?: boolean;
  /** Warning threshold (percentage of max) */
  warningThreshold?: number;
  /** className */
  className?: string;
}

export function RateLimitWarning({
  currentRequests,
  maxRequests,
  resetInSeconds,
  onDismiss,
  autoShow = true,
  warningThreshold = 0.7,
  className,
}: RateLimitWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [countdown, setCountdown] = useState(resetInSeconds);

  // Calculate percentage used
  const percentUsed = currentRequests / maxRequests;
  const remainingRequests = maxRequests - currentRequests;
  const isWarning = percentUsed >= warningThreshold;
  const isCritical = percentUsed >= 0.9;

  // Show/hide based on thresholds
  useEffect(() => {
    if (autoShow && isWarning && !isDismissed) {
      setIsVisible(true);
    } else if (percentUsed < warningThreshold) {
      setIsVisible(false);
      setIsDismissed(false);
    }
  }, [autoShow, isWarning, percentUsed, warningThreshold, isDismissed]);

  // Countdown timer
  useEffect(() => {
    setCountdown(resetInSeconds);

    if (resetInSeconds <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsVisible(false);
          setIsDismissed(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resetInSeconds]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "now";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    if (minutes < 60) {
      return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className={cn(
        "fixed left-4 right-4 md:left-auto md:right-4 md:w-96",
        "p-4 rounded-xl shadow-lg",
        "border transition-all",
        isCritical
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30",
        "animate-slide-up z-50",
        className
      )}
      style={{
        // Position above mobile bottom navigation
        bottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "p-2 rounded-full flex-shrink-0",
            isCritical
              ? "bg-red-100 dark:bg-red-500/20"
              : "bg-amber-100 dark:bg-amber-500/20"
          )}
        >
          <AlertTriangleIcon
            className={cn(
              "w-5 h-5",
              isCritical
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold text-sm",
              isCritical
                ? "text-red-800 dark:text-red-200"
                : "text-amber-800 dark:text-amber-200"
            )}
          >
            {isCritical ? "Rate limit almost reached" : "Approaching rate limit"}
          </h3>

          <p
            className={cn(
              "text-sm mt-1",
              isCritical
                ? "text-red-700 dark:text-red-300"
                : "text-amber-700 dark:text-amber-300"
            )}
          >
            {remainingRequests > 0
              ? `${remainingRequests} request${remainingRequests !== 1 ? "s" : ""} remaining`
              : "Rate limit reached"}
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isCritical ? "bg-red-500" : "bg-amber-500"
              )}
              style={{ width: `${Math.min(percentUsed * 100, 100)}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span
              className={cn(
                "flex items-center gap-1",
                isCritical
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              <ActivityIcon className="w-3 h-3" />
              {currentRequests}/{maxRequests} used
            </span>
            <span
              className={cn(
                "flex items-center gap-1",
                isCritical
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              <ClockIcon className="w-3 h-3" />
              Resets in {formatTime(countdown)}
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={cn(
            "flex-shrink-0 p-1 rounded transition-colors",
            isCritical
              ? "text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20"
              : "text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/20"
          )}
          aria-label="Dismiss warning"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for tracking rate limit status
 */
export function useRateLimitWarning(endpoint?: string) {
  const [state, setState] = useState({
    currentRequests: 0,
    maxRequests: 100,
    resetInSeconds: 3600,
    shouldShow: false,
  });

  // Fetch rate limit status
  const checkStatus = useCallback(async () => {
    try {
      const url = endpoint
        ? `/api/rate-limit/status?endpoint=${encodeURIComponent(endpoint)}`
        : "/api/rate-limit/status";

      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      setState({
        currentRequests: data.current || 0,
        maxRequests: data.limit || 100,
        resetInSeconds: data.resetIn || 3600,
        shouldShow: data.current / data.limit >= 0.7,
      });
    } catch (error) {
      console.error("[RateLimit] Status check error:", error);
    }
  }, [endpoint]);

  // Check periodically
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Increment counter (call after making a request)
  const recordRequest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentRequests: prev.currentRequests + 1,
      shouldShow: (prev.currentRequests + 1) / prev.maxRequests >= 0.7,
    }));
  }, []);

  return {
    ...state,
    checkStatus,
    recordRequest,
  };
}

/**
 * Inline rate limit indicator (for headers/footers)
 */
export function RateLimitIndicator({
  current,
  max,
  className,
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 70;
  const isCritical = percentage >= 90;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs",
        isCritical
          ? "text-red-500"
          : isWarning
          ? "text-amber-500"
          : "text-gray-500",
        className
      )}
      title={`${current} of ${max} requests used`}
    >
      <ActivityIcon className="w-3 h-3" />
      <span>
        {current}/{max}
      </span>
      <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
