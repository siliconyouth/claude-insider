"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/design-system";
import { usePress, useRipple, useReducedMotion } from "@/hooks/use-animations";

/**
 * Animated Button Components
 * Buttons with micro-interactions for delightful UX
 *
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

// ============================================
// TYPES
// ============================================

export interface AnimatedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Show ripple effect on click */
  ripple?: boolean;
  /** Show press animation */
  pressAnimation?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Icon to display before text */
  leftIcon?: ReactNode;
  /** Icon to display after text */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles = {
  primary: cn(
    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
    "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
    "text-white shadow-lg shadow-blue-500/25",
    "border border-blue-400/50"
  ),
  secondary: cn(
    "bg-gray-100 dark:bg-[#1a1a1a]",
    "hover:bg-gray-200 dark:hover:bg-[#262626]",
    "text-gray-900 dark:text-white",
    "border border-gray-300 dark:border-[#333]"
  ),
  ghost: cn(
    "bg-transparent",
    "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
    "text-gray-700 dark:text-gray-300",
    "border border-transparent"
  ),
  danger: cn(
    "bg-red-500 hover:bg-red-600",
    "text-white shadow-lg shadow-red-500/25",
    "border border-red-400/50"
  ),
  success: cn(
    "bg-emerald-500 hover:bg-emerald-600",
    "text-white shadow-lg shadow-emerald-500/25",
    "border border-emerald-400/50"
  ),
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

const iconSizes = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

// ============================================
// AnimatedButton Component
// ============================================

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      ripple = true,
      pressAnimation = true,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { pressStyle, handlers: pressHandlers } = usePress({
      disabled: disabled || isLoading || prefersReducedMotion || !pressAnimation,
    });
    const { createRipple, RippleContainer } = useRipple({
      disabled: disabled || isLoading || prefersReducedMotion || !ripple,
      color:
        variant === "primary" || variant === "danger" || variant === "success"
          ? "rgba(255, 255, 255, 0.3)"
          : "rgba(0, 0, 0, 0.1)",
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center",
          "font-medium rounded-lg",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "overflow-hidden",
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        style={pressAnimation && !prefersReducedMotion ? pressStyle : undefined}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...pressHandlers}
        {...props}
      >
        {/* Ripple container */}
        {ripple && !prefersReducedMotion && <RippleContainer />}

        {/* Loading spinner */}
        {isLoading && (
          <span
            className={cn(
              "animate-spin rounded-full border-2 border-current border-t-transparent",
              iconSizes[size]
            )}
          />
        )}

        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className={cn("flex-shrink-0", iconSizes[size])}>
            {leftIcon}
          </span>
        )}

        {/* Button text */}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className={cn("flex-shrink-0", iconSizes[size])}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// ============================================
// IconButton Component
// ============================================

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Icon to display */
  icon: ReactNode;
  /** Accessible label */
  "aria-label": string;
  /** Show ripple effect */
  ripple?: boolean;
}

const iconButtonSizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      icon,
      ripple = true,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { pressStyle, handlers: pressHandlers } = usePress({
      disabled: disabled || prefersReducedMotion,
    });
    const { createRipple, RippleContainer } = useRipple({
      disabled: disabled || prefersReducedMotion || !ripple,
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center",
          "rounded-full",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "overflow-hidden",
          // Variant and size
          variantStyles[variant],
          iconButtonSizes[size],
          className
        )}
        style={!prefersReducedMotion ? pressStyle : undefined}
        disabled={disabled}
        onClick={handleClick}
        {...pressHandlers}
        {...props}
      >
        {ripple && !prefersReducedMotion && <RippleContainer />}
        <span className={cn("relative z-10", iconSizes[size])}>{icon}</span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

// ============================================
// FloatingActionButton Component
// ============================================

export interface FloatingActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display */
  icon: ReactNode;
  /** Accessible label */
  "aria-label": string;
  /** Position on screen */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** Extended state with label */
  extended?: boolean;
  /** Label for extended state */
  label?: string;
}

const fabPositions = {
  "bottom-right": "fixed bottom-6 right-6",
  "bottom-left": "fixed bottom-6 left-6",
  "bottom-center": "fixed bottom-6 left-1/2 -translate-x-1/2",
};

export const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(
  (
    {
      className,
      icon,
      position = "bottom-right",
      extended = false,
      label,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { pressStyle, handlers: pressHandlers } = usePress({
      disabled: disabled || prefersReducedMotion,
      scalePressed: 0.95,
      scaleHovered: 1.05,
    });
    const { createRipple, RippleContainer } = useRipple({
      disabled: disabled || prefersReducedMotion,
      color: "rgba(255, 255, 255, 0.3)",
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
          "text-white font-medium",
          "shadow-xl shadow-blue-500/30",
          "transition-all duration-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "overflow-hidden z-50",
          // Shape
          extended ? "rounded-full px-6 py-4 gap-2" : "rounded-full w-14 h-14",
          // Position
          fabPositions[position],
          className
        )}
        style={!prefersReducedMotion ? pressStyle : undefined}
        disabled={disabled}
        onClick={handleClick}
        {...pressHandlers}
        {...props}
      >
        <RippleContainer />
        <span className="relative z-10 w-6 h-6">{icon}</span>
        {extended && label && (
          <span className="relative z-10 font-medium">{label}</span>
        )}
      </button>
    );
  }
);

FloatingActionButton.displayName = "FloatingActionButton";

// ============================================
// ToggleButton Component
// ============================================

export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Whether the toggle is pressed */
  isPressed: boolean;
  /** Callback when toggle state changes */
  onChange: (pressed: boolean) => void;
  /** Icon for unpressed state */
  icon?: ReactNode;
  /** Icon for pressed state */
  pressedIcon?: ReactNode;
  /** Size */
  size?: "sm" | "md" | "lg";
}

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      className,
      isPressed,
      onChange,
      icon,
      pressedIcon,
      size = "md",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { pressStyle, handlers: pressHandlers } = usePress({
      disabled: disabled || prefersReducedMotion,
    });

    const handleClick = () => {
      onChange(!isPressed);
    };

    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={isPressed}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center",
          "rounded-lg font-medium",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // State styles
          isPressed
            ? cn(
                "bg-gradient-to-r from-violet-600 to-blue-600 text-white",
                "border border-blue-400"
              )
            : cn(
                "bg-gray-100 dark:bg-[#1a1a1a]",
                "text-gray-700 dark:text-gray-300",
                "border border-gray-300 dark:border-[#333]",
                "hover:bg-gray-200 dark:hover:bg-[#262626]"
              ),
          sizeStyles[size],
          className
        )}
        style={!prefersReducedMotion ? pressStyle : undefined}
        disabled={disabled}
        onClick={handleClick}
        {...pressHandlers}
        {...props}
      >
        {/* Icon with transition */}
        {(icon || pressedIcon) && (
          <span
            className={cn(
              "transition-transform duration-200",
              iconSizes[size],
              isPressed && "rotate-0",
              !isPressed && "rotate-0"
            )}
          >
            {isPressed ? pressedIcon || icon : icon}
          </span>
        )}
        {children}
      </button>
    );
  }
);

ToggleButton.displayName = "ToggleButton";
