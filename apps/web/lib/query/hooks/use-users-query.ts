"use client";

/**
 * Users Query Hooks
 *
 * TanStack Query hooks for the Users management dashboard.
 * Provides caching, pagination, and mutation support.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, type UsersFilters } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";
import { banUser, unbanUser } from "@/app/actions/ban-appeals";
import { getAdminUserActivity, getActivityStats } from "@/app/actions/user-activity";
import type { AdminUserListItem, AdminUserDetail, PaginatedResponse } from "@/types/admin";
import type { UserRole } from "@/lib/roles";

// ============================================
// TYPES
// ============================================

export interface UserListFilters {
  page: number;
  limit?: number;
  search?: string;
  role?: string;
  isBetaTester?: boolean;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch paginated users list with filters
 */
export function useUsersList(filters: UserListFilters) {
  // Build query params
  const queryFilters: UsersFilters = {
    page: filters.page,
    pageSize: filters.limit || 20,
    search: filters.search,
    role: filters.role,
  };

  return useQuery({
    queryKey: queryKeys.users.list(queryFilters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        page: filters.page,
        limit: filters.limit || 20,
      };
      if (filters.search) params.search = filters.search;
      if (filters.role && filters.role !== "all") params.role = filters.role;
      if (filters.isBetaTester !== undefined) params.isBetaTester = filters.isBetaTester;

      return dashboardFetcher<PaginatedResponse<AdminUserListItem>>("/api/dashboard/users", params);
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}

/**
 * Fetch single user detail
 * Only fetches when userId is provided (modal is open)
 */
export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId || ""),
    queryFn: () => dashboardFetcher<AdminUserDetail>(`/api/dashboard/users/${userId}`),
    enabled: !!userId, // Only fetch when userId is set
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Fetch user activity and stats
 * Only fetches when enabled
 */
export function useUserActivity(userId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ["dashboard", "users", "activity", userId] as const,
    queryFn: async () => {
      if (!userId) return { activities: [], stats: null };

      const [activityResult, statsResult] = await Promise.all([
        getAdminUserActivity(userId, 50),
        getActivityStats(userId),
      ]);

      return {
        activities: activityResult.success ? activityResult.activities || [] : [],
        stats: statsResult.success ? statsResult.stats || null : null,
      };
    },
    enabled: !!userId && enabled,
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      return dashboardMutator<{ success: boolean }, { role: UserRole }>(
        `/api/dashboard/users/${userId}`,
        "PATCH",
        { role }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate user detail and list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "users", "list"] });

      toast.success("Success", `Role updated to ${variables.role}`);
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to update role");
    },
  });
}

/**
 * Ban a user
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const result = await banUser(userId, reason);
      if (!result.success) throw new Error(result.error || "Failed to ban user");
      return result;
    },
    onSuccess: (_data, variables) => {
      // Invalidate user detail and list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "users", "list"] });

      toast.success("Success", "User banned successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to ban user");
    },
  });
}

/**
 * Unban a user
 */
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await unbanUser(userId);
      if (!result.success) throw new Error(result.error || "Failed to unban user");
      return result;
    },
    onSuccess: (_data, userId) => {
      // Invalidate user detail and list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "users", "list"] });

      toast.success("Success", "User unbanned successfully");
    },
    onError: (error) => {
      toast.error("Error", error.message || "Failed to unban user");
    },
  });
}
