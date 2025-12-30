"use client";

/**
 * Resources Admin Query Hooks
 *
 * TanStack Query hooks for the Resources admin management dashboard.
 * Provides caching, pagination, and filter support.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, STALE_TIMES } from "..";

// ============================================
// TYPES
// ============================================

export interface ResourceAdminItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  githubStars: number | null;
  githubLanguage: string | null;
  npmDownloads: number | null;
  pypiDownloads: number | null;
  viewsCount: number;
  favoritesCount: number;
  averageRating: number | null;
  aiSummary: string | null;
  aiAnalyzedAt: string | null;
  keyFeatures: string[];
  relatedDocsCount: number;
  relatedResourcesCount: number;
  docRelationshipCount: number;
  resourceRelationshipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCategoryStats {
  total: number;
  published: number;
  featured: number;
  enhanced: number;
}

export interface ResourceAdminStats {
  total: number;
  enhanced: number;
  withSummary: number;
  withFeatures: number;
  withRelationships: number;
}

export interface ResourceAdminListResponse {
  resources: ResourceAdminItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories: Record<string, ResourceCategoryStats>;
  stats: ResourceAdminStats;
}

export interface ResourceAdminListFilters {
  page: number;
  limit?: number;
  category?: string;
  status?: "published" | "unpublished" | "all";
  enhancement?: "enhanced" | "pending" | "all";
  search?: string;
  hasRelationships?: "true" | "false" | "all";
  sortBy?: "updated_at" | "stars" | "views" | "rating" | "title";
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch paginated resources admin list with filters
 */
export function useResourcesAdminList(filters: ResourceAdminListFilters) {
  return useQuery({
    queryKey: queryKeys.resources.list({
      page: filters.page,
      pageSize: filters.limit || 20,
      category: filters.category !== "all" ? filters.category : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
    }),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page,
        limit: filters.limit || 20,
      };

      if (filters.category && filters.category !== "all") {
        params.category = filters.category;
      }
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }
      if (filters.enhancement && filters.enhancement !== "all") {
        params.enhancement = filters.enhancement;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.hasRelationships && filters.hasRelationships !== "all") {
        params.hasRelationships = filters.hasRelationships;
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
      }

      return dashboardFetcher<ResourceAdminListResponse>(
        "/api/dashboard/resources-admin",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch resource detail by ID
 */
export function useResourceAdminDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.resources.detail(id || ""),
    queryFn: () =>
      dashboardFetcher<{
        resource: ResourceAdminItem;
        relationships: unknown[];
      }>(`/api/dashboard/resources-admin/${id}`),
    enabled: !!id,
    staleTime: STALE_TIMES.dashboard,
  });
}
