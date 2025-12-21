"use client";

/**
 * Search Analytics Dashboard
 *
 * Admin view showing:
 * - Top searches this week/month
 * - Zero-result queries (content opportunities)
 * - Search trend over time
 * - Filter usage statistics
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { getSession } from "@/lib/auth-client";
import {
  SearchIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  BarChart3Icon,
  RefreshCwIcon,
  FilterIcon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";

interface SearchAnalyticsData {
  topSearches: Array<{
    query: string;
    search_count: number;
    last_searched_at: string;
    avg_result_count: number;
  }>;
  noResultsQueries: Array<{
    query: string;
    no_results_count: number;
    last_searched_at: string;
  }>;
  recentSearches: Array<{
    query: string;
    searched_at: string;
    result_count: number;
    user_id: string | null;
  }>;
  stats: {
    totalSearches: number;
    uniqueQueries: number;
    avgResultCount: number;
    noResultsRate: number;
  };
}

export default function SearchAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<
    "top" | "no-results" | "recent" | "trends"
  >("top");
  const [data, setData] = useState<SearchAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionResult = await getSession();
      if (!sessionResult?.data?.user?.id) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/search-analytics?range=${dateRange}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error("Error fetching search analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex items-center justify-center py-16">
          <RefreshCwIcon className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
          <AlertCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* Stats Overview */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Searches"
            value={data.stats.totalSearches}
            icon={<SearchIcon className="w-5 h-5" />}
            color="violet"
          />
          <StatCard
            label="Unique Queries"
            value={data.stats.uniqueQueries}
            icon={<TrendingUpIcon className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Avg. Results"
            value={data.stats.avgResultCount.toFixed(1)}
            icon={<BarChart3Icon className="w-5 h-5" />}
            color="cyan"
          />
          <StatCard
            label="No-Results Rate"
            value={`${(data.stats.noResultsRate * 100).toFixed(1)}%`}
            icon={<XCircleIcon className="w-5 h-5" />}
            color={data.stats.noResultsRate > 0.1 ? "red" : "green"}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { id: "top", label: "Top Searches", icon: TrendingUpIcon },
            { id: "no-results", label: "No Results", icon: XCircleIcon },
            { id: "recent", label: "Recent", icon: ClockIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) =>
              setDateRange(e.target.value as typeof dateRange)
            }
            className={cn(
              "px-3 py-2 text-sm rounded-lg",
              "bg-gray-800 border border-gray-700",
              "text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCwIcon
              className={cn("w-4 h-4", isLoading && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden">
        {activeTab === "top" && data?.topSearches && (
          <TopSearchesTable searches={data.topSearches} />
        )}
        {activeTab === "no-results" && data?.noResultsQueries && (
          <NoResultsTable queries={data.noResultsQueries} />
        )}
        {activeTab === "recent" && data?.recentSearches && (
          <RecentSearchesTable searches={data.recentSearches} />
        )}
      </div>

      {/* Content Opportunities */}
      {activeTab === "no-results" && data?.noResultsQueries && data.noResultsQueries.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">Content Opportunity</h3>
              <p className="text-sm text-gray-400 mt-1">
                These queries returned no results. Consider adding documentation
                or resources to cover these topics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Page Header
function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Search Analytics</h1>
      <p className="mt-1 text-gray-400">
        Track search patterns and identify content opportunities
      </p>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "violet" | "blue" | "cyan" | "green" | "red";
}) {
  const colors = {
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    green: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400",
    red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-4 border bg-gradient-to-br",
        colors[color]
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-black/20">{icon}</div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Top Searches Table
function TopSearchesTable({
  searches,
}: {
  searches: SearchAnalyticsData["topSearches"];
}) {
  if (searches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No search data available for this period.
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
            Query
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Searches
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Avg. Results
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Last Searched
          </th>
        </tr>
      </thead>
      <tbody>
        {searches.map((search, index) => (
          <tr
            key={search.query}
            className={cn(
              "border-b border-gray-700/50",
              index % 2 === 0 ? "bg-gray-800/30" : ""
            )}
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-mono">
                  {index + 1}.
                </span>
                <span className="text-white font-mono">{search.query}</span>
              </div>
            </td>
            <td className="text-right px-4 py-3 text-cyan-400 font-semibold">
              {search.search_count}
            </td>
            <td className="text-right px-4 py-3 text-gray-400">
              {search.avg_result_count.toFixed(1)}
            </td>
            <td className="text-right px-4 py-3 text-gray-500 text-sm">
              {formatRelativeTime(search.last_searched_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// No Results Table
function NoResultsTable({
  queries,
}: {
  queries: SearchAnalyticsData["noResultsQueries"];
}) {
  if (queries.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
          <SearchIcon className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-gray-400">No zero-result queries found!</p>
        <p className="text-sm text-gray-500 mt-1">
          All searches are returning results.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
            Query
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Attempts
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Last Attempt
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {queries.map((query, index) => (
          <tr
            key={query.query}
            className={cn(
              "border-b border-gray-700/50",
              index % 2 === 0 ? "bg-gray-800/30" : ""
            )}
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <XCircleIcon className="w-4 h-4 text-red-400" />
                <span className="text-white font-mono">{query.query}</span>
              </div>
            </td>
            <td className="text-right px-4 py-3 text-red-400 font-semibold">
              {query.no_results_count}
            </td>
            <td className="text-right px-4 py-3 text-gray-500 text-sm">
              {formatRelativeTime(query.last_searched_at)}
            </td>
            <td className="text-right px-4 py-3">
              <a
                href={`/admin/resources/create?suggested=${encodeURIComponent(query.query)}`}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Add Content
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Recent Searches Table
function RecentSearchesTable({
  searches,
}: {
  searches: SearchAnalyticsData["recentSearches"];
}) {
  if (searches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No recent searches recorded.
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
            Query
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Results
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            User
          </th>
          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
            Time
          </th>
        </tr>
      </thead>
      <tbody>
        {searches.map((search, index) => (
          <tr
            key={`${search.query}-${search.searched_at}`}
            className={cn(
              "border-b border-gray-700/50",
              index % 2 === 0 ? "bg-gray-800/30" : ""
            )}
          >
            <td className="px-4 py-3">
              <span className="text-white font-mono">{search.query}</span>
            </td>
            <td className="text-right px-4 py-3">
              <span
                className={cn(
                  "font-semibold",
                  search.result_count > 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {search.result_count}
              </span>
            </td>
            <td className="text-right px-4 py-3 text-gray-500 text-sm">
              {search.user_id ? (
                <span className="text-blue-400">Logged in</span>
              ) : (
                <span>Anonymous</span>
              )}
            </td>
            <td className="text-right px-4 py-3 text-gray-500 text-sm">
              {formatRelativeTime(search.searched_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
