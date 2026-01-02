/**
 * Link Unfurling Library
 *
 * Extracts URLs from messages and fetches Open Graph metadata:
 * - URL extraction with regex
 * - Server-side API calls (bypasses CORS)
 * - Database caching (7-day TTL)
 * - Batch fetching support
 *
 * Usage:
 * ```typescript
 * const unfurler = new LinkUnfurler();
 * const urls = unfurler.extractUrls("Check out https://example.com");
 * const previews = await unfurler.unfurlBatch(urls);
 * ```
 */

"use client";

// ============================================================================
// TYPES
// ============================================================================

export interface UnfurlData {
  /** Original URL */
  url: string;
  /** Page title (og:title) */
  title?: string;
  /** Page description (og:description) */
  description?: string;
  /** Preview image URL (og:image) */
  image?: string;
  /** Site name (og:site_name) */
  siteName?: string;
  /** Favicon URL */
  favicon?: string;
  /** Content type */
  type: "article" | "video" | "image" | "website";
  /** Video embed URL (for YouTube, etc.) */
  videoUrl?: string;
  /** Video MIME type */
  videoType?: string;
  /** Whether this was from cache */
  isCached?: boolean;
  /** Whether cache needs refresh */
  needsRefresh?: boolean;
}

export interface UnfurlResult {
  /** Successfully unfurled data */
  data?: UnfurlData;
  /** Error message if failed */
  error?: string;
  /** URL that was attempted */
  url: string;
}

export interface LinkUnfurlerConfig {
  /** API endpoint for unfurling */
  apiEndpoint?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum URLs to unfurl per message */
  maxUrls?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_API_ENDPOINT = "/api/chat/unfurl";
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_URLS_PER_MESSAGE = 5;

// URL regex - matches http/https URLs
const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

// Common domains that don't need unfurling (internal links, CDNs, etc.)
const SKIP_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "cdn.cloudflare.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
];

// ============================================================================
// LINK UNFURLER CLASS
// ============================================================================

export class LinkUnfurler {
  private config: Required<LinkUnfurlerConfig>;
  private cache: Map<string, UnfurlData> = new Map();
  private pendingRequests: Map<string, Promise<UnfurlResult>> = new Map();

  constructor(config: LinkUnfurlerConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint ?? DEFAULT_API_ENDPOINT,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      debug: config.debug ?? false,
      maxUrls: config.maxUrls ?? MAX_URLS_PER_MESSAGE,
    };
  }

  // ==========================================================================
  // URL EXTRACTION
  // ==========================================================================

  /**
   * Extract all URLs from text content
   */
  extractUrls(content: string): string[] {
    if (!content) return [];

    const matches = content.match(URL_REGEX) || [];

    // Deduplicate and filter
    const uniqueUrls = [...new Set(matches)]
      .filter((url) => this.shouldUnfurl(url))
      .slice(0, this.config.maxUrls);

    return uniqueUrls;
  }

  /**
   * Check if URL should be unfurled
   */
  private shouldUnfurl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Skip certain domains
      if (SKIP_DOMAINS.some((d) => parsed.hostname.includes(d))) {
        return false;
      }

      // Skip image/file URLs (they'll be handled by file preview)
      const path = parsed.pathname.toLowerCase();
      if (/\.(jpg|jpeg|png|gif|webp|svg|pdf|mp4|webm|mp3|wav)$/i.test(path)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // UNFURLING
  // ==========================================================================

  /**
   * Unfurl a single URL
   */
  async unfurl(url: string): Promise<UnfurlResult> {
    // Check memory cache first
    const cached = this.cache.get(url);
    if (cached && !cached.needsRefresh) {
      this.log("Cache hit:", url);
      return { url, data: cached };
    }

    // Check for pending request (deduplication)
    const pending = this.pendingRequests.get(url);
    if (pending) {
      this.log("Joining pending request:", url);
      return pending;
    }

    // Make new request
    const request = this.fetchUnfurl(url);
    this.pendingRequests.set(url, request);

    try {
      const result = await request;
      if (result.data) {
        this.cache.set(url, result.data);
      }
      return result;
    } finally {
      this.pendingRequests.delete(url);
    }
  }

  /**
   * Unfurl multiple URLs (batch)
   */
  async unfurlBatch(urls: string[]): Promise<Map<string, UnfurlResult>> {
    const results = new Map<string, UnfurlResult>();

    if (urls.length === 0) {
      return results;
    }

    // Separate cached vs uncached
    const uncached: string[] = [];
    for (const url of urls) {
      const cached = this.cache.get(url);
      if (cached && !cached.needsRefresh) {
        results.set(url, { url, data: cached });
      } else {
        uncached.push(url);
      }
    }

    // Fetch uncached URLs
    if (uncached.length > 0) {
      try {
        const batchResults = await this.fetchUnfurlBatch(uncached);
        for (const result of batchResults) {
          results.set(result.url, result);
          if (result.data) {
            this.cache.set(result.url, result.data);
          }
        }
      } catch (error) {
        this.log("Batch unfurl error:", error);
        // Fall back to individual requests
        const promises = uncached.map((url) => this.unfurl(url));
        const individualResults = await Promise.allSettled(promises);
        individualResults.forEach((result, index) => {
          const url = uncached[index];
          if (url && result.status === "fulfilled") {
            results.set(url, result.value);
          }
        });
      }
    }

    return results;
  }

  // ==========================================================================
  // API CALLS
  // ==========================================================================

  private async fetchUnfurl(url: string): Promise<UnfurlResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return { url, error: `Failed to unfurl: ${response.status} ${errorText}` };
      }

      const data = (await response.json()) as UnfurlData;
      return { url, data };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { url, error: "Request timeout" };
      }
      return { url, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private async fetchUnfurlBatch(urls: string[]): Promise<UnfurlResult[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const response = await fetch(`${this.config.apiEndpoint}/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Batch unfurl failed: ${response.status}`);
    }

    return response.json();
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Get cached preview (if available)
   */
  getCached(url: string): UnfurlData | null {
    return this.cache.get(url) ?? null;
  }

  /**
   * Clear cache for specific URL or all
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys()),
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log("[LinkUnfurler]", ...args);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let unfurlerInstance: LinkUnfurler | null = null;

export function getLinkUnfurler(config?: LinkUnfurlerConfig): LinkUnfurler {
  if (!unfurlerInstance) {
    unfurlerInstance = new LinkUnfurler(config);
  }
  return unfurlerInstance;
}

export function resetLinkUnfurler(): void {
  unfurlerInstance = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a URL is likely to have a good preview
 */
export function isPreviewableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Known good sites
    const goodDomains = [
      "youtube.com",
      "youtu.be",
      "twitter.com",
      "x.com",
      "github.com",
      "linkedin.com",
      "medium.com",
      "dev.to",
      "stackoverflow.com",
      "reddit.com",
      "nytimes.com",
      "theguardian.com",
      "bbc.com",
      "cnn.com",
    ];

    return (
      goodDomains.some((d) => parsed.hostname.includes(d)) ||
      !parsed.pathname.match(/\.(jpg|png|gif|pdf|mp4|zip)$/i)
    );
  } catch {
    return false;
  }
}

/**
 * Get domain display name from URL
 */
export function getDomainName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Check if URL is a video embed (YouTube, Vimeo, etc.)
 */
export function isVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const videoHosts = [
      "youtube.com",
      "youtu.be",
      "vimeo.com",
      "dailymotion.com",
      "twitch.tv",
    ];
    return videoHosts.some((h) => parsed.hostname.includes(h));
  } catch {
    return false;
  }
}

/**
 * Get YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }

    // youtube.com/watch?v=VIDEO_ID
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}
