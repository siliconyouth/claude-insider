"use client";

/**
 * Achievements Showcase Component
 *
 * Displays featured achievements on user profiles.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { AchievementBadge } from "./achievement-badge";
import {
  getFeaturedAchievements,
  getAchievementStats,
  type UserAchievement,
} from "@/app/actions/achievements";

interface AchievementsShowcaseProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function AchievementsShowcase({
  userId,
  isOwnProfile = false,
}: AchievementsShowcaseProps) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState({ total: 0, points: 0, rank: "Newcomer" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      setIsLoading(true);
      const [achievementsResult, statsResult] = await Promise.all([
        getFeaturedAchievements(userId),
        getAchievementStats(userId),
      ]);

      if (achievementsResult.data) {
        setAchievements(achievementsResult.data);
      }
      setStats(statsResult);
      setIsLoading(false);
    }

    loadAchievements();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-full" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#1a1a1a]"
            />
          ))}
        </div>
      </div>
    );
  }

  // Don't show section if no achievements and not own profile
  if (!isOwnProfile && stats.total === 0) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Achievements
          </h3>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              "bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30",
              "text-violet-600 dark:text-violet-400"
            )}
          >
            {stats.total} earned · {stats.points} pts
          </span>
        </div>
        {isOwnProfile && (
          <Link
            href="/profile/achievements"
            className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Rank Badge */}
      {stats.total > 0 && (
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <svg
            className="w-4 h-4 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {stats.rank}
          </span>
        </div>
      )}

      {/* Featured Achievements */}
      {achievements.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              name={achievement.name}
              description={achievement.description}
              icon={achievement.icon}
              tier={achievement.tier}
              points={achievement.points}
              earnedAt={achievement.earnedAt}
              isFeatured={achievement.isFeatured}
              size="md"
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "text-center py-8 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          {isOwnProfile ? (
            <>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                No featured achievements yet
              </p>
              <Link
                href="/profile/achievements"
                className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Manage achievements
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No achievements to display
            </p>
          )}
        </div>
      )}
    </div>
  );
}
