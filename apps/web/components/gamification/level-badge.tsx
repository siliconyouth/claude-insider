"use client";

/**
 * Level Badge Component
 *
 * Displays user's current level with icon and progress bar.
 */

import { cn } from "@/lib/design-system";
import { getLevelProgress, type Level } from "@/lib/gamification";

interface LevelBadgeProps {
  points: number;
  className?: string;
  variant?: "default" | "compact" | "full";
  showProgress?: boolean;
}

export function LevelBadge({
  points,
  className,
  variant = "default",
  showProgress = true,
}: LevelBadgeProps) {
  const { current, next, progress, pointsToNext } = getLevelProgress(points);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
          "bg-gray-100 dark:bg-gray-800",
          "border border-gray-200 dark:border-[#262626]",
          className
        )}
        title={`Level ${current.level}: ${current.name}`}
      >
        <span className="text-sm">{current.icon}</span>
        <span className={cn("text-xs font-medium", current.color)}>Lv.{current.level}</span>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]", className)}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
              "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            {current.icon}
          </div>
          <div>
            <div className={cn("font-semibold", current.color)}>{current.name}</div>
            <div className="text-sm text-gray-500">Level {current.level}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-bold text-gray-900 dark:text-white">{points.toLocaleString()}</div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>

        {showProgress && next && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">Next: {next.name}</span>
              <span className="text-gray-500">{pointsToNext.toLocaleString()} points to go</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!next && (
          <div className="text-sm text-center text-cyan-500 font-medium">
            Maximum level reached! 🎉
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-lg",
          "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        {current.icon}
      </div>
      <div>
        <div className={cn("text-sm font-medium leading-tight", current.color)}>{current.name}</div>
        {showProgress && next && (
          <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
