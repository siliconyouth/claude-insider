"use client";

/**
 * Dashboard Overview Query Hooks
 *
 * TanStack Query hooks for the main dashboard overview page.
 * Provides caching and automatic revalidation for stats and previews.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, STALE_TIMES } from "..";
import { getAdminNotifications } from "@/app/actions/admin-notifications";
import type { AdminStats, AdminBetaApplication, AdminFeedback } from "@/types/admin";

// ============================================
// TYPES
// ============================================

export interface ChartStats {
  userGrowth: { name: string; value: number }[];
  contentDistribution: { name: string; value: number }[];
  activityByType: { name: string; value: number }[];
  roleDistribution: { name: string; value: number }[];
  weeklySignups: { value: number }[];
  trends: {
    userGrowth: { value: number; isPositive: boolean };
  };
}

export interface DonationOverviewStats {
  total_raised: number;
  completed_donations: number;
  pending_donations: number;
  unique_donors: number;
  recent_donations: Array<{
    id: string;
    amount: number;
    donor_name: string;
    is_anonymous: boolean;
    created_at: string;
  }>;
}

interface BetaResponse {
  items: AdminBetaApplication[];
  total: number;
}

interface FeedbackResponse {
  items: AdminFeedback[];
  total: number;
}

interface DonationsResponse {
  overview: {
    total_raised: number;
    completed_donations: number;
    pending_donations: number;
    unique_donors: number;
  };
  recent_donations: Array<{
    id: string;
    amount: number;
    donor_name: string;
    is_anonymous: boolean;
    created_at: string;
  }>;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch main dashboard stats (users, content, feedback counts)
 */
export function useDashboardOverviewStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardFetcher<AdminStats>("/api/dashboard/stats"),
    staleTime: STALE_TIMES.realtime, // 10 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Fetch chart data (user growth, content distribution, etc.)
 */
export function useDashboardChartStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.chartStats,
    queryFn: () => dashboardFetcher<ChartStats>("/api/dashboard/chart-stats"),
    staleTime: STALE_TIMES.dashboard, // 30 seconds
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes (charts don't need to be real-time)
  });
}

/**
 * Fetch recent pending beta applications
 */
export function useRecentBetaApplications(limit: number = 5) {
  return useQuery({
    queryKey: ["dashboard", "beta", "recent", limit] as const,
    queryFn: () =>
      dashboardFetcher<BetaResponse>("/api/dashboard/beta", {
        limit,
        status: "pending",
      }),
    staleTime: STALE_TIMES.dashboard,
    select: (data) => data.items || [],
  });
}

/**
 * Fetch recent open feedback
 */
export function useRecentFeedback(limit: number = 5) {
  return useQuery({
    queryKey: ["dashboard", "feedback", "recent", limit] as const,
    queryFn: () =>
      dashboardFetcher<FeedbackResponse>("/api/dashboard/feedback", {
        limit,
        status: "open",
      }),
    staleTime: STALE_TIMES.dashboard,
    select: (data) => data.items || [],
  });
}

/**
 * Fetch recent notifications (uses server action)
 */
export function useRecentNotifications(limit: number = 5) {
  return useQuery({
    queryKey: ["dashboard", "notifications", "recent", limit] as const,
    queryFn: async () => {
      const result = await getAdminNotifications({ limit });
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Fetch donation overview stats
 */
export function useDonationOverview() {
  return useQuery({
    queryKey: queryKeys.donations.stats,
    queryFn: () => dashboardFetcher<DonationsResponse>("/api/dashboard/donations"),
    staleTime: STALE_TIMES.dashboard,
    select: (data): DonationOverviewStats => ({
      total_raised: data.overview?.total_raised || 0,
      completed_donations: data.overview?.completed_donations || 0,
      pending_donations: data.overview?.pending_donations || 0,
      unique_donors: data.overview?.unique_donors || 0,
      recent_donations: data.recent_donations?.slice(0, 3) || [],
    }),
  });
}

/**
 * Combined hook that fetches all dashboard overview data
 * Useful for prefetching or checking loading state
 */
export function useDashboardOverviewData() {
  const stats = useDashboardOverviewStats();
  const chartStats = useDashboardChartStats();
  const recentBeta = useRecentBetaApplications();
  const recentFeedback = useRecentFeedback();
  const recentNotifications = useRecentNotifications();
  const donations = useDonationOverview();

  return {
    stats,
    chartStats,
    recentBeta,
    recentFeedback,
    recentNotifications,
    donations,
    isLoading:
      stats.isLoading ||
      chartStats.isLoading ||
      recentBeta.isLoading ||
      recentFeedback.isLoading ||
      recentNotifications.isLoading ||
      donations.isLoading,
  };
}
