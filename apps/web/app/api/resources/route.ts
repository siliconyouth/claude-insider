/**
 * Resources API
 *
 * Returns all resources with optional filtering.
 * Public endpoint - no authentication required.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourcesByCategory,
  getFeaturedResources,
  getResourceStats,
  getCategoriesWithCounts,
  getPopularTags,
  type ResourceCategorySlug,
} from "@/data/resources";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as ResourceCategorySlug | null;
    const featured = searchParams.get("featured");
    const limit = searchParams.get("limit");
    const includeStats = searchParams.get("stats") === "true";
    const includeCategories = searchParams.get("categories") === "true";
    const includeTags = searchParams.get("tags") === "true";

    let resources;

    // Filter by category if provided
    if (category) {
      resources = getResourcesByCategory(category);
    } else if (featured === "true") {
      resources = getFeaturedResources(limit ? parseInt(limit, 10) : undefined);
    } else {
      resources = getAllResources();
    }

    // Apply limit if provided and no specific filter already applied it
    if (limit && !featured) {
      resources = resources.slice(0, parseInt(limit, 10));
    }

    // Build response
    const response: Record<string, unknown> = {
      resources,
      count: resources.length,
    };

    // Include stats if requested
    if (includeStats) {
      response.stats = getResourceStats();
    }

    // Include categories if requested
    if (includeCategories) {
      response.categories = getCategoriesWithCounts();
    }

    // Include popular tags if requested
    if (includeTags) {
      response.tags = getPopularTags(20);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Resources API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get resources" },
      { status: 500 }
    );
  }
}
