"use client";

/**
 * Sparkline Chart Component
 *
 * Compact inline chart for stat cards showing trend indicators.
 * Minimal styling, no axes or labels - just the data visualization.
 */

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/design-system";
import { CHART_COLORS } from "./index";

interface DataPoint {
  value: number;
}

interface SparklineChartProps {
  data: DataPoint[];
  color?: string;
  gradientColor?: string;
  width?: number;
  height?: number;
  className?: string;
  showGradient?: boolean;
  strokeWidth?: number;
}

export function SparklineChart({
  data,
  color = CHART_COLORS.primary,
  gradientColor,
  width = 80,
  height = 32,
  className,
  showGradient = true,
  strokeWidth = 1.5,
}: SparklineChartProps) {
  const gradientId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;
  const fillColor = gradientColor || color;

  return (
    <div className={cn("inline-block", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={showGradient ? `url(#${gradientId})` : "transparent"}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Stat Card with Sparkline
 *
 * A complete stat card component with title, value, change indicator, and sparkline.
 */
interface StatCardWithSparklineProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: DataPoint[];
  sparklineColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCardWithSparkline({
  title,
  value,
  change,
  sparklineData,
  sparklineColor = CHART_COLORS.primary,
  icon,
  className,
}: StatCardWithSparklineProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-gray-400 dark:text-gray-500">{icon}</div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {change && (
              <span
                className={cn(
                  "text-xs font-medium",
                  change.isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {change.isPositive ? "↑" : "↓"} {Math.abs(change.value)}%
              </span>
            )}
          </div>
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <SparklineChart
            data={sparklineData}
            color={
              change
                ? change.isPositive
                  ? CHART_COLORS.success
                  : CHART_COLORS.error
                : sparklineColor
            }
            width={80}
            height={40}
          />
        )}
      </div>
    </div>
  );
}
