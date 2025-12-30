"use client";

/**
 * Dashboard Navigation Counts Hook
 *
 * Fetches pending item counts for navigation badges.
 * Uses TanStack Query with real-time polling for live updates.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { STALE_TIMES } from "@/lib/query";

// ============================================
// TYPES
// ============================================

export interface NavCounts {
  /** Beta applications with status='pending' */
  betaApplications: number;
  /** Feedback with status='open' */
  feedback: number;
  /** Edit suggestions with status='pending' */
  suggestions: number;
  /** Comments with status='pending' */
  comments: number;
  /** Reports with status='pending' */
  reports: number;
  /** Resource auto-update jobs pending/analyzing */
  autoUpdates: number;
  /** Pending notifications to send */
  notifications: number;
}

interface NavCountsResponse {
  counts: NavCounts;
  timestamp: string;
}

// ============================================
// HOOK
// ============================================

export function useNavCounts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.navCounts,
    queryFn: async (): Promise<NavCountsResponse> => {
      const response = await fetch("/api/dashboard/nav-counts", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch navigation counts");
      }

      return response.json();
    },
    staleTime: STALE_TIMES.realtime,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    counts: data?.counts ?? {
      betaApplications: 0,
      feedback: 0,
      suggestions: 0,
      comments: 0,
      reports: 0,
      autoUpdates: 0,
      notifications: 0,
    },
    isLoading,
    error,
    refetch,
  };
}
