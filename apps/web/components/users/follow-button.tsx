"use client";

/**
 * Follow Button Component
 *
 * Shows follow/unfollow button with optimistic updates.
 * Used on user profiles and follow lists.
 */

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { followUser, unfollowUser } from "@/app/actions/following";
import { useToast } from "@/components/toast";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  size = "md",
  variant = "primary",
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { isAuthenticated, showSignIn, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Don't show follow button for own profile
  if (user?.id === userId) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      showSignIn();
      return;
    }

    // Optimistic update
    const newIsFollowing = !isFollowing;
    setIsFollowing(newIsFollowing);
    onFollowChange?.(newIsFollowing);

    startTransition(async () => {
      const result = newIsFollowing
        ? await followUser(userId)
        : await unfollowUser(userId);

      if (result.error) {
        // Revert on error
        setIsFollowing(!newIsFollowing);
        onFollowChange?.(!newIsFollowing);
        toast.error(result.error);
      } else {
        toast.success(newIsFollowing ? "Now following" : "Unfollowed");
      }
    });
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "rounded-lg font-medium transition-all duration-200",
          "border border-gray-200 dark:border-[#262626]",
          "text-gray-700 dark:text-gray-300",
          "hover:border-red-500 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          className
        )}
      >
        {isPending ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            ...
          </span>
        ) : (
          "Following"
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "rounded-lg font-medium transition-all duration-200",
        variant === "primary" &&
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-500/25 hover:shadow-md hover:-translate-y-0.5",
        variant === "outline" &&
          "border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
        sizeClasses[size],
        className
      )}
    >
      {isPending ? (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          ...
        </span>
      ) : (
        "Follow"
      )}
    </button>
  );
}
