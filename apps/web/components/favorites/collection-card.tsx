"use client";

/**
 * Collection Card Component
 *
 * Displays a collection preview with icon, name, and item count.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import type { CollectionWithCount, CollectionIcon } from "@/types/favorites";
import { COLLECTION_COLOR_STYLES } from "@/types/favorites";

interface CollectionCardProps {
  collection: CollectionWithCount;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Icon components for collections
 */
const CollectionIconComponent = ({ icon, className }: { icon: CollectionIcon; className?: string }) => {
  const iconClasses = cn("w-5 h-5", className);

  switch (icon) {
    case "folder":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "star":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      );
    case "heart":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "code":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case "book":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case "zap":
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
  }
};

export function CollectionCard({
  collection,
  variant = "default",
  className,
}: CollectionCardProps) {
  const colorStyles = COLLECTION_COLOR_STYLES[collection.color] || COLLECTION_COLOR_STYLES.blue;

  if (variant === "compact") {
    return (
      <Link
        href={`/favorites/collections/${collection.slug}`}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg",
          "border border-gray-200 dark:border-[#262626]",
          "hover:border-blue-500/50 dark:hover:border-blue-500/50",
          "transition-all duration-200",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            colorStyles.bg,
            colorStyles.text
          )}
        >
          <CollectionIconComponent icon={collection.icon} className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {collection.name}
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {collection.itemCount}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/favorites/collections/${collection.slug}`}
      className={cn(
        "group block p-4 rounded-xl",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "hover:border-blue-500/50 dark:hover:border-blue-500/50",
        "hover:shadow-lg hover:-translate-y-0.5",
        "transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            "transition-transform duration-200 group-hover:scale-105",
            colorStyles.bg,
            colorStyles.border,
            "border",
            colorStyles.text
          )}
        >
          <CollectionIconComponent icon={collection.icon} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {collection.name}
          </h3>
          {collection.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {collection.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="tabular-nums">
              {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
            </span>
            {collection.isPublic && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Public
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Skeleton loading state for collection card
 */
export function CollectionCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#262626]">
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#262626] animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
        </div>
        <div className="h-3 w-4 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#262626] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
