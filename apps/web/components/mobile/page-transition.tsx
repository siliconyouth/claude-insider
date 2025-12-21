"use client";

/**
 * Page Transition Wrapper
 *
 * Provides smooth page transitions for a native app feel.
 * Uses CSS animations for performance.
 */

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/design-system";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    // Skip transition on initial mount
    if (previousPathRef.current === pathname) {
      return;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplayChildren(children);
      previousPathRef.current = pathname;
      return;
    }

    // Start exit animation
    setIsTransitioning(true);

    // After exit animation, update content and start enter animation
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      previousPathRef.current = pathname;

      // Small delay before removing transition class
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 150); // Match the CSS transition duration

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-out",
        isTransitioning ? "opacity-0" : "opacity-100",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

/**
 * Slide Page Transition
 *
 * Provides slide-based transitions for navigation.
 * Direction is inferred from URL depth.
 */
interface SlideTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function SlideTransition({ children, className }: SlideTransitionProps) {
  const pathname = usePathname();
  const [state, setState] = useState<{
    children: React.ReactNode;
    direction: "left" | "right" | null;
    isAnimating: boolean;
  }>({
    children,
    direction: null,
    isAnimating: false,
  });
  const previousPathRef = useRef(pathname);
  const previousDepthRef = useRef(pathname.split("/").filter(Boolean).length);

  useEffect(() => {
    if (previousPathRef.current === pathname) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setState({ children, direction: null, isAnimating: false });
      previousPathRef.current = pathname;
      return;
    }

    const currentDepth = pathname.split("/").filter(Boolean).length;
    const direction = currentDepth > previousDepthRef.current ? "left" : "right";

    // Start exit animation
    setState((prev) => ({ ...prev, direction, isAnimating: true }));

    const timer = setTimeout(() => {
      setState({
        children,
        direction: null,
        isAnimating: false,
      });
      previousPathRef.current = pathname;
      previousDepthRef.current = currentDepth;
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  const getTransform = () => {
    if (!state.isAnimating) return "translateX(0)";
    return state.direction === "left"
      ? "translateX(-20px)"
      : "translateX(20px)";
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        state.isAnimating && "opacity-0",
        className
      )}
      style={{ transform: getTransform() }}
    >
      {state.children}
    </div>
  );
}
