"use client";

/**
 * User Directory Insights Component
 *
 * Displays visual analytics about the user community.
 * Shows category distribution, role breakdown, and activity metrics.
 */

import { useMemo } from "react";
import { cn } from "@/lib/design-system";
import {
  LazyHorizontalBarChart,
  LazyDonutChart,
  CHART_COLORS,
  type ChartDataPoint,
} from "@/components/dashboard/charts";

interface ListData {
  users: unknown[];
  total: number;
  isLoading: boolean;
}

interface UserDirectoryInsightsProps {
  lists: {
    featured: ListData;
    new: ListData;
    active: ListData;
    achievers: ListData;
    donors: ListData;
    following: ListData;
    followers: ListData;
  };
  isAuthenticated: boolean;
  className?: string;
}

// Category configurations
const CATEGORY_CONFIG = {
  featured: { name: "Featured", icon: "⭐", color: "#f59e0b" },
  new: { name: "New Users", icon: "✨", color: "#8b5cf6" },
  active: { name: "Active", icon: "⚡", color: "#3b82f6" },
  achievers: { name: "Achievers", icon: "🏆", color: "#22c55e" },
  donors: { name: "Supporters", icon: "💜", color: "#ec4899" },
};

export function UserDirectoryInsights({
  lists,
  isAuthenticated,
  className,
}: UserDirectoryInsightsProps) {
  // Check if any lists are still loading
  const isLoading = Object.entries(lists)
    .filter(([key]) => key !== "following" && key !== "followers" && key !== "search")
    .some(([, data]) => data.isLoading);

  // Prepare category bar chart data
  const categoryChartData: ChartDataPoint[] = useMemo(() => {
    return Object.entries(CATEGORY_CONFIG)
      .filter(([key]) => lists[key as keyof typeof CATEGORY_CONFIG])
      .map(([key, config]) => ({
        name: config.name,
        value: lists[key as keyof typeof CATEGORY_CONFIG]?.total || 0,
        color: config.color,
        icon: config.icon,
      }))
      .sort((a, b) => b.value - a.value);
  }, [lists]);

  // Calculate social network balance for authenticated users
  const socialData: ChartDataPoint[] = useMemo(() => {
    if (!isAuthenticated) return [];
    return [
      {
        name: "Following",
        value: lists.following.total,
        color: CHART_COLORS.secondary,
      },
      {
        name: "Followers",
        value: lists.followers.total,
        color: CHART_COLORS.tertiary,
      },
    ];
  }, [isAuthenticated, lists.following.total, lists.followers.total]);

  // Calculate total community size
  const totalUsers = useMemo(() => {
    // Use featured as baseline since it typically captures verified/notable users
    return lists.featured.total + lists.new.total;
  }, [lists.featured.total, lists.new.total]);

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl p-5 h-[200px]",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "animate-pulse"
              )}
            >
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Community Categories Chart */}
        <div
          className={cn(
            "rounded-xl p-5",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Community Highlights
          </h3>
          <LazyHorizontalBarChart
            data={categoryChartData}
            height={160}
            barSize={22}
            showLabels
            showValues={false}
          />
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-[#262626]">
            {categoryChartData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {cat.name}:
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {cat.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Social Network or Activity Summary */}
        {isAuthenticated && socialData.length > 0 ? (
          <div
            className={cn(
              "rounded-xl p-5",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Your Network
            </h3>
            <div className="flex items-center justify-center gap-8">
              <LazyDonutChart
                data={socialData}
                size={140}
                innerRadius={40}
                outerRadius={60}
                centerLabel={{
                  value: lists.following.total + lists.followers.total,
                  label: "Connections",
                }}
                expandOnHover
              />
              <div className="space-y-3">
                {socialData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {lists.followers.total > lists.following.total && (
              <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 mt-3 pt-3 border-t border-gray-100 dark:border-[#262626]">
                🎉 You have more followers than people you follow!
              </p>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-xl p-5",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Community Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalUsers.toLocaleString()}+
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Community Members
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {lists.donors.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generous Supporters
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {lists.achievers.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  High Achievers
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {lists.new.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  New This Month
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
