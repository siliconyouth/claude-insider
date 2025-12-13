"use client";

/**
 * Native Share Button
 *
 * Uses Web Share API when available, falls back to copy link.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface NativeShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function NativeShareButton({
  url,
  title,
  text,
  className,
  variant = "secondary",
  size = "md",
  showLabel = true,
}: NativeShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return !!navigator.share;
  });

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || (typeof document !== "undefined" ? document.title : "");

  const handleShare = useCallback(async () => {
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: text,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
          // Fall back to copy
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShare, shareTitle, text, shareUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-base gap-2",
  };

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
      "text-white shadow-lg shadow-blue-500/25",
      "hover:-translate-y-0.5"
    ),
    secondary: cn(
      "bg-gray-100 dark:bg-gray-800",
      "text-gray-700 dark:text-gray-300",
      "border border-gray-200 dark:border-[#262626]",
      "hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
    ),
    ghost: cn(
      "text-gray-600 dark:text-gray-400",
      "hover:bg-gray-100 dark:hover:bg-gray-800",
      "hover:text-gray-900 dark:hover:text-gray-200"
    ),
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      onClick={handleShare}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={copied ? "Link copied!" : "Share"}
    >
      {copied ? (
        <>
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {showLabel && <span>Copied!</span>}
        </>
      ) : (
        <>
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {showLabel && <span>{canShare ? "Share" : "Copy Link"}</span>}
        </>
      )}
    </button>
  );
}
