/**
 * Adapter Registry
 *
 * Central registry for all resource discovery adapters.
 * Provides unified API for discovering resources from multiple sources.
 */

import "server-only";
import {
  SourceAdapter,
  SourceType,
  SourceConfig,
  DiscoverOptions,
  DiscoveredResource,
  ValidationResult,
} from "./base";
import { githubAdapter } from "./github";
import { npmAdapter } from "./npm";
import { awesomeListAdapter } from "./awesome-list";
import { websiteAdapter } from "./website";

// Export types
export type {
  SourceAdapter,
  SourceType,
  SourceConfig,
  DiscoverOptions,
  DiscoveredResource,
  ValidationResult,
};

// Export individual adapters
export { githubAdapter } from "./github";
export { npmAdapter } from "./npm";
export { awesomeListAdapter } from "./awesome-list";
export { websiteAdapter } from "./website";

/**
 * All registered adapters
 */
const adapters: SourceAdapter[] = [
  githubAdapter,
  npmAdapter,
  awesomeListAdapter,
  websiteAdapter,
];

/**
 * Adapter registry for managing source adapters
 */
export const adapterRegistry = {
  /**
   * Get all registered adapters
   */
  getAll(): SourceAdapter[] {
    return [...adapters];
  },

  /**
   * Get adapter by type
   */
  getByType(type: SourceType): SourceAdapter | undefined {
    return adapters.find((a) => a.type === type);
  },

  /**
   * Get adapter that can handle a URL
   */
  getForUrl(url: string): SourceAdapter | undefined {
    // Priority order: GitHub > npm > awesome list > website
    // GitHub adapter handles github.com URLs
    if (githubAdapter.canHandle(url)) {
      return githubAdapter;
    }
    // npm adapter handles npmjs.com URLs
    if (npmAdapter.canHandle(url)) {
      return npmAdapter;
    }
    // Awesome list adapter (also handles GitHub, but for list parsing)
    // Only use for explicitly marked awesome lists
    if (url.toLowerCase().includes("awesome")) {
      return awesomeListAdapter;
    }
    // Website adapter is the fallback for any HTTP URL
    if (websiteAdapter.canHandle(url)) {
      return websiteAdapter;
    }
    return undefined;
  },

  /**
   * Get adapter info for display
   */
  getAdapterInfo(): {
    type: SourceType;
    name: string;
    description: string;
  }[] {
    return adapters.map((a) => ({
      type: a.type,
      name: a.name,
      description: a.description,
    }));
  },
};

/**
 * Discover resources using the appropriate adapter
 */
export async function discoverResources(
  config: SourceConfig,
  options?: DiscoverOptions
): Promise<{
  success: boolean;
  resources: DiscoveredResource[];
  adapter: string;
  error?: string;
}> {
  try {
    // Determine which adapter to use
    let adapter: SourceAdapter | undefined;

    if (config.github) {
      adapter = githubAdapter;
    } else if (config.npm) {
      adapter = npmAdapter;
    } else if (config.awesomeList) {
      adapter = awesomeListAdapter;
    } else if (config.website) {
      adapter = websiteAdapter;
    }

    if (!adapter) {
      return {
        success: false,
        resources: [],
        adapter: "none",
        error: "No valid configuration provided",
      };
    }

    // Validate configuration
    const validation = adapter.validate(config);
    if (!validation.valid) {
      return {
        success: false,
        resources: [],
        adapter: adapter.name,
        error: validation.errors?.join(", "),
      };
    }

    // Discover resources
    const resources = await adapter.discover(config, options);

    return {
      success: true,
      resources,
      adapter: adapter.name,
    };
  } catch (error) {
    return {
      success: false,
      resources: [],
      adapter: "unknown",
      error: error instanceof Error ? error.message : "Discovery failed",
    };
  }
}

/**
 * Fetch a single resource from a URL
 */
export async function fetchResource(
  url: string
): Promise<DiscoveredResource | null> {
  const adapter = adapterRegistry.getForUrl(url);
  if (!adapter) {
    return null;
  }
  return adapter.fetch(url);
}

/**
 * Batch discover from multiple sources
 */
export async function batchDiscover(
  configs: { config: SourceConfig; options?: DiscoverOptions }[]
): Promise<{
  success: boolean;
  results: {
    config: SourceConfig;
    resources: DiscoveredResource[];
    adapter: string;
    error?: string;
  }[];
  totalDiscovered: number;
}> {
  const results = await Promise.allSettled(
    configs.map(async ({ config, options }) => {
      const result = await discoverResources(config, options);
      return { config, ...result };
    })
  );

  const processedResults = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      config: configs[index]?.config || {},
      resources: [],
      adapter: "error",
      error: result.reason?.message || "Unknown error",
    };
  });

  const totalDiscovered = processedResults.reduce(
    (sum, r) => sum + r.resources.length,
    0
  );

  return {
    success: processedResults.some((r) => r.resources.length > 0),
    results: processedResults,
    totalDiscovered,
  };
}

/**
 * Quick relevance check for a URL
 */
export function isRelevantUrl(url: string): {
  relevant: boolean;
  reason: string;
  adapter?: string;
} {
  const lowercaseUrl = url.toLowerCase();

  // Check for Claude/Anthropic/MCP keywords
  const relevantKeywords = [
    "claude",
    "anthropic",
    "mcp",
    "model-context-protocol",
    "llm",
    "ai-assistant",
  ];

  const hasRelevantKeyword = relevantKeywords.some((keyword) =>
    lowercaseUrl.includes(keyword)
  );

  if (hasRelevantKeyword) {
    const adapter = adapterRegistry.getForUrl(url);
    return {
      relevant: true,
      reason: "URL contains relevant keywords",
      adapter: adapter?.name,
    };
  }

  // Check if it's an official Anthropic resource
  if (
    lowercaseUrl.includes("anthropic.com") ||
    lowercaseUrl.includes("github.com/anthropics")
  ) {
    return {
      relevant: true,
      reason: "Official Anthropic resource",
      adapter: "GitHub",
    };
  }

  // Check if it's a known relevant registry
  if (lowercaseUrl.includes("@anthropic-ai/")) {
    return {
      relevant: true,
      reason: "Official Anthropic npm package",
      adapter: "npm",
    };
  }

  return {
    relevant: false,
    reason: "URL does not appear to be Claude/Anthropic related",
  };
}
