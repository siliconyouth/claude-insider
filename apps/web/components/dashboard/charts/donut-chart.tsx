"use client";

/**
 * Donut Chart Components
 *
 * Two variants for different use cases:
 * - DonutChartCard: Complete card with title/border for standalone dashboard widgets
 * - DonutChart: Inline headless variant for embedding in custom layouts
 *
 * Features animated segments, click handlers, and hover interactions.
 */

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/design-system";
import { CHART_COLORS, CHART_PALETTE } from "./index";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  icon?: string;
  [key: string]: string | number | undefined;
}

interface DonutChartCardProps {
  title: string;
  data: DataPoint[];
  centerLabel?: {
    value: string | number;
    label: string;
  };
  colors?: string[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = [
  CHART_COLORS.primary, // violet
  CHART_COLORS.secondary, // blue
  CHART_COLORS.tertiary, // cyan
  CHART_COLORS.success, // green
  CHART_COLORS.warning, // amber
  CHART_COLORS.error, // red
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function DonutChartCard({
  title,
  data,
  centerLabel,
  colors = DEFAULT_COLORS,
  height = 240,
  className,
  showLegend = true,
  innerRadius = 55,
  outerRadius = 80,
}: DonutChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className={cn(
        "rounded-xl p-5",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      <div className="flex items-center gap-6">
        {/* Chart */}
        <div className="relative" style={{ width: outerRadius * 2 + 20, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DataPoint;
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {item.name}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.value.toLocaleString()} ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          {centerLabel && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {typeof centerLabel.value === "number"
                  ? centerLabel.value.toLocaleString()
                  : centerLabel.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {centerLabel.label}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 space-y-2">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(0);
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: item.color || colors[index % colors.length],
                      }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline Donut Chart (headless - no card wrapper)
// ────────────────────────────────────────────────────────────────────────────

interface DonutChartProps {
  data: DataPoint[];
  colors?: string[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: {
    value: string | number;
    label: string;
  };
  activeIndex?: number;
  onSegmentClick?: (item: DataPoint, index: number) => void;
  showTooltip?: boolean;
  animated?: boolean;
  className?: string;
  expandOnHover?: boolean;
}

/**
 * Inline donut chart for embedding in custom cards/layouts.
 * Supports click selection, hover expansion, and custom colors per segment.
 *
 * @example
 * <DonutChart
 *   data={[
 *     { name: "Beginner", value: 45 },
 *     { name: "Intermediate", value: 35 },
 *     { name: "Advanced", value: 20 },
 *   ]}
 *   onSegmentClick={(item, idx) => setSelectedLevel(item.name)}
 *   activeIndex={selectedIndex}
 *   centerLabel={{ value: 100, label: "Total" }}
 * />
 */
export function DonutChart({
  data,
  colors = CHART_PALETTE as unknown as string[],
  size = 180,
  innerRadius = 50,
  outerRadius = 70,
  centerLabel,
  activeIndex,
  onSegmentClick,
  showTooltip = true,
  animated = true,
  className,
  expandOnHover = true,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Determine which index to show as "active" (expanded)
  const displayActiveIndex = activeIndex ?? (expandOnHover ? hoveredIndex : null);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={displayActiveIndex !== null ? innerRadius - 2 : innerRadius}
            outerRadius={displayActiveIndex !== null ? outerRadius + 3 : outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationDuration={animated ? 800 : 0}
            animationEasing="ease-out"
            onClick={(data, index) => {
              if (onSegmentClick && data) {
                onSegmentClick(data as unknown as DataPoint, index);
              }
            }}
            onMouseEnter={(_, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {data.map((entry, index) => {
              const isActive = activeIndex === index;
              const isHovered = displayActiveIndex === index;
              const baseColor = entry.color || colors[index % colors.length];

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={baseColor}
                  opacity={
                    activeIndex !== undefined
                      ? isActive
                        ? 1
                        : 0.4
                      : 1
                  }
                  style={{
                    cursor: onSegmentClick ? "pointer" : "default",
                    transition: "all 150ms ease-out",
                    filter: isHovered ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))" : undefined,
                    transform: isHovered ? "scale(1.02)" : undefined,
                    transformOrigin: "center",
                  }}
                />
              );
            })}
          </Pie>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DataPoint;
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.name}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.value.toLocaleString()} ({percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {typeof centerLabel.value === "number"
              ? centerLabel.value.toLocaleString()
              : centerLabel.value}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {centerLabel.label}
          </span>
        </div>
      )}
    </div>
  );
}
