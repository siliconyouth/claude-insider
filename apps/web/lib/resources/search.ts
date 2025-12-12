/**
 * Claude Insider Resources - Search Module
 * Full-text search using Fuse.js with weighted fields
 */

import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import type { ResourceEntry, ResourceCategorySlug, DifficultyLevel, ResourceStatus } from '@/data/resources/schema';
import { getAllResources } from '@/data/resources';

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

// Singleton Fuse instance
let fuseInstance: Fuse<ResourceEntry> | null = null;

/**
 * Get or create the Fuse.js search instance
 */
export function getSearchInstance(): Fuse<ResourceEntry> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(getAllResources(), fuseOptions);
  }
  return fuseInstance;
}

/**
 * Reset the search instance (useful after data updates)
 */
export function resetSearchInstance(): void {
  fuseInstance = null;
}

/**
 * Search resources with full-text search and filters
 */
export function searchResources(options: ResourceSearchOptions): ResourceSearchResult[] {
  const {
    query,
    category,
    tags,
    difficulty,
    status,
    featured,
    limit = 50,
    threshold = 0.3,
  } = options;

  const fuse = getSearchInstance();

  // If no query, return filtered results based on other criteria
  if (!query || query.trim() === '') {
    let results = getAllResources();

    if (category) {
      results = results.filter((r) => r.category === category);
    }
    if (tags && tags.length > 0) {
      results = results.filter((r) => tags.some((tag) => r.tags.includes(tag)));
    }
    if (difficulty) {
      results = results.filter((r) => r.difficulty === difficulty);
    }
    if (status) {
      results = results.filter((r) => r.status === status);
    }
    if (featured !== undefined) {
      results = results.filter((r) => r.featured === featured);
    }

    return results.slice(0, limit).map((item) => ({
      item,
      score: 0,
    }));
  }

  // Perform full-text search with custom threshold
  const searchResults: FuseResult<ResourceEntry>[] = fuse.search(query, {
    limit: limit * 2, // Get more results to account for filtering
  });

  // Apply filters to search results
  const filteredResults = searchResults.filter((result) => {
    const r = result.item;

    if (category && r.category !== category) return false;
    if (tags && tags.length > 0 && !tags.some((tag) => r.tags.includes(tag))) return false;
    if (difficulty && r.difficulty !== difficulty) return false;
    if (status && r.status !== status) return false;
    if (featured !== undefined && r.featured !== featured) return false;
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
export function getSearchSuggestions(query: string, limit: number = 5): string[] {
  if (!query || query.length < 2) return [];

  const results = searchResources({ query, limit: 20 });
  const suggestions = new Set<string>();

  results.forEach((result) => {
    // Add title if it matches
    if (result.item.title.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(result.item.title);
    }

    // Add matching tags
    result.item.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(query.toLowerCase())) {
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
export function quickSearch(query: string, limit: number = 10): ResourceEntry[] {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const resources = getAllResources();

  // Simple title/tag matching for speed
  return resources
    .filter((r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      r.description.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}
