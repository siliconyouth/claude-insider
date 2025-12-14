/**
 * Awesome List Adapter
 *
 * Parses "awesome-*" GitHub repositories which contain curated lists
 * of resources in markdown format.
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

interface ParsedLink {
  title: string;
  url: string;
  description: string;
  section?: string;
}

export class AwesomeListAdapter extends BaseAdapter {
  readonly type: SourceType = "awesome_list";
  readonly name = "Awesome List";
  readonly description =
    "Parse curated awesome-* lists from GitHub for resource discovery";

  validate(config: SourceConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.awesomeList) {
      errors.push("Awesome list configuration is required");
      return { valid: false, errors };
    }

    const { url } = config.awesomeList;

    if (!url) {
      errors.push("URL is required");
    } else if (!this.canHandle(url)) {
      errors.push("URL must be a GitHub repository");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  canHandle(url: string): boolean {
    // Can handle GitHub repos (especially awesome-* lists)
    return url.includes("github.com");
  }

  async fetch(url: string): Promise<DiscoveredResource | null> {
    // For a single URL, we can't really "fetch" an awesome list item
    // This would be used for the list itself
    if (!this.canHandle(url)) {
      return null;
    }

    return this.createResource({
      url,
      title: this.extractTitleFromUrl(url),
      description: "Resource from awesome list",
    });
  }

  async discover(
    config: SourceConfig,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors?.join(", ")}`);
    }

    const { url, sections } = config.awesomeList!;
    const limit = options?.limit ?? 100;

    try {
      // Fetch the README content
      const readmeContent = await this.fetchReadme(url);
      if (!readmeContent) {
        return [];
      }

      // Parse links from markdown
      let links = this.parseMarkdownLinks(readmeContent);

      // Filter by sections if specified
      if (sections && sections.length > 0) {
        const sectionSet = new Set(sections.map((s) => s.toLowerCase()));
        links = links.filter(
          (link) => link.section && sectionSet.has(link.section.toLowerCase())
        );
      }

      // Filter by keywords if specified
      if (options?.keywords && options.keywords.length > 0) {
        const keywordRegex = new RegExp(options.keywords.join("|"), "i");
        links = links.filter(
          (link) =>
            keywordRegex.test(link.title) || keywordRegex.test(link.description)
        );
      }

      // Convert to DiscoveredResource
      let resources = links.map((link) =>
        this.createResource({
          url: link.url,
          title: link.title,
          description: link.description,
          context: link.section ? `Section: ${link.section}` : undefined,
          metadata: {
            awesomeList: {
              sourceUrl: url,
              section: link.section,
            },
          },
        })
      );

      // Filter out existing URLs
      resources = this.filterExisting(resources, options?.skipExisting);

      return resources.slice(0, limit);
    } catch (error) {
      console.error("Awesome list discovery error:", error);
      return [];
    }
  }

  private async fetchReadme(repoUrl: string): Promise<string | null> {
    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match || !match[1] || !match[2]) {
      return null;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Claude-Insider-Resource-Discovery",
    };
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.GITHUB_TOKEN) {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.encoding === "base64" && data.content) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return data.content || null;
    } catch {
      return null;
    }
  }

  private parseMarkdownLinks(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    const lines = content.split("\n");
    let currentSection = "";

    for (const line of lines) {
      // Track section headers
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/);
      if (headerMatch && headerMatch[1]) {
        currentSection = headerMatch[1].trim();
        continue;
      }

      // Parse links: [title](url) - description
      // or - [title](url) - description
      const linkMatch = line.match(
        /[-*]?\s*\[([^\]]+)\]\(([^)]+)\)(?:\s*[-–—]\s*(.+))?/
      );
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        const url = linkMatch[2];

        // Skip non-http links, anchors, and images
        if (
          !url.startsWith("http") ||
          url.includes("#") ||
          /\.(png|jpg|jpeg|gif|svg)$/i.test(url)
        ) {
          continue;
        }

        links.push({
          title: linkMatch[1].trim(),
          url: url,
          description: linkMatch[3]?.trim() || "",
          section: currentSection || undefined,
        });
      }
    }

    return links;
  }

  private extractTitleFromUrl(url: string): string {
    const match = url.match(/github\.com\/[^/]+\/([^/]+)/);
    return match && match[1] ? match[1].replace(/-/g, " ") : url;
  }
}

export const awesomeListAdapter = new AwesomeListAdapter();
