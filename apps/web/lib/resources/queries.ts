/**
 * Resource Database Queries
 *
 * Server-side queries for fetching resources from the database.
 */

import { pool } from "@/lib/db";

// =============================================================================
// TYPES
// =============================================================================

export interface ResourceRow {
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

export interface ResourceTagRow {
  tag: string;
}

export interface ResourceAuthorRow {
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

export interface ResourceAlternativeRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon_url: string | null;
  github_stars: number;
  relationship: string;
}

export interface ResourceWithDetails extends ResourceRow {
  tags: string[];
  authors: ResourceAuthorRow[];
  alternatives: ResourceAlternativeRow[];
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get a single resource by slug with all related data
 */
export async function getResourceBySlug(
  slug: string
): Promise<ResourceWithDetails | null> {
  try {
    // Get main resource
    const resourceResult = await pool.query<ResourceRow>(
      `SELECT * FROM resources WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );

    const resource = resourceResult.rows[0];
    if (!resource) {
      return null;
    }

    // Get tags
    const tagsResult = await pool.query<ResourceTagRow>(
      `SELECT tag FROM resource_tags WHERE resource_id = $1 ORDER BY tag`,
      [resource.id]
    );

    // Get authors
    const authorsResult = await pool.query<ResourceAuthorRow>(
      `SELECT id, user_id, name, role, github_username, twitter_username,
              website_url, avatar_url, is_primary
       FROM resource_authors
       WHERE resource_id = $1
       ORDER BY is_primary DESC, name`,
      [resource.id]
    );

    // Get alternatives
    const alternativesResult = await pool.query<ResourceAlternativeRow>(
      `SELECT r.id, r.slug, r.title, r.description, r.category,
              r.icon_url, r.github_stars, ra.relationship
       FROM resource_alternatives ra
       JOIN resources r ON r.id = ra.alternative_resource_id
       WHERE ra.resource_id = $1 AND r.is_published = TRUE
       ORDER BY r.github_stars DESC
       LIMIT 8`,
      [resource.id]
    );

    return {
      ...resource,
      tags: tagsResult.rows.map((t) => t.tag),
      authors: authorsResult.rows,
      alternatives: alternativesResult.rows,
    };
  } catch (error) {
    console.error("[Resources] Error fetching resource by slug:", error);
    return null;
  }
}

/**
 * Get all published resource slugs (for static generation)
 */
export async function getAllResourceSlugs(): Promise<string[]> {
  try {
    const result = await pool.query<{ slug: string }>(
      `SELECT slug FROM resources WHERE is_published = TRUE ORDER BY slug`
    );
    return result.rows.map((r) => r.slug);
  } catch (error) {
    console.error("[Resources] Error fetching slugs:", error);
    return [];
  }
}

/**
 * Resource summary for RSS feed
 */
export interface ResourceRSSSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  url: string;
  added_at: string;
}

/**
 * Get all published resources for RSS feed
 */
export async function getResourcesForRSS(): Promise<ResourceRSSSummary[]> {
  try {
    const result = await pool.query<ResourceRSSSummary>(
      `SELECT slug, title, description, category, url, added_at
       FROM resources
       WHERE is_published = TRUE
       ORDER BY added_at DESC
       LIMIT 100`
    );
    return result.rows;
  } catch (error) {
    console.error("[Resources] Error fetching resources for RSS:", error);
    return [];
  }
}

/**
 * Get related resources by category or tags
 */
export async function getRelatedResources(
  resourceId: string,
  category: string,
  tags: string[],
  limit: number = 4
): Promise<Pick<ResourceRow, "id" | "slug" | "title" | "description" | "category" | "icon_url" | "github_stars">[]> {
  try {
    // First try to find resources with matching tags
    const result = await pool.query(
      `SELECT DISTINCT r.id, r.slug, r.title, r.description, r.category, r.icon_url, r.github_stars
       FROM resources r
       LEFT JOIN resource_tags rt ON r.id = rt.resource_id
       WHERE r.id != $1
         AND r.is_published = TRUE
         AND (r.category = $2 OR rt.tag = ANY($3))
       ORDER BY r.github_stars DESC
       LIMIT $4`,
      [resourceId, category, tags, limit]
    );

    return result.rows;
  } catch (error) {
    console.error("[Resources] Error fetching related resources:", error);
    return [];
  }
}

/**
 * Increment view count for a resource
 */
export async function incrementResourceView(
  resourceId: string,
  userId?: string,
  visitorId?: string,
  ipHash?: string,
  userAgent?: string,
  referrer?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO resource_views (resource_id, user_id, visitor_id, ip_hash, user_agent, referrer)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [resourceId, userId || null, visitorId || null, ipHash || null, userAgent || null, referrer || null]
    );
    // The trigger will automatically increment views_count on the resource
  } catch (error) {
    console.error("[Resources] Error tracking view:", error);
  }
}

/**
 * Check if user has favorited a resource
 */
export async function hasUserFavorited(
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM resource_favorites WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("[Resources] Error checking favorite:", error);
    return false;
  }
}

/**
 * Get user's rating for a resource
 */
export async function getUserRating(
  resourceId: string,
  userId: string
): Promise<number | null> {
  try {
    const result = await pool.query<{ rating: number }>(
      `SELECT rating FROM resource_ratings WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, userId]
    );
    return result.rows[0]?.rating ?? null;
  } catch (error) {
    console.error("[Resources] Error getting rating:", error);
    return null;
  }
}

// =============================================================================
// DOC-RESOURCE RELATIONSHIPS
// =============================================================================

export interface DocRelatedResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  url: string;
  icon_url: string | null;
  github_stars: number;
  relationship_type: string;
  confidence_score: number;
  reasoning: string | null;
}

/**
 * Get resources related to a documentation page
 */
export async function getResourcesForDoc(
  docSlug: string,
  limit: number = 6
): Promise<DocRelatedResource[]> {
  try {
    const result = await pool.query<DocRelatedResource>(
      `SELECT
        r.id,
        r.slug,
        r.title,
        r.description,
        r.category,
        r.url,
        r.icon_url,
        r.github_stars,
        dr.relationship_type,
        dr.confidence_score,
        dr.ai_reasoning as reasoning
       FROM doc_resource_relationships dr
       JOIN resources r ON r.id = dr.resource_id
       WHERE dr.doc_slug = $1
         AND dr.is_active = TRUE
         AND r.is_published = TRUE
       ORDER BY dr.display_priority DESC, dr.confidence_score DESC, r.github_stars DESC
       LIMIT $2`,
      [docSlug, limit]
    );
    return result.rows;
  } catch (error) {
    console.error("[Resources] Error fetching doc relationships:", error);
    return [];
  }
}
