/**
 * Base Adapter Interface for Resource Discovery Sources
 *
 * All source adapters must implement this interface to provide
 * a consistent API for discovering and fetching resources.
 */

import "server-only";

/**
 * Configuration options for discovery operations
 */
export interface DiscoverOptions {
  /** Maximum number of resources to discover */
  limit?: number;
  /** Skip already processed URLs */
  skipExisting?: string[];
  /** Filter by keywords */
  keywords?: string[];
  /** Include archived/deprecated items */
  includeArchived?: boolean;
  /** Minimum stars (for GitHub) */
  minStars?: number;
  /** Minimum downloads (for npm) */
  minDownloads?: number;
}

/**
 * A discovered resource ready for queue/analysis
 */
export interface DiscoveredResource {
  /** Source URL */
  url: string;
  /** Extracted or inferred title */
  title: string;
  /** Description if available */
  description: string;
  /** Source type that discovered this */
  sourceType: SourceType;
  /** Raw metadata from source */
  metadata: {
    /** GitHub-specific data */
    github?: {
      owner: string;
      repo: string;
      stars?: number;
      forks?: number;
      language?: string;
      topics?: string[];
      license?: string;
      lastCommit?: string;
      archived?: boolean;
    };
    /** npm-specific data */
    npm?: {
      name: string;
      version: string;
      weeklyDownloads?: number;
      keywords?: string[];
      license?: string;
      author?: string;
    };
    /** Generic metadata */
    [key: string]: unknown;
  };
  /** When this was discovered */
  discoveredAt: string;
  /** Additional context from source */
  context?: string;
}

/**
 * Supported source types
 */
export type SourceType =
  | "github_repo"
  | "github_search"
  | "github_org"
  | "npm_package"
  | "npm_search"
  | "awesome_list"
  | "website"
  | "rss_feed"
  | "manual";

/**
 * Source-specific configuration
 */
export interface SourceConfig {
  /** GitHub repository discovery */
  github?: {
    owner?: string;
    repo?: string;
    searchQuery?: string;
    topics?: string[];
    language?: string;
  };
  /** npm registry discovery */
  npm?: {
    packageName?: string;
    searchQuery?: string;
    scope?: string;
  };
  /** Awesome list parsing */
  awesomeList?: {
    url: string;
    sections?: string[];
  };
  /** Generic website */
  website?: {
    url: string;
    selectors?: {
      links?: string;
      title?: string;
      description?: string;
    };
  };
}

/**
 * Result of adapter validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Base interface that all source adapters must implement
 */
export interface SourceAdapter {
  /** Unique identifier for this adapter type */
  readonly type: SourceType;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this adapter does */
  readonly description: string;

  /**
   * Validate source configuration
   * @param config Source-specific configuration
   * @returns Validation result with any errors
   */
  validate(config: SourceConfig): ValidationResult;

  /**
   * Discover resources from the configured source
   * @param config Source-specific configuration
   * @param options Discovery options (limits, filters)
   * @returns Array of discovered resources
   */
  discover(
    config: SourceConfig,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]>;

  /**
   * Fetch a single resource by URL
   * @param url The URL to fetch
   * @returns The discovered resource or null if not found
   */
  fetch(url: string): Promise<DiscoveredResource | null>;

  /**
   * Check if this adapter can handle a given URL
   * @param url URL to check
   * @returns True if this adapter can process the URL
   */
  canHandle(url: string): boolean;
}

/**
 * Abstract base class with common functionality
 */
export abstract class BaseAdapter implements SourceAdapter {
  abstract readonly type: SourceType;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract validate(config: SourceConfig): ValidationResult;
  abstract discover(
    config: SourceConfig,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]>;
  abstract fetch(url: string): Promise<DiscoveredResource | null>;
  abstract canHandle(url: string): boolean;

  /**
   * Helper to create a discovered resource with defaults
   */
  protected createResource(
    partial: Partial<DiscoveredResource> & { url: string; title: string }
  ): DiscoveredResource {
    return {
      description: "",
      sourceType: this.type,
      metadata: {},
      discoveredAt: new Date().toISOString(),
      ...partial,
    };
  }

  /**
   * Helper to filter out existing URLs
   */
  protected filterExisting(
    resources: DiscoveredResource[],
    skipExisting?: string[]
  ): DiscoveredResource[] {
    if (!skipExisting || skipExisting.length === 0) {
      return resources;
    }
    const skipSet = new Set(skipExisting.map((url) => url.toLowerCase()));
    return resources.filter((r) => !skipSet.has(r.url.toLowerCase()));
  }
}
