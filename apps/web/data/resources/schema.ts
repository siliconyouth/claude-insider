/**
 * Claude Insider Resources - TypeScript Schema
 * Defines the data structure for all resource entries
 */

// Primary category slugs
export type ResourceCategorySlug =
  | 'official'
  | 'tools'
  | 'mcp-servers'
  | 'rules'
  | 'prompts'
  | 'agents'
  | 'tutorials'
  | 'sdks'
  | 'showcases'
  | 'community';

// Difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Resource status
export type ResourceStatus = 'official' | 'community' | 'beta' | 'deprecated' | 'archived';

// GitHub repository information
export interface GitHubInfo {
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  language: string;
}

// Resource entry interface
export interface ResourceEntry {
  // Core fields
  id: string;
  title: string;
  description: string;
  url: string;
  category: ResourceCategorySlug;
  subcategory?: string;

  // Metadata
  tags: string[];
  difficulty?: DifficultyLevel;
  status: ResourceStatus;

  // GitHub stats (if applicable)
  github?: GitHubInfo;

  // Versioning (for MCP servers, packages)
  version?: string;
  namespace?: string;

  // Community signals
  featured?: boolean;
  featuredReason?: string; // e.g., "Editor's Pick", "Most Popular", "New"

  // Visual assets
  screenshotUrl?: string;
  screenshots?: string[];

  // Timestamps
  addedDate: string;
  lastVerified: string;

  // ============================================
  // Enhanced fields (Migration 088)
  // ============================================

  // AI-generated content
  aiOverview?: string;
  aiSummary?: string;
  aiAnalyzedAt?: string;
  aiConfidence?: number;

  // Structured analysis
  keyFeatures?: string[];
  useCases?: string[];
  pros?: string[];
  cons?: string[];
  targetAudience?: string[];
  prerequisites?: string[];

  // Relationship data
  relatedDocsCount?: number;
  relatedResourcesCount?: number;
  relatedDocSlugs?: string[];
  relatedResourceSlugs?: string[];

  // Screenshot metadata
  screenshotMetadata?: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
    order?: number;
  }>;
  primaryScreenshotUrl?: string;
  thumbnailUrl?: string;

  // Trending/popularity
  viewsThisWeek?: number;
  trendingScore?: number;
}

// Category metadata
export interface ResourceCategory {
  slug: ResourceCategorySlug;
  name: string;
  shortName: string;
  description: string;
  icon: string; // Emoji icon
  color: string; // Tailwind color class
}

// Resource statistics
export interface ResourceStats {
  totalResources: number;
  totalCategories: number;
  totalTags: number;
  totalGitHubStars: number;
  featuredCount: number;
  recentlyAdded: number;
  byCategory: Record<ResourceCategorySlug, number>;
}

// Search result
export interface ResourceSearchResult {
  resource: ResourceEntry;
  score: number;
  matches?: {
    key: string;
    value: string;
    indices: [number, number][];
  }[];
}

// Filter options
export interface ResourceFilters {
  category?: ResourceCategorySlug;
  tags?: string[];
  difficulty?: DifficultyLevel;
  status?: ResourceStatus;
  featured?: boolean;
  search?: string;

  // Enhanced field filters (Migration 088)
  targetAudience?: string[];
  useCases?: string[];
  minKeyFeatures?: number;
  hasPros?: boolean;
  hasCons?: boolean;
  hasPrerequisites?: boolean;
  hasAiAnalysis?: boolean;
}

// Tag with count
export interface TagWithCount {
  name: string;
  count: number;
}

// Array of category slugs for quick lookup (used in routing)
export const RESOURCE_CATEGORY_SLUGS: ResourceCategorySlug[] = [
  'official',
  'tools',
  'mcp-servers',
  'rules',
  'prompts',
  'agents',
  'tutorials',
  'sdks',
  'showcases',
  'community',
];

// All categories with metadata
export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    slug: 'official',
    name: 'Official Resources',
    shortName: 'Official',
    description: 'Official Anthropic documentation, guides, and repositories',
    icon: '🎯',
    color: 'violet',
  },
  {
    slug: 'tools',
    name: 'Tools & Extensions',
    shortName: 'Tools',
    description: 'IDE plugins, CLI tools, browser extensions, and desktop apps',
    icon: '🛠️',
    color: 'blue',
  },
  {
    slug: 'mcp-servers',
    name: 'MCP Servers',
    shortName: 'MCP',
    description: 'Model Context Protocol servers for extending Claude capabilities',
    icon: '🔌',
    color: 'cyan',
  },
  {
    slug: 'rules',
    name: 'CLAUDE.md Rules',
    shortName: 'Rules',
    description: 'Project configuration rules and best practices by framework',
    icon: '📝',
    color: 'green',
  },
  {
    slug: 'prompts',
    name: 'Prompting Guides',
    shortName: 'Prompts',
    description: 'System prompts, templates, and advanced prompting techniques',
    icon: '💡',
    color: 'yellow',
  },
  {
    slug: 'agents',
    name: 'AI Agent Resources',
    shortName: 'Agents',
    description: 'AI agent frameworks, multi-agent systems, and autonomous agents',
    icon: '🤖',
    color: 'purple',
  },
  {
    slug: 'tutorials',
    name: 'Tutorials & Courses',
    shortName: 'Tutorials',
    description: 'Step-by-step guides, courses, and learning resources',
    icon: '📖',
    color: 'pink',
  },
  {
    slug: 'sdks',
    name: 'SDKs & Libraries',
    shortName: 'SDKs',
    description: 'Official and community SDKs, client libraries, and utilities',
    icon: '🔧',
    color: 'indigo',
  },
  {
    slug: 'showcases',
    name: 'Showcases & Examples',
    shortName: 'Showcases',
    description: 'Real-world projects, case studies, and production deployments',
    icon: '🌟',
    color: 'amber',
  },
  {
    slug: 'community',
    name: 'Community',
    shortName: 'Community',
    description: 'Discord servers, forums, newsletters, and podcasts',
    icon: '👥',
    color: 'rose',
  },
];

// Get category by slug
export function getCategoryBySlug(slug: ResourceCategorySlug): ResourceCategory | undefined {
  return RESOURCE_CATEGORIES.find((cat) => cat.slug === slug);
}

// Validate resource entry
export function validateResource(resource: Partial<ResourceEntry>): resource is ResourceEntry {
  return !!(
    resource.id &&
    resource.title &&
    resource.description &&
    resource.url &&
    resource.category &&
    resource.status &&
    resource.tags &&
    resource.addedDate &&
    resource.lastVerified
  );
}
