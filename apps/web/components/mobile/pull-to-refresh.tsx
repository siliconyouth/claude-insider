"use client";

/**
 * Pull to Refresh Component
 *
 * Enables native-like pull-to-refresh gesture on mobile devices.
 * Only activates when at the top of the page and pulling down.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/design-system";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  threshold?: number;
  className?: string;
}

const PULL_THRESHOLD = 80; // Pixels to pull before triggering refresh
const MAX_PULL = 120; // Maximum pull distance

export function PullToRefresh({
  children,
  onRefresh,
  threshold = PULL_THRESHOLD,
  className,
}: PullToRefreshProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  // Check if we're at the top of the page
  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isAtTop() || isRefreshing) return;
      const touch = e.touches[0];
      if (!touch) return;

      startYRef.current = touch.clientY;
      currentYRef.current = startYRef.current;
      setIsPulling(true);
    },
    [isAtTop, isRefreshing]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      const touch = e.touches[0];
      if (!touch) return;

      currentYRef.current = touch.clientY;
      const distance = Math.max(0, currentYRef.current - startYRef.current);

      // Only pull if we started at the top
      if (!isAtTop() && distance > 0) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      // Apply resistance for natural feel
      const resistedDistance = Math.min(
        MAX_PULL,
        distance * 0.5 // 50% resistance
      );

      setPullDistance(resistedDistance);

      // Prevent default scroll when pulling
      if (distance > 0 && isAtTop()) {
        e.preventDefault();
      }
    },
    [isPulling, isRefreshing, isAtTop]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default behavior: refresh the current page
          router.refresh();
          // Small delay to show the refresh animation
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to top
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh, router]);

  // Attach touch listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false to allow preventDefault
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate spinner rotation based on pull distance
  const spinnerRotation = Math.min(360, (pullDistance / threshold) * 360);
  const isTriggered = pullDistance >= threshold;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center",
          "transition-transform duration-200 ease-out",
          "pointer-events-none z-40"
        )}
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "bg-white dark:bg-[#1a1a1a]",
            "border border-gray-200 dark:border-[#333]",
            "shadow-lg",
            isRefreshing && "animate-spin"
          )}
        >
          <svg
            className={cn(
              "w-5 h-5 transition-colors duration-200",
              isTriggered || isRefreshing
                ? "text-blue-600 dark:text-cyan-400"
                : "text-gray-400"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${spinnerRotation}deg)`,
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
