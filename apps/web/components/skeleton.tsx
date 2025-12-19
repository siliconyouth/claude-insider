"use client";

import { cn } from "@/lib/design-system";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        "bg-gray-200 dark:bg-[#262626]",
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for text content
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-4/5" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card content
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl p-6",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <SkeletonText lines={2} />
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#262626]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for search results
 */
export function SkeletonSearchResult({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", className)}>
      <Skeleton className="h-6 w-6 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton for list items
 */
export function SkeletonList({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for documentation page
 */
export function SkeletonDocPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Title */}
      <Skeleton className="h-10 w-2/3" />

      {/* Reading time and metadata */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Content paragraphs */}
      <SkeletonText lines={4} />

      {/* Subheading */}
      <Skeleton className="h-7 w-1/2 mt-8" />

      {/* More content */}
      <SkeletonText lines={3} />

      {/* Code block */}
      <Skeleton className="h-32 w-full rounded-lg" />

      {/* More content */}
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Skeleton for the homepage hero
 */
export function SkeletonHero({ className }: { className?: string }) {
  return (
    <div className={cn("text-center space-y-6", className)}>
      <Skeleton className="h-12 w-64 mx-auto" />
      <div className="space-y-2 max-w-lg mx-auto">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5 mx-auto" />
      </div>
      <div className="flex gap-4 justify-center">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for navigation sidebar
 */
export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Section 1 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-1 pl-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>
      {/* Section 2 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-1 pl-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>
      {/* Section 3 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-1 pl-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton wrapper with loading state
 */
export function SkeletonWrapper({
  isLoading,
  skeleton,
  children,
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
}

/**
 * Inline skeleton for buttons and small elements
 */
export function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-24 rounded-lg", className)} />
  );
}

/**
 * Skeleton for avatar/profile pictures
 */
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
    />
  );
}

/**
 * Skeleton for profile pages (hero cover design)
 *
 * Matches the new profile design with:
 * - Hero cover section (3:1 aspect ratio)
 * - Profile info overlay at bottom of cover
 * - Bio/info section
 * - Stats bar
 * - Achievement section
 * - Optional content tabs
 */
export function SkeletonProfile({
  showTabs = false,
  className,
}: {
  showTabs?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-5xl mx-auto px-4", className)}>
      {/* Main Profile Card */}
      <div
        className={cn(
          "bg-white dark:bg-[#111111] rounded-2xl",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-xl shadow-black/5 dark:shadow-black/20",
          "mb-6 overflow-hidden"
        )}
      >
        {/* Hero Cover Skeleton - matches aspect-[3/1] */}
        <div className="relative w-full aspect-[2.5/1] sm:aspect-[3/1]">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 animate-pulse" />

          {/* Gradient overlay (mimics the real cover overlay) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Profile Info Overlay Skeleton */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 animate-pulse">
              {/* Avatar */}
              <div
                className={cn(
                  "w-24 h-24 sm:w-28 sm:h-28 rounded-full",
                  "bg-gray-300/50 dark:bg-gray-700/50",
                  "border-4 border-white/20"
                )}
              />

              {/* Name, badges, bio, and social */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                {/* Name + badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <div className="h-8 w-40 bg-white/20 rounded-lg" />
                  <div className="h-5 w-16 bg-white/20 rounded-full" />
                </div>
                {/* Username + followers */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div className="h-4 w-24 bg-white/20 rounded" />
                  <div className="h-4 w-32 bg-white/20 rounded" />
                </div>
                {/* Bio */}
                <div className="h-4 w-3/4 max-w-md bg-white/15 rounded" />
                {/* Joined + social links */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div className="h-3 w-28 bg-white/15 rounded" />
                  <div className="flex gap-1">
                    <div className="h-7 w-7 bg-white/10 rounded-lg" />
                    <div className="h-7 w-7 bg-white/10 rounded-lg" />
                    <div className="h-7 w-7 bg-white/10 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-10 w-28 bg-white/30 rounded-xl" />
                <div className="h-10 w-10 bg-white/20 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar Skeleton */}
        <div className="border-t border-gray-200 dark:border-[#262626] px-6 sm:px-8 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <div className="h-7 w-12 mx-auto bg-gray-200 dark:bg-[#1a1a1a] rounded mb-1" />
                <div className="h-3 w-16 mx-auto bg-gray-200 dark:bg-[#1a1a1a] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Section Skeleton */}
      <div
        className={cn(
          "bg-white dark:bg-[#111111] rounded-2xl",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden mb-6"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626] animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-yellow-200 dark:bg-yellow-900/30 rounded" />
            <div className="h-5 w-28 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
          </div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
        </div>
        <div className="p-4 animate-pulse">
          {/* Achievement icon grid */}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#1a1a1a]"
              />
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#1a1a1a] rounded-full" />
              <div className="h-3 w-8 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs Skeleton (optional for private profile) */}
      {showTabs && (
        <div
          className={cn(
            "bg-white dark:bg-[#111111] rounded-2xl",
            "border border-gray-200 dark:border-[#262626]",
            "overflow-hidden mb-12"
          )}
        >
          {/* Tab header */}
          <div className="flex gap-2 px-6 pt-4 border-b border-gray-200 dark:border-[#262626] animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-4 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
              </div>
            ))}
          </div>
          {/* Tab content */}
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 dark:bg-[#0a0a0a] rounded-xl"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
