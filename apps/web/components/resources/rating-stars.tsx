"use client";

/**
 * RatingStars Component
 *
 * Interactive star rating component with support for:
 * - Display mode (shows average rating with half-stars)
 * - Interactive mode (allows user to select rating)
 * - Keyboard navigation and accessibility
 * - Hover preview before selection
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface RatingStarsProps {
  /** Current rating value (1-5, supports decimals for display) */
  value: number;
  /** Callback when rating changes (makes component interactive) */
  onChange?: (rating: number) => void;
  /** Size of stars */
  size?: "sm" | "md" | "lg";
  /** Show numeric value next to stars */
  showValue?: boolean;
  /** Number of ratings (shown in parentheses) */
  count?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const StarIcon = ({
  className,
  fillPercent = 0,
}: {
  className?: string;
  fillPercent?: number;
}) => {
  const id = `star-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg className={className} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fillPercent}%`} stopColor="currentColor" />
          <stop
            offset={`${fillPercent}%`}
            stopColor="currentColor"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      {/* Background (empty star) */}
      <path
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-gray-300 dark:text-gray-600"
      />
      {/* Filled portion */}
      <path
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        fill={`url(#${id})`}
        className="text-yellow-400"
      />
    </svg>
  );
};

const sizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const gapSizes = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1.5",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function RatingStars({
  value,
  onChange,
  size = "md",
  showValue = false,
  count,
  disabled = false,
  className,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isInteractive = !!onChange && !disabled;

  const displayValue = hoverValue ?? value;

  const handleMouseEnter = useCallback(
    (starIndex: number) => {
      if (isInteractive) {
        setHoverValue(starIndex);
      }
    },
    [isInteractive]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
  }, []);

  const handleClick = useCallback(
    (starIndex: number) => {
      if (isInteractive && onChange) {
        onChange(starIndex);
      }
    },
    [isInteractive, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, starIndex: number) => {
      if (!isInteractive || !onChange) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChange(starIndex);
      } else if (e.key === "ArrowRight" && starIndex < 5) {
        e.preventDefault();
        onChange(starIndex + 1);
      } else if (e.key === "ArrowLeft" && starIndex > 1) {
        e.preventDefault();
        onChange(starIndex - 1);
      }
    },
    [isInteractive, onChange]
  );

  // Calculate fill percentage for each star
  const getStarFillPercent = (starIndex: number): number => {
    const rating = displayValue;
    if (starIndex <= Math.floor(rating)) {
      return 100;
    }
    if (starIndex === Math.ceil(rating) && rating % 1 !== 0) {
      return (rating % 1) * 100;
    }
    return 0;
  };

  return (
    <div
      className={cn("inline-flex items-center", gapSizes[size], className)}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn("flex items-center", gapSizes[size])}
        role={isInteractive ? "radiogroup" : "img"}
        aria-label={
          isInteractive
            ? `Rating: ${value} out of 5 stars. Select a rating.`
            : `Rating: ${value.toFixed(1)} out of 5 stars`
        }
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const fillPercent = getStarFillPercent(starIndex);
          const isSelected = starIndex <= value;

          if (isInteractive) {
            return (
              <button
                key={starIndex}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${starIndex} star${starIndex > 1 ? "s" : ""}`}
                className={cn(
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
                  "transition-transform duration-100",
                  !disabled && "hover:scale-110 cursor-pointer",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onMouseEnter={() => handleMouseEnter(starIndex)}
                onClick={() => handleClick(starIndex)}
                onKeyDown={(e) => handleKeyDown(e, starIndex)}
                disabled={disabled}
              >
                <StarIcon
                  className={cn(sizes[size], "transition-colors")}
                  fillPercent={starIndex <= displayValue ? 100 : 0}
                />
              </button>
            );
          }

          return (
            <StarIcon
              key={starIndex}
              className={sizes[size]}
              fillPercent={fillPercent}
            />
          );
        })}
      </div>

      {(showValue || count !== undefined) && (
        <div
          className={cn(
            "flex items-center gap-1",
            textSizes[size],
            "text-gray-600 dark:text-gray-400"
          )}
        >
          {showValue && (
            <span className="font-medium text-gray-900 dark:text-white">
              {value.toFixed(1)}
            </span>
          )}
          {count !== undefined && (
            <span>
              ({count} {count === 1 ? "review" : "reviews"})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact rating display for cards and lists
 */
export function RatingBadge({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
        "bg-yellow-50 dark:bg-yellow-900/20",
        "text-yellow-700 dark:text-yellow-400",
        className
      )}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span className="text-xs font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs opacity-75">({count})</span>
      )}
    </div>
  );
}
