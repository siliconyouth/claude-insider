"use client";

/**
 * Activity Feed Page
 *
 * Shows activity from users you follow.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";

interface ActivityItem {
  id: string;
  type: "comment" | "suggestion" | "collection";
  content: string;
  resourceType?: string;
  resourceId?: string;
  resourceTitle?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

export default function FeedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchActivities = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await fetch(`/api/feed?limit=${limit}&offset=${currentOffset}`);
      const data = await res.json();

      if (res.ok) {
        const newActivities = data.activities || [];
        if (reset) {
          setActivities(newActivities);
          setOffset(limit);
        } else {
          setActivities((prev) => [...prev, ...newActivities]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(newActivities.length === limit);
      }
    } catch (error) {
      console.error("Failed to load feed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities(true);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchActivities();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "comment":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "suggestion":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case "collection":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "comment":
        return "commented on";
      case "suggestion":
        return "suggested an edit to";
      case "collection":
        return "created a collection";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Show sign-in prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-600/20 via-blue-600/20 to-cyan-600/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Activity Feed
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Sign in to see activity from people you follow. Discover comments, suggestions, and collections from the community.
          </p>
          <Link
            href="/auth/signin"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            Sign In
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Activity Feed
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Recent activity from people you follow
        </p>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "p-4 rounded-xl animate-pulse",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1a1a1a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No activity yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Follow some users to see their activity here.
          </p>
          <Link
            href="/users"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:border-blue-500/50 transition-colors"
            )}
          >
            Discover Users
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "hover:border-blue-500/30 transition-colors"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Link
                  href={activity.user.username ? `/users/${activity.user.username}` : "#"}
                  className="flex-shrink-0"
                >
                  {activity.user.image ? (
                    <img
                      src={activity.user.image}
                      alt={activity.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                        "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white"
                      )}
                    >
                      {activity.user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={activity.user.username ? `/users/${activity.user.username}` : "#"}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400"
                    >
                      {activity.user.name}
                    </Link>
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                      {getActivityIcon(activity.type)}
                      {getActivityText(activity)}
                    </span>
                    {activity.resourceTitle && (
                      <span className="text-blue-600 dark:text-cyan-400 text-sm font-medium truncate">
                        {activity.resourceTitle}
                      </span>
                    )}
                  </div>

                  {activity.content && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {activity.content}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-700 dark:text-gray-300",
                  "hover:border-blue-500/50 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
