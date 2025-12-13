"use client";

/**
 * Activity Chart Component
 *
 * Display activity over time with a simple bar chart.
 */

import { cn } from "@/lib/design-system";

interface ActivityChartProps {
  data: Array<{ date: string; count: number }>;
  label?: string;
  color?: string;
  height?: number;
  className?: string;
}

export function ActivityChart({
  data,
  label = "Activity",
  color = "#3b82f6",
  height = 100,
  className,
}: ActivityChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {total} total
        </span>
      </div>

      {/* Chart */}
      <div
        className="flex items-end gap-[2px] rounded-lg overflow-hidden"
        style={{ height }}
      >
        {data.map((item) => {
          const barHeight = (item.count / maxCount) * height;
          return (
            <div
              key={item.date}
              className="relative flex-1 group cursor-pointer"
              style={{ height }}
            >
              {/* Bar */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-200 group-hover:opacity-80"
                style={{
                  height: barHeight || 2,
                  backgroundColor: item.count > 0 ? color : "#e5e7eb",
                }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="font-medium">{item.count} views</div>
                <div className="text-gray-400">{formatDate(item.date)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatDate(data[0]?.date || "")}</span>
        <span>{formatDate(data[data.length - 1]?.date || "")}</span>
      </div>
    </div>
  );
}

/**
 * Mini activity indicator (sparkline-style)
 */
export function ActivitySparkline({
  data,
  color = "#3b82f6",
  width = 80,
  height = 24,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const max = Math.max(...data, 1);

  return (
    <div
      className={cn("flex items-end gap-px", className)}
      style={{ width, height }}
    >
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-t-sm"
          style={{
            height: (value / max) * height || 2,
            backgroundColor: value > 0 ? color : "#e5e7eb",
          }}
        />
      ))}
    </div>
  );
}
