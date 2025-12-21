"use client";

/**
 * Achievement Progress Component
 *
 * Shows progress toward unearned achievements.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { TrophyIcon, ArrowRightIcon } from "lucide-react";

interface AchievementProgressItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
}

interface AchievementProgressProps {
  achievementsUnlocked: number;
  achievementsTotal: number;
  nextAchievements: AchievementProgressItem[];
  className?: string;
}

// Tier colors
const TIER_COLORS: Record<string, string> = {
  common: "from-gray-500 to-gray-400",
  rare: "from-blue-500 to-blue-400",
  epic: "from-purple-500 to-purple-400",
  legendary: "from-amber-500 to-amber-400",
};

export function AchievementProgress({
  achievementsUnlocked,
  achievementsTotal,
  nextAchievements,
  className,
}: AchievementProgressProps) {
  const overallProgress = Math.round(
    (achievementsUnlocked / achievementsTotal) * 100
  );

  return (
    <div
      className={cn(
        "rounded-xl p-6 bg-[#111111] border border-[#262626]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-white">
            Achievement Progress
          </h3>
        </div>
        <Link
          href="/profile/achievements"
          className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">
            {achievementsUnlocked} of {achievementsTotal} unlocked
          </span>
          <span className="font-medium text-white">{overallProgress}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Next achievements to earn */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-400">
          Almost There
        </h4>

        {nextAchievements.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No achievements in progress
          </p>
        ) : (
          <div className="space-y-3">
            {nextAchievements.map((achievement) => (
              <AchievementItem key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementItem({
  achievement,
}: {
  achievement: AchievementProgressItem;
}) {
  const tierColor = TIER_COLORS[achievement.tier] || TIER_COLORS.common;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      {/* Icon */}
      <div className="text-2xl flex-shrink-0">{achievement.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white truncate">
            {achievement.name}
          </span>
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              "bg-gradient-to-r text-white",
              tierColor
            )}
          >
            {achievement.tier}
          </span>
        </div>

        <p className="text-xs text-gray-400 mb-2 line-clamp-1">
          {achievement.description}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", tierColor)}
              style={{ width: `${achievement.percentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {achievement.currentProgress}/{achievement.targetProgress}
          </span>
        </div>
      </div>
    </div>
  );
}
