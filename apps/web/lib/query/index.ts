/**
 * TanStack Query Client Configuration
 *
 * This module provides the shared QueryClient instance and default options
 * for the dashboard. All dashboard pages use this for caching, deduplication,
 * and background refetching.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default stale times for different data types
 * - realtime: Data that changes frequently (e.g., badge counts)
 * - dashboard: Standard dashboard data (e.g., stats, lists)
 * - static: Rarely changing data (e.g., settings, user preferences)
 */
export const STALE_TIMES = {
  realtime: 5 * 1000, // 5 seconds
  dashboard: 30 * 1000, // 30 seconds
  static: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Create a new QueryClient with our default options
 * Each browser tab should have its own QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time for most queries
        staleTime: STALE_TIMES.dashboard,

        // Retry failed requests with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,

        // Don't refetch immediately on mount if data exists
        refetchOnMount: false,

        // Cache garbage collection time
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  });
}

/**
 * Generic fetcher for dashboard API routes
 * Handles authentication and error responses automatically
 */
export async function dashboardFetcher<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(endpoint, window.location.origin);

  // Add query params if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generic mutator for dashboard API routes
 * Handles PATCH/POST/DELETE with JSON body
 */
export async function dashboardMutator<T, TVariables = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "DELETE",
  variables?: TVariables,
): Promise<T> {
  const response = await fetch(endpoint, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: variables ? JSON.stringify(variables) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Type for paginated API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
