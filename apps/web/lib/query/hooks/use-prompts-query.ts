"use client";

/**
 * Prompts Query Hooks
 *
 * TanStack Query hooks for the Prompts management dashboard.
 * Provides caching, pagination, and mutation support.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";

// ============================================
// TYPES
// ============================================

export interface PromptCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export interface PromptItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: PromptCategory | null;
  tags: string[];
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
  visibility: string;
  status: string;
  isFeatured: boolean;
  isSystem: boolean;
  useCount: number;
  saveCount: number;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptStats {
  activeCount: number;
  systemCount: number;
  featuredCount: number;
  publicCount: number;
  privateCount: number;
  totalUses: number;
}

export interface PromptListResponse {
  prompts: PromptItem[];
  categories: PromptCategory[];
  stats: PromptStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PromptListFilters {
  page: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: "system" | "user" | "";
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch paginated prompts list with filters
 */
export function usePromptsList(filters: PromptListFilters) {
  return useQuery({
    queryKey: queryKeys.prompts.list({
      page: filters.page,
      category: filters.category || undefined,
    }),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page,
        limit: filters.limit || 20,
      };

      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.type) {
        params.type = filters.type;
      }

      return dashboardFetcher<PromptListResponse>(
        "/api/dashboard/prompts",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch prompt detail by ID
 */
export function usePromptDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.prompts.detail(id || ""),
    queryFn: () =>
      dashboardFetcher<{ prompt: PromptItem }>(
        `/api/dashboard/prompts/${id}`
      ),
    enabled: !!id,
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Toggle prompt featured status
 */
export function useTogglePromptFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isFeatured,
    }: {
      id: string;
      isFeatured: boolean;
    }) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/prompts/${id}`,
        "PATCH",
        { isFeatured }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      toast.success(
        "Success",
        variables.isFeatured ? "Prompt featured" : "Prompt unfeatured"
      );
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to update prompt");
    },
  });
}

/**
 * Delete a prompt
 */
export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/prompts/${id}`,
        "DELETE"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      toast.success("Success", "Prompt deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to delete prompt");
    },
  });
}
