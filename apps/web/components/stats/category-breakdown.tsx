"use client";

/**
 * Category Breakdown Component
 *
 * Horizontal progress bar chart showing reading distribution by category.
 */

import { cn } from "@/lib/design-system";
import { PieChartIcon } from "lucide-react";

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  title?: string;
  className?: string;
}

// Category colors matching the design system
const CATEGORY_COLORS: Record<string, string> = {
  Documentation: "from-blue-600 to-blue-400",
  Resources: "from-violet-600 to-violet-400",
  "Getting Started": "from-green-600 to-green-400",
  Configuration: "from-amber-600 to-amber-400",
  "API Reference": "from-cyan-600 to-cyan-400",
  Integrations: "from-purple-600 to-purple-400",
  "Tips & Tricks": "from-pink-600 to-pink-400",
  Tutorials: "from-indigo-600 to-indigo-400",
  Examples: "from-teal-600 to-teal-400",
  Other: "from-gray-600 to-gray-400",
};

export function CategoryBreakdown({
  data,
  title = "Reading Activity by Category",
  className,
}: CategoryBreakdownProps) {
  // Take top 5 categories
  const topCategories = data.slice(0, 5);
  const totalViews = data.reduce((sum, d) => sum + d.count, 0);

  if (topCategories.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl p-6 bg-[#111111] border border-[#262626]",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          No activity data yet
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="text-sm text-gray-400">
          {totalViews.toLocaleString()} total views
        </span>
      </div>

      {/* Category bars */}
      <div className="space-y-4">
        {topCategories.map((category) => (
          <CategoryBar
            key={category.category}
            category={category}
            gradientClass={
              CATEGORY_COLORS[category.category] ?? CATEGORY_COLORS.Other ?? "from-gray-600 to-gray-400"
            }
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryBarProps {
  category: CategoryData;
  gradientClass: string;
}

function CategoryBar({ category, gradientClass }: CategoryBarProps) {
  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-200">{category.category}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            {category.count.toLocaleString()} views
          </span>
          <span className="font-semibold text-white">{category.percentage}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            gradientClass
          )}
          style={{ width: `${category.percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Mini donut chart variant for compact display
 */
export function CategoryDonut({
  data,
  size = 120,
  className,
}: {
  data: CategoryData[];
  size?: number;
  className?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {data.slice(0, 5).map((category, index) => {
          const percentage = (category.count / total) * 100;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (percentage / 100) * circumference;

          const colors = [
            "#3b82f6", // blue
            "#8b5cf6", // violet
            "#22c55e", // green
            "#f59e0b", // amber
            "#06b6d4", // cyan
          ];

          return (
            <circle
              key={category.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors[index] || "#6b7280"}
              strokeWidth={12}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {data.length}
        </span>
        <span className="text-xs text-gray-400">categories</span>
      </div>
    </div>
  );
}
