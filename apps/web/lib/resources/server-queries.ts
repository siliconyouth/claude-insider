/**
 * Server-Side Resource Queries
 *
 * Direct Supabase queries for Server Components with ISR caching.
 * This module is the single source of truth - no JSON files needed.
 *
 * Caching Strategy:
 * - Uses Next.js unstable_cache for function-level caching
 * - Revalidation triggered by webhook on database changes
 * - Default revalidation: 300 seconds (5 minutes)
 *
 * @module lib/resources/server-queries
 */

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  ResourceEntry,
  ResourceCategorySlug,
  ResourceStats,
  TagWithCount,
  DifficultyLevel,
  ResourceStatus,
} from "@/data/resources/schema";
import { RESOURCE_CATEGORIES } from "@/data/resources/schema";

// Cache tags for granular revalidation
export const CACHE_TAGS = {
  ALL_RESOURCES: "resources",
  RESOURCE_BY_SLUG: (slug: string) => `resource-${slug}`,
  RESOURCES_BY_CATEGORY: (category: string) => `resources-${category}`,
  RESOURCE_STATS: "resource-stats",
  RESOURCE_TAGS: "resource-tags",
} as const;

// Default revalidation time (5 minutes)
const DEFAULT_REVALIDATE = 300;

/**
 * Transform database row to ResourceEntry format
 */
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

  // Optional fields
  if (row.subcategory) entry.subcategory = row.subcategory;
  if (row.difficulty) entry.difficulty = row.difficulty as DifficultyLevel;
  if (row.version) entry.version = row.version;
  if (row.namespace) entry.namespace = row.namespace;
  if (row.is_featured) {
    entry.featured = true;
    if (row.featured_reason) entry.featuredReason = row.featured_reason;
  }

  // GitHub info
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

  // Screenshots - prefer screenshots array, fallback to primary_screenshot_url
  if (row.screenshots && row.screenshots.length > 0) {
    entry.screenshotUrl = row.screenshots[0];
    if (row.screenshots.length > 1) {
      entry.screenshots = row.screenshots;
    }
  } else if (row.primary_screenshot_url) {
    entry.screenshotUrl = row.primary_screenshot_url;
  }

  // AI-enhanced fields
  if (row.ai_overview) entry.aiOverview = row.ai_overview;
  if (row.ai_summary) entry.aiSummary = row.ai_summary;
  if (row.ai_analyzed_at) entry.aiAnalyzedAt = row.ai_analyzed_at.split("T")[0];
  if (row.ai_confidence !== null) entry.aiConfidence = row.ai_confidence;

  // AI-extracted arrays
  if (row.key_features?.length) entry.keyFeatures = row.key_features;
  if (row.use_cases?.length) entry.useCases = row.use_cases;
  if (row.pros?.length) entry.pros = row.pros;
  if (row.cons?.length) entry.cons = row.cons;
  if (row.target_audience?.length) entry.targetAudience = row.target_audience;
  if (row.prerequisites?.length) entry.prerequisites = row.prerequisites;

  // Relationship data
  if ((row.related_docs_count ?? 0) > 0) entry.relatedDocsCount = row.related_docs_count ?? 0;
  if ((row.related_resources_count ?? 0) > 0) entry.relatedResourcesCount = row.related_resources_count ?? 0;
  if (row.related_doc_slugs?.length) entry.relatedDocSlugs = row.related_doc_slugs;
  if (row.related_resource_slugs?.length) entry.relatedResourceSlugs = row.related_resource_slugs;

  // Screenshot metadata
  if (row.screenshot_metadata?.length) entry.screenshotMetadata = row.screenshot_metadata;
  if (row.primary_screenshot_url) entry.primaryScreenshotUrl = row.primary_screenshot_url;
  if (row.thumbnail_url) entry.thumbnailUrl = row.thumbnail_url;

  // Trending
  if ((row.views_this_week ?? 0) > 0) entry.viewsThisWeek = row.views_this_week ?? 0;
  if (row.trending_score !== null) entry.trendingScore = row.trending_score;

  return entry;
}

// Database resource type - matches Supabase nullable types
// Uses index signature to allow additional fields from Supabase
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
  added_at: string | null;
  last_verified_at: string | null;
  ai_overview: string | null;
  ai_summary: string | null;
  ai_analyzed_at: string | null;
  ai_confidence: number | null;
  key_features: string[] | null;
  use_cases: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  target_audience: string[] | null;
  prerequisites: string[] | null;
  related_docs_count: number | null;
  related_resources_count: number | null;
  related_doc_slugs: string[] | null;
  related_resource_slugs: string[] | null;
  screenshot_metadata: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
    order?: number;
  }> | null;
  primary_screenshot_url: string | null;
  thumbnail_url: string | null;
  views_this_week: number | null;
  trending_score: number | null;
  tags?: string[];
  // Allow additional fields from Supabase
  [key: string]: unknown;
}

/**
 * Get all resources (cached)
 */
export const getAllResources = unstable_cache(
  async (): Promise<ResourceEntry[]> => {
    const supabase = await createAdminClient();

    // Fetch resources with pagination
    const allResources: DatabaseResource[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .order("category")
        .order("title")
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Failed to fetch resources:", error);
        throw error;
      }

      if (!data || data.length === 0) break;

      allResources.push(...(data as unknown as DatabaseResource[]));

      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Fetch tags
    const { data: tagsData } = await supabase
      .from("resource_tags")
      .select("resource_id, tag");

    // Group tags by resource
    const tagsMap = new Map<string, string[]>();
    if (tagsData) {
      for (const tag of tagsData) {
        const existing = tagsMap.get(tag.resource_id) || [];
        existing.push(tag.tag);
        tagsMap.set(tag.resource_id, existing);
      }
    }

    // Transform and attach tags
    return allResources.map((row) => {
      const rowWithTags = { ...row, tags: tagsMap.get(row.id) || [] } as DatabaseResource;
      return transformToResourceEntry(rowWithTags);
    });
  },
  [CACHE_TAGS.ALL_RESOURCES],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES] }
);

/**
 * Get resources by category (cached)
 */
export const getResourcesByCategory = unstable_cache(
  async (category: ResourceCategorySlug): Promise<ResourceEntry[]> => {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .eq("category", category)
      .order("title");

    if (error) {
      console.error(`Failed to fetch resources for category "${category}":`, error);
      throw error;
    }

    // Fetch tags for these resources
    const resourceIds = data?.map((r) => r.id) || [];
    const { data: tagsData } = await supabase
      .from("resource_tags")
      .select("resource_id, tag")
      .in("resource_id", resourceIds);

    const tagsMap = new Map<string, string[]>();
    if (tagsData) {
      for (const tag of tagsData) {
        const existing = tagsMap.get(tag.resource_id) || [];
        existing.push(tag.tag);
        tagsMap.set(tag.resource_id, existing);
      }
    }

    return (data || []).map((row) => {
      const rowWithTags = { ...row, tags: tagsMap.get(row.id) || [] } as unknown as DatabaseResource;
      return transformToResourceEntry(rowWithTags);
    });
  },
  [CACHE_TAGS.ALL_RESOURCES],
  {
    revalidate: DEFAULT_REVALIDATE,
    tags: [CACHE_TAGS.ALL_RESOURCES],
  }
);

/**
 * Get resource by slug (cached)
 */
export const getResourceBySlug = unstable_cache(
  async (slug: string): Promise<ResourceEntry | null> => {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !data) {
      return null;
    }

    // Fetch tags
    const { data: tagsData } = await supabase
      .from("resource_tags")
      .select("tag")
      .eq("resource_id", data.id);

    const rowWithTags = {
      ...data,
      tags: tagsData?.map((t) => t.tag) || [],
    } as unknown as DatabaseResource;

    return transformToResourceEntry(rowWithTags);
  },
  [], // Cache key will be based on slug argument
  {
    revalidate: DEFAULT_REVALIDATE,
    tags: [CACHE_TAGS.ALL_RESOURCES],
  }
);

/**
 * Get resource stats (cached)
 */
export const getResourceStats = unstable_cache(
  async (): Promise<ResourceStats> => {
    const supabase = await createAdminClient();

    // Get total count
    const { count: totalResources } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    // Get counts by category
    const { data: categoryCounts } = await supabase
      .from("resources")
      .select("category")
      .eq("is_published", true);

    const categoryMap = new Map<string, number>();
    categoryCounts?.forEach((r) => {
      categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + 1);
    });

    // Build byCategory object
    const byCategory = {} as Record<ResourceCategorySlug, number>;
    for (const cat of RESOURCE_CATEGORIES) {
      byCategory[cat.slug] = categoryMap.get(cat.slug) || 0;
    }

    // Get featured count
    const { count: featuredCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("is_featured", true);

    // Get total stars
    const { data: starsData } = await supabase
      .from("resources")
      .select("github_stars")
      .eq("is_published", true);

    const totalStars = starsData?.reduce((sum, r) => sum + (r.github_stars || 0), 0) || 0;

    // Get unique tags count
    const { data: tagsData } = await supabase
      .from("resource_tags")
      .select("tag");

    const uniqueTags = new Set(tagsData?.map((t) => t.tag) || []);

    // Get recently added (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recentlyAdded } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("added_at", thirtyDaysAgo.toISOString());

    return {
      totalResources: totalResources || 0,
      totalCategories: RESOURCE_CATEGORIES.length,
      totalTags: uniqueTags.size,
      totalGitHubStars: totalStars,
      featuredCount: featuredCount || 0,
      recentlyAdded: recentlyAdded || 0,
      byCategory,
    };
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get all tags with counts (cached)
 */
export const getAllTags = unstable_cache(
  async (): Promise<TagWithCount[]> => {
    const supabase = await createAdminClient();

    const { data } = await supabase.from("resource_tags").select("tag");

    const tagCounts = new Map<string, number>();
    data?.forEach((row) => {
      tagCounts.set(row.tag, (tagCounts.get(row.tag) || 0) + 1);
    });

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
  [CACHE_TAGS.RESOURCE_TAGS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_TAGS] }
);

/**
 * Get popular tags (cached)
 */
export async function getPopularTags(limit: number = 20): Promise<TagWithCount[]> {
  const allTags = await getAllTags();
  return allTags.slice(0, limit);
}

/**
 * Get categories with counts (cached)
 */
export const getCategoriesWithCounts = unstable_cache(
  async () => {
    const supabase = await createAdminClient();

    const { data: categoryCounts } = await supabase
      .from("resources")
      .select("category")
      .eq("is_published", true);

    const countMap = new Map<string, number>();
    categoryCounts?.forEach((r) => {
      countMap.set(r.category, (countMap.get(r.category) || 0) + 1);
    });

    return RESOURCE_CATEGORIES.map((category) => ({
      ...category,
      count: countMap.get(category.slug) || 0,
    }));
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get featured resources (cached)
 */
export const getFeaturedResources = unstable_cache(
  async (limit?: number): Promise<ResourceEntry[]> => {
    const supabase = await createAdminClient();

    let query = supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("github_stars", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch featured resources:", error);
      throw error;
    }

    // Fetch tags
    const resourceIds = data?.map((r) => r.id) || [];
    const { data: tagsData } = await supabase
      .from("resource_tags")
      .select("resource_id, tag")
      .in("resource_id", resourceIds);

    const tagsMap = new Map<string, string[]>();
    if (tagsData) {
      for (const tag of tagsData) {
        const existing = tagsMap.get(tag.resource_id) || [];
        existing.push(tag.tag);
        tagsMap.set(tag.resource_id, existing);
      }
    }

    return (data || []).map((row) => {
      const rowWithTags = { ...row, tags: tagsMap.get(row.id) || [] } as unknown as DatabaseResource;
      return transformToResourceEntry(rowWithTags);
    });
  },
  [CACHE_TAGS.ALL_RESOURCES],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES] }
);

/**
 * Get recently added resources (cached)
 */
export const getRecentlyAdded = unstable_cache(
  async (limit: number = 10): Promise<ResourceEntry[]> => {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .order("added_at", { ascending: false })
      .limit(limit);

    return (data || []).map((row) => {
      const rowWithTags = { ...row, tags: [] } as unknown as DatabaseResource;
      return transformToResourceEntry(rowWithTags);
    });
  },
  [CACHE_TAGS.ALL_RESOURCES],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES] }
);

/**
 * Get top resources by stars (cached)
 */
export const getTopByStars = unstable_cache(
  async (limit: number = 10): Promise<ResourceEntry[]> => {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .not("github_stars", "is", null)
      .order("github_stars", { ascending: false })
      .limit(limit);

    return (data || []).map((row) => {
      const rowWithTags = { ...row, tags: [] } as unknown as DatabaseResource;
      return transformToResourceEntry(rowWithTags);
    });
  },
  [CACHE_TAGS.ALL_RESOURCES],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES] }
);

/**
 * Get difficulty stats (cached)
 */
export const getDifficultyStats = unstable_cache(
  async () => {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("resources")
      .select("difficulty")
      .eq("is_published", true);

    const counts: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };

    data?.forEach((r) => {
      const difficulty = r.difficulty as keyof typeof counts | null;
      if (difficulty && difficulty in counts) {
        counts[difficulty] = (counts[difficulty] ?? 0) + 1;
      }
    });

    return Object.entries(counts).map(([level, count]) => ({
      level: level as DifficultyLevel,
      count,
    }));
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get status stats (cached)
 */
export const getStatusStats = unstable_cache(
  async () => {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("resources")
      .select("status")
      .eq("is_published", true);

    const counts: Record<string, number> = {};

    data?.forEach((r) => {
      if (r.status) {
        counts[r.status] = (counts[r.status] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([status, count]) => ({
      status: status as ResourceStatus,
      count,
    }));
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get target audience stats (cached)
 */
export const getTargetAudienceStats = unstable_cache(
  async () => {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("resources")
      .select("target_audience")
      .eq("is_published", true)
      .not("target_audience", "is", null);

    const audienceCounts = new Map<string, number>();

    data?.forEach((r) => {
      r.target_audience?.forEach((audience: string) => {
        audienceCounts.set(audience, (audienceCounts.get(audience) || 0) + 1);
      });
    });

    return Array.from(audienceCounts.entries())
      .map(([audience, count]) => ({ audience, count }))
      .sort((a, b) => b.count - a.count);
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get use cases stats (cached)
 */
export const getUseCasesStats = unstable_cache(
  async () => {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from("resources")
      .select("use_cases")
      .eq("is_published", true)
      .not("use_cases", "is", null);

    const useCaseCounts = new Map<string, number>();

    data?.forEach((r) => {
      r.use_cases?.forEach((useCase: string) => {
        useCaseCounts.set(useCase, (useCaseCounts.get(useCase) || 0) + 1);
      });
    });

    return Array.from(useCaseCounts.entries())
      .map(([useCase, count]) => ({ useCase, count }))
      .sort((a, b) => b.count - a.count);
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get enhanced fields coverage (cached)
 */
export const getEnhancedFieldsCoverage = unstable_cache(
  async () => {
    const supabase = await createAdminClient();

    const { count: total } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    const { count: hasKeyFeatures } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("key_features", "is", null);

    const { count: hasPros } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("pros", "is", null);

    const { count: hasCons } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("cons", "is", null);

    const { count: hasTargetAudience } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("target_audience", "is", null);

    const { count: hasUseCases } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("use_cases", "is", null);

    const { count: hasPrerequisites } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("prerequisites", "is", null);

    return {
      total: total || 0,
      hasKeyFeatures: hasKeyFeatures || 0,
      hasPros: hasPros || 0,
      hasCons: hasCons || 0,
      hasTargetAudience: hasTargetAudience || 0,
      hasUseCases: hasUseCases || 0,
      hasPrerequisites: hasPrerequisites || 0,
    };
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);
