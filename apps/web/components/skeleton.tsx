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
