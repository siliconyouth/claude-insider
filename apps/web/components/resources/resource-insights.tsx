"use client";

/**
 * Resource Insights Component
 *
 * Displays visual analytics about the resources collection.
 * Shows category distribution, difficulty breakdown, and status counts.
 * Interactive charts allow filtering the resources list.
 *
 * Extended in Migration 088 to show enhanced field visualizations:
 * - Target Audience Distribution
 * - Use Cases
 * - Feature Richness
 * - Pros/Cons Coverage
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

// Enhanced field data types (Migration 088)
interface AudienceData {
  audience: string;
  count: number;
}

interface UseCaseData {
  useCase: string;
  count: number;
}

interface EnhancedCoverage {
  hasPros: number;
  hasCons: number;
  hasPrerequisites: number;
  hasAiAnalysis: number;
  hasTargetAudience: number;
  hasUseCases: number;
  hasKeyFeatures: number;
  total: number;
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
  // Enhanced field data (Migration 088)
  audienceStats?: AudienceData[];
  useCasesStats?: UseCaseData[];
  enhancedCoverage?: EnhancedCoverage;
  onAudienceClick?: (audience: string) => void;
  onUseCaseClick?: (useCase: string) => void;
  selectedAudiences?: string[];
  selectedUseCases?: string[];
  showEnhancedInsights?: boolean;
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

// Audience color palette (Migration 088)
const AUDIENCE_COLORS = [
  "#8b5cf6", // violet-500
  "#6366f1", // indigo-500
  "#3b82f6", // blue-500
  "#0ea5e9", // sky-500
  "#06b6d4", // cyan-500
  "#14b8a6", // teal-500
  "#10b981", // emerald-500
  "#22c55e", // green-500
];

// Enhanced coverage colors
const COVERAGE_COLORS = {
  pros: "#22c55e", // green-500
  cons: "#ef4444", // red-500
  prerequisites: "#f59e0b", // amber-500
  features: "#3b82f6", // blue-500
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
  // Enhanced field props (Migration 088)
  audienceStats,
  useCasesStats,
  enhancedCoverage,
  onAudienceClick,
  onUseCaseClick,
  selectedAudiences = [],
  selectedUseCases = [],
  showEnhancedInsights = false,
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

  // Transform audience data for horizontal bar chart (Migration 088)
  const audienceChartData: ChartDataPoint[] = useMemo(
    () =>
      (audienceStats || [])
        .slice(0, 6)
        .map((a, index) => ({
          name: a.audience,
          value: a.count,
          color: AUDIENCE_COLORS[index % AUDIENCE_COLORS.length],
          audience: a.audience,
        })),
    [audienceStats]
  );

  // Transform coverage data for visualization (Migration 088)
  const coverageChartData: ChartDataPoint[] = useMemo(() => {
    if (!enhancedCoverage) return [];
    return [
      {
        name: "Key Features",
        value: enhancedCoverage.hasKeyFeatures,
        color: COVERAGE_COLORS.features,
      },
      {
        name: "Pros Listed",
        value: enhancedCoverage.hasPros,
        color: COVERAGE_COLORS.pros,
      },
      {
        name: "Cons Listed",
        value: enhancedCoverage.hasCons,
        color: COVERAGE_COLORS.cons,
      },
      {
        name: "Prerequisites",
        value: enhancedCoverage.hasPrerequisites,
        color: COVERAGE_COLORS.prerequisites,
      },
    ];
  }, [enhancedCoverage]);

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
              {categoryChartData.slice(0, 5).map((cat) => (
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

      {/* Enhanced Insights Panel (Migration 088) */}
      {showEnhancedInsights && (audienceChartData.length > 0 || coverageChartData.length > 0) && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Target Audience Distribution */}
          {audienceChartData.length > 0 && (
            <div
              className={cn(
                "rounded-xl p-5",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "transition-all duration-200",
                hoveredSection === "audience" && "ring-2 ring-blue-500/30"
              )}
              onMouseEnter={() => setHoveredSection("audience")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                By Target Audience
              </h3>
              <div className="space-y-2">
                {audienceChartData.map((item) => {
                  const isSelected = selectedAudiences.includes(item.audience as string);
                  const percentage = Math.round((item.value / totalResources) * 100);
                  return (
                    <button
                      key={item.name}
                      onClick={() => onAudienceClick?.(item.audience as string)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left",
                        "transition-colors duration-150",
                        isSelected
                          ? "bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      )}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right">
                          {item.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feature Coverage */}
          {coverageChartData.length > 0 && enhancedCoverage && (
            <div
              className={cn(
                "rounded-xl p-5",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "transition-all duration-200",
                hoveredSection === "coverage" && "ring-2 ring-blue-500/30"
              )}
              onMouseEnter={() => setHoveredSection("coverage")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Enhanced Data Coverage
              </h3>
              <div className="space-y-3">
                {coverageChartData.map((item) => {
                  const percentage = Math.round((item.value / enhancedCoverage.total) * 100);
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {item.value} of {enhancedCoverage.total} resources
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Analysis Badge */}
              {enhancedCoverage.hasAiAnalysis > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-violet-500/10 to-cyan-500/10 text-violet-600 dark:text-violet-400">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                      </svg>
                      AI Enhanced
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {enhancedCoverage.hasAiAnalysis} resources with AI analysis
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
