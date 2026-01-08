/**
 * Client-Side Resource Helpers
 *
 * Pure functions for filtering and searching resources on the client.
 * These work on already-loaded data passed from Server Components.
 *
 * @module lib/resources/client-helpers
 */

import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import type {
  ResourceEntry,
  ResourceCategorySlug,
  DifficultyLevel,
  ResourceStatus,
} from '@/data/resources/schema';

// Search result type
export interface ResourceSearchResult {
  item: ResourceEntry;
  score: number;
  matches?: {
    key: string;
    value: string;
    indices: [number, number][];
  }[];
}

// Search options
export interface ResourceSearchOptions {
  query: string;
  category?: ResourceCategorySlug;
  tags?: string[];
  difficulty?: DifficultyLevel;
  status?: ResourceStatus;
  featured?: boolean;
  limit?: number;
  threshold?: number;

  // Enhanced field filters
  targetAudience?: string[];
  useCases?: string[];
  minKeyFeatures?: number;
  hasPros?: boolean;
  hasCons?: boolean;
  hasPrerequisites?: boolean;
  hasAiAnalysis?: boolean;
}

// Filter options (subset without query)
export interface ResourceFilterOptions {
  category?: ResourceCategorySlug;
  tags?: string[];
  difficulty?: DifficultyLevel;
  status?: ResourceStatus;
  featured?: boolean;

  // Enhanced field filters
  targetAudience?: string[];
  useCases?: string[];
  minKeyFeatures?: number;
  hasPros?: boolean;
  hasCons?: boolean;
  hasPrerequisites?: boolean;
  hasAiAnalysis?: boolean;
}

// Fuse.js configuration with weighted fields
const fuseOptions: IFuseOptions<ResourceEntry> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.15 },
    { name: 'subcategory', weight: 0.1 },
    { name: 'github.owner', weight: 0.03 },
    { name: 'github.repo', weight: 0.02 },
  ],
  threshold: 0.3, // 0 = exact match, 1 = match anything
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  useExtendedSearch: true,
  minMatchCharLength: 2,
  findAllMatches: true,
};

// Cached Fuse instance per resource array
const fuseCache = new WeakMap<ResourceEntry[], Fuse<ResourceEntry>>();

/**
 * Get or create the Fuse.js search instance for a resource array
 */
function getFuseInstance(resources: ResourceEntry[]): Fuse<ResourceEntry> {
  let fuse = fuseCache.get(resources);
  if (!fuse) {
    fuse = new Fuse(resources, fuseOptions);
    fuseCache.set(resources, fuse);
  }
  return fuse;
}

/**
 * Apply enhanced filters to a resource
 */
function matchesEnhancedFilters(
  resource: ResourceEntry,
  options: ResourceFilterOptions
): boolean {
  const {
    targetAudience,
    useCases,
    minKeyFeatures,
    hasPros,
    hasCons,
    hasPrerequisites,
    hasAiAnalysis,
  } = options;

  if (targetAudience && targetAudience.length > 0) {
    if (!resource.targetAudience?.some((a) => targetAudience.includes(a))) {
      return false;
    }
  }
  if (useCases && useCases.length > 0) {
    if (!resource.useCases?.some((u) => useCases.includes(u))) {
      return false;
    }
  }
  if (minKeyFeatures !== undefined && minKeyFeatures > 0) {
    if ((resource.keyFeatures?.length || 0) < minKeyFeatures) {
      return false;
    }
  }
  if (hasPros === true) {
    if (!resource.pros || resource.pros.length === 0) {
      return false;
    }
  }
  if (hasCons === true) {
    if (!resource.cons || resource.cons.length === 0) {
      return false;
    }
  }
  if (hasPrerequisites === true) {
    if (!resource.prerequisites || resource.prerequisites.length === 0) {
      return false;
    }
  }
  if (hasAiAnalysis === true) {
    if (!resource.aiOverview && !resource.aiSummary) {
      return false;
    }
  }

  return true;
}

/**
 * Apply basic filters to a resource
 */
function matchesBasicFilters(
  resource: ResourceEntry,
  options: ResourceFilterOptions
): boolean {
  const { category, tags, difficulty, status, featured } = options;

  if (category && resource.category !== category) return false;
  if (tags && tags.length > 0 && !tags.some((tag) => resource.tags.includes(tag))) return false;
  if (difficulty && resource.difficulty !== difficulty) return false;
  if (status && resource.status !== status) return false;
  if (featured !== undefined && resource.featured !== featured) return false;

  return true;
}

/**
 * Filter resources without search query
 */
export function filterResources(
  resources: ResourceEntry[],
  options: ResourceFilterOptions
): ResourceEntry[] {
  return resources.filter((r) =>
    matchesBasicFilters(r, options) && matchesEnhancedFilters(r, options)
  );
}

/**
 * Search resources with full-text search and filters
 */
export function searchResources(
  resources: ResourceEntry[],
  options: ResourceSearchOptions
): ResourceSearchResult[] {
  const {
    query,
    limit = 50,
    threshold = 0.3,
    ...filterOptions
  } = options;

  // If no query, return filtered results based on other criteria
  if (!query || query.trim() === '') {
    const filtered = filterResources(resources, filterOptions);
    return filtered.slice(0, limit).map((item) => ({
      item,
      score: 0,
    }));
  }

  // Perform full-text search with Fuse.js
  const fuse = getFuseInstance(resources);
  const searchResults: FuseResult<ResourceEntry>[] = fuse.search(query, {
    limit: limit * 2, // Get more results to account for filtering
  });

  // Apply filters to search results
  const filteredResults = searchResults.filter((result) => {
    const r = result.item;

    if (!matchesBasicFilters(r, filterOptions)) return false;
    if (!matchesEnhancedFilters(r, filterOptions)) return false;
    if (result.score !== undefined && result.score > threshold) return false;

    return true;
  });

  // Map to our result format
  return filteredResults.slice(0, limit).map((result) => ({
    item: result.item,
    score: result.score ?? 0,
    matches: result.matches?.map((m) => ({
      key: m.key ?? '',
      value: m.value ?? '',
      indices: m.indices as [number, number][],
    })),
  }));
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(
  resources: ResourceEntry[],
  query: string,
  limit: number = 5
): string[] {
  if (!query || query.length < 2) return [];

  const results = searchResources(resources, { query, limit: 20 });
  const suggestions = new Set<string>();
  const lowerQuery = query.toLowerCase();

  results.forEach((result) => {
    // Add title if it matches
    if (result.item.title.toLowerCase().includes(lowerQuery)) {
      suggestions.add(result.item.title);
    }

    // Add matching tags
    result.item.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tag);
      }
    });
  });

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Highlight matching text in a string
 */
export function highlightMatches(
  text: string,
  indices: [number, number][]
): { text: string; highlighted: boolean }[] {
  if (!indices || indices.length === 0) {
    return [{ text, highlighted: false }];
  }

  const result: { text: string; highlighted: boolean }[] = [];
  let lastEnd = 0;

  // Sort indices by start position
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);

  sortedIndices.forEach(([start, end]) => {
    // Add non-highlighted text before this match
    if (start > lastEnd) {
      result.push({ text: text.slice(lastEnd, start), highlighted: false });
    }

    // Add highlighted text
    result.push({ text: text.slice(start, end + 1), highlighted: true });
    lastEnd = end + 1;
  });

  // Add remaining non-highlighted text
  if (lastEnd < text.length) {
    result.push({ text: text.slice(lastEnd), highlighted: false });
  }

  return result;
}

/**
 * Group search results by category
 */
export function groupResultsByCategory(
  results: ResourceSearchResult[]
): Record<ResourceCategorySlug, ResourceSearchResult[]> {
  const grouped: Record<string, ResourceSearchResult[]> = {};

  results.forEach((result) => {
    const category = result.item.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(result);
  });

  return grouped as Record<ResourceCategorySlug, ResourceSearchResult[]>;
}

/**
 * Quick search for autocomplete (faster, less accurate)
 */
export function quickSearch(
  resources: ResourceEntry[],
  query: string,
  limit: number = 10
): ResourceEntry[] {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

  // Simple title/tag matching for speed
  return resources
    .filter(
      (r) =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        r.description.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}
