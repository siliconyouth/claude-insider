"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  useTilt,
  useHoverGlow,
  useReducedMotion,
} from "@/hooks/use-animations";

/**
 * Animated Card Components
 * Cards with 3D tilt, glow effects, and smooth interactions
 *
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

// ============================================
// TYPES
// ============================================

export interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable 3D tilt effect on hover */
  tilt?: boolean;
  /** Enable cursor-following glow effect */
  glow?: boolean;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Scale on hover */
  hoverScale?: number;
  /** Glow color (defaults to blue) */
  glowColor?: string;
  /** Card variant */
  variant?: "default" | "elevated" | "bordered" | "glass";
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Interactive (shows hover effects) */
  interactive?: boolean;
}

export interface AnimatedCardLinkProps extends AnimatedCardProps {
  /** Link destination */
  href: string;
  /** Open in new tab */
  external?: boolean;
}

export interface FeatureCardProps extends AnimatedCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon component */
  icon?: ReactNode;
  /** Badge text */
  badge?: string;
  /** Badge variant */
  badgeVariant?: "default" | "new" | "popular" | "updated";
}

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles = {
  default: cn(
    "bg-white dark:bg-[#111111]",
    "border border-gray-200 dark:border-[#262626]"
  ),
  elevated: cn(
    "bg-white dark:bg-[#111111]",
    "border border-gray-200 dark:border-[#262626]",
    "shadow-lg shadow-black/5 dark:shadow-black/20"
  ),
  bordered: cn(
    "bg-transparent",
    "border-2 border-gray-200 dark:border-[#333]"
  ),
  glass: cn(
    "bg-white/80 dark:bg-[#111111]/80",
    "backdrop-blur-lg",
    "border border-gray-200/50 dark:border-[#333]/50"
  ),
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const badgeStyles = {
  default: "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400",
  new: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  popular: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  updated: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

// ============================================
// AnimatedCard Component
// ============================================

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      children,
      className,
      tilt = false,
      glow = false,
      maxTilt = 8,
      hoverScale = 1.02,
      glowColor = "rgba(59, 130, 246, 0.15)",
      variant = "default",
      padding = "md",
      interactive = false,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { tiltStyle, handlers: tiltHandlers } = useTilt({
      maxTilt,
      scale: hoverScale,
      disabled: prefersReducedMotion || !tilt,
    });
    const { glowStyle, handlers: glowHandlers } = useHoverGlow({
      color: glowColor,
      disabled: prefersReducedMotion || !glow,
    });

    // Combine handlers
    const combinedHandlers = {
      onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
        tiltHandlers.onMouseMove(e);
        glowHandlers.onMouseMove(e);
      },
      onMouseEnter: () => {
        glowHandlers.onMouseEnter();
      },
      onMouseLeave: () => {
        tiltHandlers.onMouseLeave();
        glowHandlers.onMouseLeave();
      },
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl overflow-hidden",
          "transition-all duration-300",
          prefersReducedMotion && "transition-none",
          variantStyles[variant],
          paddingStyles[padding],
          interactive && cn(
            "cursor-pointer",
            "hover:border-gray-300 dark:hover:border-[#404040]",
            !tilt && "hover:scale-[1.02]"
          ),
          className
        )}
        style={tilt && !prefersReducedMotion ? tiltStyle : undefined}
        {...(tilt || glow ? combinedHandlers : {})}
        {...props}
      >
        {/* Glow effect overlay */}
        {glow && !prefersReducedMotion && (
          <div style={glowStyle} aria-hidden="true" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

// ============================================
// AnimatedCardLink Component
// ============================================

export const AnimatedCardLink = forwardRef<
  HTMLAnchorElement,
  AnimatedCardLinkProps
>(
  (
    {
      children,
      className,
      href,
      external = false,
      tilt = true,
      glow = true,
      maxTilt = 8,
      hoverScale = 1.02,
      glowColor = "rgba(59, 130, 246, 0.15)",
      variant = "default",
      padding = "md",
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { tiltStyle, handlers: tiltHandlers } = useTilt({
      maxTilt,
      scale: hoverScale,
      disabled: prefersReducedMotion || !tilt,
    });
    const { glowStyle, handlers: glowHandlers } = useHoverGlow({
      color: glowColor,
      disabled: prefersReducedMotion || !glow,
    });

    const combinedHandlers = {
      onMouseMove: (e: React.MouseEvent<HTMLAnchorElement>) => {
        tiltHandlers.onMouseMove(e as unknown as React.MouseEvent<HTMLElement>);
        glowHandlers.onMouseMove(e as unknown as React.MouseEvent<HTMLElement>);
      },
      onMouseEnter: () => {
        glowHandlers.onMouseEnter();
      },
      onMouseLeave: () => {
        tiltHandlers.onMouseLeave();
        glowHandlers.onMouseLeave();
      },
    };

    const linkProps = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          "relative block rounded-xl overflow-hidden",
          "transition-all duration-300",
          prefersReducedMotion && "transition-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          variantStyles[variant],
          paddingStyles[padding],
          "hover:border-gray-300 dark:hover:border-[#404040]",
          className
        )}
        style={tilt && !prefersReducedMotion ? tiltStyle : undefined}
        {...combinedHandlers}
        {...linkProps}
        {...(props as HTMLAttributes<HTMLAnchorElement>)}
      >
        {/* Glow effect overlay */}
        {glow && !prefersReducedMotion && (
          <div style={glowStyle} aria-hidden="true" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </Link>
    );
  }
);

AnimatedCardLink.displayName = "AnimatedCardLink";

// ============================================
// FeatureCard Component
// ============================================

export function FeatureCard({
  title,
  description,
  icon,
  badge,
  badgeVariant = "default",
  className,
  tilt = true,
  glow = true,
  ...props
}: FeatureCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatedCard
      tilt={tilt}
      glow={glow}
      interactive
      className={cn("group", className)}
      {...props}
    >
      <div className="flex flex-col gap-4">
        {/* Header with icon and badge */}
        <div className="flex items-start justify-between">
          {/* Icon */}
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center",
                "w-12 h-12 rounded-lg",
                "bg-blue-100 dark:bg-blue-900/30",
                "text-blue-600 dark:text-cyan-400",
                "transition-transform duration-300",
                !prefersReducedMotion && "group-hover:scale-110"
              )}
            >
              {icon}
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                badgeStyles[badgeVariant]
              )}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-lg font-semibold",
            "text-gray-900 dark:text-white",
            "transition-colors duration-200",
            "group-hover:text-blue-600 dark:group-hover:text-cyan-400"
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>

        {/* Arrow indicator */}
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            "text-blue-600 dark:text-cyan-400",
            "transition-transform duration-200",
            !prefersReducedMotion && "group-hover:translate-x-1"
          )}
        >
          <span>Learn more</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </AnimatedCard>
  );
}

// ============================================
// StatsCard Component
// ============================================

export interface StatsCardProps extends Omit<AnimatedCardProps, "children"> {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Change indicator (e.g., "+12%") */
  change?: string;
  /** Whether change is positive */
  changePositive?: boolean;
  /** Icon */
  icon?: ReactNode;
}

export function StatsCard({
  label,
  value,
  change,
  changePositive = true,
  icon,
  className,
  tilt = false,
  glow = false,
  ...props
}: StatsCardProps) {
  return (
    <AnimatedCard
      tilt={tilt}
      glow={glow}
      className={className}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "text-sm font-medium mt-1",
                changePositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center",
              "w-12 h-12 rounded-full",
              "bg-gray-100 dark:bg-[#1a1a1a]",
              "text-gray-600 dark:text-gray-400"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}

// ============================================
// ImageCard Component
// ============================================

export interface ImageCardProps extends Omit<AnimatedCardProps, "children"> {
  /** Image source */
  src: string;
  /** Image alt text */
  alt: string;
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Image aspect ratio */
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
  /** Overlay content */
  overlay?: ReactNode;
}

const aspectRatios = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

export function ImageCard({
  src,
  alt,
  title,
  description,
  aspectRatio = "video",
  overlay,
  className,
  tilt = true,
  glow = true,
  padding = "none",
  ...props
}: ImageCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatedCard
      tilt={tilt}
      glow={glow}
      padding={padding}
      className={cn("group overflow-hidden", className)}
      {...props}
    >
      {/* Image container */}
      <div className={cn("relative overflow-hidden", aspectRatios[aspectRatio])}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover",
            "transition-transform duration-500",
            !prefersReducedMotion && "group-hover:scale-105"
          )}
        />

        {/* Gradient overlay */}
        {(title || description || overlay) && (
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
              "opacity-80 transition-opacity duration-300",
              "group-hover:opacity-90"
            )}
          />
        )}

        {/* Content overlay */}
        {(title || description) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            {title && (
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Custom overlay */}
        {overlay}
      </div>
    </AnimatedCard>
  );
}

// ============================================
// CardGrid Component
// ============================================

export interface CardGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between cards */
  gap?: "sm" | "md" | "lg";
}

const columnStyles = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const gapStyles = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

export function CardGrid({
  children,
  columns = 3,
  gap = "md",
  className,
  ...props
}: CardGridProps) {
  return (
    <div
      className={cn("grid", columnStyles[columns], gapStyles[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}
