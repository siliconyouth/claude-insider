"use client";

/**
 * Popular Resources Component
 *
 * Display trending/popular resources.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getPopularResources, getTrendingResources } from "@/app/actions/analytics";
import type { PopularResource } from "@/app/actions/analytics";

interface PopularResourcesProps {
  type?: "popular" | "trending";
  resourceType?: string;
  limit?: number;
  className?: string;
}

export function PopularResources({
  type = "popular",
  resourceType,
  limit = 5,
  className,
}: PopularResourcesProps) {
  const [resources, setResources] = useState<PopularResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    let result;
    if (type === "trending") {
      result = await getTrendingResources(limit);
    } else {
      result = await getPopularResources({
        resourceType,
        period: "week",
        limit,
      });
    }
    if (result.resources) {
      setResources(result.resources);
    }
    setIsLoading(false);
  }, [type, resourceType, limit]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(limit)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-[#111111]"
          >
            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">
          No {type} content yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {resources.map((resource, index) => (
        <Link
          key={`${resource.resource_type}-${resource.resource_id}`}
          href={resource.url}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            "bg-gray-50 dark:bg-[#111111]",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
            "transition-colors"
          )}
        >
          {/* Rank */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold",
              index === 0 && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
              index === 1 && "bg-gray-100 dark:bg-gray-800 text-gray-500",
              index === 2 && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
              index > 2 && "bg-gray-100 dark:bg-gray-800 text-gray-400"
            )}
          >
            {index + 1}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {resource.title || resource.resource_id}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {resource.resource_type}
            </p>
          </div>

          {/* Views */}
          <div className="flex-shrink-0 text-right">
            <p className="font-semibold text-gray-900 dark:text-white">
              {resource.views_week.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              this week
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/**
 * Trending badge component
 */
export function TrendingBadge({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  if (rank > 10) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        rank <= 3
          ? "bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 text-white"
          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-3 h-3"
      >
        <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
      #{rank}
    </span>
  );
}
