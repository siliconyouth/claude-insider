"use client";

/**
 * Moderation Query Hooks
 *
 * TanStack Query hooks for moderation dashboard pages:
 * - Beta Applications
 * - Edit Suggestions
 * - Comments
 * - Reports
 *
 * All moderation pages share similar patterns:
 * - Paginated list with status filter
 * - Detail view in modal
 * - Status update mutations (approve/reject/etc.)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, type BetaFilters } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";
import type { AdminBetaApplication, PaginatedResponse } from "@/types/admin";

// ============================================
// TYPES
// ============================================

export type BetaStatus = "pending" | "approved" | "rejected" | "all";
export type SuggestionStatus = "pending" | "approved" | "rejected" | "merged" | "all";
export type CommentModerationStatus = "pending" | "approved" | "rejected" | "flagged" | "all";
export type ReportStatus = "pending" | "investigating" | "action_taken" | "dismissed" | "all";

export interface BetaListFilters {
  page: number;
  limit?: number;
  status?: BetaStatus;
}

export interface SuggestionListFilters {
  page?: number;
  limit?: number;
  status?: SuggestionStatus;
}

export interface CommentListFilters {
  page?: number;
  limit?: number;
  status?: CommentModerationStatus;
}

export interface ReportListFilters {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  type?: "user" | "comment" | "all";
}

export interface SuggestionWithUser {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_username: string | null;
  resource_type: "resource" | "doc";
  resource_id: string;
  suggestion_type: "content" | "metadata" | "typo" | "other";
  title: string;
  description: string;
  suggested_changes: string | null;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_image: string | null;
  user_username: string | null;
  resource_type: "resource" | "doc";
  resource_id: string;
  parent_id: string | null;
  content: string;
  status: string;
  is_edited: boolean;
  upvotes: number;
  downvotes: number;
  moderator_name: string | null;
  moderation_notes: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// BETA APPLICATION HOOKS
// ============================================

/**
 * Fetch paginated beta applications list with filters
 */
export function useBetaApplicationsList(filters: BetaListFilters) {
  const queryFilters: BetaFilters = {
    page: filters.page,
    pageSize: filters.limit || 20,
    status: filters.status !== "all" ? filters.status : undefined,
  };

  return useQuery({
    queryKey: queryKeys.beta.applications(queryFilters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page,
        limit: filters.limit || 20,
      };
      if (filters.status && filters.status !== "all") params.status = filters.status;

      return dashboardFetcher<PaginatedResponse<AdminBetaApplication>>("/api/dashboard/beta", params);
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Review beta application (approve/reject)
 */
export function useReviewBetaApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      reviewNotes,
    }: {
      applicationId: string;
      status: "approved" | "rejected";
      reviewNotes?: string;
    }) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/beta/${applicationId}`,
        "PATCH",
        { status, reviewNotes }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate beta applications list
      queryClient.invalidateQueries({ queryKey: ["dashboard", "beta"] });

      const message = variables.status === "approved"
        ? "Application approved! User is now a beta tester."
        : "Application rejected.";
      toast.success("Success", message);
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to review application");
    },
  });
}

// ============================================
// SUGGESTIONS HOOKS
// ============================================

/**
 * Fetch suggestions list with filters
 */
export function useSuggestionsList(filters: SuggestionListFilters) {
  return useQuery({
    queryKey: queryKeys.moderation.suggestions({
      page: filters.page,
      status: filters.status !== "all" ? filters.status : undefined,
    }),
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      return dashboardFetcher<{ suggestions: SuggestionWithUser[]; total: number }>(
        "/api/dashboard/suggestions",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Review suggestion (approve/reject/merge)
 */
export function useReviewSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      status,
      reviewerNotes,
    }: {
      suggestionId: string;
      status: "approved" | "rejected" | "merged";
      reviewerNotes?: string;
    }) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/suggestions/${suggestionId}`,
        "PATCH",
        { status, reviewerNotes }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "moderation", "suggestions"] });
      toast.success("Success", "Suggestion reviewed successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to review suggestion");
    },
  });
}

// ============================================
// COMMENTS HOOKS
// ============================================

/**
 * Fetch comments list with filters
 */
export function useCommentsList(filters: CommentListFilters) {
  return useQuery({
    queryKey: queryKeys.moderation.comments({
      page: filters.page,
      status: filters.status !== "all" ? filters.status : undefined,
    }),
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      return dashboardFetcher<{ comments: CommentWithUser[]; counts: Record<string, number> }>(
        "/api/dashboard/comments",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Moderate comment (approve/reject/flag)
 */
export function useModerateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      status,
      moderationNotes,
    }: {
      commentId: string;
      status: "approved" | "rejected" | "flagged";
      moderationNotes?: string;
    }) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/comments/${commentId}`,
        "PATCH",
        { status, moderationNotes }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "moderation", "comments"] });
      toast.success("Success", "Comment moderated successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to moderate comment");
    },
  });
}

/**
 * Delete comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/comments/${commentId}`,
        "DELETE"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "moderation", "comments"] });
      toast.success("Success", "Comment deleted successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to delete comment");
    },
  });
}

// ============================================
// REPORTS HOOKS
// ============================================

// Reports use server actions instead of API routes
import {
  getReports,
  getReportStats,
  reviewReport as reviewReportAction,
  type Report,
  type ReportStatus as ServerReportStatus,
  type ReportType as ServerReportType,
} from "@/app/actions/reports";

// Re-export types for consumers
export type { Report };
export type ReportTypeFilter = ServerReportType | "all";

/**
 * Fetch reports list with filters
 */
export function useReportsList(filters: ReportListFilters) {
  return useQuery({
    queryKey: queryKeys.moderation.reports({
      page: filters.page,
      status: filters.status !== "all" ? filters.status : undefined,
      type: filters.type !== "all" ? filters.type : undefined,
    }),
    queryFn: async () => {
      const result = await getReports({
        status: filters.status !== "all" ? (filters.status as ServerReportStatus) : undefined,
        type: filters.type !== "all" ? (filters.type as ServerReportType) : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch reports");
      }

      return { reports: result.reports || [], total: result.reports?.length || 0 };
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch report stats
 */
export function useReportStats() {
  return useQuery({
    queryKey: ["dashboard", "reports", "stats"],
    queryFn: async () => {
      const result = await getReportStats();

      if (!result.success || !result.stats) {
        throw new Error("Failed to fetch report stats");
      }

      return result.stats;
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Review report (investigate/action_taken/dismiss)
 */
export function useReviewReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      reviewNotes,
      actionTaken,
      reporterMessage,
    }: {
      reportId: string;
      status: "investigating" | "action_taken" | "dismissed";
      reviewNotes?: string;
      actionTaken?: string;
      reporterMessage?: string;
    }) => {
      const result = await reviewReportAction(reportId, status, {
        reviewNotes,
        actionTaken,
        reporterMessage,
        sendNotifications: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to review report");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "moderation", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "reports", "stats"] });
      toast.success("Success", "Report reviewed successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to review report");
    },
  });
}
