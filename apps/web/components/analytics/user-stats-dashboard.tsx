"use client";

/**
 * User Stats Dashboard Component
 *
 * Display personal activity statistics.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getUserActivityStats, getUserReadingActivity } from "@/app/actions/analytics";
import { ActivityChart } from "./activity-chart";
import type { UserActivityStats } from "@/app/actions/analytics";

interface UserStatsDashboardProps {
  className?: string;
}

export function UserStatsDashboard({ className }: UserStatsDashboardProps) {
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [activity, setActivity] = useState<Array<{ date: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [statsResult, activityResult] = await Promise.all([
      getUserActivityStats(),
      getUserReadingActivity(30),
    ]);
    if (statsResult.stats) {
      setStats(statsResult.stats);
    }
    if (activityResult.activity) {
      setActivity(activityResult.activity);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
     
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-[#111111] rounded-xl" />
          ))}
        </div>
        <div className="animate-pulse h-32 bg-gray-100 dark:bg-[#111111] rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load stats. Please try again.
        </p>
      </div>
    );
  }

  const statItems = [
    {
      label: "Comments",
      value: stats.comments_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      href: "/profile?tab=comments",
      color: "#3b82f6",
    },
    {
      label: "Suggestions",
      value: stats.suggestions_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      href: "/suggestions",
      color: "#8b5cf6",
    },
    {
      label: "Favorites",
      value: stats.favorites_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      href: "/favorites",
      color: "#ef4444",
    },
    {
      label: "Collections",
      value: stats.collections_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      href: "/favorites/collections",
      color: "#06b6d4",
    },
    {
      label: "Reading Lists",
      value: stats.reading_lists_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      ),
      href: "/reading-lists",
      color: "#10b981",
    },
    {
      label: "Items Read",
      value: stats.items_read_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: "/reading-lists",
      color: "#22c55e",
    },
    {
      label: "Followers",
      value: stats.followers_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      href: "/profile?tab=followers",
      color: "#f59e0b",
    },
    {
      label: "Achievements",
      value: stats.achievements_count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      ),
      href: "/profile/achievements",
      color: "#ec4899",
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "rounded-xl p-4",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]",
              "hover:border-gray-300 dark:hover:border-[#333]",
              "transition-all duration-200"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div style={{ color: item.color }}>{item.icon}</div>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Activity chart */}
      <div
        className={cn(
          "rounded-xl p-5",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <ActivityChart
          data={activity}
          label="Reading Activity (Last 30 Days)"
          color="#3b82f6"
          height={120}
        />
      </div>

      {/* Member since */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Member since {new Date(stats.joined_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  );
}
