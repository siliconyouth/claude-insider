"use client";

/**
 * Stats Cards Components
 *
 * Display various statistics in card format.
 */

import { cn } from "@/lib/design-system";
import { ActivitySparkline } from "./activity-chart";

interface StatCardProps {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  sparklineData?: number[];
  color?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  sparklineData,
  color = "#3b82f6",
  className,
}: StatCardProps) {
  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

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
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {icon && (
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>

      {/* Change indicator or sparkline */}
      <div className="mt-3 flex items-center justify-between">
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositiveChange && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
                <path d="M12 4l8 8h-6v8h-4v-8H4l8-8z" />
              </svg>
            )}
            {isNegativeChange && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
                <path d="M12 20l-8-8h6V4h4v8h6l-8 8z" />
              </svg>
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isPositiveChange && "text-green-600 dark:text-green-400",
                isNegativeChange && "text-red-600 dark:text-red-400",
                !isPositiveChange && !isNegativeChange && "text-gray-500"
              )}
            >
              {isPositiveChange && "+"}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-gray-400">{changeLabel}</span>
            )}
          </div>
        )}
        {sparklineData && sparklineData.length > 0 && (
          <ActivitySparkline data={sparklineData} color={color} />
        )}
      </div>
    </div>
  );
}

/**
 * Stat card grid for multiple stats
 */
export function StatsGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

/**
 * View count display component
 */
export function ViewCount({
  views,
  label = "views",
  size = "md",
  className,
}: {
  views: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-gray-500 dark:text-gray-400",
        sizes[size],
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className={cn(
          size === "sm" && "w-3.5 h-3.5",
          size === "md" && "w-4 h-4",
          size === "lg" && "w-5 h-5"
        )}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span>
        {views.toLocaleString()} {label}
      </span>
    </div>
  );
}
