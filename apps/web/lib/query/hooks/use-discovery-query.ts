"use client";

/**
 * Discovery Query Hooks
 *
 * TanStack Query hooks for the Resource Discovery dashboard.
 * Provides caching, automatic revalidation, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";

// ============================================
// TYPES
// ============================================

export type QueueStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface QueueItem {
  id: string;
  source_id: string;
  source_name?: string;
  source_type?: string;
  discovered_url: string;
  discovered_title: string | null;
  discovered_description: string | null;
  discovered_data: Record<string, unknown>;
  status: QueueStatus;
  reviewed_by: string | null;
  reviewer_name?: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  description: string | null;
  type: string;
  url: string;
  default_category: string | null;
  default_tags: string[];
  is_active: boolean;
  scan_frequency: string;
  last_scan_at: string | null;
  last_scan_status: string | null;
  last_scan_count: number;
  next_scan_at: string | null;
  queue_counts: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface DiscoveryStats {
  queue: {
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    total: number;
  };
  sources: {
    active: number;
    inactive: number;
    total: number;
    dueForScan: number;
    byType: Record<string, number>;
  };
  recentScans: Array<{
    id: string;
    name: string;
    last_scan_at: string | null;
    last_scan_status: string | null;
    last_scan_count: number;
  }>;
}

export interface QueueFilters {
  status: QueueStatus | "all";
  page: number;
  limit?: number;
}

export interface QueueResponse {
  items: QueueItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SourcesResponse {
  sources: Source[];
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch discovery stats (queue counts, source counts, recent scans)
 */
export function useDiscoveryStats() {
  return useQuery({
    queryKey: queryKeys.discovery.stats,
    queryFn: () => dashboardFetcher<DiscoveryStats>("/api/admin/discovery/stats"),
    staleTime: STALE_TIMES.realtime, // 10 seconds - stats change frequently
    refetchInterval: 30 * 1000, // Auto-refresh every 30s
  });
}

/**
 * Fetch discovery queue items with filters and pagination
 */
export function useDiscoveryQueue(filters: QueueFilters) {
  return useQuery({
    queryKey: queryKeys.discovery.queue(filters),
    queryFn: () =>
      dashboardFetcher<QueueResponse>("/api/admin/discovery/queue", {
        status: filters.status,
        page: filters.page,
        limit: filters.limit || 20,
      }),
    staleTime: STALE_TIMES.dashboard, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Fetch all discovery sources
 */
export function useDiscoverySources() {
  return useQuery({
    queryKey: queryKeys.discovery.sources,
    queryFn: () => dashboardFetcher<SourcesResponse>("/api/admin/discovery/sources"),
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Approve or reject a queue item
 */
export function useQueueAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      return dashboardMutator<{ success: boolean }, { id: string; action: string }>(
        "/api/admin/discovery/queue",
        "PATCH",
        { id, action }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate queue and stats
      queryClient.invalidateQueries({ queryKey: ["dashboard", "discovery", "queue"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.stats });

      toast.success(
        "Success",
        `Resource ${variables.action === "approve" ? "approved" : "rejected"}`
      );
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to update resource");
    },
  });
}

/**
 * Toggle source active status
 */
export function useSourceToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return dashboardMutator<{ success: boolean }, { id: string; action: string; isActive: boolean }>(
        "/api/admin/discovery/sources",
        "PATCH",
        { id, action: "toggle", isActive }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate sources and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.sources });
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.stats });

      toast.success(
        "Success",
        `Source ${variables.isActive ? "enabled" : "disabled"}`
      );
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to toggle source");
    },
  });
}

/**
 * Trigger a manual scan for a source
 */
export function useTriggerScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      return dashboardMutator<{ success: boolean }, { id: string; action: string }>(
        "/api/admin/discovery/sources",
        "POST",
        { id: sourceId, action: "scan" }
      );
    },
    onSuccess: () => {
      // Invalidate sources and stats to show scan in progress
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.sources });
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.stats });

      toast.success("Scan Started", "Source scan has been queued");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to trigger scan");
    },
  });
}

/**
 * Bulk approve/reject queue items
 */
export function useBulkQueueAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: "approve" | "reject" }) => {
      return dashboardMutator<{ success: boolean; count: number }, { ids: string[]; action: string }>(
        "/api/admin/discovery/queue/bulk",
        "POST",
        { ids, action }
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate queue and stats
      queryClient.invalidateQueries({ queryKey: ["dashboard", "discovery", "queue"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.stats });

      toast.success(
        "Bulk Action Complete",
        `${data.count} resources ${variables.action === "approve" ? "approved" : "rejected"}`
      );
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to perform bulk action");
    },
  });
}
