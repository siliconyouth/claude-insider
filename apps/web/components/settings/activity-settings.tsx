"use client";

/**
 * Activity Settings Component
 *
 * Displays user's activity stats and recent activity timeline
 * in the settings page.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { ActivityTimeline, ActivityStats } from "@/components/activity";
import { getOwnActivity, getActivityStats, type ActivityItem, type ActivityStats as ActivityStatsType } from "@/app/actions/user-activity";
import Link from "next/link";

export function ActivitySettings() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [activityResult, statsResult] = await Promise.all([
          getOwnActivity(showAll ? 100 : 10),
          getActivityStats(),
        ]);

        if (activityResult.success && activityResult.activities) {
          setActivities(activityResult.activities);
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [showAll]);

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      {stats && <ActivityStats stats={stats} showPrivate={true} />}

      {/* Recent Activity */}
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <div className="flex items-center gap-3">
            {activities.length > 0 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                {showAll ? "Show less" : "Show all"}
              </button>
            )}
            <Link
              href="/profile/stats"
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              View full stats
            </Link>
          </div>
        </div>

        <ActivityTimeline
          activities={activities}
          isLoading={isLoading}
          emptyMessage="No activity recorded yet. Start exploring!"
          compact={!showAll}
          showLoadMore={!showAll && activities.length >= 10}
          onLoadMore={() => setShowAll(true)}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/favorites"
          className={cn(
            "p-3 rounded-lg text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10",
            "transition-all"
          )}
        >
          <span className="text-lg">❤️</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            Favorites
          </p>
        </Link>

        <Link
          href="/reading-lists"
          className={cn(
            "p-3 rounded-lg text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10",
            "transition-all"
          )}
        >
          <span className="text-lg">📚</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            Reading Lists
          </p>
        </Link>

        <Link
          href="/profile/achievements"
          className={cn(
            "p-3 rounded-lg text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10",
            "transition-all"
          )}
        >
          <span className="text-lg">🏆</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            Achievements
          </p>
        </Link>

        <Link
          href="/profile"
          className={cn(
            "p-3 rounded-lg text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10",
            "transition-all"
          )}
        >
          <span className="text-lg">👤</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            View Profile
          </p>
        </Link>
      </div>
    </div>
  );
}

export default ActivitySettings;
