/**
 * Firecrawl API Client
 *
 * Wrapper for Firecrawl web scraping API.
 * Used to scrape URLs for resource discovery.
 *
 * Environment variables:
 * - FIRECRAWL_API_KEY: API key for Firecrawl
 */

import "server-only";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

export interface ScrapeOptions {
  formats?: ("markdown" | "html" | "rawHtml" | "links" | "summary" | "screenshot")[];
  onlyMainContent?: boolean;
  waitFor?: number;
  maxAge?: number; // Cache time in ms
  includeTags?: string[];
  excludeTags?: string[];
  screenshot?: {
    fullPage?: boolean;
    quality?: number; // 0-100
    viewport?: { width: number; height: number };
  };
}

export interface ScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string; // Base64 encoded image or URL
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
      ogTitle?: string;
      ogDescription?: string;
      language?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
  error?: string;
}

export interface MapResult {
  success: boolean;
  links?: string[];
  error?: string;
}

export interface SearchResult {
  success: boolean;
  data?: {
    url: string;
    title?: string;
    description?: string;
    markdown?: string;
  }[];
  error?: string;
}

/**
 * Get Firecrawl API key from environment
 */
function getApiKey(): string {
   
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Scrape a single URL
 */
export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: options.formats || ["markdown"],
        onlyMainContent: options.onlyMainContent ?? true,
        waitFor: options.waitFor,
        maxAge: options.maxAge,
        includeTags: options.includeTags,
        excludeTags: options.excludeTags,
        // Screenshot options - pass as format object if screenshot is requested
        ...(options.screenshot && options.formats?.includes("screenshot")
          ? {
              formats: options.formats.map((f) =>
                f === "screenshot"
                  ? {
                      type: "screenshot" as const,
                      fullPage: options.screenshot?.fullPage ?? false,
                      quality: options.screenshot?.quality,
                      viewport: options.screenshot?.viewport,
                    }
                  : f
              ),
            }
          : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Map a website to discover all URLs
 */
export async function mapSite(
  url: string,
  options: {
    search?: string;
    limit?: number;
    includeSubdomains?: boolean;
    ignoreQueryParameters?: boolean;
  } = {}
): Promise<MapResult> {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${FIRECRAWL_API_URL}/map`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        search: options.search,
        limit: options.limit || 100,
        includeSubdomains: options.includeSubdomains ?? false,
        ignoreQueryParameters: options.ignoreQueryParameters ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      links: data.links,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search the web and optionally scrape results
 */
export async function searchWeb(
  query: string,
  options: {
    limit?: number;
    scrapeResults?: boolean;
    formats?: ("markdown" | "html")[];
  } = {}
): Promise<SearchResult> {
  try {
    const apiKey = getApiKey();

    const body: Record<string, unknown> = {
      query,
      limit: options.limit || 5,
    };

    // If scraping is requested, add scrape options
    if (options.scrapeResults) {
      body.scrapeOptions = {
        formats: options.formats || ["markdown"],
        onlyMainContent: true,
      };
    }

    const response = await fetch(`${FIRECRAWL_API_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract structured data from a URL
 */
export async function extractFromUrl(
  urls: string[],
  options: {
    prompt?: string;
    schema?: Record<string, unknown>;
  } = {}
): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${FIRECRAWL_API_URL}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        urls,
        prompt: options.prompt,
        schema: options.schema,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data?.[0] || data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
