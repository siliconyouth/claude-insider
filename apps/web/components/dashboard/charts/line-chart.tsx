"use client";

/**
 * Line Chart Component
 *
 * Displays multi-series time-series data as lines.
 * Features multiple data series, tooltips, and animated entrances.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/design-system";
import { CHART_COLORS } from "./index";

interface DataSeries {
  dataKey: string;
  name: string;
  color?: string;
  dashed?: boolean;
}

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface LineChartCardProps {
  title: string;
  data: DataPoint[];
  series: DataSeries[];
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

const DEFAULT_SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
];

export function LineChartCard({
  title,
  data,
  series,
  height = 200,
  className,
  showGrid = true,
  showLegend = true,
  formatValue = (v) => v.toLocaleString(),
}: LineChartCardProps) {
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

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {label}
                      </p>
                      <div className="space-y-1">
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {entry.name}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatValue(entry.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-gray-600 dark:text-gray-400">{value}</span>
                )}
              />
            )}
            {series.map((s, index) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color || DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length]}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
