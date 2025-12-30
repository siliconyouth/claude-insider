"use client";

/**
 * Feedback Query Hooks
 *
 * TanStack Query hooks for the Feedback management dashboard.
 * Provides caching, pagination, and mutation support.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, type FeedbackFilters } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";
import type { AdminFeedback, PaginatedResponse } from "@/types/admin";
import type { FeedbackStatus, FeedbackType } from "@/lib/dashboard";

// ============================================
// TYPES
// ============================================

export interface FeedbackListFilters {
  page: number;
  limit?: number;
  status?: FeedbackStatus | "all";
  feedbackType?: FeedbackType | "all";
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch paginated feedback list with filters
 */
export function useFeedbackList(filters: FeedbackListFilters) {
  // Build query params (note: FeedbackFilters uses `type` not `feedbackType`)
  const queryFilters: FeedbackFilters = {
    page: filters.page,
    pageSize: filters.limit || 20,
    status: filters.status !== "all" ? filters.status : undefined,
    type: filters.feedbackType !== "all" ? filters.feedbackType : undefined,
  };

  return useQuery({
    queryKey: queryKeys.feedback.list(queryFilters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        page: filters.page,
        limit: filters.limit || 20,
      };
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.feedbackType && filters.feedbackType !== "all") params.feedbackType = filters.feedbackType;

      return dashboardFetcher<PaginatedResponse<AdminFeedback>>("/api/dashboard/feedback", params);
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}

/**
 * Fetch single feedback detail
 * Only fetches when feedbackId is provided (modal is open)
 */
export function useFeedbackDetail(feedbackId: string | null) {
  return useQuery({
    queryKey: queryKeys.feedback.detail(feedbackId || ""),
    queryFn: () => dashboardFetcher<AdminFeedback>(`/api/dashboard/feedback/${feedbackId}`),
    enabled: !!feedbackId, // Only fetch when feedbackId is set
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Update feedback status
 */
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: FeedbackStatus | string }) => {
      return dashboardMutator<{ success: boolean }, { status: string }>(
        `/api/dashboard/feedback/${feedbackId}`,
        "PATCH",
        { status }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate feedback detail and list
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.detail(variables.feedbackId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "feedback", "list"] });

      toast.success("Success", "Status updated successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to update status");
    },
  });
}

/**
 * Delete feedback
 */
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedbackId: string) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/feedback/${feedbackId}`,
        "DELETE"
      );
    },
    onSuccess: (_data, feedbackId) => {
      // Invalidate feedback list (detail doesn't need invalidation as it's deleted)
      queryClient.removeQueries({ queryKey: queryKeys.feedback.detail(feedbackId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "feedback", "list"] });

      toast.success("Success", "Feedback deleted successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to delete feedback");
    },
  });
}
