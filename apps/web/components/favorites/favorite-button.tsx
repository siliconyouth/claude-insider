"use client";

/**
 * Favorite Button Component
 *
 * Heart icon toggle for adding/removing favorites with optimistic updates.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { checkFavoriteStatus, toggleFavorite } from "@/lib/favorites";
import type { FavoriteResourceType, FavoriteStatus } from "@/types/favorites";

interface FavoriteButtonProps {
  resourceType: FavoriteResourceType;
  resourceId: string;
  resourceTitle?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
  onAuthRequired?: () => void;
}

export function FavoriteButton({
  resourceType,
  resourceId,
  resourceTitle,
  size = "md",
  showCount = false,
  className,
  onAuthRequired,
}: FavoriteButtonProps) {
  const [status, setStatus] = useState<FavoriteStatus>({
    isFavorited: false,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const toast = useToast();

  // Fetch initial status
  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const result = await checkFavoriteStatus(resourceType, resourceId);
        if (!cancelled) {
          setStatus(result);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [resourceType, resourceId]);

  const handleToggle = useCallback(async () => {
    if (isLoading || isAnimating) return;

    // Optimistic update
    const previousStatus = { ...status };
    const newIsFavorited = !status.isFavorited;

    setStatus({
      isFavorited: newIsFavorited,
      favoriteId: newIsFavorited ? status.favoriteId : undefined,
      count: status.count + (newIsFavorited ? 1 : -1),
    });

    // Trigger animation
    if (newIsFavorited) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }

    try {
      const result = await toggleFavorite(resourceType, resourceId, previousStatus);
      setStatus(result);

      // Show toast
      if (result.isFavorited) {
        toast.success(
          "Added to favorites",
          resourceTitle ? `${resourceTitle} saved` : undefined
        );
      } else {
        toast.info(
          "Removed from favorites",
          resourceTitle ? `${resourceTitle} removed` : undefined
        );
      }
    } catch (error) {
      // Revert on error
      setStatus(previousStatus);

      if (error instanceof Error && error.message.includes("Unauthorized")) {
        onAuthRequired?.();
        toast.warning("Sign in required", "Please sign in to save favorites");
      } else {
        toast.error("Failed to update", "Please try again");
      }
    }
  }, [status, isLoading, isAnimating, resourceType, resourceId, resourceTitle, toast, onAuthRequired]);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buttonSizeClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2",
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "relative group inline-flex items-center gap-1.5 rounded-lg",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0a0a]",
        buttonSizeClasses[size],
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={status.isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={status.isFavorited}
    >
      <span className="relative">
        {/* Background heart (outline) */}
        <svg
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            status.isFavorited
              ? "text-transparent"
              : "text-gray-500 dark:text-gray-400 group-hover:text-rose-400"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        {/* Filled heart (gradient) */}
        <svg
          className={cn(
            sizeClasses[size],
            "absolute inset-0 transition-all duration-200",
            status.isFavorited
              ? "opacity-100 scale-100"
              : "opacity-0 scale-75",
            isAnimating && "animate-favorite-pop"
          )}
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path
            fill="url(#heart-gradient)"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        {/* Burst particles on animation */}
        {isAnimating && (
          <span className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-rose-400 animate-burst"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `rotate(${i * 60}deg) translateY(-12px)`,
                  animationDelay: `${i * 30}ms`,
                }}
              />
            ))}
          </span>
        )}
      </span>

      {/* Count */}
      {showCount && status.count > 0 && (
        <span
          className={cn(
            "text-xs font-medium tabular-nums",
            status.isFavorited
              ? "text-rose-500 dark:text-rose-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {status.count}
        </span>
      )}
    </button>
  );
}

/**
 * Compact variant for use in lists/cards
 */
export function FavoriteButtonCompact({
  resourceType,
  resourceId,
  className,
  onAuthRequired,
}: Pick<FavoriteButtonProps, "resourceType" | "resourceId" | "className" | "onAuthRequired">) {
  return (
    <FavoriteButton
      resourceType={resourceType}
      resourceId={resourceId}
      size="sm"
      showCount={false}
      className={cn(
        "hover:bg-gray-100 dark:hover:bg-[#262626]",
        className
      )}
      onAuthRequired={onAuthRequired}
    />
  );
}
