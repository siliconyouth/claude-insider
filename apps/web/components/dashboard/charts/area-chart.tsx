"use client";

/**
 * Area Chart Component
 *
 * Displays time-series data with a gradient-filled area.
 * Features animated entrance, tooltips, and responsive sizing.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/design-system";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface AreaChartCardProps {
  title: string;
  data: DataPoint[];
  dataKey?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradientId?: string;
  gradientColors?: { start: string; end: string };
  height?: number;
  className?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

const TrendIcon = ({ isPositive }: { isPositive: boolean }) => (
  <svg
    className={cn("w-4 h-4", isPositive ? "text-green-500" : "text-red-500")}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d={isPositive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
    />
  </svg>
);

export function AreaChartCard({
  title,
  data,
  dataKey = "value",
  trend,
  gradientId = "areaGradient",
  gradientColors = { start: "#8b5cf6", end: "#3b82f6" },
  height = 200,
  className,
  showGrid = true,
  formatValue = (v) => v.toLocaleString(),
}: AreaChartCardProps) {
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend.isPositive
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            )}
          >
            <TrendIcon isPositive={trend.isPositive} />
            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColors.start} stopOpacity={0.4} />
                <stop offset="100%" stopColor={gradientColors.end} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-[#262626]"
                vertical={false}
              />
            )}
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
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatValue(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={gradientColors.start}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
