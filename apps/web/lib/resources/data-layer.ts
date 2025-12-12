/**
 * Hybrid Data Layer for Resources
 *
 * This module provides a unified interface for accessing resources data.
 * It attempts to fetch from the Payload CMS database first,
 * then falls back to static JSON files if the database is unavailable.
 *
 * This ensures the site works even without database configuration (e.g., local dev).
 */

import { getPayload } from 'payload';
import config from '../../payload.config';

// Static fallback imports
import {
  ALL_RESOURCES,
  RESOURCES_BY_CATEGORY,
  getAllResources as getStaticResources,
  getResourcesByCategory as getStaticResourcesByCategory,
  getFeaturedResources as getStaticFeaturedResources,
  getResourceById as getStaticResourceById,
  getCategoriesWithCounts as getStaticCategoriesWithCounts,
  getAllTags as getStaticTags,
  getResourceStats as getStaticStats,
  filterResources as filterStaticResources,
  getRecentlyAdded as getStaticRecentlyAdded,
  getTopByStars as getStaticTopByStars,
} from '../../data/resources';

import type {
  ResourceEntry,
  ResourceCategory,
  ResourceCategorySlug,
  ResourceStats,
  ResourceFilters,
  TagWithCount,
} from '../../data/resources/schema';

// Check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  try {
    const payload = await getPayload({ config });
    // Try a simple query to verify connection
    await payload.find({ collection: 'categories', limit: 1 });
    return true;
  } catch {
    return false;
  }
}

// Cache the database availability check
let dbAvailable: boolean | null = null;

async function checkDatabase(): Promise<boolean> {
  if (dbAvailable === null) {
    dbAvailable = await isDatabaseAvailable();
    console.log(`Database ${dbAvailable ? 'available' : 'unavailable'}, using ${dbAvailable ? 'CMS' : 'static'} data`);
  }
  return dbAvailable;
}

/**
 * Get all resources
 * Returns from database if available, otherwise from static files
 */
export async function getAllResources(): Promise<ResourceEntry[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticResources();
  }

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'resources',
      limit: 1000,
      depth: 2, // Include category and tags
    });

    return result.docs.map(transformPayloadResource);
  } catch (error) {
    console.error('Failed to fetch resources from database:', error);
    return getStaticResources();
  }
}

/**
 * Get resources by category
 */
export async function getResourcesByCategory(category: ResourceCategorySlug): Promise<ResourceEntry[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticResourcesByCategory(category);
  }

  try {
    const payload = await getPayload({ config });

    // First find the category by slug
    const categoryResult = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category } },
      limit: 1,
    });

    if (categoryResult.docs.length === 0) {
      return [];
    }

    const result = await payload.find({
      collection: 'resources',
      where: { category: { equals: categoryResult.docs[0].id } },
      limit: 1000,
      depth: 2,
    });

    return result.docs.map(transformPayloadResource);
  } catch (error) {
    console.error(`Failed to fetch resources for category "${category}":`, error);
    return getStaticResourcesByCategory(category);
  }
}

/**
 * Get featured resources
 */
export async function getFeaturedResources(limit?: number): Promise<ResourceEntry[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticFeaturedResources(limit);
  }

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'resources',
      where: { featured: { equals: true } },
      limit: limit || 100,
      depth: 2,
    });

    return result.docs.map(transformPayloadResource);
  } catch (error) {
    console.error('Failed to fetch featured resources:', error);
    return getStaticFeaturedResources(limit);
  }
}

/**
 * Get resource by ID
 */
export async function getResourceById(id: string): Promise<ResourceEntry | undefined> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticResourceById(id);
  }

  try {
    const payload = await getPayload({ config });
    // Try to find by numeric ID first (Payload uses numeric IDs)
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const result = await payload.findByID({
        collection: 'resources',
        id: numericId,
        depth: 2,
      });
      return transformPayloadResource(result);
    }

    // Otherwise search by URL or title
    const result = await payload.find({
      collection: 'resources',
      where: {
        or: [
          { url: { contains: id } },
          { title: { contains: id } },
        ],
      },
      limit: 1,
      depth: 2,
    });

    if (result.docs.length > 0) {
      return transformPayloadResource(result.docs[0]);
    }

    return undefined;
  } catch (error) {
    console.error(`Failed to fetch resource "${id}":`, error);
    return getStaticResourceById(id);
  }
}

/**
 * Get all categories with counts
 */
export async function getCategoriesWithCounts(): Promise<(ResourceCategory & { count: number })[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticCategoriesWithCounts();
  }

  try {
    const payload = await getPayload({ config });
    const categories = await payload.find({
      collection: 'categories',
      limit: 100,
      sort: 'sortOrder',
    });

    const categoriesWithCounts = await Promise.all(
      categories.docs.map(async (cat) => {
        const resources = await payload.find({
          collection: 'resources',
          where: { category: { equals: cat.id } },
          limit: 0,
        });

        return {
          slug: cat.slug as ResourceCategorySlug,
          name: cat.name,
          shortName: cat.shortName,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          count: resources.totalDocs,
        };
      })
    );

    return categoriesWithCounts;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return getStaticCategoriesWithCounts();
  }
}

/**
 * Get all tags with counts
 */
export async function getAllTags(): Promise<TagWithCount[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticTags();
  }

  try {
    const payload = await getPayload({ config });
    const tags = await payload.find({
      collection: 'tags',
      limit: 1000,
      sort: '-resourceCount',
    });

    return tags.docs.map((tag) => ({
      name: tag.name,
      count: tag.resourceCount || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return getStaticTags();
  }
}

/**
 * Get resource statistics
 */
export async function getResourceStats(): Promise<ResourceStats> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticStats();
  }

  try {
    const [resources, categories, tags, featured] = await Promise.all([
      getAllResources(),
      getCategoriesWithCounts(),
      getAllTags(),
      getFeaturedResources(),
    ]);

    // Calculate total GitHub stars
    const totalGitHubStars = resources.reduce((sum, r) => sum + (r.github?.stars || 0), 0);

    // Resources added in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = resources.filter((r) => new Date(r.addedDate) >= sevenDaysAgo).length;

    // Count by category
    const byCategory = categories.reduce(
      (acc, cat) => {
        acc[cat.slug] = cat.count;
        return acc;
      },
      {} as Record<ResourceCategorySlug, number>
    );

    return {
      totalResources: resources.length,
      totalCategories: categories.length,
      totalTags: tags.length,
      totalGitHubStars,
      featuredCount: featured.length,
      recentlyAdded,
      byCategory,
    };
  } catch (error) {
    console.error('Failed to calculate stats:', error);
    return getStaticStats();
  }
}

/**
 * Filter resources
 */
export async function filterResources(filters: ResourceFilters): Promise<ResourceEntry[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return filterStaticResources(filters);
  }

  try {
    const payload = await getPayload({ config });
    const whereClause: Record<string, unknown> = {};

    if (filters.category) {
      const categoryResult = await payload.find({
        collection: 'categories',
        where: { slug: { equals: filters.category } },
        limit: 1,
      });
      if (categoryResult.docs.length > 0) {
        whereClause.category = { equals: categoryResult.docs[0].id };
      }
    }

    if (filters.difficulty) {
      whereClause.difficulty = { equals: filters.difficulty };
    }

    if (filters.status) {
      whereClause.status = { equals: filters.status };
    }

    if (filters.featured !== undefined) {
      whereClause.featured = { equals: filters.featured };
    }

    const result = await payload.find({
      collection: 'resources',
      where: whereClause,
      limit: 1000,
      depth: 2,
    });

    let resources = result.docs.map(transformPayloadResource);

    // Filter by tags (Payload doesn't support this well in where clause)
    if (filters.tags && filters.tags.length > 0) {
      resources = resources.filter((r) =>
        filters.tags!.some((tag) => r.tags.includes(tag))
      );
    }

    return resources;
  } catch (error) {
    console.error('Failed to filter resources:', error);
    return filterStaticResources(filters);
  }
}

/**
 * Get recently added resources
 */
export async function getRecentlyAdded(limit: number = 10): Promise<ResourceEntry[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticRecentlyAdded(limit);
  }

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'resources',
      limit,
      sort: '-addedDate',
      depth: 2,
    });

    return result.docs.map(transformPayloadResource);
  } catch (error) {
    console.error('Failed to fetch recently added:', error);
    return getStaticRecentlyAdded(limit);
  }
}

/**
 * Get top resources by GitHub stars
 */
export async function getTopByStars(limit: number = 10): Promise<ResourceEntry[]> {
  const useDb = await checkDatabase();

  if (!useDb) {
    return getStaticTopByStars(limit);
  }

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'resources',
      limit,
      sort: '-github.stars',
      depth: 2,
      where: {
        'github.stars': { greater_than: 0 },
      },
    });

    return result.docs.map(transformPayloadResource);
  } catch (error) {
    console.error('Failed to fetch top by stars:', error);
    return getStaticTopByStars(limit);
  }
}

/**
 * Transform Payload CMS document to ResourceEntry format
 */
function transformPayloadResource(doc: Record<string, unknown>): ResourceEntry {
  const category = doc.category as Record<string, unknown>;
  const tags = (doc.tags as Record<string, unknown>[]) || [];
  const github = doc.github as Record<string, unknown> | undefined;

  return {
    id: String(doc.id),
    title: doc.title as string,
    description: doc.description as string,
    url: doc.url as string,
    category: (category?.slug || doc.category) as ResourceCategorySlug,
    subcategory: doc.subcategory as string | undefined,
    tags: tags.map((t) => (typeof t === 'string' ? t : (t.name as string))),
    difficulty: doc.difficulty as ResourceEntry['difficulty'],
    status: doc.status as ResourceEntry['status'],
    github: github
      ? {
          owner: github.owner as string,
          repo: github.repo as string,
          stars: github.stars as number,
          forks: github.forks as number,
          lastUpdated: github.lastUpdated as string,
          language: github.language as string,
        }
      : undefined,
    version: doc.version as string | undefined,
    namespace: doc.namespace as string | undefined,
    featured: doc.featured as boolean | undefined,
    featuredReason: doc.featuredReason as string | undefined,
    addedDate: doc.addedDate as string,
    lastVerified: doc.lastVerified as string,
  };
}

// Re-export static functions for backward compatibility
export {
  ALL_RESOURCES,
  RESOURCES_BY_CATEGORY,
};

// Re-export types
export type {
  ResourceEntry,
  ResourceCategory,
  ResourceCategorySlug,
  ResourceStats,
  ResourceFilters,
  TagWithCount,
};
