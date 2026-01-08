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
 * Check if Supabase credentials are available
 * Returns false in CI/build environments without database access
 */
function hasSupabaseCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}

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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return null;
    }
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
    if (!hasSupabaseCredentials()) {
      const byCategory = {} as Record<ResourceCategorySlug, number>;
      for (const cat of RESOURCE_CATEGORIES) {
        byCategory[cat.slug] = 0;
      }
      return { totalResources: 0, totalCategories: 0, totalTags: 0, totalGitHubStars: 0, featuredCount: 0, recentlyAdded: 0, byCategory };
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return RESOURCE_CATEGORIES.map((category) => ({ ...category, count: 0 }));
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return [{ level: "beginner" as DifficultyLevel, count: 0 }, { level: "intermediate" as DifficultyLevel, count: 0 }, { level: "advanced" as DifficultyLevel, count: 0 }, { level: "expert" as DifficultyLevel, count: 0 }];
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return [];
    }
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
    if (!hasSupabaseCredentials()) {
      return { total: 0, hasKeyFeatures: 0, hasPros: 0, hasCons: 0, hasTargetAudience: 0, hasUseCases: 0, hasPrerequisites: 0, hasAiAnalysis: 0 };
    }
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

    const { count: hasAiAnalysis } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .not("ai_summary", "is", null);

    return {
      total: total || 0,
      hasKeyFeatures: hasKeyFeatures || 0,
      hasPros: hasPros || 0,
      hasCons: hasCons || 0,
      hasTargetAudience: hasTargetAudience || 0,
      hasUseCases: hasUseCases || 0,
      hasPrerequisites: hasPrerequisites || 0,
      hasAiAnalysis: hasAiAnalysis || 0,
    };
  },
  [CACHE_TAGS.RESOURCE_STATS],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.RESOURCE_STATS] }
);

// =============================================================================
// FULL RESOURCE TYPES (for individual resource pages)
// =============================================================================

/**
 * Full database row type for resources (all 60+ fields)
 */
export interface FullResourceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  long_description: string | null;
  url: string;
  category: string;
  subcategory: string | null;
  status: string;
  is_featured: boolean;
  featured_reason: string | null;
  is_published: boolean;
  difficulty: string | null;
  version: string | null;
  namespace: string | null;
  pricing: string;
  price_details: Record<string, unknown> | null;
  platforms: string[];
  license: string | null;
  website_url: string | null;
  docs_url: string | null;
  changelog_url: string | null;
  discord_url: string | null;
  twitter_url: string | null;
  github_owner: string | null;
  github_repo: string | null;
  github_stars: number;
  github_forks: number;
  github_issues: number;
  github_language: string | null;
  github_last_commit: string | null;
  github_contributors: number;
  npm_package: string | null;
  npm_downloads_weekly: number;
  pypi_package: string | null;
  pypi_downloads_monthly: number;
  icon_url: string | null;
  banner_url: string | null;
  screenshots: string[];
  video_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  views_count: number;
  favorites_count: number;
  ratings_count: number;
  average_rating: number;
  reviews_count: number;
  comments_count: number;
  added_at: string;
  last_verified_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  // Enhanced fields (Migration 088)
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
  // Relationship denormalization
  related_docs_count: number;
  related_resources_count: number;
  related_doc_slugs: string[] | null;
  related_resource_slugs: string[] | null;
  // Screenshot metadata
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
  // Trending/popularity
  views_this_week: number;
  trending_score: number | null;
  trending_calculated_at: string | null;
}

export interface ResourceAuthor {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  github_username: string | null;
  twitter_username: string | null;
  website_url: string | null;
  avatar_url: string | null;
  is_primary: boolean;
}

export interface ResourceAlternative {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon_url: string | null;
  github_stars: number;
  relationship: string;
}

export interface FullResourceWithDetails extends FullResourceRow {
  tags: string[];
  authors: ResourceAuthor[];
  alternatives: ResourceAlternative[];
}

/**
 * Get full resource by slug with all details (cached)
 * Used for individual resource pages that need all 60+ fields
 */
export const getFullResourceBySlug = unstable_cache(
  async (slug: string): Promise<FullResourceWithDetails | null> => {
    if (!hasSupabaseCredentials()) {
      return null;
    }
    const supabase = await createAdminClient();

    // Get main resource
    const { data: resource, error } = await supabase
      .from("resources")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !resource) {
      return null;
    }

    // Fetch all related data in parallel
    const [tagsResult, authorsResult, alternativesResult] = await Promise.all([
      // Get tags
      supabase
        .from("resource_tags")
        .select("tag")
        .eq("resource_id", resource.id)
        .order("tag"),
      // Get authors
      supabase
        .from("resource_authors")
        .select("id, user_id, name, role, github_username, twitter_username, website_url, avatar_url, is_primary")
        .eq("resource_id", resource.id)
        .order("is_primary", { ascending: false })
        .order("name"),
      // Get alternatives via join
      supabase
        .from("resource_alternatives")
        .select(`
          alternative_resource_id,
          relationship,
          resources!resource_alternatives_alternative_resource_id_fkey (
            id, slug, title, description, category, icon_url, github_stars
          )
        `)
        .eq("resource_id", resource.id)
        .limit(8),
    ]);

    // Process alternatives - need to flatten the joined data
    const alternatives: ResourceAlternative[] = [];
    if (alternativesResult.data) {
      for (const alt of alternativesResult.data) {
        const relatedResource = alt.resources as unknown as {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          icon_url: string | null;
          github_stars: number;
        } | null;
        if (relatedResource) {
          alternatives.push({
            id: relatedResource.id,
            slug: relatedResource.slug,
            title: relatedResource.title,
            description: relatedResource.description,
            category: relatedResource.category,
            icon_url: relatedResource.icon_url,
            github_stars: relatedResource.github_stars,
            relationship: alt.relationship || "alternative",
          });
        }
      }
    }

    return {
      ...resource,
      tags: tagsResult.data?.map((t) => t.tag) || [],
      authors: (authorsResult.data as ResourceAuthor[]) || [],
      alternatives,
    } as FullResourceWithDetails;
  },
  [], // Dynamic cache key based on slug
  {
    revalidate: DEFAULT_REVALIDATE,
    tags: [CACHE_TAGS.ALL_RESOURCES],
  }
);

/**
 * Get all published resource slugs (cached)
 * Used for static generation
 *
 * NOTE: Returns empty array if Supabase credentials are not available (CI builds).
 * This means individual resource pages will be generated on-demand via ISR
 * instead of statically at build time.
 */
export const getAllResourceSlugs = unstable_cache(
  async (): Promise<string[]> => {
    if (!hasSupabaseCredentials()) {
      return [];
    }

    try {
      const supabase = await createAdminClient();

      const { data, error } = await supabase
        .from("resources")
        .select("slug")
        .eq("is_published", true)
        .order("slug");

      if (error) {
        console.error("Failed to fetch resource slugs:", error);
        return [];
      }

      return data?.map((r) => r.slug) || [];
    } catch (err) {
      console.error("[getAllResourceSlugs] Error:", err);
      return [];
    }
  },
  [CACHE_TAGS.ALL_RESOURCES],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES] }
);

// Re-export schema constants and types for convenience
export { RESOURCE_CATEGORIES } from "@/data/resources/schema";
export type {
  ResourceEntry,
  ResourceCategory,
  ResourceCategorySlug,
  ResourceStats,
  TagWithCount,
  DifficultyLevel,
  ResourceStatus,
} from "@/data/resources/schema";

// Re-export types from shared types module
export type {
  ResourcesSectionData,
  EnhancedFieldsCoverage,
  AudienceStatsItem,
  CategoryWithCount,
  HeroFeaturedProps,
  TrendingResourcesProps,
  CategoryQuickLinksProps,
} from "./types";

/**
 * Fetch all data needed for the homepage Resources Section
 *
 * This function parallelizes all queries for optimal performance.
 * Used by the homepage Server Component to pass data to client components.
 */
export async function getResourcesSectionData(): Promise<import("./types").ResourcesSectionData> {
  // Parallel fetch all data
  const [
    stats,
    coverage,
    popularTags,
    audienceStats,
    featuredResources,
    topByStars,
    categoriesWithCounts,
  ] = await Promise.all([
    getResourceStats(),
    getEnhancedFieldsCoverage(),
    getPopularTags(15),
    getTargetAudienceStats(),
    getFeaturedResources(10),
    getTopByStars(10),
    getCategoriesWithCounts(),
  ]);

  return {
    stats,
    coverage,
    popularTags,
    audienceStats: audienceStats.slice(0, 6),
    featuredResources,
    topByStars,
    categoriesWithCounts,
  };
}

// =============================================================================
// LEAN SCHEMA QUERIES (v1.18.5)
// =============================================================================
// These functions return ResourceListItem (lean schema) for listings pages.
// Each cached item stays well under the 2MB Next.js unstable_cache limit.

import type {
  ResourceListItem,
  ResourceListResponse,
  ResourcePageInitialData,
} from "@/data/resources/schema";

// Columns for lean listing queries (only what's needed for cards)
const LEAN_COLUMNS = `
  slug,
  title,
  description,
  url,
  category,
  status,
  difficulty,
  is_featured,
  featured_reason,
  github_stars,
  github_language,
  primary_screenshot_url,
  thumbnail_url,
  ai_summary,
  key_features,
  added_at,
  last_verified_at
`;

/**
 * Cache size monitoring utility
 *
 * MANDATORY: Call this in development to catch cache size issues before production.
 * Next.js unstable_cache has a hard 2MB limit per cached item.
 */
const CACHE_SIZE_LIMIT = 2 * 1024 * 1024; // 2MB
const CACHE_SIZE_WARNING_THRESHOLD = 0.75; // Warn at 75%

function checkCacheSize<T>(data: T, label: string): T {
  if (process.env.NODE_ENV === "development") {
    const size = JSON.stringify(data).length;
    const percentage = (size / CACHE_SIZE_LIMIT) * 100;

    if (size > CACHE_SIZE_LIMIT) {
      console.error(
        `[CACHE SIZE ERROR] ${label}: ${(size / 1024 / 1024).toFixed(2)}MB EXCEEDS 2MB LIMIT!`
      );
    } else if (size > CACHE_SIZE_LIMIT * CACHE_SIZE_WARNING_THRESHOLD) {
      console.warn(
        `[CACHE SIZE WARNING] ${label}: ${(size / 1024 / 1024).toFixed(2)}MB (${percentage.toFixed(1)}% of limit)`
      );
    }
  }
  return data;
}

/**
 * Transform database row to lean ResourceListItem
 * ~500 bytes per item vs ~2KB for full ResourceEntry
 */
function transformToListItem(row: {
  slug: string;
  title: string;
  description: string;
  url: string;
  category: string;
  status: string | null;
  difficulty: string | null;
  is_featured: boolean | null;
  featured_reason: string | null;
  github_stars: number | null;
  github_language: string | null;
  primary_screenshot_url: string | null;
  thumbnail_url: string | null;
  ai_summary: string | null;
  key_features: string[] | null;
  added_at: string | null;
  last_verified_at: string | null;
  tags?: string[];
}): ResourceListItem {
  const item: ResourceListItem = {
    id: row.slug,
    title: row.title,
    // Truncate description to 200 chars for listings
    description: row.description.length > 200
      ? row.description.slice(0, 197) + "..."
      : row.description,
    url: row.url,
    category: row.category as ResourceCategorySlug,
    status: (row.status as ResourceStatus) || "community",
    tags: row.tags || [],
    addedDate: row.added_at?.split("T")[0] || "",
    lastVerified: row.last_verified_at?.split("T")[0] || row.added_at?.split("T")[0] || "",
  };

  // Optional fields (only add if present)
  if (row.primary_screenshot_url) item.screenshotUrl = row.primary_screenshot_url;
  if (row.thumbnail_url) item.thumbnailUrl = row.thumbnail_url;
  if (row.github_stars) item.githubStars = row.github_stars;
  if (row.github_language) item.githubLanguage = row.github_language;
  if (row.difficulty) item.difficulty = row.difficulty as DifficultyLevel;
  if (row.is_featured) {
    item.featured = true;
    if (row.featured_reason) item.featuredReason = row.featured_reason;
  }
  if (row.ai_summary) item.aiSummary = row.ai_summary;
  if (row.key_features?.length) item.keyFeaturesCount = row.key_features.length;

  return item;
}

/**
 * Get initial page data for /resources page (cached)
 *
 * Returns first batch of resources + all stats in a single cached response.
 * Total size: ~300KB (well under 2MB limit)
 *
 * Used by: Server Component for SSR
 */
export const getResourcePageInitialData = unstable_cache(
  async (): Promise<ResourcePageInitialData> => {
    if (!hasSupabaseCredentials()) {
      const emptyCategories = RESOURCE_CATEGORIES.map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        shortName: cat.shortName,
        icon: cat.icon,
        count: 0,
      }));
      return {
        resources: [],
        total: 0,
        stats: {
          totalResources: 0,
          totalCategories: 0,
          totalTags: 0,
          totalGitHubStars: 0,
          featuredCount: 0,
          recentlyAdded: 0,
          byCategory: {} as Record<ResourceCategorySlug, number>,
        },
        categories: emptyCategories,
        popularTags: [],
      };
    }

    const supabase = await createAdminClient();

    // Parallel fetch: initial resources + stats
    const [resourcesResult, statsResult, categoriesResult, tagsResult] = await Promise.all([
      // First 24 resources (lean columns only)
      supabase
        .from("resources")
        .select(LEAN_COLUMNS, { count: "exact" })
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("github_stars", { ascending: false, nullsFirst: false })
        .limit(24),
      // Stats
      getResourceStats(),
      // Categories with counts
      getCategoriesWithCounts(),
      // Popular tags
      getPopularTags(30),
    ]);

    // Fetch tags for initial resources
    const resourceIds = resourcesResult.data?.map((r) => r.slug) || [];
    const tagsMap = new Map<string, string[]>();

    if (resourceIds.length > 0) {
      // Need to get resource IDs first for tag lookup
      const { data: idData } = await supabase
        .from("resources")
        .select("id, slug")
        .in("slug", resourceIds);

      if (idData) {
        const idToSlug = new Map<string, string>(idData.map((r) => [r.id, r.slug]));
        const ids = idData.map((r) => r.id);

        const { data: tagsData } = await supabase
          .from("resource_tags")
          .select("resource_id, tag")
          .in("resource_id", ids);

        if (tagsData) {
          for (const t of tagsData) {
            const slug = idToSlug.get(t.resource_id);
            if (slug) {
              const existing = tagsMap.get(slug) || [];
              existing.push(t.tag);
              tagsMap.set(slug, existing);
            }
          }
        }
      }
    }

    // Transform to lean items
    const resources = (resourcesResult.data || []).map((row) => {
      const rowWithTags = { ...row, tags: tagsMap.get(row.slug) || [] };
      return transformToListItem(rowWithTags);
    });

    const result: ResourcePageInitialData = {
      resources,
      total: resourcesResult.count || 0,
      stats: statsResult,
      categories: categoriesResult,
      popularTags: tagsResult,
    };

    // Development: Check cache size
    return checkCacheSize(result, "getResourcePageInitialData");
  },
  ["resources-page-initial"],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES, CACHE_TAGS.RESOURCE_STATS] }
);

/**
 * Get resources by category (lean, cached)
 *
 * Each category stays well under 2MB:
 * - ~300 resources max × 500 bytes = ~150KB
 */
export const getResourceListByCategory = unstable_cache(
  async (category: ResourceCategorySlug): Promise<ResourceListItem[]> => {
    if (!hasSupabaseCredentials()) {
      return [];
    }
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("resources")
      .select(LEAN_COLUMNS)
      .eq("is_published", true)
      .eq("category", category)
      .order("is_featured", { ascending: false })
      .order("github_stars", { ascending: false, nullsFirst: false });

    if (error) {
      console.error(`Failed to fetch resources for category "${category}":`, error);
      throw error;
    }

    // Fetch tags
    const slugs = data?.map((r) => r.slug) || [];
    const tagsMap = new Map<string, string[]>();

    if (slugs.length > 0) {
      const { data: idData } = await supabase
        .from("resources")
        .select("id, slug")
        .in("slug", slugs);

      if (idData) {
        const idToSlug = new Map<string, string>(idData.map((r) => [r.id, r.slug]));
        const ids = idData.map((r) => r.id);

        const { data: tagsData } = await supabase
          .from("resource_tags")
          .select("resource_id, tag")
          .in("resource_id", ids);

        if (tagsData) {
          for (const t of tagsData) {
            const slug = idToSlug.get(t.resource_id);
            if (slug) {
              const existing = tagsMap.get(slug) || [];
              existing.push(t.tag);
              tagsMap.set(slug, existing);
            }
          }
        }
      }
    }

    const items = (data || []).map((row) => {
      const rowWithTags = { ...row, tags: tagsMap.get(row.slug) || [] };
      return transformToListItem(rowWithTags);
    });

    return checkCacheSize(items, `getResourceListByCategory(${category})`);
  },
  ["resources-list-category"],
  { revalidate: DEFAULT_REVALIDATE, tags: [CACHE_TAGS.ALL_RESOURCES] }
);

/**
 * Get all resources as lean list items (chunked by category)
 *
 * IMPORTANT: This aggregates from category caches, NOT a single large cache.
 * Each category cache is ~150KB, total is ~1.5MB but split across 10 cache entries.
 */
export async function getAllResourcesList(): Promise<ResourceListItem[]> {
  // Fetch all categories in parallel (each cached separately)
  const categoryPromises = RESOURCE_CATEGORIES.map((cat) =>
    getResourceListByCategory(cat.slug)
  );

  const results = await Promise.all(categoryPromises);
  return results.flat();
}

// Re-export lean types
export type { ResourceListItem, ResourceListResponse, ResourcePageInitialData } from "@/data/resources/schema";
