"use client";

import {
  forwardRef,
  useState,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/design-system";
import { useReducedMotion } from "@/hooks/use-animations";

/**
 * Animated Input Components
 * Form inputs with micro-interactions for delightful UX
 *
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

// ============================================
// TYPES
// ============================================

export interface AnimatedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success state */
  success?: boolean;
  /** Left icon/addon */
  leftIcon?: ReactNode;
  /** Right icon/addon */
  rightIcon?: ReactNode;
  /** Input size */
  size?: "sm" | "md" | "lg";
  /** Floating label style */
  floatingLabel?: boolean;
  /** Show character count */
  showCount?: boolean;
}

export interface AnimatedTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  /** Label text */
  label?: string;
  /** Helper text below textarea */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success state */
  success?: boolean;
  /** Textarea size */
  size?: "sm" | "md" | "lg";
  /** Floating label style */
  floatingLabel?: boolean;
  /** Show character count */
  showCount?: boolean;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

// ============================================
// SIZE STYLES
// ============================================

const inputSizes = {
  sm: "h-9 text-sm px-3",
  md: "h-11 text-sm px-4",
  lg: "h-13 text-base px-4",
};

const labelSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-5 h-5",
};

// ============================================
// AnimatedInput Component
// ============================================

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      size = "md",
      floatingLabel = false,
      showCount = false,
      maxLength,
      disabled,
      id: providedId,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const prefersReducedMotion = useReducedMotion();

    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(
      (value as string) || (defaultValue as string) || ""
    );
    const [charCount, setCharCount] = useState(
      ((value as string) || (defaultValue as string) || "").length
    );

    const hasValue = internalValue.length > 0;
    const isFloating = floatingLabel && (isFocused || hasValue);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setCharCount(newValue.length);
      onChange?.(e);
    };

    return (
      <div className={cn("w-full", className)}>
        {/* Static label */}
        {label && !floatingLabel && (
          <label
            htmlFor={id}
            className={cn(
              "block mb-1.5 font-medium",
              "text-gray-700 dark:text-gray-300",
              labelSizes[size],
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Floating label */}
          {label && floatingLabel && (
            <label
              htmlFor={id}
              className={cn(
                "absolute left-4 z-10 pointer-events-none",
                "text-gray-500 dark:text-gray-400",
                "transition-all duration-200",
                prefersReducedMotion && "transition-none",
                isFloating
                  ? cn(
                      "top-0 -translate-y-1/2 text-xs",
                      "bg-white dark:bg-[#0a0a0a] px-1",
                      error
                        ? "text-red-500"
                        : success
                        ? "text-emerald-500"
                        : isFocused
                        ? "text-orange-500"
                        : ""
                    )
                  : cn(
                      "top-1/2 -translate-y-1/2",
                      labelSizes[size],
                      leftIcon && "left-11"
                    )
              )}
            >
              {label}
            </label>
          )}

          {/* Left icon */}
          {leftIcon && (
            <span
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2",
                "text-gray-400 dark:text-gray-500",
                "transition-colors duration-200",
                isFocused && "text-orange-500",
                error && "text-red-500",
                success && "text-emerald-500",
                iconSizes[size]
              )}
            >
              {leftIcon}
            </span>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              // Base styles
              "w-full rounded-lg",
              "bg-white dark:bg-[#0a0a0a]",
              "text-gray-900 dark:text-white",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "transition-all duration-200",
              prefersReducedMotion && "transition-none",
              // Border states
              "border-2",
              error
                ? "border-red-500 focus:border-red-500"
                : success
                ? "border-emerald-500 focus:border-emerald-500"
                : cn(
                    "border-gray-200 dark:border-[#333]",
                    "hover:border-gray-300 dark:hover:border-[#444]",
                    "focus:border-orange-500"
                  ),
              // Focus ring
              "focus:outline-none focus:ring-4",
              error
                ? "focus:ring-red-500/20"
                : success
                ? "focus:ring-emerald-500/20"
                : "focus:ring-orange-500/20",
              // Disabled
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "disabled:bg-gray-50 dark:disabled:bg-[#111]",
              // Size
              inputSizes[size],
              // Icon padding
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              // Floating label padding
              floatingLabel && "pt-4 pb-1"
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                "text-gray-400 dark:text-gray-500",
                iconSizes[size]
              )}
            >
              {rightIcon}
            </span>
          )}

          {/* Focus glow effect */}
          <span
            className={cn(
              "absolute inset-0 rounded-lg pointer-events-none",
              "transition-opacity duration-300",
              prefersReducedMotion && "hidden",
              isFocused && !error && !success
                ? "opacity-100"
                : "opacity-0",
              "shadow-[0_0_0_4px_rgba(251,146,60,0.1)]"
            )}
          />
        </div>

        {/* Helper text / Error / Count */}
        <div className="flex justify-between mt-1.5 gap-4">
          <div>
            {error && (
              <p className="text-xs text-red-500 animate-fade-in">{error}</p>
            )}
            {!error && helperText && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs",
                charCount >= maxLength
                  ? "text-red-500"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

// ============================================
// AnimatedTextarea Component
// ============================================

export const AnimatedTextarea = forwardRef<
  HTMLTextAreaElement,
  AnimatedTextareaProps
>(
  (
    {
      className,
      label,
      helperText,
      error,
      success,
      size = "md",
      floatingLabel = false,
      showCount = false,
      autoResize = false,
      maxLength,
      disabled,
      id: providedId,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const prefersReducedMotion = useReducedMotion();

    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(
      (value as string) || (defaultValue as string) || ""
    );
    const [charCount, setCharCount] = useState(
      ((value as string) || (defaultValue as string) || "").length
    );

    const hasValue = internalValue.length > 0;
    const isFloating = floatingLabel && (isFocused || hasValue);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setCharCount(newValue.length);

      // Auto-resize
      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }

      onChange?.(e);
    };

    return (
      <div className={cn("w-full", className)}>
        {/* Static label */}
        {label && !floatingLabel && (
          <label
            htmlFor={id}
            className={cn(
              "block mb-1.5 font-medium",
              "text-gray-700 dark:text-gray-300",
              labelSizes[size],
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea wrapper */}
        <div className="relative">
          {/* Floating label */}
          {label && floatingLabel && (
            <label
              htmlFor={id}
              className={cn(
                "absolute left-4 z-10 pointer-events-none",
                "text-gray-500 dark:text-gray-400",
                "transition-all duration-200",
                prefersReducedMotion && "transition-none",
                isFloating
                  ? cn(
                      "top-0 -translate-y-1/2 text-xs",
                      "bg-white dark:bg-[#0a0a0a] px-1",
                      error
                        ? "text-red-500"
                        : success
                        ? "text-emerald-500"
                        : isFocused
                        ? "text-orange-500"
                        : ""
                    )
                  : cn("top-4", labelSizes[size])
              )}
            >
              {label}
            </label>
          )}

          {/* Textarea element */}
          <textarea
            ref={ref}
            id={id}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              // Base styles
              "w-full rounded-lg resize-none",
              "bg-white dark:bg-[#0a0a0a]",
              "text-gray-900 dark:text-white",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "transition-all duration-200",
              prefersReducedMotion && "transition-none",
              // Border states
              "border-2",
              error
                ? "border-red-500 focus:border-red-500"
                : success
                ? "border-emerald-500 focus:border-emerald-500"
                : cn(
                    "border-gray-200 dark:border-[#333]",
                    "hover:border-gray-300 dark:hover:border-[#444]",
                    "focus:border-orange-500"
                  ),
              // Focus ring
              "focus:outline-none focus:ring-4",
              error
                ? "focus:ring-red-500/20"
                : success
                ? "focus:ring-emerald-500/20"
                : "focus:ring-orange-500/20",
              // Disabled
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "disabled:bg-gray-50 dark:disabled:bg-[#111]",
              // Padding
              size === "sm" ? "p-3 text-sm" : "p-4 text-sm",
              // Floating label padding
              floatingLabel && "pt-6"
            )}
            {...props}
          />

          {/* Focus glow effect */}
          <span
            className={cn(
              "absolute inset-0 rounded-lg pointer-events-none",
              "transition-opacity duration-300",
              prefersReducedMotion && "hidden",
              isFocused && !error && !success ? "opacity-100" : "opacity-0",
              "shadow-[0_0_0_4px_rgba(251,146,60,0.1)]"
            )}
          />
        </div>

        {/* Helper text / Error / Count */}
        <div className="flex justify-between mt-1.5 gap-4">
          <div>
            {error && (
              <p className="text-xs text-red-500 animate-fade-in">{error}</p>
            )}
            {!error && helperText && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs",
                charCount >= maxLength
                  ? "text-red-500"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AnimatedTextarea.displayName = "AnimatedTextarea";

// ============================================
// AnimatedSwitch Component
// ============================================

export interface AnimatedSwitchProps {
  /** Whether switch is on */
  checked: boolean;
  /** Callback when state changes */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: "left" | "right";
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Disabled state */
  disabled?: boolean;
  /** ID for accessibility */
  id?: string;
  /** Additional class names */
  className?: string;
}

const switchSizes = {
  sm: { track: "w-8 h-5", thumb: "w-4 h-4", translate: "translate-x-3" },
  md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: "translate-x-5" },
  lg: { track: "w-14 h-8", thumb: "w-7 h-7", translate: "translate-x-6" },
};

export function AnimatedSwitch({
  checked,
  onChange,
  label,
  labelPosition = "right",
  size = "md",
  disabled = false,
  id: providedId,
  className,
}: AnimatedSwitchProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const prefersReducedMotion = useReducedMotion();
  const sizeConfig = switchSizes[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3",
        labelPosition === "left" && "flex-row-reverse",
        className
      )}
    >
      {/* Switch track */}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full",
          "transition-colors duration-200",
          prefersReducedMotion && "transition-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          checked
            ? "bg-orange-500"
            : "bg-gray-200 dark:bg-[#333]",
          sizeConfig.track
        )}
      >
        {/* Thumb */}
        <span
          className={cn(
            "absolute left-0.5 rounded-full",
            "bg-white shadow-sm",
            "transition-transform duration-200",
            prefersReducedMotion && "transition-none",
            checked && sizeConfig.translate,
            sizeConfig.thumb
          )}
        />
      </button>

      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium cursor-pointer select-none",
            "text-gray-700 dark:text-gray-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}

// ============================================
// AnimatedCheckbox Component
// ============================================

export interface AnimatedCheckboxProps {
  /** Whether checkbox is checked */
  checked: boolean;
  /** Callback when state changes */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Disabled state */
  disabled?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** ID for accessibility */
  id?: string;
  /** Additional class names */
  className?: string;
}

const checkboxSizes = {
  sm: { box: "w-4 h-4", icon: "w-2.5 h-2.5" },
  md: { box: "w-5 h-5", icon: "w-3 h-3" },
  lg: { box: "w-6 h-6", icon: "w-4 h-4" },
};

export function AnimatedCheckbox({
  checked,
  onChange,
  label,
  size = "md",
  disabled = false,
  indeterminate = false,
  id: providedId,
  className,
}: AnimatedCheckboxProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const prefersReducedMotion = useReducedMotion();
  const sizeConfig = checkboxSizes[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={indeterminate ? "mixed" : checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center rounded",
          "transition-all duration-200",
          prefersReducedMotion && "transition-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-[#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Border and background
          checked || indeterminate
            ? "bg-orange-500 border-2 border-orange-500"
            : cn(
                "bg-white dark:bg-[#0a0a0a]",
                "border-2 border-gray-300 dark:border-[#444]",
                "hover:border-orange-500"
              ),
          sizeConfig.box
        )}
      >
        {/* Check icon */}
        <svg
          className={cn(
            "text-white",
            "transition-all duration-200",
            prefersReducedMotion && "transition-none",
            checked ? "opacity-100 scale-100" : "opacity-0 scale-50",
            sizeConfig.icon
          )}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2 6 5 9 10 3" />
        </svg>

        {/* Indeterminate icon */}
        {indeterminate && !checked && (
          <span
            className={cn(
              "absolute bg-white rounded-sm",
              size === "sm" ? "w-2 h-0.5" : size === "md" ? "w-2.5 h-0.5" : "w-3 h-0.5"
            )}
          />
        )}
      </button>

      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm cursor-pointer select-none",
            "text-gray-700 dark:text-gray-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
