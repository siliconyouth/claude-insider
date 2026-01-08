/**
 * Shared Types for Resources System
 *
 * These types are used for passing pre-fetched resource data
 * from Server Components to Client Components.
 *
 * @module lib/resources/types
 */

import type {
  ResourceEntry,
  ResourceCategory,
  ResourceStats,
  TagWithCount,
} from "@/data/resources/schema";

/**
 * Enhanced fields coverage stats
 */
export interface EnhancedFieldsCoverage {
  total: number;
  hasKeyFeatures: number;
  hasPros: number;
  hasCons: number;
  hasTargetAudience: number;
  hasUseCases: number;
  hasPrerequisites: number;
  hasAiAnalysis: number;
}

/**
 * Audience stats item
 */
export interface AudienceStatsItem {
  audience: string;
  count: number;
}

/**
 * Category with resource count
 */
export interface CategoryWithCount extends ResourceCategory {
  count: number;
}

/**
 * Pre-fetched data for the homepage Resources Section
 *
 * This data is fetched server-side and passed to client components as props.
 * This pattern eliminates the need for JSON file imports in client components.
 */
export interface ResourcesSectionData {
  /** Overall resource statistics */
  stats: ResourceStats;

  /** Enhanced fields coverage stats */
  coverage: EnhancedFieldsCoverage;

  /** Popular tags for tag cloud */
  popularTags: TagWithCount[];

  /** Target audience breakdown */
  audienceStats: AudienceStatsItem[];

  /** Featured resources (for hero and trending) */
  featuredResources: ResourceEntry[];

  /** Top resources by GitHub stars */
  topByStars: ResourceEntry[];

  /** Categories with resource counts */
  categoriesWithCounts: CategoryWithCount[];
}

/**
 * Props for HeroFeatured component
 */
export interface HeroFeaturedProps {
  featuredResources: ResourceEntry[];
  topByStars: ResourceEntry[];
}

/**
 * Props for TrendingResources component
 */
export interface TrendingResourcesProps {
  topByStars: ResourceEntry[];
  featuredResources: ResourceEntry[];
}

/**
 * Props for CategoryQuickLinks component
 */
export interface CategoryQuickLinksProps {
  categories: CategoryWithCount[];
}

// Re-export schema types for convenience
export type {
  ResourceEntry,
  ResourceCategory,
  ResourceCategorySlug,
  ResourceStats,
  TagWithCount,
  DifficultyLevel,
  ResourceStatus,
} from "@/data/resources/schema";
