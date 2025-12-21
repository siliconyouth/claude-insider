"use client";

/**
 * Comparison Card Component
 *
 * Shows user stats compared to community average.
 */

import { cn } from "@/lib/design-system";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";

interface ComparisonData {
  user: number;
  avg: number;
  percentile: number;
}

interface ComparisonCardProps {
  comparison: {
    viewsVsAvg: ComparisonData;
    favoritesVsAvg: ComparisonData;
    commentsVsAvg: ComparisonData;
    pointsVsAvg: ComparisonData;
  };
  className?: string;
}

export function ComparisonCard({ comparison, className }: ComparisonCardProps) {
  const metrics = [
    {
      label: "Items Read",
      data: comparison.viewsVsAvg,
      icon: "📖",
    },
    {
      label: "Favorites",
      data: comparison.favoritesVsAvg,
      icon: "⭐",
    },
    {
      label: "Comments",
      data: comparison.commentsVsAvg,
      icon: "💬",
    },
    {
      label: "Points",
      data: comparison.pointsVsAvg,
      icon: "✨",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-xl p-6 bg-[#111111] border border-[#262626]",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-white mb-6">
        You vs. Community
      </h3>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <ComparisonRow key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[#262626] text-center">
        <span className="text-xs text-gray-500">
          Percentile shows how you rank among all users
        </span>
      </div>
    </div>
  );
}

interface ComparisonRowProps {
  label: string;
  data: ComparisonData;
  icon: string;
}

function ComparisonRow({ label, data, icon }: ComparisonRowProps) {
  const diff = data.user - data.avg;
  const diffPercentage =
    data.avg > 0 ? Math.round((diff / data.avg) * 100) : 0;

  const isAbove = diff > 0;
  const isBelow = diff < 0;
  const isEqual = diff === 0;

  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <span className="text-lg">{icon}</span>

      {/* Label and values */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {data.user.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">
              (avg: {data.avg.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Comparison bar and percentile */}
        <div className="flex items-center gap-2">
          {/* Trend indicator */}
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
              isAbove && "bg-green-500/20 text-green-400",
              isBelow && "bg-red-500/20 text-red-400",
              isEqual && "bg-gray-500/20 text-gray-400"
            )}
          >
            {isAbove && <TrendingUpIcon className="w-3 h-3" />}
            {isBelow && <TrendingDownIcon className="w-3 h-3" />}
            {isEqual && <MinusIcon className="w-3 h-3" />}
            <span>
              {isAbove && "+"}
              {diffPercentage}%
            </span>
          </div>

          {/* Percentile badge */}
          <div
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              data.percentile >= 80 && "bg-green-500/20 text-green-400",
              data.percentile >= 50 &&
                data.percentile < 80 &&
                "bg-blue-500/20 text-blue-400",
              data.percentile >= 25 &&
                data.percentile < 50 &&
                "bg-amber-500/20 text-amber-400",
              data.percentile < 25 && "bg-gray-500/20 text-gray-400"
            )}
          >
            Top {100 - data.percentile}%
          </div>
        </div>
      </div>
    </div>
  );
}
