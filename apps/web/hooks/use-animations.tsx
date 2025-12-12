"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Animation Hooks
 * Micro-interaction utilities for delightful UX
 *
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

// ============================================
// TYPES
// ============================================

export interface SpringConfig {
  /** Stiffness of the spring (higher = faster) */
  stiffness?: number;
  /** Damping ratio (higher = less bouncy) */
  damping?: number;
  /** Mass of the object (higher = slower) */
  mass?: number;
}

export interface TiltState {
  /** Rotation around X axis (degrees) */
  rotateX: number;
  /** Rotation around Y axis (degrees) */
  rotateY: number;
  /** Scale factor */
  scale: number;
}

export interface PressState {
  /** Whether the element is being pressed */
  isPressed: boolean;
  /** Whether the element is being hovered */
  isHovered: boolean;
  /** Current scale (for press animation) */
  scale: number;
}

export interface RippleState {
  /** Unique ID for the ripple */
  id: number;
  /** X position relative to element */
  x: number;
  /** Y position relative to element */
  y: number;
  /** Size of the ripple */
  size: number;
}

// ============================================
// SPRING PHYSICS
// ============================================

const DEFAULT_SPRING: SpringConfig = {
  stiffness: 400,
  damping: 30,
  mass: 1,
};

/**
 * Simple spring physics interpolation
 */
function springInterpolate(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  deltaTime: number
): { value: number; velocity: number } {
  const { stiffness = 400, damping = 30, mass = 1 } = config;

  // Spring force: F = -kx (Hooke's law)
  const springForce = -stiffness * (current - target);

  // Damping force: F = -cv
  const dampingForce = -damping * velocity;

  // Acceleration: a = F/m
  const acceleration = (springForce + dampingForce) / mass;

  // Update velocity and position
  const newVelocity = velocity + acceleration * deltaTime;
  const newValue = current + newVelocity * deltaTime;

  return { value: newValue, velocity: newVelocity };
}

// ============================================
// useTilt Hook
// ============================================

/**
 * Hook for 3D tilt effect on hover
 *
 * @example
 * ```tsx
 * const { tiltStyle, handlers } = useTilt({ maxTilt: 15 });
 *
 * <div style={tiltStyle} {...handlers}>
 *   Hover me for 3D effect!
 * </div>
 * ```
 */
export function useTilt(options: {
  maxTilt?: number;
  scale?: number;
  perspective?: number;
  speed?: number;
  disabled?: boolean;
} = {}) {
  const {
    maxTilt = 10,
    scale = 1.02,
    perspective = 1000,
    speed = 400,
    disabled = false,
  } = options;

  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const elementRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;

      const element = e.currentTarget;
      elementRef.current = element;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate rotation based on mouse position relative to center
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
      const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * maxTilt;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setTilt({ rotateX, rotateY, scale });
      });
    },
    [maxTilt, scale, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const tiltStyle: React.CSSProperties = {
    transform: `perspective(${perspective}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
    transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
    transformStyle: "preserve-3d",
  };

  return {
    tiltStyle,
    tilt,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}

// ============================================
// usePress Hook
// ============================================

/**
 * Hook for press/click animations with haptic-like feedback
 *
 * @example
 * ```tsx
 * const { pressStyle, handlers, isPressed } = usePress();
 *
 * <button style={pressStyle} {...handlers}>
 *   Click me!
 * </button>
 * ```
 */
export function usePress(options: {
  scalePressed?: number;
  scaleHovered?: number;
  disabled?: boolean;
} = {}) {
  const {
    scalePressed = 0.97,
    scaleHovered = 1.02,
    disabled = false,
  } = options;

  const [state, setState] = useState<PressState>({
    isPressed: false,
    isHovered: false,
    scale: 1,
  });

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    setState((prev) => ({ ...prev, isPressed: true, scale: scalePressed }));
  }, [scalePressed, disabled]);

  const handleMouseUp = useCallback(() => {
    if (disabled) return;
    setState((prev) => ({
      ...prev,
      isPressed: false,
      scale: prev.isHovered ? scaleHovered : 1,
    }));
  }, [scaleHovered, disabled]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    setState((prev) => ({
      ...prev,
      isHovered: true,
      scale: prev.isPressed ? scalePressed : scaleHovered,
    }));
  }, [scalePressed, scaleHovered, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setState({ isPressed: false, isHovered: false, scale: 1 });
  }, [disabled]);

  const pressStyle: React.CSSProperties = {
    transform: `scale(${state.scale})`,
    transition: state.isPressed
      ? "transform 50ms cubic-bezier(0.4, 0, 0.2, 1)"
      : "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  return {
    pressStyle,
    state,
    isPressed: state.isPressed,
    isHovered: state.isHovered,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}

// ============================================
// useRipple Hook
// ============================================

/**
 * Hook for Material Design-style ripple effect
 *
 * @example
 * ```tsx
 * const { ripples, createRipple, RippleContainer } = useRipple();
 *
 * <button onClick={createRipple}>
 *   <RippleContainer />
 *   Click for ripple!
 * </button>
 * ```
 */
export function useRipple(options: {
  color?: string;
  duration?: number;
  disabled?: boolean;
} = {}) {
  const {
    color = "rgba(255, 255, 255, 0.3)",
    duration = 600,
    disabled = false,
  } = options;

  const [ripples, setRipples] = useState<RippleState[]>([]);
  const nextIdRef = useRef(0);

  const createRipple = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;

      const element = e.currentTarget;
      const rect = element.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate ripple size to cover entire element
      const size = Math.max(rect.width, rect.height) * 2;

      const newRipple: RippleState = {
        id: nextIdRef.current++,
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration);
    },
    [duration, disabled]
  );

  const RippleContainer = useCallback(
    () => (
      <span
        className="ripple-container"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          borderRadius: "inherit",
          pointerEvents: "none",
        }}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              position: "absolute",
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              borderRadius: "50%",
              backgroundColor: color,
              transform: "scale(0)",
              animation: `ripple-expand ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              pointerEvents: "none",
            }}
          />
        ))}
      </span>
    ),
    [ripples, color, duration]
  );

  return {
    ripples,
    createRipple,
    RippleContainer,
  };
}

// ============================================
// useSpring Hook
// ============================================

/**
 * Hook for spring-animated values
 *
 * @example
 * ```tsx
 * const [value, setValue] = useSpring(0, { stiffness: 300, damping: 25 });
 *
 * // value will animate smoothly to 100
 * setValue(100);
 * ```
 */
export function useSpring(
  initialValue: number,
  config: SpringConfig = DEFAULT_SPRING
): [number, (target: number) => void] {
  const [value, setValueState] = useState(initialValue);
  const targetRef = useRef(initialValue);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    const now = performance.now();
    const deltaTime = lastTimeRef.current
      ? Math.min((now - lastTimeRef.current) / 1000, 0.064) // Cap at ~15fps minimum
      : 0.016;
    lastTimeRef.current = now;

    const result = springInterpolate(
      value,
      targetRef.current,
      velocityRef.current,
      config,
      deltaTime
    );

    velocityRef.current = result.velocity;

    // Check if we're close enough to stop
    const isSettled =
      Math.abs(result.value - targetRef.current) < 0.01 &&
      Math.abs(result.velocity) < 0.01;

    if (isSettled) {
      setValueState(targetRef.current);
      velocityRef.current = 0;
      rafRef.current = null;
    } else {
      setValueState(result.value);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [value, config]);

  const setValue = useCallback(
    (target: number) => {
      targetRef.current = target;
      if (!rafRef.current) {
        lastTimeRef.current = null;
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [animate]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return [value, setValue];
}

// ============================================
// useHoverGlow Hook
// ============================================

/**
 * Hook for cursor-following glow effect
 *
 * @example
 * ```tsx
 * const { glowStyle, handlers } = useHoverGlow();
 *
 * <div style={{ position: 'relative' }} {...handlers}>
 *   <div style={glowStyle} />
 *   Content with glow
 * </div>
 * ```
 */
export function useHoverGlow(options: {
  color?: string;
  size?: number;
  opacity?: number;
  disabled?: boolean;
} = {}) {
  const {
    color = "rgba(251, 146, 60, 0.15)", // Orange glow
    size = 300,
    opacity = 1,
    disabled = false,
  } = options;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [disabled]
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    setIsHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsHovered(false);
  }, [disabled]);

  const glowStyle: React.CSSProperties = {
    position: "absolute",
    left: position.x - size / 2,
    top: position.y - size / 2,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity: isHovered ? opacity : 0,
    transition: "opacity 300ms ease",
    pointerEvents: "none",
    zIndex: 0,
  };

  return {
    glowStyle,
    position,
    isHovered,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}

// ============================================
// useScrollReveal Hook
// ============================================

/**
 * Hook for scroll-triggered reveal animations
 *
 * @example
 * ```tsx
 * const { ref, isVisible, revealStyle } = useScrollReveal();
 *
 * <div ref={ref} style={revealStyle}>
 *   I'll animate in when scrolled into view!
 * </div>
 * ```
 */
export function useScrollReveal(options: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
} = {}) {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
    delay = 0,
    direction = "up",
    distance = 20,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          if (triggerOnce && hasTriggeredRef.current) return;
          hasTriggeredRef.current = true;

          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, delay]);

  const getTransform = () => {
    if (isVisible) return "translate(0, 0)";

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
        return "translate(0, 0)";
    }
  };

  const revealStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transitionDelay: `${delay}ms`,
  };

  const setRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return {
    ref: setRef,
    isVisible,
    revealStyle,
  };
}

// ============================================
// useTypewriter Hook
// ============================================

/**
 * Hook for typewriter text animation
 *
 * @example
 * ```tsx
 * const { displayText, isTyping } = useTypewriter("Hello, World!", {
 *   speed: 50,
 *   startDelay: 500
 * });
 *
 * <p>{displayText}<span className="cursor">|</span></p>
 * ```
 */
export function useTypewriter(
  text: string,
  options: {
    speed?: number;
    startDelay?: number;
    onComplete?: () => void;
  } = {}
) {
  const { speed = 50, startDelay = 0, onComplete } = options;

  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayText("");
    setIsTyping(true);

    const startTyping = () => {
      const type = () => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          timeoutRef.current = setTimeout(type, speed);
        } else {
          setIsTyping(false);
          onComplete?.();
        }
      };
      type();
    };

    timeoutRef.current = setTimeout(startTyping, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay, onComplete]);

  return { displayText, isTyping };
}

// ============================================
// useParallax Hook
// ============================================

/**
 * Hook for parallax scrolling effect
 *
 * @example
 * ```tsx
 * const { parallaxStyle } = useParallax({ speed: 0.5 });
 *
 * <div style={parallaxStyle}>
 *   I move at half the scroll speed!
 * </div>
 * ```
 */
export function useParallax(options: {
  speed?: number;
  direction?: "vertical" | "horizontal";
  disabled?: boolean;
} = {}) {
  const { speed = 0.5, direction = "vertical", disabled = false } = options;

  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (disabled) return;

    const handleScroll = () => {
      const element = elementRef.current;
      if (!element) {
        // Use window scroll if no element
        const scrollY = window.scrollY;
        setOffset(scrollY * speed);
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;

      // Calculate offset based on element position
      const distanceFromCenter = elementCenter - viewportCenter;
      setOffset(distanceFromCenter * speed * -1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [speed, disabled]);

  const parallaxStyle: React.CSSProperties = {
    transform:
      direction === "vertical"
        ? `translateY(${offset}px)`
        : `translateX(${offset}px)`,
    willChange: "transform",
  };

  const setRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return {
    ref: setRef,
    offset,
    parallaxStyle,
  };
}

// ============================================
// useReducedMotion Hook
// ============================================

/**
 * Hook to detect prefers-reduced-motion setting
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
