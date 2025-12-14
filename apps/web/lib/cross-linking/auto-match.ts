/**
 * Auto-Matching Algorithm for Cross-Linking
 *
 * Matches documentation pages with resources based on:
 * - Tag overlap (60% weight)
 * - Category mapping (25% weight)
 * - Title similarity (15% weight)
 */

import type { Resource, Tag, Category } from '../../payload-types';

// Flexible tag type - supports both Payload relationships and simple strings
type TagLike = number | string | Tag | { name: string };

// Flexible category type - supports both Payload relationships and simple strings
type CategoryLike = number | string | Category | { slug: string };

// Flexible resource reference type
type ResourceLike = number | Resource | { id: number };

// Document type for cross-linking (matches our Documents collection)
interface DocumentLike {
  title: string;
  docCategory: string;
  tags?: TagLike[] | null;
  excludedResources?: ResourceLike[] | null;
  relatedResources?: ResourceLike[] | null;
}

// Default settings (can be overridden by CrossLinkSettings global)
export const DEFAULT_SETTINGS = {
  minTagOverlap: 2,
  minScoreThreshold: 0.3,
  maxAutoMatches: 5,
  tagOverlapWeight: 0.6,
  categoryMappingWeight: 0.25,
  titleSimilarityWeight: 0.15,
};

// Default category mappings (doc category -> resource categories)
export const DEFAULT_CATEGORY_MAPPINGS: Record<string, string[]> = {
  'getting-started': ['official', 'tools', 'tutorials'],
  configuration: ['rules', 'tools'],
  'tips-and-tricks': ['prompts', 'tutorials'],
  api: ['sdks', 'official'],
  integrations: ['mcp-servers', 'tools', 'sdks'],
  tutorials: ['tutorials', 'showcases'],
  examples: ['showcases', 'community'],
};

export interface MatchScore {
  resourceId: number;
  score: number;
  matchedTags: string[];
  tagScore: number;
  categoryBonus: number;
  titleSimilarity: number;
}

export interface MatchSettings {
  minTagOverlap: number;
  minScoreThreshold: number;
  maxAutoMatches: number;
  tagOverlapWeight: number;
  categoryMappingWeight: number;
  titleSimilarityWeight: number;
  categoryMappings: Record<string, string[]>;
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate simple text similarity using word overlap
 */
export function textSimilarity(text1: string, text2: string): number {
  const normalize = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2)
    );
  };

  return jaccardSimilarity(normalize(text1), normalize(text2));
}

/**
 * Extract tag names from tag relationships (flexible - handles strings, objects, and Payload types)
 */
export function extractTagNames(tags: TagLike[] | null | undefined): string[] {
  if (!tags) return [];
  return tags.map(tag => {
    if (typeof tag === 'number') return '';
    if (typeof tag === 'string') return tag.toLowerCase();
    if ('name' in tag && tag.name) return tag.name.toLowerCase();
    return '';
  }).filter(Boolean);
}

/**
 * Get category slug from category relationship (flexible - handles strings and objects)
 */
export function getCategorySlug(category: CategoryLike | null | undefined): string {
  if (!category) return '';
  if (typeof category === 'number') return '';
  if (typeof category === 'string') return category;
  if ('slug' in category && category.slug) return category.slug;
  return '';
}

/**
 * Calculate match score between a document and a resource
 */
export function calculateMatchScore(
  docTitle: string,
  docTags: string[],
  docCategory: string,
  resource: {
    id: number;
    title: string;
    tags?: TagLike[] | null;
    category?: CategoryLike | null;
  },
  settings: MatchSettings = {
    ...DEFAULT_SETTINGS,
    categoryMappings: DEFAULT_CATEGORY_MAPPINGS,
  }
): MatchScore {
  // Extract resource tags and category
  const resourceTags = extractTagNames(resource.tags);
  const resourceCategory = getCategorySlug(resource.category);

  // 1. Tag overlap score (Jaccard similarity)
  const docTagSet = new Set(docTags.map(t => t.toLowerCase()));
  const resourceTagSet = new Set(resourceTags);
  const matchedTags = [...docTagSet].filter(tag => resourceTagSet.has(tag));
  const tagScore = jaccardSimilarity(docTagSet, resourceTagSet);

  // 2. Category mapping bonus
  const mappedCategories = settings.categoryMappings[docCategory] || [];
  const categoryBonus = mappedCategories.includes(resourceCategory) ? 1 : 0;

  // 3. Title similarity
  const titleSimilarity = textSimilarity(docTitle, resource.title);

  // Combined weighted score
  const score =
    tagScore * settings.tagOverlapWeight +
    categoryBonus * settings.categoryMappingWeight +
    titleSimilarity * settings.titleSimilarityWeight;

  return {
    resourceId: resource.id,
    score,
    matchedTags,
    tagScore,
    categoryBonus,
    titleSimilarity,
  };
}

/**
 * Get auto-matched resources for a document
 */
export function getAutoMatchedResources(
  document: DocumentLike,
  resources: Array<{
    id: number;
    title: string;
    tags?: TagLike[] | null;
    category?: CategoryLike | null;
  }>,
  settings: MatchSettings = {
    ...DEFAULT_SETTINGS,
    categoryMappings: DEFAULT_CATEGORY_MAPPINGS,
  }
): MatchScore[] {
  const docTags = extractTagNames(document.tags);
  const docCategory = document.docCategory;

  // Get excluded and manually linked resource IDs
  const getResourceId = (r: ResourceLike): number => {
    if (typeof r === 'number') return r;
    return r.id;
  };
  const excludedIds = new Set(
    (document.excludedResources || []).map(getResourceId)
  );
  const manualIds = new Set(
    (document.relatedResources || []).map(getResourceId)
  );

  // Calculate scores for all resources
  const scores = resources
    .filter(r => !excludedIds.has(r.id) && !manualIds.has(r.id))
    .map(resource =>
      calculateMatchScore(document.title, docTags, docCategory, resource, settings)
    )
    .filter(score => score.score >= settings.minScoreThreshold)
    .filter(score => score.matchedTags.length >= settings.minTagOverlap)
    .sort((a, b) => b.score - a.score)
    .slice(0, settings.maxAutoMatches);

  return scores;
}

/**
 * Merge manual and auto-matched resources
 * Manual links take priority, then auto-matched by score
 */
export function mergeResourceLinks(
  manualResources: (number | Resource)[] | null | undefined,
  autoMatched: MatchScore[],
  maxTotal: number = 10
): number[] {
  const manualIds = (manualResources || []).map(r => (typeof r === 'number' ? r : r.id));
  const autoIds = autoMatched.map(m => m.resourceId);

  // Manual first, then auto-matched (excluding duplicates)
  const merged = [...manualIds];
  for (const id of autoIds) {
    if (!merged.includes(id) && merged.length < maxTotal) {
      merged.push(id);
    }
  }

  return merged;
}

/**
 * Batch compute auto-matches for all documents
 */
export async function batchComputeAutoMatches(
  documents: Array<DocumentLike & { id: number }>,
  resources: Array<{
    id: number;
    title: string;
    tags?: TagLike[] | null;
    category?: CategoryLike | null;
  }>,
  settings?: MatchSettings
): Promise<Map<number, MatchScore[]>> {
  const results = new Map<number, MatchScore[]>();

  for (const doc of documents) {
    const matches = getAutoMatchedResources(doc, resources, settings);
    results.set(doc.id, matches);
  }

  return results;
}
