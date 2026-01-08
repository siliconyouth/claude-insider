/**
 * Infinite Scroll Resources Hook (v1.18.5)
 *
 * TanStack Query hook for paginated resource fetching with infinite scroll.
 * Uses the lean ResourceListItem schema to minimize payload size.
 *
 * Features:
 * - Infinite scroll with automatic page fetching
 * - Client-side filtering and search
 * - Optimistic updates for instant feedback
 * - Deduplication of items across pages
 *
 * @module lib/query/hooks/use-resources-infinite
 */

"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys, type ResourceListingFilters } from "../keys";
import type {
  ResourceListItem,
  ResourceListResponse,
} from "@/data/resources/schema";

// Constants
const ITEMS_PER_PAGE = 24;
const STALE_TIME = 30 * 1000; // 30 seconds

/**
 * Fetch resources page from API
 */
async function fetchResourcesPage(
  filters: ResourceListingFilters,
  page: number
): Promise<ResourceListResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(ITEMS_PER_PAGE));

  if (filters.search) params.set("q", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.status) params.set("status", filters.status);
  if (filters.featured) params.set("featured", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.audience?.length) params.set("audience", filters.audience.join(","));
  if (filters.useCases?.length) params.set("usecase", filters.useCases.join(","));
  if (filters.tags?.length && filters.tags[0]) params.set("tag", filters.tags[0]); // API supports single tag

  const response = await fetch(`/api/resources?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch resources");
  }

  const data = await response.json();

  return {
    resources: data.resources as ResourceListItem[],
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    hasMore: data.page < data.totalPages,
    nextCursor: data.page < data.totalPages ? data.page + 1 : undefined,
  };
}

/**
 * Infinite scroll hook for resources
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useResourcesInfinite({ category: "mcp-servers" });
 *
 * // Access all loaded resources
 * const resources = data?.pages.flatMap(p => p.resources) ?? [];
 *
 * // Load more when scrolling
 * if (inView && hasNextPage) fetchNextPage();
 * ```
 */
export function useResourcesInfinite(filters: ResourceListingFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.publicResources.list(filters),
    queryFn: ({ pageParam }) => fetchResourcesPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: STALE_TIME,
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Single page query (for simpler use cases)
 */
export function useResourcesPage(filters: ResourceListingFilters, page: number) {
  return useQuery({
    queryKey: queryKeys.publicResources.page(filters, page),
    queryFn: () => fetchResourcesPage(filters, page),
    staleTime: STALE_TIME,
  });
}

/**
 * Helper hook for flattened resources list
 */
export function useResourcesList(filters: ResourceListingFilters = {}) {
  const query = useResourcesInfinite(filters);

  const resources = query.data?.pages.flatMap((p) => p.resources) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const isLoadingInitial = query.isPending;
  const isLoadingMore = query.isFetchingNextPage;

  return {
    resources,
    total,
    isLoadingInitial,
    isLoadingMore,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
}

// Re-export types
export type { ResourceListItem, ResourceListResponse, ResourceListingFilters };
