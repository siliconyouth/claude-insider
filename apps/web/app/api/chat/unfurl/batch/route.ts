/**
 * Batch Link Unfurl API
 *
 * Fetches Open Graph metadata for multiple URLs at once
 *
 * POST /api/chat/unfurl/batch
 * Body: { urls: string[] }
 * Returns: UnfurlResult[]
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// ============================================================================
// TYPES
// ============================================================================

interface LinkPreviewRow {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
  favicon: string | null;
  type: string;
  video_url: string | null;
  video_type: string | null;
  expires_at: string;
}

interface UnfurlResult {
  url: string;
  data?: {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string;
    type: string;
    videoUrl?: string | null;
    videoType?: string | null;
    isCached?: boolean;
    needsRefresh?: boolean;
  };
  needsFetch?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_URLS_PER_BATCH = 10;

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body as { urls?: string[] };

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: "urls array is required" },
        { status: 400 }
      );
    }

    if (urls.length === 0) {
      return NextResponse.json([]);
    }

    if (urls.length > MAX_URLS_PER_BATCH) {
      return NextResponse.json(
        { error: `Maximum ${MAX_URLS_PER_BATCH} URLs per batch` },
        { status: 400 }
      );
    }

    // Validate URLs
    const validUrls: string[] = [];
    for (const url of urls) {
      try {
        const parsed = new URL(url);
        if (["http:", "https:"].includes(parsed.protocol)) {
          validUrls.push(url);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json([]);
    }

    // Get cached previews from database
    const cachedMap = new Map<string, LinkPreviewRow>();

    try {
      const cacheResult = await pool.query<LinkPreviewRow>(
        `SELECT url, title, description, image, site_name, favicon, type, video_url, video_type, expires_at
         FROM link_previews
         WHERE url = ANY($1)`,
        [validUrls]
      );

      for (const row of cacheResult.rows) {
        cachedMap.set(row.url, row);
      }
    } catch (dbError) {
      // Table might not exist yet, return empty results
      console.warn("[Unfurl Batch API] Cache check failed:", dbError);
    }

    // Build results
    const results: UnfurlResult[] = validUrls.map((url) => {
      const cached = cachedMap.get(url);
      const isExpired = cached ? new Date(cached.expires_at) < new Date() : true;

      if (cached && cached.title && !isExpired) {
        return {
          url,
          data: {
            url,
            title: cached.title,
            description: cached.description,
            image: cached.image,
            siteName: cached.site_name,
            favicon: getFaviconUrl(url),
            type: cached.type || "website",
            videoUrl: cached.video_url,
            videoType: cached.video_type,
            isCached: true,
          },
        };
      }

      // URL needs to be fetched - return partial result
      return {
        url,
        data: cached?.title
          ? {
              url,
              title: cached.title,
              description: cached.description,
              image: cached.image,
              siteName: cached.site_name,
              favicon: getFaviconUrl(url),
              type: cached.type || "website",
              needsRefresh: true,
            }
          : undefined,
        needsFetch: !cached?.title || isExpired,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Unfurl Batch API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return "";
  }
}
