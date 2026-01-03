"use client";

/**
 * Base Dashboard Query Hooks
 *
 * Generic hooks for fetching and mutating dashboard data.
 * These wrap TanStack Query with dashboard-specific defaults.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  dashboardFetcher,
  dashboardMutator,
  STALE_TIMES,
  type PaginatedResponse,
} from "@/lib/query";
import { toast } from "@/components/toast";

/**
 * Hook for fetching a single dashboard resource
 */
export function useDashboardQuery<TData>(
  queryKey: readonly unknown[],
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey,
    queryFn: () => dashboardFetcher<TData>(endpoint, params),
    staleTime: STALE_TIMES.dashboard,
    ...options,
  });
}

/**
 * Hook for fetching paginated dashboard lists
 */
export function useDashboardList<TItem>(
  queryKey: readonly unknown[],
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Omit<UseQueryOptions<PaginatedResponse<TItem>>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey,
    queryFn: () => dashboardFetcher<PaginatedResponse<TItem>>(endpoint, params),
    staleTime: STALE_TIMES.dashboard,
    ...options,
  });
}

/**
 * Hook for fetching dashboard statistics (shorter stale time)
 */
export function useDashboardStats<TData>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey,
    queryFn: () => dashboardFetcher<TData>(endpoint),
    staleTime: STALE_TIMES.realtime,
    refetchInterval: 30 * 1000, // Auto-refresh every 30s
    ...options,
  });
}

/**
 * Mutation options with invalidation and toast notifications
 */
interface DashboardMutationOptions<TData, TVariables> {
  method?: "POST" | "PATCH" | "DELETE";
  invalidateKeys?: readonly (readonly unknown[])[];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

/**
 * Hook for dashboard mutations (create, update, delete)
 * Automatically invalidates related queries and shows toast notifications
 */
export function useDashboardMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: DashboardMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      dashboardMutator<TData, TVariables>(
        endpoint,
        options?.method || "PATCH",
        variables,
      ),
    onSuccess: (data, variables, _context) => {
      // Invalidate related queries
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Show success toast
      if (options?.successMessage) {
        toast.success("Success", options.successMessage);
      }

      // Call custom onSuccess
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      // Show error toast
      toast.error("Error", options?.errorMessage || error.message);

      // Call custom onError
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Hook for bulk actions (approve all, reject selected, etc.)
 */
export function useBulkMutation<TData = unknown>(
  endpoint: string,
  options?: DashboardMutationOptions<TData, { ids: string[]; action: string }>,
) {
  return useDashboardMutation<TData, { ids: string[]; action: string }>(
    endpoint,
    {
      method: "POST",
      ...options,
    },
  );
}

/**
 * Hook for optimistic updates
 * Updates the cache immediately, then reverts on error
 */
export function useOptimisticMutation<TData, TVariables extends { id: string }>(
  endpoint: string,
  queryKey: readonly unknown[],
  updateFn: (old: TData, variables: TVariables) => TData,
  options?: Omit<DashboardMutationOptions<TData, TVariables>, "invalidateKeys">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      dashboardMutator<TData, TVariables>(
        endpoint,
        options?.method || "PATCH",
        variables,
      ),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, updateFn(previousData, variables));
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      toast.error("Error", options?.errorMessage || error.message);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (data, variables) => {
      if (options?.successMessage) {
        toast.success("Success", options.successMessage);
      }
      options?.onSuccess?.(data, variables);
    },
  });
}
