"use client";

/**
 * Analytics Dashboard
 *
 * Displays discovery metrics, approval rates, and source performance
 * using CSS-based visualizations (no external charting library).
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface DailyStats {
  date: string;
  discovered: number;
  approved: number;
  rejected: number;
}

interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

interface SourceStats {
  sourceId: number;
  sourceName: string;
  sourceType: string;
  discovered: number;
  approved: number;
  successRate: number;
}

interface AnalyticsData {
  success: boolean;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalResources: number;
    pendingQueue: number;
    totalDiscovered: number;
    totalApproved: number;
    totalRejected: number;
    approvalRate: number;
    activeSources: number;
  };
  charts: {
    dailyStats: DailyStats[];
    categoryDistribution: CategoryStats[];
    sourcePerformance: SourceStats[];
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/resources/analytics?days=${days}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-[#262626] rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-[#262626] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-[#262626] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, charts } = data;

  // Calculate max values for scaling charts
  const maxDaily = Math.max(
    ...charts.dailyStats.map((d) => Math.max(d.discovered, d.approved, d.rejected)),
    1
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Discovery metrics and performance insights
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                days === d
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Resources"
          value={summary.totalResources}
          icon={<ResourceIcon />}
          color="blue"
        />
        <StatCard
          label="Pending Review"
          value={summary.pendingQueue}
          icon={<QueueIcon />}
          color="amber"
          trend={summary.pendingQueue > 10 ? "warning" : undefined}
        />
        <StatCard
          label="Approval Rate"
          value={`${summary.approvalRate}%`}
          icon={<CheckIcon />}
          color="green"
          subtitle={`${summary.totalApproved} approved / ${summary.totalRejected} rejected`}
        />
        <StatCard
          label="Active Sources"
          value={summary.activeSources}
          icon={<SourceIcon />}
          color="violet"
        />
      </div>

      {/* Discovery Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          label="Discovered"
          value={summary.totalDiscovered}
          subtitle={`Last ${days} days`}
          icon={<SearchIcon />}
          color="cyan"
        />
        <StatCard
          label="Approved"
          value={summary.totalApproved}
          subtitle={`Last ${days} days`}
          icon={<ApproveIcon />}
          color="green"
        />
        <StatCard
          label="Rejected"
          value={summary.totalRejected}
          subtitle={`Last ${days} days`}
          icon={<RejectIcon />}
          color="red"
        />
      </div>

      {/* Daily Activity Chart */}
      <div className={cn(
        "rounded-xl p-6",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Activity
        </h2>
        <div className="h-64 flex items-end gap-1">
          {charts.dailyStats.slice(-days).map((day, index) => {
            const discoveredHeight = (day.discovered / maxDaily) * 100;
            const approvedHeight = (day.approved / maxDaily) * 100;
            const rejectedHeight = (day.rejected / maxDaily) * 100;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Bars */}
                <div className="w-full flex gap-0.5 items-end h-48">
                  <div
                    className="flex-1 bg-blue-500/80 rounded-t transition-all group-hover:bg-blue-500"
                    style={{ height: `${discoveredHeight}%` }}
                  />
                  <div
                    className="flex-1 bg-green-500/80 rounded-t transition-all group-hover:bg-green-500"
                    style={{ height: `${approvedHeight}%` }}
                  />
                  <div
                    className="flex-1 bg-red-500/80 rounded-t transition-all group-hover:bg-red-500"
                    style={{ height: `${rejectedHeight}%` }}
                  />
                </div>

                {/* Date label (show every 7th) */}
                {index % 7 === 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 dark:bg-[#1a1a1a] text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                    <p className="font-medium">{day.date}</p>
                    <p className="text-blue-400">Discovered: {day.discovered}</p>
                    <p className="text-green-400">Approved: {day.approved}</p>
                    <p className="text-red-400">Rejected: {day.rejected}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Discovered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
          </div>
        </div>
      </div>

      {/* Category Distribution & Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className={cn(
          "rounded-xl p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Distribution
          </h2>
          <div className="space-y-3">
            {charts.categoryDistribution.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {cat.category.replace(/-/g, " ")}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {charts.categoryDistribution.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No category data available
              </p>
            )}
          </div>
        </div>

        {/* Source Performance */}
        <div className={cn(
          "rounded-xl p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Source Performance
          </h2>
          <div className="space-y-4">
            {charts.sourcePerformance.map((source) => (
              <div key={source.sourceId} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {source.sourceName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {source.sourceType} • {source.discovered} discovered
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {source.approved}
                    </p>
                    <p className="text-xs text-gray-500">approved</p>
                  </div>
                  {/* Success Rate Donut */}
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200 dark:text-[#262626]"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${source.successRate * 1.256} 126`}
                        className={cn(
                          source.successRate >= 70
                            ? "text-green-500"
                            : source.successRate >= 40
                            ? "text-amber-500"
                            : "text-red-500"
                        )}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">
                      {source.successRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {charts.sourcePerformance.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No source data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Data from {new Date(data.period.startDate).toLocaleDateString()} to{" "}
        {new Date(data.period.endDate).toLocaleDateString()}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "red" | "violet" | "cyan";
  trend?: "up" | "down" | "warning";
}) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400",
    green: "from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400",
    red: "from-red-500/10 to-red-500/5 text-red-600 dark:text-red-400",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-600 dark:text-violet-400",
    cyan: "from-cyan-500/10 to-cyan-500/5 text-cyan-600 dark:text-cyan-400",
  };

  return (
    <div className={cn(
      "rounded-xl p-5",
      "bg-gradient-to-br",
      colorClasses[color].split(" ").slice(0, 2).join(" "),
      "border border-gray-200 dark:border-[#262626]"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className={cn(
            "mt-1 text-2xl font-bold",
            colorClasses[color].split(" ").slice(2).join(" ")
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "p-2 rounded-lg",
          `bg-${color}-100 dark:bg-${color}-900/20`
        )}>
          <div className={cn("w-5 h-5", colorClasses[color].split(" ").slice(2).join(" "))}>
            {icon}
          </div>
        </div>
      </div>
      {trend === "warning" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <span>⚠️</span>
          <span>Queue needs attention</span>
        </div>
      )}
    </div>
  );
}

// Icons
function ResourceIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
