"use client";

/**
 * Streak Indicator Component
 *
 * Shows current streak with fire animation and bonus info.
 */

import { cn } from "@/lib/design-system";
import { getStreakBonus, streakMilestones } from "@/lib/gamification";

interface StreakIndicatorProps {
  streak: number;
  longestStreak?: number;
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function StreakIndicator({
  streak,
  longestStreak,
  className,
  variant = "default",
}: StreakIndicatorProps) {
  const { bonus, milestone } = getStreakBonus(streak);
  const nextMilestone = streakMilestones.find((m) => m.days > streak);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full",
          streak > 0
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500",
          className
        )}
        title={`${streak} day streak${bonus > 0 ? ` (+${bonus}% bonus)` : ""}`}
      >
        <span className={cn("text-sm", streak > 0 && "animate-pulse")}>🔥</span>
        <span className="text-xs font-semibold">{streak}</span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "p-4 rounded-xl",
          "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
          "border border-orange-200 dark:border-orange-800/50",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                "bg-gradient-to-br from-orange-400 to-amber-500",
                streak > 0 && "animate-pulse"
              )}
            >
              🔥
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {streak} {streak === 1 ? "Day" : "Days"}
              </div>
              <div className="text-sm text-gray-500">Current Streak</div>
            </div>
          </div>
          {bonus > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                +{bonus}%
              </div>
              <div className="text-xs text-gray-500">Point Bonus</div>
            </div>
          )}
        </div>

        {milestone && (
          <div className="mb-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-center">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {milestone.badge} (+{milestone.bonus} bonus points!)
            </span>
          </div>
        )}

        {nextMilestone && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Next milestone</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {nextMilestone.days - streak} days to {nextMilestone.badge}
            </span>
          </div>
        )}

        {longestStreak !== undefined && longestStreak > streak && (
          <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800/50 flex items-center justify-between text-sm">
            <span className="text-gray-500">Personal best</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{longestStreak} days</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
          "bg-gradient-to-br from-orange-400 to-amber-500",
          streak > 0 && "animate-pulse"
        )}
      >
        🔥
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white">
          {streak} {streak === 1 ? "Day" : "Days"}
        </div>
        {bonus > 0 && (
          <div className="text-xs text-orange-600 dark:text-orange-400">+{bonus}% bonus</div>
        )}
      </div>
    </div>
  );
}
