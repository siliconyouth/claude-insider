"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { toggleFavorite } from "@/app/actions/favorites";
import { useToast } from "@/components/toast";

interface FavoriteButtonProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  initialIsFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
  className?: string;
}

export function FavoriteButton({
  resourceType,
  resourceId,
  initialIsFavorited = false,
  size = "md",
  showCount = false,
  count = 0,
  className,
}: FavoriteButtonProps) {
  const { isAuthenticated, showSignIn } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [displayCount, setDisplayCount] = useState(count);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to save favorites");
      showSignIn();
      return;
    }

    // Optimistic update
    const newFavorited = !isFavorited;
    setIsFavorited(newFavorited);
    if (showCount) {
      setDisplayCount((prev) => (newFavorited ? prev + 1 : Math.max(0, prev - 1)));
    }

    startTransition(async () => {
      const result = await toggleFavorite(resourceType, resourceId);

      if (result.error) {
        // Revert on error
        setIsFavorited(isFavorited);
        if (showCount) {
          setDisplayCount(count);
        }
        toast.error(result.error);
      }
    });
  };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        sizeClasses[size],
        isPending && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorited}
    >
      <svg
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          isFavorited
            ? "fill-red-500 text-red-500 scale-110"
            : "fill-none text-gray-400 hover:text-red-500"
        )}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && displayCount > 0 && (
        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
          {displayCount}
        </span>
      )}
    </button>
  );
}
