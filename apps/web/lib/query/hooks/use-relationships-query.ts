"use client";

/**
 * Relationships Query Hooks
 *
 * TanStack Query hooks for the Relationships management dashboard.
 * Handles both doc-resource and resource-resource relationships.
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardFetcher, STALE_TIMES } from "..";

// ============================================
// TYPES
// ============================================

export interface DocResourceRelationship {
  id: string;
  docSlug: string;
  docTitle: string;
  docCategory: string;
  resourceId: string;
  resourceSlug: string;
  resourceTitle: string;
  resourceCategory: string;
  relationshipType: string;
  confidenceScore: number;
  aiReasoning: string | null;
  isManual: boolean;
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceResourceRelationship {
  id: string;
  sourceResourceId: string;
  sourceSlug: string;
  sourceTitle: string;
  sourceCategory: string;
  targetResourceId: string;
  targetSlug: string;
  targetTitle: string;
  targetCategory: string;
  relationshipType: string;
  confidenceScore: number;
  aiReasoning: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocResourceStats {
  total: number;
  manual: number;
  aiGenerated: number;
  avgConfidence: number;
  uniqueDocs: number;
  uniqueResources: number;
}

export interface ResourceResourceStats {
  total: number;
  manual: number;
  aiGenerated: number;
  avgConfidence: number;
}

export interface DocResourceApiResponse {
  type: "doc_resource";
  relationships: DocResourceRelationship[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: DocResourceStats;
  typeCounts: Record<string, number>;
}

export interface ResourceResourceApiResponse {
  type: "resource_resource";
  relationships: ResourceResourceRelationship[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ResourceResourceStats;
  typeCounts: Record<string, number>;
}

export type RelationshipsApiResponse =
  | DocResourceApiResponse
  | ResourceResourceApiResponse;

export interface RelationshipsListFilters {
  page: number;
  limit?: number;
  type: "doc_resource" | "resource_resource";
  search?: string;
  relationshipType?: string;
  isManual?: "true" | "false" | "all";
  minConfidence?: string;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch relationships list with filters
 * Returns different data shape based on type filter
 */
export function useRelationshipsList(filters: RelationshipsListFilters) {
  return useQuery({
    queryKey: [
      "dashboard",
      "relationships",
      filters.type,
      {
        page: filters.page,
        relationshipType: filters.relationshipType,
        isManual: filters.isManual,
        minConfidence: filters.minConfidence,
        search: filters.search,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page,
        limit: filters.limit || 30,
        type: filters.type,
      };

      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.relationshipType && filters.relationshipType !== "all") {
        params.relationshipType = filters.relationshipType;
      }
      if (filters.isManual && filters.isManual !== "all") {
        params.isManual = filters.isManual;
      }
      if (filters.minConfidence) {
        params.minConfidence = filters.minConfidence;
      }

      return dashboardFetcher<RelationshipsApiResponse>(
        "/api/dashboard/relationships",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Type guard for doc-resource response
 */
export function isDocResourceResponse(
  response: RelationshipsApiResponse
): response is DocResourceApiResponse {
  return response.type === "doc_resource";
}

/**
 * Type guard for resource-resource response
 */
export function isResourceResourceResponse(
  response: RelationshipsApiResponse
): response is ResourceResourceApiResponse {
  return response.type === "resource_resource";
}
