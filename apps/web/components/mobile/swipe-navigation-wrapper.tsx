"use client";

/**
 * Swipe Navigation Wrapper
 *
 * Client-side wrapper that enables swipe gestures for navigating
 * between documentation pages on mobile devices.
 */

import { ReactNode } from "react";
import { useSwipeNavigation, SwipeIndicator } from "@/hooks/use-swipe-navigation";

interface SwipeNavigationWrapperProps {
  children: ReactNode;
  prevUrl?: string | null;
  nextUrl?: string | null;
  prevLabel?: string;
  nextLabel?: string;
}

export function SwipeNavigationWrapper({
  children,
  prevUrl,
  nextUrl,
  prevLabel = "Previous",
  nextLabel = "Next",
}: SwipeNavigationWrapperProps) {
  const { swipeState, hasPrev, hasNext } = useSwipeNavigation({
    prevUrl: prevUrl || undefined,
    nextUrl: nextUrl || undefined,
    threshold: 80,
    enabled: true,
  });

  // Only render indicator on mobile (handled by the indicator itself via fixed positioning)
  const showIndicator = (hasPrev || hasNext) && swipeState.isSwiping;

  return (
    <>
      {children}
      {showIndicator && (
        <SwipeIndicator
          direction={swipeState.direction}
          progress={swipeState.progress}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      )}
    </>
  );
}
