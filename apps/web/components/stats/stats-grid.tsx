"use client";

/**
 * Community Stats Grid Component
 *
 * 4-column grid of stat cards for community metrics.
 */

import { cn } from "@/lib/design-system";
import {
  UsersIcon,
  FolderIcon,
  TrophyIcon,
  EyeIcon,
  TrendingUpIcon,
} from "lucide-react";

interface StatsGridProps {
  stats: {
    totalUsers: number;
    totalResources: number;
    totalAchievements: number;
    viewsThisMonth: number;
    newUsersThisWeek?: number;
    newUsersThisMonth?: number;
  };
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const cards = [
    {
      label: "Members",
      value: stats.totalUsers,
      change: stats.newUsersThisWeek
        ? `+${stats.newUsersThisWeek} this week`
        : undefined,
      icon: UsersIcon,
      color: "from-blue-600 to-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Resources",
      value: stats.totalResources,
      icon: FolderIcon,
      color: "from-violet-600 to-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Achievements",
      value: stats.totalAchievements,
      suffix: "+",
      icon: TrophyIcon,
      color: "from-amber-600 to-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Views/Month",
      value: stats.viewsThisMonth,
      icon: EyeIcon,
      color: "from-cyan-600 to-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatCard({
  label,
  value,
  suffix,
  change,
  icon: Icon,
  color,
  bgColor,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "bg-[#111111] border border-[#262626]",
        "hover:border-blue-500/50 transition-all duration-300",
        "group"
      )}
    >
      {/* Background icon */}
      <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>

      {/* Icon */}
      <div
        className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3",
          bgColor
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5",
            color.includes("blue") && "text-blue-500",
            color.includes("violet") && "text-violet-500",
            color.includes("amber") && "text-amber-500",
            color.includes("cyan") && "text-cyan-500",
            !color.includes("blue") && !color.includes("violet") && !color.includes("amber") && !color.includes("cyan") && "text-gray-400"
          )}
        />
      </div>

      {/* Value */}
      <div className="text-2xl md:text-3xl font-bold text-white mb-1">
        {formatNumber(value)}
        {suffix && <span className="text-gray-500">{suffix}</span>}
      </div>

      {/* Label */}
      <div className="text-sm text-gray-400">{label}</div>

      {/* Change indicator */}
      {change && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
          <TrendingUpIcon className="w-3 h-3" />
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}
