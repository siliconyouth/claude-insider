"use client";

/**
 * Sentry Error Monitoring Query Hooks
 *
 * TanStack Query hooks for Sentry integration.
 * Handles:
 * - List issues with filtering (status, level, timeframe)
 * - Get individual issue details with stack trace
 * - Update issue status (resolve, ignore, unresolve)
 * - View cron job check logs
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";
import type {
  SentryIssue,
  SentryIssueDetail,
  SentryEvent,
  SentryStats,
  SentryIssueStatus,
} from "@/lib/sentry-api";

// ============================================
// TYPES
// ============================================

export interface SentryIssuesFilters {
  status?: "unresolved" | "resolved" | "ignored";
  level?: "fatal" | "error" | "warning";
  statsPeriod?: "1h" | "24h" | "7d" | "14d" | "30d";
  sort?: "date" | "new" | "priority" | "freq" | "user";
  cursor?: string;
  limit?: number;
}

export interface SentryIssuesResponse {
  issues: SentryIssue[];
  nextCursor: string | null;
  prevCursor: string | null;
  stats: SentryStats;
  filters: SentryIssuesFilters;
}

export interface SentryIssueDetailResponse {
  issue: SentryIssueDetail;
  latestEvent: SentryEvent | null;
}

export interface SentryCheckLog {
  id: string;
  checked_at: string;
  issues_found: number;
  new_issues: number;
  error_count: number;
  warning_count: number;
  fatal_count: number;
  notification_sent: boolean;
  notification_id: string | null;
  error: string | null;
  duration_ms: number | null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Get Sentry issues with filtering
 */
export function useSentryIssues(filters: SentryIssuesFilters = {}) {
  return useQuery({
    queryKey: queryKeys.sentry.issues(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.level) params.set("level", filters.level);
      if (filters.statsPeriod) params.set("statsPeriod", filters.statsPeriod);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.cursor) params.set("cursor", filters.cursor);
      if (filters.limit) params.set("limit", String(filters.limit));

      return dashboardFetcher<SentryIssuesResponse>(
        `/api/admin/sentry?${params.toString()}`
      );
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Get Sentry issue details with latest event (stack trace)
 */
export function useSentryIssueDetail(issueId: string | null) {
  return useQuery({
    queryKey: queryKeys.sentry.issue(issueId || ""),
    queryFn: () =>
      dashboardFetcher<SentryIssueDetailResponse>(
        `/api/admin/sentry/${issueId}`
      ),
    enabled: !!issueId,
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Get Sentry stats for a time period
 */
export function useSentryStats(statsPeriod: string = "24h") {
  return useQuery({
    queryKey: queryKeys.sentry.stats(statsPeriod),
    queryFn: async () => {
      const res = await dashboardFetcher<SentryIssuesResponse>(
        `/api/admin/sentry?statsPeriod=${statsPeriod}&limit=1`
      );
      return res.stats;
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Update Sentry issue status (resolve, ignore, unresolve)
 */
export function useUpdateSentryIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      status,
    }: {
      issueId: string;
      status: SentryIssueStatus;
    }) =>
      dashboardMutator<{ issue: SentryIssue; message: string }>(
        `/api/admin/sentry/${issueId}`,
        "PATCH",
        { status }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sentry.all });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update issue"
      );
    },
  });
}

/**
 * Bulk update multiple issues
 */
export function useBulkUpdateSentryIssues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueIds,
      status,
    }: {
      issueIds: string[];
      status: SentryIssueStatus;
    }) =>
      Promise.all(
        issueIds.map((issueId) =>
          dashboardMutator<{ issue: SentryIssue }>(
            `/api/admin/sentry/${issueId}`,
            "PATCH",
            { status }
          )
        )
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sentry.all });
      toast.success(`${variables.issueIds.length} issues marked as ${variables.status}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update issues"
      );
    },
  });
}

/**
 * Get Sentry check logs (cron job history)
 */
export function useSentryCheckLogs(page: number = 1) {
  return useQuery({
    queryKey: queryKeys.sentry.checkLogs(page),
    queryFn: () =>
      dashboardFetcher<{
        logs: SentryCheckLog[];
        total: number;
        page: number;
        pageSize: number;
      }>(`/api/admin/sentry/check-logs?page=${page}`),
    staleTime: STALE_TIMES.static,
  });
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type { SentryIssue, SentryIssueDetail, SentryEvent, SentryStats, SentryIssueStatus };
