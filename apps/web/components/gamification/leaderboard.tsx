"use client";

/**
 * Leaderboard Component
 *
 * Displays top users by points with ranks and levels.
 */

import { cn } from "@/lib/design-system";
import { getLevelFromPoints, type LeaderboardEntry } from "@/lib/gamification";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
  variant?: "default" | "compact";
  title?: string;
}

export function Leaderboard({
  entries,
  currentUserId,
  className,
  variant = "default",
  title = "Leaderboard",
}: LeaderboardProps) {
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: "🥇", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" };
      case 2:
        return { icon: "🥈", color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/50" };
      case 3:
        return { icon: "🥉", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" };
      default:
        return { icon: `#${rank}`, color: "text-gray-500", bg: "" };
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="space-y-1">
          {entries.slice(0, 5).map((entry) => {
            const rank = getRankDisplay(entry.rank);
            const level = getLevelFromPoints(entry.points);
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                  isCurrentUser && "bg-blue-50 dark:bg-blue-900/20",
                  rank.bg
                )}
              >
                <span className={cn("w-6 text-center text-sm font-medium", rank.color)}>
                  {entry.rank <= 3 ? rank.icon : rank.icon}
                </span>
                <span className="text-sm">{level.icon}</span>
                <span
                  className={cn(
                    "flex-1 text-sm truncate",
                    isCurrentUser ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {entry.username}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {entry.points.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "rounded-xl bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "overflow-hidden",
        className
      )}
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map((entry) => {
          const rank = getRankDisplay(entry.rank);
          const level = getLevelFromPoints(entry.points);
          const isCurrentUser = entry.user_id === currentUserId;

          return (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                "transition-colors",
                isCurrentUser && "bg-blue-50 dark:bg-blue-900/20",
                rank.bg
              )}
            >
              {/* Rank */}
              <div className={cn("w-8 text-center font-bold", rank.color)}>
                {entry.rank <= 3 ? (
                  <span className="text-xl">{rank.icon}</span>
                ) : (
                  <span className="text-sm">{rank.icon}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (entry.username[0] || "?").toUpperCase()
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium truncate",
                      isCurrentUser
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    )}
                  >
                    {entry.username}
                  </span>
                  <span className="text-sm">{level.icon}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={level.color}>Lv.{level.level}</span>
                  {entry.streak > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span>🔥</span>
                      <span>{entry.streak}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-white">
                  {entry.points.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">
          No entries yet. Be the first!
        </div>
      )}
    </div>
  );
}
