"use client";

/**
 * Profile Activity Chart Component
 *
 * Compact visualization of user activity breakdown for profile pages.
 * Shows favorites, collections, comments, and suggestions in a donut chart.
 */

import { useMemo } from "react";
import { cn } from "@/lib/design-system";
import { LazyDonutChart, type ChartDataPoint } from "@/components/dashboard/charts";

interface ProfileStats {
  favorites: number;
  collections: number;
  comments: number;
  suggestions: number;
}

interface Achievement {
  id: string;
  unlockedAt: string;
}

interface ProfileActivityChartProps {
  stats: ProfileStats;
  achievementPoints: number;
  achievements?: Achievement[];
  className?: string;
}

// Activity type colors
const ACTIVITY_COLORS = {
  favorites: "#8b5cf6", // violet
  collections: "#3b82f6", // blue
  comments: "#06b6d4", // cyan
  suggestions: "#22c55e", // green
};

// Achievement rarity tiers (should match lib/achievements.ts)
const RARITY_COLORS = {
  common: "#6b7280", // gray
  rare: "#3b82f6", // blue
  epic: "#8b5cf6", // violet
  legendary: "#f59e0b", // amber
};

export function ProfileActivityChart({
  stats,
  achievementPoints,
  achievements = [],
  className,
}: ProfileActivityChartProps) {
  // Calculate total activity
  const totalActivity = stats.favorites + stats.collections + stats.comments + stats.suggestions;

  // Prepare activity chart data
  const activityData: ChartDataPoint[] = useMemo(() => {
    const data: ChartDataPoint[] = [];

    if (stats.favorites > 0) {
      data.push({ name: "Favorites", value: stats.favorites, color: ACTIVITY_COLORS.favorites });
    }
    if (stats.collections > 0) {
      data.push({ name: "Collections", value: stats.collections, color: ACTIVITY_COLORS.collections });
    }
    if (stats.comments > 0) {
      data.push({ name: "Comments", value: stats.comments, color: ACTIVITY_COLORS.comments });
    }
    if (stats.suggestions > 0) {
      data.push({ name: "Suggestions", value: stats.suggestions, color: ACTIVITY_COLORS.suggestions });
    }

    return data;
  }, [stats]);

  // No activity yet
  if (totalActivity === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Activity Breakdown */}
      <div className="flex items-center gap-4">
        <LazyDonutChart
          data={activityData}
          size={100}
          innerRadius={28}
          outerRadius={42}
          centerLabel={{
            value: totalActivity,
            label: "Total",
          }}
          expandOnHover
        />
        <div className="flex-1 space-y-1.5">
          {activityData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Points Progress */}
      {achievementPoints > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Achievement Points
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {achievementPoints.toLocaleString()}
            </span>
          </div>
          {/* Progress bar to next milestone */}
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((achievementPoints % 1000) / 10, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            {1000 - (achievementPoints % 1000)} points to next milestone
          </p>
        </div>
      )}

      {/* Achievements count with rarity hint */}
      {achievements.length > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Achievements Unlocked
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {achievements.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
