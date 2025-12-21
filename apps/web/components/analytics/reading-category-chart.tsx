"use client";

/**
 * Reading Category Chart Component
 *
 * Donut chart showing reading distribution by category.
 */

import { cn } from "@/lib/design-system";

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

interface ReadingCategoryChartProps {
  data: CategoryData[];
  className?: string;
}

// Fixed colors for consistent display
const CHART_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#22c55e", // green
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export function ReadingCategoryChart({
  data,
  className,
}: ReadingCategoryChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const topCategories = data.slice(0, 6);

  if (topCategories.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl p-6 bg-[#111111] border border-[#262626]",
          className
        )}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Reading by Category
        </h3>
        <p className="text-sm text-gray-400 text-center py-8">
          No reading history yet
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
      <h3 className="text-lg font-semibold text-white mb-6">
        Reading by Category
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <DonutChart data={topCategories} size={140} />

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {topCategories.map((category, index) => (
            <div key={category.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[index] || "#6b7280" }}
              />
              <span className="text-sm text-gray-300 flex-1 truncate">
                {category.category}
              </span>
              <span className="text-sm font-medium text-white">
                {category.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-[#262626] text-center">
        <span className="text-sm text-gray-400">
          {total.toLocaleString()} items read across {data.length} categories
        </span>
      </div>
    </div>
  );
}

function DonutChart({
  data,
  size,
}: {
  data: CategoryData[];
  size: number;
}) {
  const radius = size / 2 - 15;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  let currentOffset = 0;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={20}
        />

        {/* Category segments */}
        {data.map((category, index) => {
          const percentage = (category.count / total) * 100;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (percentage / 100) * circumference;

          return (
            <circle
              key={category.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index] || "#6b7280"}
              strokeWidth={20}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-gray-400">items</span>
      </div>
    </div>
  );
}
