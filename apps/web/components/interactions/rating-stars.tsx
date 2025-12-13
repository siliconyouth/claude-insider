"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { submitRating } from "@/app/actions/ratings";
import { useToast } from "@/components/toast";

interface RatingStarsProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  initialRating?: number;
  averageRating?: number;
  totalRatings?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showAverage?: boolean;
  className?: string;
}

export function RatingStars({
  resourceType,
  resourceId,
  initialRating = 0,
  averageRating,
  totalRatings,
  readonly = false,
  size = "md",
  showAverage = true,
  className,
}: RatingStarsProps) {
  const { isAuthenticated, showSignIn } = useAuth();
  const [userRating, setUserRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleRate = (value: number) => {
    if (readonly) return;

    if (!isAuthenticated) {
      toast.info("Sign in to rate resources");
      showSignIn();
      return;
    }

    // Optimistic update
    const previousRating = userRating;
    setUserRating(value);

    startTransition(async () => {
      const result = await submitRating(resourceType, resourceId, value);

      if (result.error) {
        // Revert on error
        setUserRating(previousRating);
        toast.error(result.error);
      } else {
        toast.success(`Rated ${value} star${value > 1 ? "s" : ""}`);
      }
    });
  };

  // Display rating: hover > user rating > average
  const displayRating = hoverRating || userRating || averageRating || 0;

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  };

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      <div className={cn("flex", gapClasses[size])} role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayRating;
          const isHalf = value - 0.5 <= displayRating && value > displayRating;

          return (
            <button
              key={value}
              onClick={() => handleRate(value)}
              onMouseEnter={() => !readonly && setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={readonly || isPending}
              className={cn(
                "transition-all duration-150",
                !readonly && "cursor-pointer hover:scale-110",
                readonly && "cursor-default",
                isPending && "opacity-50"
              )}
              aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            >
              <svg
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-150",
                  isFilled || isHalf
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-300 dark:text-gray-600"
                )}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {showAverage && (averageRating !== undefined || totalRatings !== undefined) && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          {averageRating !== undefined && (
            <span className="font-medium">{averageRating.toFixed(1)}</span>
          )}
          {totalRatings !== undefined && totalRatings > 0 && (
            <span className="text-xs">({totalRatings})</span>
          )}
        </div>
      )}
    </div>
  );
}
