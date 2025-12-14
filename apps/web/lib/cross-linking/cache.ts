/**
 * Caching Utilities for Cross-Linking
 *
 * Uses Next.js unstable_cache for efficient data fetching
 * with automatic revalidation on CMS changes.
 */

import { unstable_cache } from 'next/cache';

// Cache tags for revalidation
export const CACHE_TAGS = {
  documents: 'cross-link-documents',
  resources: 'cross-link-resources',
  sections: 'cross-link-sections',
  codeExamples: 'cross-link-code-examples',
  settings: 'cross-link-settings',
  autoMatches: 'cross-link-auto-matches',
} as const;

// Default revalidation time (1 hour)
const DEFAULT_REVALIDATE = 3600;

/**
 * Cache wrapper for cross-link data fetching
 */
export function createCrossLinkCache<T>(
  fetchFn: () => Promise<T>,
  tags: string[],
  revalidate: number = DEFAULT_REVALIDATE
): () => Promise<T> {
  return unstable_cache(fetchFn, tags, {
    revalidate,
    tags,
  });
}

/**
 * Get cached cross-links for a document
 */
export const getCachedDocumentCrossLinks = unstable_cache(
  async (docSlug: string) => {
    // This will be implemented to fetch from Payload API
    // For now, return a placeholder structure
    return {
      docSlug,
      relatedResources: [] as number[],
      autoMatchedResources: [] as number[],
      displayMode: 'both' as const,
      sections: [] as Array<{
        headingId: string;
        relatedResources: number[];
      }>,
    };
  },
  ['cross-link-doc'],
  {
    revalidate: DEFAULT_REVALIDATE,
    tags: [CACHE_TAGS.documents, CACHE_TAGS.autoMatches],
  }
);

/**
 * Get cached cross-links for a resource
 */
export const getCachedResourceCrossLinks = unstable_cache(
  async (resourceId: number) => {
    // This will be implemented to fetch from Payload API
    return {
      resourceId,
      relatedDocs: [] as Array<{
        id: number;
        slug: string;
        title: string;
        docCategory: string;
      }>,
      relatedSections: [] as Array<{
        id: number;
        headingId: string;
        headingText: string;
        documentSlug: string;
      }>,
    };
  },
  ['cross-link-resource'],
  {
    revalidate: DEFAULT_REVALIDATE,
    tags: [CACHE_TAGS.resources, CACHE_TAGS.autoMatches],
  }
);

/**
 * Get cached cross-link settings
 */
export const getCachedCrossLinkSettings = unstable_cache(
  async () => {
    // This will be implemented to fetch from Payload globals
    return {
      autoMatching: {
        minTagOverlap: 2,
        minScoreThreshold: 0.3,
        maxAutoMatches: 5,
        enabled: true,
      },
      displayDefaults: {
        defaultDisplayMode: 'both' as const,
        hoverDelayMs: 200,
        showResourceCardsAfterSection: true,
        showResourceCardsAtDocumentEnd: true,
        maxCardsPerSection: 3,
      },
      scoringWeights: {
        tagOverlapWeight: 0.6,
        categoryMappingWeight: 0.25,
        titleSimilarityWeight: 0.15,
      },
      features: {
        enableHoverCards: true,
        enableInlineCards: true,
        enableSectionLinks: true,
        enableCodeBlockLinks: true,
        enableBidirectionalLinks: true,
      },
    };
  },
  ['cross-link-settings'],
  {
    revalidate: DEFAULT_REVALIDATE,
    tags: [CACHE_TAGS.settings],
  }
);

/**
 * Invalidate cache for a specific document
 */
export function invalidateDocumentCache(docSlug: string): void {
  // Next.js handles this via revalidateTag in server actions
  // This is a placeholder for documentation
  console.log(`[Cache] Invalidating document cache: ${docSlug}`);
}

/**
 * Invalidate cache for a specific resource
 */
export function invalidateResourceCache(resourceId: number): void {
  console.log(`[Cache] Invalidating resource cache: ${resourceId}`);
}

/**
 * Invalidate all auto-match caches
 */
export function invalidateAutoMatchCache(): void {
  console.log(`[Cache] Invalidating all auto-match caches`);
}
