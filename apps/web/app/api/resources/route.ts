/**
 * Resources API
 *
 * Provides filtered, paginated resource data for client-side queries.
 * Uses database as source of truth with server-side caching.
 *
 * Query Parameters:
 * - q: Search query (searches title and description)
 * - category: Filter by category slug
 * - tag: Filter by tag
 * - difficulty: Filter by difficulty level
 * - status: Filter by status
 * - featured: Show only featured resources
 * - sort: Sort order (relevance, stars, recent, title)
 * - page: Page number (default 1)
 * - limit: Items per page (default 24, max 100)
 * - stats: Include stats in response
 * - categories: Include categories in response
 * - tags: Include popular tags in response
 *
 * @module app/api/resources/route
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getResourceStats,
  getCategoriesWithCounts,
  getPopularTags,
} from "@/lib/resources/server-queries";
import type {
  ResourceEntry,
  ResourceCategorySlug,
  DifficultyLevel,
  ResourceStatus,
} from "@/data/resources/schema";

interface DatabaseResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory: string | null;
  status: string | null;
  is_featured: boolean | null;
  featured_reason: string | null;
  difficulty: string | null;
  version: string | null;
  namespace: string | null;
  github_owner: string | null;
  github_repo: string | null;
  github_stars: number | null;
  github_forks: number | null;
  github_language: string | null;
  github_last_commit: string | null;
  screenshots: string[] | null;
  primary_screenshot_url: string | null;
  added_at: string | null;
  last_verified_at: string | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  key_features: string[] | null;
  use_cases: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  target_audience: string[] | null;
  prerequisites: string[] | null;
  tags?: string[];
}

function transformToResourceEntry(row: DatabaseResource): ResourceEntry {
  const entry: ResourceEntry = {
    id: row.slug,
    title: row.title,
    description: row.description,
    url: row.url,
    category: row.category as ResourceCategorySlug,
    tags: row.tags || [],
    status: (row.status as ResourceStatus) || "community",
    addedDate: row.added_at?.split("T")[0] || "",
    lastVerified: row.last_verified_at?.split("T")[0] || row.added_at?.split("T")[0] || "",
  };

  if (row.subcategory) entry.subcategory = row.subcategory;
  if (row.difficulty) entry.difficulty = row.difficulty as DifficultyLevel;
  if (row.version) entry.version = row.version;
  if (row.namespace) entry.namespace = row.namespace;

  if (row.is_featured) {
    entry.featured = true;
    if (row.featured_reason) entry.featuredReason = row.featured_reason;
  }

  if (row.github_owner && row.github_repo) {
    entry.github = {
      owner: row.github_owner,
      repo: row.github_repo,
      stars: row.github_stars ?? 0,
      forks: row.github_forks ?? 0,
      lastUpdated: row.github_last_commit?.split("T")[0] || entry.addedDate,
      language: row.github_language || "Unknown",
    };
  }

  // Screenshots
  if (row.screenshots && row.screenshots.length > 0) {
    entry.screenshotUrl = row.screenshots[0];
  } else if (row.primary_screenshot_url) {
    entry.screenshotUrl = row.primary_screenshot_url;
  }

  // AI fields
  if (row.ai_summary) entry.aiSummary = row.ai_summary;
  if (row.ai_confidence !== null) entry.aiConfidence = row.ai_confidence;
  if (row.key_features?.length) entry.keyFeatures = row.key_features;
  if (row.use_cases?.length) entry.useCases = row.use_cases;
  if (row.pros?.length) entry.pros = row.pros;
  if (row.cons?.length) entry.cons = row.cons;
  if (row.target_audience?.length) entry.targetAudience = row.target_audience;
  if (row.prerequisites?.length) entry.prerequisites = row.prerequisites;

  return entry;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") as ResourceCategorySlug | null;
    const tag = searchParams.get("tag");
    const difficulty = searchParams.get("difficulty") as DifficultyLevel | null;
    const status = searchParams.get("status") as ResourceStatus | null;
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 100);

    // Optional response additions
    const includeStats = searchParams.get("stats") === "true";
    const includeCategories = searchParams.get("categories") === "true";
    const includeTags = searchParams.get("tags") === "true";

    // Enhanced filters
    const audiences = searchParams.get("audience")?.split(",").filter(Boolean) || [];
    const useCases = searchParams.get("usecase")?.split(",").filter(Boolean) || [];
    const minFeatures = searchParams.get("minFeatures") ? parseInt(searchParams.get("minFeatures")!) : null;
    const hasPros = searchParams.get("hasPros") === "true" ? true : null;
    const hasCons = searchParams.get("hasCons") === "true" ? true : null;

    const supabase = await createAdminClient();

    // Build query
    let dbQuery = supabase
      .from("resources")
      .select("*", { count: "exact" })
      .eq("is_published", true);

    // Apply filters
    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }

    if (difficulty) {
      dbQuery = dbQuery.eq("difficulty", difficulty);
    }

    if (status) {
      dbQuery = dbQuery.eq("status", status);
    }

    if (featured) {
      dbQuery = dbQuery.eq("is_featured", true);
    }

    // Text search
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Enhanced filters
    if (audiences.length > 0) {
      dbQuery = dbQuery.overlaps("target_audience", audiences);
    }

    if (useCases.length > 0) {
      dbQuery = dbQuery.overlaps("use_cases", useCases);
    }

    if (hasPros) {
      dbQuery = dbQuery.not("pros", "is", null);
    }

    if (hasCons) {
      dbQuery = dbQuery.not("cons", "is", null);
    }

    // Sorting - always include slug as stable tie-breaker to prevent duplicates across pages
    switch (sort) {
      case "stars":
        dbQuery = dbQuery
          .order("github_stars", { ascending: false, nullsFirst: false })
          .order("slug", { ascending: true });
        break;
      case "recent":
        dbQuery = dbQuery
          .order("added_at", { ascending: false })
          .order("slug", { ascending: true });
        break;
      case "title":
        dbQuery = dbQuery
          .order("title", { ascending: true })
          .order("slug", { ascending: true });
        break;
      default:
        // Relevance - order by featured first, then stars, then slug for stability
        dbQuery = dbQuery
          .order("is_featured", { ascending: false })
          .order("github_stars", { ascending: false, nullsFirst: false })
          .order("slug", { ascending: true });
    }

    // Pagination
    const offset = (page - 1) * limit;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("Failed to fetch resources:", error);
      return NextResponse.json(
        { error: "Failed to fetch resources" },
        { status: 500 }
      );
    }

    // Fetch tags for results
    const resourceIds = data?.map((r) => r.id) || [];
    const tagsMap = new Map<string, string[]>();

    if (resourceIds.length > 0) {
      const { data: tagsData } = await supabase
        .from("resource_tags")
        .select("resource_id, tag")
        .in("resource_id", resourceIds);

      if (tagsData) {
        for (const t of tagsData) {
          const existing = tagsMap.get(t.resource_id) || [];
          existing.push(t.tag);
          tagsMap.set(t.resource_id, existing);
        }
      }
    }

    // Filter by tag if specified (post-query since it requires join)
    let filteredData = data || [];
    if (tag) {
      const resourceIdsWithTag = new Set<string>();
      for (const [resourceId, tags] of tagsMap.entries()) {
        if (tags.includes(tag)) {
          resourceIdsWithTag.add(resourceId);
        }
      }
      filteredData = filteredData.filter((r) => resourceIdsWithTag.has(r.id));
    }

    // Filter by min features
    if (minFeatures !== null) {
      filteredData = filteredData.filter(
        (r) => r.key_features && r.key_features.length >= minFeatures
      );
    }

    // Transform to ResourceEntry format
    const resources = filteredData.map((row) => {
      const rowWithTags: DatabaseResource = { ...row, tags: tagsMap.get(row.id) || [] };
      return transformToResourceEntry(rowWithTags);
    });

    // Build response
    const response: Record<string, unknown> = {
      resources,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };

    // Include optional data if requested
    if (includeStats) {
      response.stats = await getResourceStats();
    }

    if (includeCategories) {
      response.categories = await getCategoriesWithCounts();
    }

    if (includeTags) {
      response.tags = await getPopularTags(20);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Resources API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
