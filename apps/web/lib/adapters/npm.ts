/**
 * npm Adapter
 *
 * Discovers resources from npm registry packages and search results.
 */

import "server-only";
import {
  BaseAdapter,
  DiscoveredResource,
  DiscoverOptions,
  SourceConfig,
  SourceType,
  ValidationResult,
} from "./base";

interface NpmPackage {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  license?: string;
  author?:
    | string
    | {
        name: string;
        email?: string;
      };
  maintainers?: { name: string; email: string }[];
  time?: {
    created: string;
    modified: string;
  };
}

interface NpmSearchResult {
  package: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    links: {
      npm: string;
      homepage?: string;
      repository?: string;
    };
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

interface NpmDownloads {
  downloads: number;
  package: string;
}

export class NpmAdapter extends BaseAdapter {
  readonly type: SourceType = "npm_package";
  readonly name = "npm";
  readonly description =
    "Discover resources from npm registry packages and search";

  private readonly registryUrl = "https://registry.npmjs.org";
  private readonly downloadsUrl = "https://api.npmjs.org/downloads";

  validate(config: SourceConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.npm) {
      errors.push("npm configuration is required");
      return { valid: false, errors };
    }

    const { packageName, searchQuery, scope } = config.npm;

    if (!packageName && !searchQuery && !scope) {
      errors.push(
        "At least one of packageName, searchQuery, or scope must be provided"
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  canHandle(url: string): boolean {
    return (
      url.includes("npmjs.com") ||
      url.includes("npmjs.org") ||
      url.startsWith("npm:")
    );
  }

  async fetch(url: string): Promise<DiscoveredResource | null> {
    // Extract package name from URL
    let packageName: string | null = null;

    if (url.startsWith("npm:")) {
      packageName = url.replace("npm:", "");
    } else {
      const match = url.match(/npmjs\.(?:com|org)\/package\/(.+?)(?:\/|$)/);
      if (match && match[1]) {
        packageName = decodeURIComponent(match[1]);
      }
    }

    if (!packageName) {
      return null;
    }

    try {
      const pkg = await this.fetchPackage(packageName);
      if (!pkg) {
        return null;
      }

      const downloads = await this.fetchDownloads(packageName);
      return this.packageToResource(pkg, downloads);
    } catch (error) {
      console.error("npm fetch error:", error);
      return null;
    }
  }

  async discover(
    config: SourceConfig,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors?.join(", ")}`);
    }

    const npm = config.npm!;
    const limit = options?.limit ?? 20;
    let resources: DiscoveredResource[] = [];

    // Mode 1: Specific package
    if (npm.packageName) {
      const resource = await this.fetch(`npm:${npm.packageName}`);
      if (resource) {
        resources.push(resource);
      }
    }
    // Mode 2: Search query
    else if (npm.searchQuery) {
      resources = await this.searchPackages(npm.searchQuery, limit, options);
    }
    // Mode 3: Scope-based discovery
    else if (npm.scope) {
      const query = npm.scope.startsWith("@") ? npm.scope : `@${npm.scope}`;
      resources = await this.searchPackages(query, limit, options);
    }

    // Filter out existing URLs
    resources = this.filterExisting(resources, options?.skipExisting);

    // Apply download filter
    if (options?.minDownloads) {
      resources = resources.filter(
        (r) =>
          (r.metadata.npm?.weeklyDownloads ?? 0) >= (options.minDownloads ?? 0)
      );
    }

    return resources.slice(0, limit);
  }

  private async fetchPackage(name: string): Promise<NpmPackage | null> {
    try {
      const response = await fetch(
        `${this.registryUrl}/${encodeURIComponent(name)}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const latestVersion = data["dist-tags"]?.latest;
      const versionInfo = latestVersion ? data.versions?.[latestVersion] : {};

      return {
        name: data.name,
        version: latestVersion || "unknown",
        description: data.description,
        keywords: data.keywords,
        homepage: versionInfo.homepage || data.homepage,
        repository: versionInfo.repository || data.repository,
        license: versionInfo.license || data.license,
        author: versionInfo.author || data.author,
        maintainers: data.maintainers,
        time: data.time,
      };
    } catch {
      return null;
    }
  }

  private async fetchDownloads(name: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.downloadsUrl}/point/last-week/${encodeURIComponent(name)}`
      );

      if (!response.ok) {
        return 0;
      }

      const data: NpmDownloads = await response.json();
      return data.downloads || 0;
    } catch {
      return 0;
    }
  }

  private async searchPackages(
    query: string,
    limit: number,
    _options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    try {
      // Add Claude/Anthropic relevance if not already present
      let searchQuery = query;
      if (
        !query.toLowerCase().includes("claude") &&
        !query.toLowerCase().includes("anthropic")
      ) {
        searchQuery = `${query} claude anthropic`;
      }

      const response = await fetch(
        `${this.registryUrl}/-/v1/search?text=${encodeURIComponent(searchQuery)}&size=${limit}`
      );

      if (!response.ok) {
        throw new Error(`npm search error: ${response.status}`);
      }

      const data = await response.json();
      const results: NpmSearchResult[] = data.objects || [];

      // Fetch downloads for each package
      const resources = await Promise.all(
        results.map(async (result) => {
          const downloads = await this.fetchDownloads(result.package.name);
          return this.searchResultToResource(result, downloads);
        })
      );

      return resources;
    } catch (error) {
      console.error("npm search error:", error);
      return [];
    }
  }

  private packageToResource(
    pkg: NpmPackage,
    downloads: number
  ): DiscoveredResource {
    const authorName =
      typeof pkg.author === "string" ? pkg.author : pkg.author?.name;

    return this.createResource({
      url: `https://www.npmjs.com/package/${pkg.name}`,
      title: pkg.name,
      description: pkg.description || "",
      metadata: {
        npm: {
          name: pkg.name,
          version: pkg.version,
          weeklyDownloads: downloads,
          keywords: pkg.keywords,
          license: pkg.license,
          author: authorName,
        },
        github: this.parseGitHubFromRepo(pkg.repository),
      },
      context: pkg.homepage || undefined,
    });
  }

  private searchResultToResource(
    result: NpmSearchResult,
    downloads: number
  ): DiscoveredResource {
    return this.createResource({
      url: result.package.links.npm,
      title: result.package.name,
      description: result.package.description || "",
      metadata: {
        npm: {
          name: result.package.name,
          version: result.package.version,
          weeklyDownloads: downloads,
          keywords: result.package.keywords,
        },
        github: result.package.links.repository
          ? this.parseGitHubFromUrl(result.package.links.repository)
          : undefined,
      },
      context: result.package.links.homepage || undefined,
    });
  }

  private parseGitHubFromRepo(
    repo?: NpmPackage["repository"]
  ): DiscoveredResource["metadata"]["github"] {
    if (!repo?.url) return undefined;
    return this.parseGitHubFromUrl(repo.url);
  }

  private parseGitHubFromUrl(
    url: string
  ): DiscoveredResource["metadata"]["github"] {
    const cleanUrl = url
      .replace(/^git\+/, "")
      .replace(/^git:\/\//, "https://")
      .replace(/\.git$/, "");

    const match = cleanUrl.match(/github\.com[/:]([^/]+)\/([^/]+)/);
    if (match && match[1] && match[2]) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
    return undefined;
  }
}

export const npmAdapter = new NpmAdapter();
