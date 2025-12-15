/**
 * GitHub Adapter
 *
 * Discovers resources from GitHub repositories, organizations,
 * and search results.
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

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  license: { spdx_id: string } | null;
  pushed_at: string;
  created_at: string;
  archived: boolean;
  owner: {
    login: string;
    type: string;
  };
}

interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export class GitHubAdapter extends BaseAdapter {
  readonly type: SourceType = "github_repo";
  readonly name = "GitHub";
  readonly description =
    "Discover resources from GitHub repositories, organizations, and search";

  private readonly baseUrl = "https://api.github.com";
  private readonly headers: Record<string, string>;

  constructor() {
    super();
    this.headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Claude-Insider-Resource-Discovery",
    };
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.GITHUB_TOKEN) {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      this.headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
  }

  validate(config: SourceConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.github) {
      errors.push("GitHub configuration is required");
      return { valid: false, errors };
    }

    const { owner, repo, searchQuery, topics } = config.github;

    // Must have at least one discovery method
    if (!owner && !searchQuery && (!topics || topics.length === 0)) {
      errors.push(
        "At least one of owner, searchQuery, or topics must be provided"
      );
    }

    // If owner is provided without searchQuery, repo is optional (will list org repos)
    // If repo is provided, owner must also be provided
    if (repo && !owner) {
      errors.push("Owner is required when specifying a repository");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  canHandle(url: string): boolean {
    return url.includes("github.com");
  }

  async fetch(url: string): Promise<DiscoveredResource | null> {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match || !match[1] || !match[2]) {
      return null;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "").split("/")[0] || match[2];

    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        console.error(`GitHub API error: ${response.status}`);
        return null;
      }

      const data: GitHubRepo = await response.json();
      return this.repoToResource(data);
    } catch (error) {
      console.error("GitHub fetch error:", error);
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

    const github = config.github!;
    const limit = options?.limit ?? 30;
    let resources: DiscoveredResource[] = [];

    // Mode 1: Specific repository
    if (github.owner && github.repo) {
      const resource = await this.fetch(
        `https://github.com/${github.owner}/${github.repo}`
      );
      if (resource) {
        resources.push(resource);
      }
    }
    // Mode 2: Organization/user repositories
    else if (github.owner && !github.searchQuery) {
      resources = await this.discoverOrgRepos(github.owner, limit, options);
    }
    // Mode 3: Search query
    else if (github.searchQuery) {
      resources = await this.searchRepos(github.searchQuery, limit, options);
    }
    // Mode 4: Topic-based discovery
    else if (github.topics && github.topics.length > 0) {
      const query = github.topics.map((t) => `topic:${t}`).join(" ");
      resources = await this.searchRepos(query, limit, options);
    }

    // Filter out existing URLs if provided
    resources = this.filterExisting(resources, options?.skipExisting);

    // Apply filters
    if (options?.minStars) {
      resources = resources.filter(
        (r) => (r.metadata.github?.stars ?? 0) >= options.minStars!
      );
    }

    if (!options?.includeArchived) {
      resources = resources.filter((r) => !r.metadata.github?.archived);
    }

    return resources.slice(0, limit);
  }

  private async discoverOrgRepos(
    org: string,
    limit: number,
    _options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    try {
      const perPage = Math.min(limit, 100);
      const response = await fetch(
        `${this.baseUrl}/orgs/${org}/repos?per_page=${perPage}&sort=updated`,
        { headers: this.headers }
      );

      if (!response.ok) {
        // Try user repos instead
        const userResponse = await fetch(
          `${this.baseUrl}/users/${org}/repos?per_page=${perPage}&sort=updated`,
          { headers: this.headers }
        );
        if (!userResponse.ok) {
          throw new Error(`GitHub API error: ${userResponse.status}`);
        }
        const repos: GitHubRepo[] = await userResponse.json();
        return repos.map((repo) => this.repoToResource(repo));
      }

      const repos: GitHubRepo[] = await response.json();
      return repos.map((repo) => this.repoToResource(repo));
    } catch (error) {
      console.error("GitHub org discovery error:", error);
      return [];
    }
  }

  private async searchRepos(
    query: string,
    limit: number,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    try {
      // Build search query
      let searchQuery = query;

      // Add star filter if provided
      if (options?.minStars) {
        searchQuery += ` stars:>=${options.minStars}`;
      }

      // Always search for Claude/Anthropic related unless query already includes it
      if (
        !query.toLowerCase().includes("claude") &&
        !query.toLowerCase().includes("anthropic")
      ) {
        // Add relevance filter
        searchQuery += " (claude OR anthropic OR mcp)";
      }

      const perPage = Math.min(limit, 100);
      const response = await fetch(
        `${this.baseUrl}/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=${perPage}&sort=stars`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub search error: ${response.status}`);
      }

      const data: GitHubSearchResult = await response.json();
      return data.items.map((repo) => this.repoToResource(repo));
    } catch (error) {
      console.error("GitHub search error:", error);
      return [];
    }
  }

  private repoToResource(repo: GitHubRepo): DiscoveredResource {
    return this.createResource({
      url: repo.html_url,
      title: repo.name,
      description: repo.description || "",
      metadata: {
        github: {
          owner: repo.owner.login,
          repo: repo.name,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || undefined,
          topics: repo.topics,
          license: repo.license?.spdx_id,
          lastCommit: repo.pushed_at,
          archived: repo.archived,
        },
      },
      context: repo.homepage || undefined,
    });
  }
}

export const githubAdapter = new GitHubAdapter();
