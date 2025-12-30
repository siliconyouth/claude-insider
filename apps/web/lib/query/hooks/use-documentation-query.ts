"use client";

/**
 * Documentation Query Hooks
 *
 * TanStack Query hooks for the Documentation management dashboard.
 * Provides caching, pagination, and mutation support.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, STALE_TIMES } from "..";

// ============================================
// TYPES
// ============================================

export interface DocumentationItem {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  version: number;
  scrapeStatus: string | null;
  relationshipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryStats {
  total: number;
  published: number;
  featured: number;
}

export interface DocumentationStats {
  totalDocResourceRelationships: number;
  docsWithRelationships: number;
  avgConfidence: number;
}

export interface DocumentationListResponse {
  documentation: DocumentationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories: Record<string, CategoryStats>;
  stats: DocumentationStats | null;
}

export interface DocumentationListFilters {
  page: number;
  limit?: number;
  category?: string;
  status?: "published" | "unpublished" | "all";
  search?: string;
  hasRelationships?: "true" | "false" | "all";
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch paginated documentation list with filters
 */
export function useDocumentationList(filters: DocumentationListFilters) {
  return useQuery({
    queryKey: queryKeys.documentation.list({
      page: filters.page,
      category: filters.category !== "all" ? filters.category : undefined,
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
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.hasRelationships && filters.hasRelationships !== "all") {
        params.hasRelationships = filters.hasRelationships;
      }

      return dashboardFetcher<DocumentationListResponse>(
        "/api/dashboard/documentation",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch documentation detail by slug
 */
export function useDocumentationDetail(slug: string | null) {
  return useQuery({
    queryKey: ["dashboard", "documentation", "detail", slug],
    queryFn: () =>
      dashboardFetcher<{
        documentation: DocumentationItem;
        relationships: unknown[];
        versions: unknown[];
      }>(`/api/dashboard/documentation/${encodeURIComponent(slug || "")}`),
    enabled: !!slug,
    staleTime: STALE_TIMES.dashboard,
  });
}
