"use client";

/**
 * Activity Timeline Component
 *
 * Displays a chronological list of user activities with icons,
 * timestamps, and links to related content.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import type { ActivityItem, ActivityType } from "@/app/actions/user-activity";

// Simple relative time formatter (no external deps)
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? "s" : ""} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? "s" : ""} ago`;
}

function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  compact?: boolean;
}

// Activity type configurations
const activityConfig: Record<ActivityType, { icon: string; color: string; bgColor: string }> = {
  view_doc: { icon: "📄", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  view_resource: { icon: "📦", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  search: { icon: "🔍", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  favorite: { icon: "❤️", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
  unfavorite: { icon: "💔", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  rate: { icon: "⭐", color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  comment: { icon: "💬", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  comment_reply: { icon: "↩️", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  collection_create: { icon: "📁", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  collection_add: { icon: "➕", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  achievement_earned: { icon: "🏆", color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  report_submitted: { icon: "🚩", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  follow: { icon: "👤", color: "text-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  followed_by: { icon: "🎉", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  reading_list_create: { icon: "📚", color: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  profile_update: { icon: "✏️", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  account_created: { icon: "🎂", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
};

function ActivityIcon({ type }: { type: ActivityType }) {
  const config = activityConfig[type] || activityConfig.view_doc;

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm",
        config.bgColor
      )}
    >
      {config.icon}
    </div>
  );
}

function formatActivityDate(dateString: string): { relative: string; absolute: string } {
  return {
    relative: formatRelativeTime(dateString),
    absolute: formatAbsoluteDate(dateString),
  };
}

export function ActivityTimeline({
  activities,
  isLoading = false,
  showLoadMore = false,
  onLoadMore,
  emptyMessage = "No activity yet",
  compact = false,
}: ActivityTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <div className="space-y-6">
      {(Object.entries(groupedActivities) as [string, ActivityItem[]][]).map(([date, dateActivities]) => (
        <div key={date}>
          {/* Date header */}
          {!compact && (
            <div className="sticky top-0 bg-white dark:bg-[#0a0a0a] py-2 z-10">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Activities for this date */}
          <div className={cn("space-y-3", compact ? "space-y-2" : "")}>
            {dateActivities.map((activity: ActivityItem) => {
              const { relative, absolute } = formatActivityDate(activity.createdAt);
              const isExpanded = expandedItems.has(activity.id);
              const config = activityConfig[activity.type] || activityConfig.view_doc;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex gap-3 group",
                    compact ? "items-center" : "items-start"
                  )}
                >
                  {/* Icon */}
                  <ActivityIcon type={activity.type} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Title */}
                      {activity.link ? (
                        <Link
                          href={activity.link}
                          className={cn(
                            "font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors",
                            compact ? "text-sm" : ""
                          )}
                        >
                          {activity.title}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            "font-medium text-gray-900 dark:text-white",
                            compact ? "text-sm" : ""
                          )}
                        >
                          {activity.title}
                        </span>
                      )}

                      {/* Rating stars */}
                      {activity.type === "rate" && activity.metadata?.rating != null && (
                        <span className="text-yellow-500">
                          {"★".repeat(Number(activity.metadata.rating))}
                          {"☆".repeat(5 - Number(activity.metadata.rating))}
                        </span>
                      )}

                      {/* Achievement tier badge */}
                      {activity.type === "achievement_earned" && activity.metadata?.tier != null && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-xs rounded font-medium",
                            String(activity.metadata.tier) === "platinum"
                              ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                              : String(activity.metadata.tier) === "gold"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : String(activity.metadata.tier) === "silver"
                              ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          )}
                        >
                          {String(activity.metadata.tier).charAt(0).toUpperCase() +
                            String(activity.metadata.tier).slice(1)}
                        </span>
                      )}

                      {/* Report status badge */}
                      {activity.type === "report_submitted" && activity.metadata?.status != null && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-xs rounded font-medium",
                            String(activity.metadata.status) === "action_taken"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : String(activity.metadata.status) === "dismissed"
                              ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              : String(activity.metadata.status) === "investigating"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}
                        >
                          {String(activity.metadata.status).replace("_", " ")}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {activity.description && !compact && (
                      <p
                        className={cn(
                          "text-sm text-gray-600 dark:text-gray-400 mt-0.5",
                          !isExpanded && activity.description.length > 100 ? "line-clamp-2" : ""
                        )}
                      >
                        {activity.description}
                        {activity.description.length > 100 && (
                          <button
                            onClick={() => toggleExpand(activity.id)}
                            className="ml-1 text-blue-600 dark:text-cyan-400 hover:underline"
                          >
                            {isExpanded ? "less" : "more"}
                          </button>
                        )}
                      </p>
                    )}

                    {/* Timestamp */}
                    <p
                      className="text-xs text-gray-500 dark:text-gray-500 mt-0.5"
                      title={absolute}
                    >
                      {relative}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Load more */}
      {showLoadMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// ACTIVITY STATS COMPONENT
// ============================================

interface ActivityStatsProps {
  stats: {
    totalComments: number;
    totalFavorites: number;
    totalRatings: number;
    totalCollections: number;
    totalAchievements: number;
    totalReports: number;
    totalFollowing: number;
    totalFollowers: number;
    memberSince: string;
    lastActive?: string;
  };
  showPrivate?: boolean;
}

export function ActivityStats({ stats, showPrivate = false }: ActivityStatsProps) {
  const publicStats = [
    { label: "Comments", value: stats.totalComments, icon: "💬" },
    { label: "Ratings", value: stats.totalRatings, icon: "⭐" },
    { label: "Collections", value: stats.totalCollections, icon: "📁" },
    { label: "Achievements", value: stats.totalAchievements, icon: "🏆" },
    { label: "Following", value: stats.totalFollowing, icon: "👤" },
    { label: "Followers", value: stats.totalFollowers, icon: "🎉" },
  ];

  const privateStats = [
    { label: "Favorites", value: stats.totalFavorites, icon: "❤️" },
    { label: "Reports", value: stats.totalReports, icon: "🚩" },
  ];

  const displayStats = showPrivate ? [...publicStats, ...privateStats] : publicStats;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {displayStats.map((stat) => (
        <div
          key={stat.label}
          className="p-3 rounded-lg bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{stat.icon}</span>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Member since */}
      {stats.memberSince && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(stats.memberSince).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Member since</p>
            </div>
          </div>
        </div>
      )}

      {/* Last active */}
      {showPrivate && stats.lastActive && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatRelativeTime(stats.lastActive)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;
