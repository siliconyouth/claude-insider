"use client";

/**
 * Swipe Navigation Hook
 *
 * Enables swipe gestures for navigating between pages.
 * Used primarily for documentation pages to swipe between prev/next docs.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface SwipeNavigationOptions {
  /** URL for previous page (swipe right) */
  prevUrl?: string | null;
  /** URL for next page (swipe left) */
  nextUrl?: string | null;
  /** Minimum swipe distance to trigger navigation (default: 100px) */
  threshold?: number;
  /** Maximum vertical movement allowed (default: 50px) */
  maxVertical?: number;
  /** Whether swipe navigation is enabled */
  enabled?: boolean;
}

interface SwipeState {
  /** Current swipe direction hint */
  direction: "left" | "right" | null;
  /** Current swipe progress (0-1) */
  progress: number;
  /** Whether a swipe is in progress */
  isSwiping: boolean;
}

export function useSwipeNavigation({
  prevUrl,
  nextUrl,
  threshold = 100,
  maxVertical = 50,
  enabled = true,
}: SwipeNavigationOptions) {
  const router = useRouter();
  const containerRef = useRef<HTMLElement | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    direction: null,
    progress: 0,
    isSwiping: false,
  });

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      // Don't interfere with horizontal scrollable elements
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-swipe-ignore]') ||
        target.closest('pre') ||
        target.closest('code') ||
        target.closest('.overflow-x-auto')
      ) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) return;

      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      currentXRef.current = startXRef.current;
      setSwipeState((prev) => ({ ...prev, isSwiping: true }));
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !swipeState.isSwiping) return;
      const touch = e.touches[0];
      if (!touch) return;

      const currentX = touch.clientX;
      const currentY = touch.clientY;
      currentXRef.current = currentX;

      const deltaX = currentX - startXRef.current;
      const deltaY = Math.abs(currentY - startYRef.current);

      // If vertical movement exceeds threshold, cancel swipe
      if (deltaY > maxVertical) {
        setSwipeState({ direction: null, progress: 0, isSwiping: false });
        return;
      }

      // Determine direction and progress
      const absDeltaX = Math.abs(deltaX);
      const progress = Math.min(1, absDeltaX / threshold);

      if (deltaX > 20 && prevUrl) {
        // Swiping right (go to previous)
        setSwipeState({ direction: "right", progress, isSwiping: true });
      } else if (deltaX < -20 && nextUrl) {
        // Swiping left (go to next)
        setSwipeState({ direction: "left", progress, isSwiping: true });
      } else {
        setSwipeState({ direction: null, progress: 0, isSwiping: true });
      }
    },
    [enabled, swipeState.isSwiping, prevUrl, nextUrl, threshold, maxVertical]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !swipeState.isSwiping) return;

    const deltaX = currentXRef.current - startXRef.current;

    if (Math.abs(deltaX) >= threshold) {
      if (deltaX > 0 && prevUrl) {
        // Swipe right - go to previous
        router.push(prevUrl);
      } else if (deltaX < 0 && nextUrl) {
        // Swipe left - go to next
        router.push(nextUrl);
      }
    }

    setSwipeState({ direction: null, progress: 0, isSwiping: false });
  }, [enabled, swipeState.isSwiping, prevUrl, nextUrl, threshold, router]);

  // Attach to document for global swipe detection
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    swipeState,
    hasPrev: !!prevUrl,
    hasNext: !!nextUrl,
  };
}

/**
 * Swipe Indicator Component
 *
 * Visual feedback for swipe navigation progress.
 */
interface SwipeIndicatorProps {
  direction: "left" | "right" | null;
  progress: number;
  prevLabel?: string;
  nextLabel?: string;
}

export function SwipeIndicator({
  direction,
  progress,
  prevLabel = "Previous",
  nextLabel = "Next",
}: SwipeIndicatorProps) {
  if (!direction || progress < 0.1) return null;

  const isLeft = direction === "left";
  const label = isLeft ? nextLabel : prevLabel;
  const opacity = Math.min(1, progress * 1.5);
  const scale = 0.8 + progress * 0.2;

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-opacity duration-100 ${
        isLeft ? "right-4" : "left-4"
      }`}
      style={{ opacity }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm border border-gray-200 dark:border-[#333] shadow-lg"
        style={{ transform: `scale(${scale})` }}
      >
        {!isLeft && (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {isLeft && (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
