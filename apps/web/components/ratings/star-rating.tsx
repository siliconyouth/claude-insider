"use client";

/**
 * Star Rating Component
 *
 * Interactive star rating with hover effects.
 */

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { submitRating } from "@/app/actions/ratings";
import { useToast } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";

interface StarRatingProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  initialRating?: number;
  averageRating?: number;
  totalRatings?: number;
  size?: "sm" | "md" | "lg";
  showAverage?: boolean;
  readonly?: boolean;
  className?: string;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  resourceType,
  resourceId,
  initialRating = 0,
  averageRating = 0,
  totalRatings = 0,
  size = "md",
  showAverage = true,
  readonly = false,
  className,
  onRatingChange,
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const { isAuthenticated, showSignIn } = useAuth();

  const handleClick = (value: number) => {
    if (readonly) return;

    if (!isAuthenticated) {
      showSignIn();
      return;
    }

    // Optimistic update
    setRating(value);
    onRatingChange?.(value);

    startTransition(async () => {
      const result = await submitRating(resourceType, resourceId, value);
      if (result.error) {
        // Revert on error
        setRating(initialRating);
        onRatingChange?.(initialRating);
        toast.error(result.error);
      } else {
        toast.success("Rating submitted!");
      }
    });
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Stars */}
      <div
        className={cn("flex items-center gap-0.5", readonly && "cursor-default")}
        onMouseLeave={() => !readonly && setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={readonly || isPending}
            onClick={() => handleClick(value)}
            onMouseEnter={() => !readonly && setHoverRating(value)}
            className={cn(
              "transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
              isPending && "opacity-50"
            )}
          >
            <svg
              className={cn(
                sizeClasses[size],
                "transition-colors",
                value <= displayRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300 dark:text-gray-600"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
      </div>

      {/* Average rating display */}
      {showAverage && (averageRating > 0 || totalRatings > 0) && (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">{averageRating.toFixed(1)}</span>
          <span>({totalRatings})</span>
        </div>
      )}
    </div>
  );
}

/**
 * Read-only star display for showing averages
 */
export function StarDisplay({
  rating,
  totalRatings,
  size = "sm",
  className,
}: {
  rating: number;
  totalRatings?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= Math.floor(rating);
          const partial = !filled && value - 0.5 <= rating;

          return (
            <svg
              key={value}
              className={cn(
                sizeClasses[size],
                filled || partial
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300 dark:text-gray-600"
              )}
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          );
        })}
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {rating.toFixed(1)}
      </span>
      {totalRatings !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({totalRatings})
        </span>
      )}
    </div>
  );
}
