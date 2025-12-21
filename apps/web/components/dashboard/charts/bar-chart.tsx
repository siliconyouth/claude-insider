"use client";

/**
 * Bar Chart Components
 *
 * Two variants for different use cases:
 * - BarChartCard: Complete card with title/border for standalone dashboard widgets
 * - HorizontalBarChart: Inline headless variant for embedding in custom layouts
 *
 * Features gradient fills, tooltips, click handlers, and hover animations.
 */

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/design-system";
import { CHART_COLORS, CHART_PALETTE } from "./index";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  icon?: string;
  [key: string]: string | number | undefined;
}

interface BarChartCardProps {
  title: string;
  data: DataPoint[];
  dataKey?: string;
  subtitle?: string;
  color?: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  horizontal?: boolean;
  useGradient?: boolean;
  gradientId?: string;
}

export function BarChartCard({
  title,
  data,
  dataKey = "value",
  subtitle,
  color = CHART_COLORS.primary,
  height = 200,
  className,
  showGrid = true,
  formatValue = (v) => v.toLocaleString(),
  horizontal = false,
  useGradient = true,
  gradientId = "barGradient",
}: BarChartCardProps) {
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={
              horizontal
                ? { top: 5, right: 30, left: 60, bottom: 5 }
                : { top: 5, right: 5, left: -20, bottom: 0 }
            }
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2={horizontal ? "1" : "0"}
                y2={horizontal ? "0" : "1"}
              >
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={1} />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-[#262626]"
                horizontal={!horizontal}
                vertical={horizontal}
              />
            )}
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(value) => formatValue(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  width={55}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(value) => formatValue(value)}
                />
              </>
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {horizontal ? (payload[0].payload as DataPoint).name : label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatValue(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "rgba(107, 114, 128, 0.1)" }}
            />
            <Bar
              dataKey={dataKey}
              fill={useGradient ? `url(#${gradientId})` : color}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.color ||
                    (useGradient ? `url(#${gradientId})` : color)
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline Horizontal Bar Chart (headless - no card wrapper)
// ────────────────────────────────────────────────────────────────────────────

interface HorizontalBarChartProps {
  data: DataPoint[];
  dataKey?: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  formatValue?: (value: number) => string;
  activeIndex?: number;
  onBarClick?: (item: DataPoint, index: number) => void;
  className?: string;
  animated?: boolean;
  barSize?: number;
}

/**
 * Inline horizontal bar chart for embedding in custom cards/layouts.
 * Supports click selection, hover animations, and custom colors per bar.
 *
 * @example
 * <HorizontalBarChart
 *   data={[
 *     { name: "Docs", value: 34 },
 *     { name: "Resources", value: 1952 },
 *   ]}
 *   onBarClick={(item, idx) => setSelectedCategory(item.name)}
 *   activeIndex={selectedIndex}
 * />
 */
export function HorizontalBarChart({
  data,
  dataKey = "value",
  height = 200,
  colors = CHART_PALETTE as unknown as string[],
  showGrid = false,
  showLabels = true,
  showValues = true,
  formatValue = (v) => v.toLocaleString(),
  activeIndex,
  onBarClick,
  className,
  animated = true,
  barSize = 24,
}: HorizontalBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: showValues ? 50 : 10, left: showLabels ? 80 : 10, bottom: 5 }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-[#262626]"
              horizontal={false}
              vertical={true}
            />
          )}
          {showLabels && (
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              width={75}
            />
          )}
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={formatValue}
            hide={!showValues}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DataPoint;
                return (
                  <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {item.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatValue(item.value)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ fill: "rgba(107, 114, 128, 0.1)" }}
          />
          <Bar
            dataKey={dataKey}
            radius={[0, 4, 4, 0]}
            animationDuration={animated ? 800 : 0}
            animationEasing="ease-out"
            barSize={barSize}
            onClick={(data, index) => {
              if (onBarClick && data) {
                onBarClick(data as unknown as DataPoint, index);
              }
            }}
            onMouseEnter={(_, index) => setHoveredIndex(index)}
          >
            {data.map((entry, index) => {
              const isActive = activeIndex === index;
              const isHovered = hoveredIndex === index;
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
                      : isHovered
                        ? 1
                        : 0.85
                  }
                  style={{
                    cursor: onBarClick ? "pointer" : "default",
                    transition: "opacity 150ms ease-out",
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
