/**
 * Website Adapter
 *
 * Discovers resources from generic websites using Firecrawl
 * for scraping and content extraction.
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
import { scrapeUrl, mapSite, extractFromUrl } from "@/lib/firecrawl";

interface ExtractedLink {
  url: string;
  title?: string;
  description?: string;
}

export class WebsiteAdapter extends BaseAdapter {
  readonly type: SourceType = "website";
  readonly name = "Website";
  readonly description =
    "Discover resources from websites using web scraping and link extraction";

  validate(config: SourceConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.website) {
      errors.push("Website configuration is required");
      return { valid: false, errors };
    }

    const { url } = config.website;

    if (!url) {
      errors.push("URL is required");
    } else {
      try {
        new URL(url);
      } catch {
        errors.push("Invalid URL format");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  canHandle(url: string): boolean {
    // Can handle any HTTP(S) URL
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async fetch(url: string): Promise<DiscoveredResource | null> {
    if (!this.canHandle(url)) {
      return null;
    }

    try {
      const result = await scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        maxAge: 86400000, // 24 hour cache
      });

      if (!result.success || !result.data) {
        return null;
      }

      const metadata = result.data.metadata || {};

      return this.createResource({
        url,
        title: (metadata.title as string) || this.extractTitleFromUrl(url),
        description: (metadata.description as string) || "",
        metadata: {
          website: {
            title: metadata.title,
            description: metadata.description,
            ogImage: metadata.ogImage,
            language: metadata.language,
          },
          contentLength: result.data.markdown?.length || 0,
        },
      });
    } catch (error) {
      console.error("Website fetch error:", error);
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

    const { url } = config.website!;
    const limit = options?.limit ?? 50;

    try {
      // First, map the site to discover URLs
      const mapResult = await mapSite(url, { limit: limit * 2 });

      if (!mapResult.success || !mapResult.links) {
        // Fallback to scraping the main page and extracting links
        return this.discoverFromScrape(url, limit, options);
      }

      // Filter and process discovered URLs
      let links: string[] = mapResult.links;

      // Filter by keywords if specified
      if (options?.keywords && options.keywords.length > 0) {
        const keywordRegex = new RegExp(options.keywords.join("|"), "i");
        links = links.filter((link) => keywordRegex.test(link));
      }

      // Convert links to resources (with basic metadata)
      const resources = links.slice(0, limit).map((link) =>
        this.createResource({
          url: link,
          title: this.extractTitleFromUrl(link),
          description: "",
          metadata: {
            website: {
              sourceUrl: url,
            },
          },
        })
      );

      // Filter out existing URLs
      return this.filterExisting(resources, options?.skipExisting);
    } catch (error) {
      console.error("Website discovery error:", error);
      return [];
    }
  }

  private async discoverFromScrape(
    url: string,
    limit: number,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    try {
      // Use extraction to get links with context
      const extractResult = await extractFromUrl([url], {
        prompt:
          "Extract all resource links from this page. Include project links, tool links, library links, and any documentation links that would be useful for Claude AI developers.",
        schema: {
          type: "object",
          properties: {
            links: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["url"],
              },
            },
          },
        },
      });

      if (!extractResult.success || !extractResult.data) {
        // Final fallback: just scrape and extract links manually
        return this.extractLinksFromScrape(url, limit, options);
      }

      const extracted = extractResult.data as { links?: ExtractedLink[] };
      const links = extracted.links || [];

      let resources = links.map((link) =>
        this.createResource({
          url: link.url,
          title: link.title || this.extractTitleFromUrl(link.url),
          description: link.description || "",
          metadata: {
            website: {
              sourceUrl: url,
            },
          },
        })
      );

      // Filter by keywords
      if (options?.keywords && options.keywords.length > 0) {
        const keywordRegex = new RegExp(options.keywords.join("|"), "i");
        resources = resources.filter(
          (r) => keywordRegex.test(r.title) || keywordRegex.test(r.description)
        );
      }

      // Filter existing and limit
      resources = this.filterExisting(resources, options?.skipExisting);
      return resources.slice(0, limit);
    } catch (error) {
      console.error("Website scrape extraction error:", error);
      return [];
    }
  }

  private async extractLinksFromScrape(
    url: string,
    limit: number,
    options?: DiscoverOptions
  ): Promise<DiscoveredResource[]> {
    try {
      const result = await scrapeUrl(url, {
        formats: ["links", "markdown"],
        onlyMainContent: true,
      });

      if (!result.success || !result.data) {
        return [];
      }

      // Get links from the scrape result
      const links: string[] = result.data.links || [];

      // Filter to only external links that look like resources
      const baseUrl = new URL(url);
      const filteredLinks = links.filter((link) => {
        try {
          const linkUrl = new URL(link);
          // Include external links and links that look like projects/tools
          return (
            linkUrl.hostname !== baseUrl.hostname ||
            /\/(project|tool|resource|package|repo)/i.test(linkUrl.pathname)
          );
        } catch {
          return false;
        }
      });

      let resources = filteredLinks.slice(0, limit).map((link) =>
        this.createResource({
          url: link,
          title: this.extractTitleFromUrl(link),
          description: "",
          metadata: {
            website: {
              sourceUrl: url,
            },
          },
        })
      );

      // Filter existing
      resources = this.filterExisting(resources, options?.skipExisting);
      return resources;
    } catch (error) {
      console.error("Link extraction error:", error);
      return [];
    }
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Get the last meaningful path segment
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];

      if (lastPart) {
        // Clean up the segment
        return lastPart
          .replace(/[-_]/g, " ")
          .replace(/\.\w+$/, "") // Remove file extension
          .replace(/\b\w/g, (c) => c.toUpperCase()); // Title case
      }

      return parsed.hostname;
    } catch {
      return url;
    }
  }
}

export const websiteAdapter = new WebsiteAdapter();
