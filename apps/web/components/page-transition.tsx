"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/design-system";
import { useReducedMotion } from "@/hooks/use-animations";

/**
 * Page Transition Components
 * Smooth transitions between routes with various effects
 *
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

// ============================================
// TYPES
// ============================================

type TransitionType = "fade" | "slide" | "scale" | "blur" | "none";
type TransitionDirection = "up" | "down" | "left" | "right";

interface TransitionConfig {
  /** Transition type */
  type: TransitionType;
  /** Duration in milliseconds */
  duration: number;
  /** Direction for slide transitions */
  direction?: TransitionDirection;
  /** Easing function */
  easing?: string;
}

interface PageTransitionContextValue {
  /** Current transition state */
  isTransitioning: boolean;
  /** Start a transition */
  startTransition: () => void;
  /** End the transition */
  endTransition: () => void;
  /** Current transition config */
  config: TransitionConfig;
  /** Update transition config */
  setConfig: (config: Partial<TransitionConfig>) => void;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: TransitionConfig = {
  type: "fade",
  duration: 300,
  direction: "up",
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// ============================================
// CONTEXT
// ============================================

const PageTransitionContext = createContext<PageTransitionContextValue | null>(
  null
);

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error(
      "usePageTransition must be used within PageTransitionProvider"
    );
  }
  return context;
}

// ============================================
// PageTransitionProvider
// ============================================

export interface PageTransitionProviderProps {
  children: ReactNode;
  /** Default transition config */
  defaultConfig?: Partial<TransitionConfig>;
}

export function PageTransitionProvider({
  children,
  defaultConfig,
}: PageTransitionProviderProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [config, setConfigState] = useState<TransitionConfig>({
    ...DEFAULT_CONFIG,
    ...defaultConfig,
  });
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();

  // Trigger transition on route change
  useEffect(() => {
    if (prefersReducedMotion) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, config.duration);

    return () => clearTimeout(timer);
  }, [pathname, config.duration, prefersReducedMotion]);

  const startTransition = useCallback(() => {
    if (!prefersReducedMotion) {
      setIsTransitioning(true);
    }
  }, [prefersReducedMotion]);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const setConfig = useCallback((newConfig: Partial<TransitionConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <PageTransitionContext.Provider
      value={{
        isTransitioning,
        startTransition,
        endTransition,
        config,
        setConfig,
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
}

// ============================================
// PageTransition Component
// ============================================

export interface PageTransitionProps {
  children: ReactNode;
  /** Override transition type */
  type?: TransitionType;
  /** Override duration */
  duration?: number;
  /** Override direction */
  direction?: TransitionDirection;
  /** Additional class names */
  className?: string;
}

export function PageTransition({
  children,
  type,
  duration,
  direction,
  className,
}: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  const transitionType = type || "fade";
  const transitionDuration = duration || 300;
  const transitionDirection = direction || "up";

  // Handle route changes
  useEffect(() => {
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayChildren(children);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, transitionDuration / 2);

    return () => clearTimeout(timer);
  }, [pathname, children, transitionDuration, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  const getTransitionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transition: `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    };

    if (isAnimating) {
      switch (transitionType) {
        case "fade":
          return { ...baseStyles, opacity: 0 };
        case "slide": {
          const slideOffset = "20px";
          const transforms = {
            up: `translateY(${slideOffset})`,
            down: `translateY(-${slideOffset})`,
            left: `translateX(${slideOffset})`,
            right: `translateX(-${slideOffset})`,
          };
          return {
            ...baseStyles,
            opacity: 0,
            transform: transforms[transitionDirection],
          };
        }
        case "scale":
          return { ...baseStyles, opacity: 0, transform: "scale(0.98)" };
        case "blur":
          return { ...baseStyles, opacity: 0, filter: "blur(4px)" };
        default:
          return baseStyles;
      }
    }

    return {
      ...baseStyles,
      opacity: 1,
      transform: "none",
      filter: "none",
    };
  };

  return (
    <div className={cn("w-full", className)} style={getTransitionStyles()}>
      {displayChildren}
    </div>
  );
}

// ============================================
// FadeIn Component
// ============================================

export interface FadeInProps {
  children: ReactNode;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Duration of animation (ms) */
  duration?: number;
  /** Direction to fade in from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance to travel */
  distance?: number;
  /** Additional class names */
  className?: string;
  /** Trigger animation on mount or use IntersectionObserver */
  trigger?: "mount" | "visible";
}

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  direction = "up",
  distance = 20,
  className,
  trigger = "mount",
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(trigger === "mount");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (trigger === "mount" && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay, trigger, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return `translateY(${distance}px)`;
      case "down":
        return `translateY(-${distance}px)`;
      case "left":
        return `translateX(${distance}px)`;
      case "right":
        return `translateX(-${distance}px)`;
      case "none":
        return "none";
    }
  };

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : getInitialTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transitionDelay: `${delay}ms`,
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

// ============================================
// StaggerChildren Component
// ============================================

export interface StaggerChildrenProps {
  children: ReactNode;
  /** Delay between each child (ms) */
  stagger?: number;
  /** Base delay before first child (ms) */
  baseDelay?: number;
  /** Duration for each child animation (ms) */
  duration?: number;
  /** Direction to animate from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance to travel */
  distance?: number;
  /** Additional class names for container */
  className?: string;
}

export function StaggerChildren({
  children,
  stagger = 50,
  baseDelay = 0,
  duration = 500,
  direction = "up",
  distance = 20,
  className,
}: StaggerChildrenProps) {
  const prefersReducedMotion = useReducedMotion();
  const childArray = Array.isArray(children) ? children : [children];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <FadeIn
          key={index}
          delay={baseDelay + index * stagger}
          duration={duration}
          direction={direction}
          distance={distance}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// ============================================
// AnimatePresence Component
// ============================================

export interface AnimatePresenceProps {
  children: ReactNode;
  /** Whether the children should be visible */
  show: boolean;
  /** Animation type */
  type?: "fade" | "slide" | "scale" | "collapse";
  /** Duration in milliseconds */
  duration?: number;
  /** Direction for slide */
  direction?: TransitionDirection;
  /** Additional class names */
  className?: string;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
}

export function AnimatePresence({
  children,
  show,
  type = "fade",
  duration = 200,
  direction = "up",
  className,
  onExitComplete,
}: AnimatePresenceProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRender(true);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), duration);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
        onExitComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onExitComplete]);

  if (!shouldRender) return null;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getStyles = (): React.CSSProperties => {
    const baseTransition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const isVisible = show && !isAnimating;

    switch (type) {
      case "fade":
        return {
          opacity: isVisible ? 1 : 0,
          transition: baseTransition,
        };
      case "slide": {
        const offset = "20px";
        const transforms = {
          up: `translateY(${offset})`,
          down: `translateY(-${offset})`,
          left: `translateX(${offset})`,
          right: `translateX(-${offset})`,
        };
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "none" : transforms[direction],
          transition: baseTransition,
        };
      }
      case "scale":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.95)",
          transition: baseTransition,
        };
      case "collapse":
        return {
          opacity: isVisible ? 1 : 0,
          maxHeight: isVisible ? "1000px" : "0",
          overflow: "hidden",
          transition: baseTransition,
        };
      default:
        return {};
    }
  };

  return (
    <div className={className} style={getStyles()}>
      {children}
    </div>
  );
}

// ============================================
// ProgressBar Component (for navigation)
// ============================================

export interface NavigationProgressProps {
  /** Whether navigation is in progress */
  isNavigating?: boolean;
  /** Progress color */
  color?: string;
  /** Height of the bar */
  height?: number;
  /** Additional class names */
  className?: string;
}

export function NavigationProgress({
  isNavigating = false,
  color = "rgb(59, 130, 246)", // blue-500
  height = 2,
  className,
}: NavigationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isNavigating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      setProgress(0);

      // Animate to 90%
      const timer1 = setTimeout(() => setProgress(30), 100);
      const timer2 = setTimeout(() => setProgress(60), 300);
      const timer3 = setTimeout(() => setProgress(90), 600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else if (visible) {
      // Complete and hide
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, visible]);

  if (!visible || prefersReducedMotion) return null;

  return (
    <div
      className={cn("fixed top-0 left-0 right-0 z-[9999]", className)}
      style={{ height }}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}, 0 0 5px ${color}`,
        }}
      />
    </div>
  );
}

// ============================================
// useNavigationProgress Hook
// ============================================

export function useNavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Start progress on route change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNavigating(true);

    // End progress after a short delay
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return { isNavigating };
}
