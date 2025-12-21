"use client";

/**
 * Personal Stats Header Component
 *
 * Shows level, points, streak, and achievement progress summary.
 */

import { cn } from "@/lib/design-system";
import { type Level, levels } from "@/lib/gamification";
import {
  TrophyIcon,
  FlameIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";

interface PersonalStatsHeaderProps {
  level: Level;
  totalPoints: number;
  pointsThisWeek: number;
  nextLevelProgress: number;
  pointsToNextLevel: number;
  currentStreak: number;
  streakActive: boolean;
  achievementsUnlocked: number;
  achievementsTotal: number;
  className?: string;
}

export function PersonalStatsHeader({
  level,
  totalPoints,
  pointsThisWeek,
  nextLevelProgress,
  pointsToNextLevel,
  currentStreak,
  streakActive,
  achievementsUnlocked,
  achievementsTotal,
  className,
}: PersonalStatsHeaderProps) {
  const cards = [
    {
      label: level.name,
      value: `Level ${level.level}`,
      subValue: nextLevelProgress < 100 ? `${nextLevelProgress}% to L${level.level + 1}` : "Max Level",
      icon: level.icon,
      color: "from-violet-600 to-violet-400",
      bgColor: "bg-violet-500/10",
      hasProgress: true,
      progress: nextLevelProgress,
    },
    {
      label: "Points",
      value: totalPoints.toLocaleString(),
      subValue: pointsThisWeek > 0 ? `+${pointsThisWeek} this week` : "Keep earning!",
      icon: <SparklesIcon className="w-5 h-5" />,
      color: "from-blue-600 to-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Streak",
      value: `${currentStreak} days`,
      subValue: streakActive ? "Active! 🔥" : "Start today!",
      icon: <FlameIcon className="w-5 h-5" />,
      color: streakActive ? "from-amber-600 to-amber-400" : "from-gray-600 to-gray-400",
      bgColor: streakActive ? "bg-amber-500/10" : "bg-gray-500/10",
    },
    {
      label: "Achievements",
      value: `${achievementsUnlocked}/${achievementsTotal}`,
      subValue: `${Math.round((achievementsUnlocked / achievementsTotal) * 100)}% complete`,
      icon: <TrophyIcon className="w-5 h-5" />,
      color: "from-cyan-600 to-cyan-400",
      bgColor: "bg-cyan-500/10",
      hasProgress: true,
      progress: Math.round((achievementsUnlocked / achievementsTotal) * 100),
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hasProgress?: boolean;
  progress?: number;
}

function StatCard({
  label,
  value,
  subValue,
  icon,
  color,
  bgColor,
  hasProgress,
  progress = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-[#111111] border border-[#262626]",
        "hover:border-blue-500/50 transition-all duration-300"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3",
          bgColor
        )}
      >
        {typeof icon === "string" ? (
          <span className="text-xl">{icon}</span>
        ) : (
          <span className={cn("bg-gradient-to-r bg-clip-text", color)}>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-xl font-bold text-white mb-0.5">{value}</div>

      {/* Label */}
      <div className="text-sm text-gray-400 mb-2">{label}</div>

      {/* Sub value or progress */}
      {hasProgress ? (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", color)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{subValue}</div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">{subValue}</div>
      )}
    </div>
  );
}
