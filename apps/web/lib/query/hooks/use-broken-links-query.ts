"use client";

/**
 * Broken Links Query Hooks
 *
 * TanStack Query hooks for the broken links moderation queue.
 * Handles:
 * - List broken links with status filtering
 * - Get validation statistics
 * - Actions: fix, hide, dismiss broken links
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";

// ============================================
// TYPES
// ============================================

export type BrokenLinkStatus =
  | "pending"
  | "reviewing"
  | "fixed"
  | "hidden"
  | "dismissed"
  | "all";

export interface BrokenLinkEntry {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceSlug: string;
  originalUrl: string;
  statusCode: number | null;
  errorMessage: string | null;
  suggestedUrl: string | null;
  status: Exclude<BrokenLinkStatus, "all">;
  createdAt: string;
}

export interface BrokenLinkQueueFilters {
  status?: BrokenLinkStatus;
  page?: number;
  limit?: number;
}

export interface BrokenLinkStats {
  totalResources: number;
  validated: number;
  unchecked: number;
  valid: number;
  invalid: number;
  pendingReview: number;
  lastFullScan: string | null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Get broken links queue with filtering
 */
export function useBrokenLinksQueue(filters: BrokenLinkQueueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.brokenLinks.queue(filters),
    queryFn: () =>
      dashboardFetcher<{ items: BrokenLinkEntry[]; total: number }>(
        `/api/admin/broken-links?status=${filters.status || "pending"}&page=${filters.page || 1}&limit=${filters.limit || 50}`
      ),
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Get link validation statistics
 */
export function useBrokenLinksStats() {
  return useQuery({
    queryKey: queryKeys.brokenLinks.stats,
    queryFn: () =>
      dashboardFetcher<BrokenLinkStats>("/api/admin/broken-links/stats"),
    staleTime: STALE_TIMES.static,
  });
}

/**
 * Fix a broken link with a new URL
 */
export function useFixBrokenLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, newUrl }: { entryId: string; newUrl: string }) =>
      dashboardMutator<{ success: boolean }>(
        `/api/admin/broken-links/${entryId}/fix`,
        "POST",
        { newUrl }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokenLinks.all });
      toast.success("Link fixed successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to fix link");
    },
  });
}

/**
 * Hide a resource with a broken link
 */
export function useHideBrokenLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      dashboardMutator<{ success: boolean }>(
        `/api/admin/broken-links/${entryId}/hide`,
        "POST",
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokenLinks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
      toast.success("Resource hidden");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to hide resource"
      );
    },
  });
}

/**
 * Dismiss a broken link entry (false positive)
 */
export function useDismissBrokenLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      dashboardMutator<{ success: boolean }>(
        `/api/admin/broken-links/${entryId}/dismiss`,
        "POST",
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokenLinks.all });
      toast.success("Entry dismissed");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to dismiss entry"
      );
    },
  });
}

/**
 * Trigger manual link validation
 */
export function useTriggerValidation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: {
      limit?: number;
      onlyUnchecked?: boolean;
      onlyBroken?: boolean;
    }) =>
      dashboardMutator<{ success: boolean; results: object }>(
        "/api/admin/broken-links/validate",
        "POST",
        options || {}
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokenLinks.all });
      const message = variables?.onlyBroken
        ? "Re-validation of broken links complete"
        : "Validation triggered";
      toast.success(message);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to trigger validation"
      );
    },
  });
}

/**
 * Bulk actions: hide-all or dismiss-all
 */
export function useBulkBrokenLinkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: "hide-all" | "dismiss-all") =>
      dashboardMutator<{ success: boolean; affected: number }>(
        "/api/admin/broken-links/bulk",
        "POST",
        { action }
      ),
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokenLinks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
      const actionLabel = action === "hide-all" ? "hidden" : "dismissed";
      toast.success(`${data.affected} resources ${actionLabel}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Bulk action failed"
      );
    },
  });
}

/**
 * Rediscover response types
 */
export interface RediscoverResult {
  resourceId: string;
  resourceTitle: string;
  originalUrl: string;
  suggestedUrl: string | null;
  source: string | null;
  status: "found" | "not_found" | "error";
  error?: string;
}

export interface RediscoverResponse {
  success: boolean;
  results: RediscoverResult[];
  summary: {
    total: number;
    found: number;
    notFound: number;
    errors: number;
  };
  message: string;
}

/**
 * Auto-rediscover broken links
 * Searches GitHub/npm for resources by name
 */
export function useRediscoverBrokenLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { limit?: number }) =>
      dashboardMutator<RediscoverResponse>(
        "/api/admin/broken-links/rediscover",
        "POST",
        options || { limit: 20 }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokenLinks.all });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to rediscover resources"
      );
    },
  });
}
