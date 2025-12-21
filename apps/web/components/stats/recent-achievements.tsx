"use client";

/**
 * Recent Achievements Component
 *
 * Feed of recently unlocked achievements across the community.
 */

import { cn } from "@/lib/design-system";
import { formatDistanceToNow } from "date-fns";
import { TrophyIcon } from "lucide-react";

interface Achievement {
  obfuscatedUserId: string;
  username: string;
  avatar: string | null;
  achievementName: string;
  achievementIcon: string;
  unlockedAt: string;
}

interface RecentAchievementsProps {
  achievements: Achievement[];
  className?: string;
}

export function RecentAchievements({
  achievements,
  className,
}: RecentAchievementsProps) {
  if (achievements.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl p-6 bg-[#111111] border border-[#262626]",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrophyIcon className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-white">
            Recent Achievements
          </h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          No recent achievements yet
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl p-6 bg-[#111111] border border-[#262626]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrophyIcon className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Recent Achievements
        </h3>
      </div>

      {/* Achievement list */}
      <div className="space-y-3">
        {achievements.map((achievement, index) => (
          <AchievementItem key={index} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementItem({ achievement }: { achievement: Achievement }) {
  const timeAgo = formatDistanceToNow(new Date(achievement.unlockedAt), {
    addSuffix: true,
  });

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      {/* User avatar or icon */}
      <div className="relative">
        {achievement.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={achievement.avatar}
            alt={achievement.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {achievement.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Achievement icon badge */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#111111] flex items-center justify-center text-xs">
          {achievement.achievementIcon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium text-white truncate">
            {achievement.username}
          </span>
          <span className="text-gray-400">earned</span>
        </div>
        <div className="text-sm text-gray-300 truncate">
          {achievement.achievementIcon} {achievement.achievementName}
        </div>
      </div>

      {/* Time */}
      <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
    </div>
  );
}
