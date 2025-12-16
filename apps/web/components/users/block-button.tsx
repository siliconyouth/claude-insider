"use client";

/**
 * Block Button Component
 *
 * Button to block/unblock a user with confirmation.
 */

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { blockUser, unblockUser } from "@/app/actions/users";
import { useToast } from "@/components/toast";

interface BlockButtonProps {
  userId: string;
  initialIsBlocked?: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
  onBlock?: () => void;
  onUnblock?: () => void;
  className?: string;
}

export function BlockButton({
  userId,
  initialIsBlocked = false,
  size = "md",
  showLabel = false,
  onBlock,
  onUnblock,
  className,
}: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleBlock = () => {
    if (!isBlocked && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    startTransition(async () => {
      if (isBlocked) {
        const result = await unblockUser(userId);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setIsBlocked(false);
        toast.success("User unblocked");
        onUnblock?.();
      } else {
        const result = await blockUser(userId);
        if (result.error) {
          toast.error(result.error);
          setShowConfirm(false);
          return;
        }
        setIsBlocked(true);
        setShowConfirm(false);
        toast.success("User blocked");
        onBlock?.();
      }
    });
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Confirmation state
  if (showConfirm) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          onClick={handleBlock}
          disabled={isPending}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded",
            "bg-red-600 text-white",
            "hover:bg-red-700",
            "disabled:opacity-50"
          )}
        >
          {isPending ? "..." : "Confirm"}
        </button>
        <button
          onClick={handleCancel}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-600 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          )}
        >
          Cancel
        </button>
      </div>
    );
  }

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
  };

  const iconSize = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  return (
    <button
      onClick={handleBlock}
      disabled={isPending}
      title={isBlocked ? "Unblock user" : "Block user"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg transition-colors",
        sizeClasses[size],
        isBlocked
          ? "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isBlocked ? (
        // Unblock icon
        <svg
          className={iconSize[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ) : (
        // Block icon
        <svg
          className={iconSize[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {isPending ? "..." : isBlocked ? "Unblock" : "Block"}
        </span>
      )}
    </button>
  );
}
