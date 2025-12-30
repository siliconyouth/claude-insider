"use client";

/**
 * Analytics Query Hooks
 *
 * TanStack Query hooks for Analytics dashboard pages:
 * - Search analytics (top searches, no-results, trends)
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { STALE_TIMES } from "..";

// ============================================
// TYPES
// ============================================

export interface SearchAnalyticsData {
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

export type SearchDateRange = "week" | "month" | "all";

// ============================================
// SEARCH ANALYTICS HOOKS
// ============================================

/**
 * Fetch search analytics data with date range filter
 */
export function useSearchAnalytics(dateRange: SearchDateRange = "week") {
  return useQuery({
    queryKey: queryKeys.analytics.search({ period: dateRange }),
    queryFn: async () => {
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

      return response.json() as Promise<SearchAnalyticsData>;
    },
    staleTime: STALE_TIMES.dashboard,
    // Auto-refetch every minute for live updates
    refetchInterval: 60000,
  });
}
