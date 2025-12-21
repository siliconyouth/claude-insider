"use client";

/**
 * Resource Insights Component
 *
 * Displays visual analytics about the resources collection.
 * Shows category distribution, difficulty breakdown, and status counts.
 * Interactive charts allow filtering the resources list.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/design-system";
import {
  LazyDonutChart,
  LazyHorizontalBarChart,
  CHART_COLORS,
  type ChartDataPoint,
} from "@/components/dashboard/charts";

interface CategoryData {
  slug: string;
  name: string;
  icon: string;
  count: number;
}

interface ResourceInsightsProps {
  categories: CategoryData[];
  difficultyStats: { level: string; count: number }[];
  statusStats: { status: string; count: number }[];
  totalResources: number;
  onCategoryClick?: (categorySlug: string) => void;
  onDifficultyClick?: (difficulty: string) => void;
  selectedCategory?: string | null;
  selectedDifficulty?: string | null;
  className?: string;
}

// Color mappings for difficulty levels
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22c55e", // green-500
  intermediate: "#3b82f6", // blue-500
  advanced: "#f59e0b", // amber-500
  expert: "#ef4444", // red-500
};

// Color mappings for status
const STATUS_COLORS: Record<string, string> = {
  official: "#8b5cf6", // violet-500
  community: "#3b82f6", // blue-500
  beta: "#f59e0b", // amber-500
  deprecated: "#6b7280", // gray-500
};

export function ResourceInsights({
  categories,
  difficultyStats,
  statusStats,
  totalResources,
  onCategoryClick,
  onDifficultyClick,
  selectedCategory,
  selectedDifficulty,
  className,
}: ResourceInsightsProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Transform category data for donut chart
  const categoryChartData: ChartDataPoint[] = useMemo(
    () =>
      categories
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((cat, index) => ({
          name: cat.name,
          value: cat.count,
          icon: cat.icon,
          slug: cat.slug,
          color: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
        })),
    [categories]
  );

  // Find selected category index
  const selectedCategoryIndex = useMemo(() => {
    if (!selectedCategory) return undefined;
    return categoryChartData.findIndex((c) => c.slug === selectedCategory);
  }, [selectedCategory, categoryChartData]);

  // Transform difficulty data for bar chart
  const difficultyChartData: ChartDataPoint[] = useMemo(
    () =>
      difficultyStats
        .filter((d) => d.count > 0)
        .map((d) => ({
          name: d.level.charAt(0).toUpperCase() + d.level.slice(1),
          value: d.count,
          color: DIFFICULTY_COLORS[d.level] || CHART_COLORS.muted,
          level: d.level,
        })),
    [difficultyStats]
  );

  // Find selected difficulty index
  const selectedDifficultyIndex = useMemo(() => {
    if (!selectedDifficulty) return undefined;
    return difficultyChartData.findIndex(
      (d) => d.level === selectedDifficulty
    );
  }, [selectedDifficulty, difficultyChartData]);

  // Transform status data for small donut
  const statusChartData: ChartDataPoint[] = useMemo(
    () =>
      statusStats
        .filter((s) => s.count > 0)
        .map((s) => ({
          name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
          value: s.count,
          color: STATUS_COLORS[s.status] || CHART_COLORS.muted,
        })),
    [statusStats]
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Distribution */}
        <div
          className={cn(
            "rounded-xl p-5",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "transition-all duration-200",
            hoveredSection === "category" && "ring-2 ring-blue-500/30"
          )}
          onMouseEnter={() => setHoveredSection("category")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            By Category
          </h3>
          <div className="flex items-center gap-4">
            <LazyDonutChart
              data={categoryChartData}
              size={140}
              innerRadius={40}
              outerRadius={60}
              centerLabel={{
                value: totalResources,
                label: "Total",
              }}
              activeIndex={selectedCategoryIndex}
              onSegmentClick={(item) => {
                if (onCategoryClick) {
                  onCategoryClick(item.slug as string);
                }
              }}
              expandOnHover
            />
            <div className="flex-1 space-y-1.5">
              {categoryChartData.slice(0, 5).map((cat, index) => (
                <button
                  key={cat.name}
                  onClick={() => onCategoryClick?.(cat.slug as string)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1 rounded-md text-left",
                    "transition-colors duration-150",
                    selectedCategory === cat.slug
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                      {cat.icon} {cat.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {cat.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div
          className={cn(
            "rounded-xl p-5",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "transition-all duration-200",
            hoveredSection === "difficulty" && "ring-2 ring-blue-500/30"
          )}
          onMouseEnter={() => setHoveredSection("difficulty")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            By Difficulty
          </h3>
          <LazyHorizontalBarChart
            data={difficultyChartData}
            height={140}
            barSize={20}
            activeIndex={selectedDifficultyIndex}
            onBarClick={(item) => {
              if (onDifficultyClick) {
                onDifficultyClick(item.level as string);
              }
            }}
            showLabels
            showValues={false}
          />
          <div className="flex justify-center gap-4 mt-3">
            {difficultyChartData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {d.name}: {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div
          className={cn(
            "rounded-xl p-5",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "transition-all duration-200",
            hoveredSection === "status" && "ring-2 ring-blue-500/30"
          )}
          onMouseEnter={() => setHoveredSection("status")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            By Status
          </h3>
          <div className="flex items-center justify-center gap-6">
            <LazyDonutChart
              data={statusChartData}
              size={120}
              innerRadius={35}
              outerRadius={50}
              expandOnHover
            />
            <div className="space-y-2">
              {statusChartData.map((s) => {
                const percentage = Math.round((s.value / totalResources) * 100);
                return (
                  <div key={s.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {s.name}
                    </span>
                    <span className="text-xs text-gray-400">({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
