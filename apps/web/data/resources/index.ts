/**
 * Claude Insider Resources - Main Data Index
 * Aggregates all resource data and provides utility functions
 */

import type {
  ResourceEntry,
  ResourceCategory,
  ResourceCategorySlug,
  ResourceStats,
  ResourceFilters,
  TagWithCount,
} from './schema';

import { RESOURCE_CATEGORIES, getCategoryBySlug } from './schema';

// Import all resource data
import officialResources from './official.json';
import toolsResources from './tools.json';
import mcpServersResources from './mcp-servers.json';
import rulesResources from './rules.json';
import promptsResources from './prompts.json';
import agentsResources from './agents.json';
import tutorialsResources from './tutorials.json';
import sdksResources from './sdks.json';
import showcasesResources from './showcases.json';
import communityResources from './community.json';

// Type assertion for imported JSON
const official = officialResources as ResourceEntry[];
const tools = toolsResources as ResourceEntry[];
const mcpServers = mcpServersResources as ResourceEntry[];
const rules = rulesResources as ResourceEntry[];
const prompts = promptsResources as ResourceEntry[];
const agents = agentsResources as ResourceEntry[];
const tutorials = tutorialsResources as ResourceEntry[];
const sdks = sdksResources as ResourceEntry[];
const showcases = showcasesResources as ResourceEntry[];
const community = communityResources as ResourceEntry[];

// All resources combined
export const ALL_RESOURCES: ResourceEntry[] = [
  ...official,
  ...tools,
  ...mcpServers,
  ...rules,
  ...prompts,
  ...agents,
  ...tutorials,
  ...sdks,
  ...showcases,
  ...community,
];

// Resources by category
export const RESOURCES_BY_CATEGORY: Record<ResourceCategorySlug, ResourceEntry[]> = {
  official,
  tools,
  'mcp-servers': mcpServers,
  rules,
  prompts,
  agents,
  tutorials,
  sdks,
  showcases,
  community,
};

// Get all resources
export function getAllResources(): ResourceEntry[] {
  return ALL_RESOURCES;
}

// Get resources by category
export function getResourcesByCategory(category: ResourceCategorySlug): ResourceEntry[] {
  return RESOURCES_BY_CATEGORY[category] || [];
}

// Get featured resources
export function getFeaturedResources(limit?: number): ResourceEntry[] {
  const featured = ALL_RESOURCES.filter((r) => r.featured);
  return limit ? featured.slice(0, limit) : featured;
}

// Get resource by ID
export function getResourceById(id: string): ResourceEntry | undefined {
  return ALL_RESOURCES.find((r) => r.id === id);
}

// Get all categories with counts
export function getCategoriesWithCounts(): (ResourceCategory & { count: number })[] {
  return RESOURCE_CATEGORIES.map((category) => ({
    ...category,
    count: RESOURCES_BY_CATEGORY[category.slug]?.length || 0,
  }));
}

// Get all unique tags with counts
export function getAllTags(): TagWithCount[] {
  const tagCounts: Record<string, number> = {};

  ALL_RESOURCES.forEach((resource) => {
    resource.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Get popular tags (top N)
export function getPopularTags(limit: number = 10): TagWithCount[] {
  return getAllTags().slice(0, limit);
}

// Calculate resource statistics
export function getResourceStats(): ResourceStats {
  const allTags = getAllTags();
  const totalGitHubStars = ALL_RESOURCES.reduce((sum, r) => sum + (r.github?.stars || 0), 0);
  const featured = ALL_RESOURCES.filter((r) => r.featured);

  // Resources added in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyAdded = ALL_RESOURCES.filter(
    (r) => new Date(r.addedDate) >= sevenDaysAgo
  ).length;

  const byCategory: Record<ResourceCategorySlug, number> = {
    official: official.length,
    tools: tools.length,
    'mcp-servers': mcpServers.length,
    rules: rules.length,
    prompts: prompts.length,
    agents: agents.length,
    tutorials: tutorials.length,
    sdks: sdks.length,
    showcases: showcases.length,
    community: community.length,
  };

  return {
    totalResources: ALL_RESOURCES.length,
    totalCategories: RESOURCE_CATEGORIES.length,
    totalTags: allTags.length,
    totalGitHubStars,
    featuredCount: featured.length,
    recentlyAdded,
    byCategory,
  };
}

// Filter resources
export function filterResources(filters: ResourceFilters): ResourceEntry[] {
  let results = ALL_RESOURCES;

  if (filters.category) {
    results = results.filter((r) => r.category === filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((r) =>
      filters.tags!.some((tag) => r.tags.includes(tag))
    );
  }

  if (filters.difficulty) {
    results = results.filter((r) => r.difficulty === filters.difficulty);
  }

  if (filters.status) {
    results = results.filter((r) => r.status === filters.status);
  }

  if (filters.featured !== undefined) {
    results = results.filter((r) => r.featured === filters.featured);
  }

  // Enhanced field filters (Migration 088)
  if (filters.targetAudience && filters.targetAudience.length > 0) {
    results = results.filter((r) =>
      r.targetAudience?.some((a) => filters.targetAudience!.includes(a))
    );
  }

  if (filters.useCases && filters.useCases.length > 0) {
    results = results.filter((r) =>
      r.useCases?.some((u) => filters.useCases!.includes(u))
    );
  }

  if (filters.minKeyFeatures !== undefined && filters.minKeyFeatures > 0) {
    results = results.filter((r) =>
      (r.keyFeatures?.length || 0) >= filters.minKeyFeatures!
    );
  }

  if (filters.hasPros === true) {
    results = results.filter((r) => r.pros && r.pros.length > 0);
  }

  if (filters.hasCons === true) {
    results = results.filter((r) => r.cons && r.cons.length > 0);
  }

  if (filters.hasPrerequisites === true) {
    results = results.filter((r) => r.prerequisites && r.prerequisites.length > 0);
  }

  if (filters.hasAiAnalysis === true) {
    results = results.filter((r) => !!r.aiOverview || !!r.aiSummary);
  }

  return results;
}

// Get recently added resources
export function getRecentlyAdded(limit: number = 10): ResourceEntry[] {
  return [...ALL_RESOURCES]
    .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
    .slice(0, limit);
}

// Get top resources by GitHub stars
export function getTopByStars(limit: number = 10): ResourceEntry[] {
  return [...ALL_RESOURCES]
    .filter((r) => r.github?.stars)
    .sort((a, b) => (b.github?.stars || 0) - (a.github?.stars || 0))
    .slice(0, limit);
}

// Get difficulty distribution stats
export function getDifficultyStats(): { level: string; count: number }[] {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  return levels.map((level) => ({
    level,
    count: ALL_RESOURCES.filter((r) => r.difficulty === level).length,
  }));
}

// Get status distribution stats
export function getStatusStats(): { status: string; count: number }[] {
  const statuses = ['official', 'community', 'beta', 'deprecated'];
  return statuses.map((status) => ({
    status,
    count: ALL_RESOURCES.filter((r) => r.status === status).length,
  }));
}

// ============================================
// Enhanced Field Aggregations (Migration 088)
// ============================================

// Get unique target audiences with counts
export function getTargetAudienceStats(): { audience: string; count: number }[] {
  const audienceMap = new Map<string, number>();

  ALL_RESOURCES.forEach((r) => {
    r.targetAudience?.forEach((audience) => {
      audienceMap.set(audience, (audienceMap.get(audience) || 0) + 1);
    });
  });

  return Array.from(audienceMap.entries())
    .map(([audience, count]) => ({ audience, count }))
    .sort((a, b) => b.count - a.count);
}

// Get unique use cases with counts
export function getUseCasesStats(): { useCase: string; count: number }[] {
  const useCaseMap = new Map<string, number>();

  ALL_RESOURCES.forEach((r) => {
    r.useCases?.forEach((useCase) => {
      useCaseMap.set(useCase, (useCaseMap.get(useCase) || 0) + 1);
    });
  });

  return Array.from(useCaseMap.entries())
    .map(([useCase, count]) => ({ useCase, count }))
    .sort((a, b) => b.count - a.count);
}

// Get key features distribution
export function getFeatureCountStats(): { range: string; count: number; min: number; max: number }[] {
  const ranges = [
    { range: '0', min: 0, max: 0 },
    { range: '1-3', min: 1, max: 3 },
    { range: '4-6', min: 4, max: 6 },
    { range: '7-10', min: 7, max: 10 },
    { range: '10+', min: 10, max: Infinity },
  ];

  return ranges.map((r) => ({
    ...r,
    count: ALL_RESOURCES.filter((res) => {
      const features = res.keyFeatures?.length || 0;
      return features >= r.min && features <= r.max;
    }).length,
  }));
}

// Get enhanced fields coverage stats
export function getEnhancedFieldsCoverage(): {
  hasPros: number;
  hasCons: number;
  hasPrerequisites: number;
  hasAiAnalysis: number;
  hasTargetAudience: number;
  hasUseCases: number;
  hasKeyFeatures: number;
  total: number;
} {
  return {
    hasPros: ALL_RESOURCES.filter((r) => r.pros && r.pros.length > 0).length,
    hasCons: ALL_RESOURCES.filter((r) => r.cons && r.cons.length > 0).length,
    hasPrerequisites: ALL_RESOURCES.filter((r) => r.prerequisites && r.prerequisites.length > 0).length,
    hasAiAnalysis: ALL_RESOURCES.filter((r) => !!r.aiOverview || !!r.aiSummary).length,
    hasTargetAudience: ALL_RESOURCES.filter((r) => r.targetAudience && r.targetAudience.length > 0).length,
    hasUseCases: ALL_RESOURCES.filter((r) => r.useCases && r.useCases.length > 0).length,
    hasKeyFeatures: ALL_RESOURCES.filter((r) => r.keyFeatures && r.keyFeatures.length > 0).length,
    total: ALL_RESOURCES.length,
  };
}

// Re-export schema types and utilities
export * from './schema';
export { getCategoryBySlug };
