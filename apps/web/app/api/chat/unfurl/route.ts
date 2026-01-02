/**
 * Link Unfurl API
 *
 * Fetches Open Graph metadata for URLs (server-side to bypass CORS)
 *
 * POST /api/chat/unfurl
 * Body: { url: string }
 * Returns: UnfurlData
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// ============================================================================
// TYPES
// ============================================================================

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  videoUrl?: string;
  videoType?: string;
}

interface LinkPreviewRow {
  id: string;
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

// ============================================================================
// CONSTANTS
// ============================================================================

const FETCH_TIMEOUT = 8000; // 8 seconds
const MAX_HTML_SIZE = 512 * 1024; // 512KB max HTML to parse
const USER_AGENT =
  "Mozilla/5.0 (compatible; ClaudeInsider/1.0; +https://www.claudeinsider.com)";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse Open Graph tags from HTML
 */
function parseOpenGraph(html: string, baseUrl: string): OpenGraphData {
  const data: OpenGraphData = {};

  // Helper to extract meta content
  const getMetaContent = (property: string): string | undefined => {
    // Match og:property or name="property"
    const patterns = [
      new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i"),
      new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return decodeHTMLEntities(match[1]);
      }
    }
    return undefined;
  };

  // Get title (og:title > twitter:title > <title>)
  data.title =
    getMetaContent("title") ??
    getMetaContent("twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

  // Get description
  data.description =
    getMetaContent("description") ??
    getMetaContent("twitter:description");

  // Get image
  let image = getMetaContent("image") ?? getMetaContent("twitter:image");
  if (image) {
    // Make relative URLs absolute
    if (image.startsWith("/")) {
      const url = new URL(baseUrl);
      image = `${url.protocol}//${url.host}${image}`;
    }
    data.image = image;
  }

  // Get site name
  data.siteName = getMetaContent("site_name");

  // Get type
  data.type = getMetaContent("type") ?? "website";

  // Video tags (for YouTube, etc.)
  data.videoUrl = getMetaContent("video:url") ?? getMetaContent("video");
  data.videoType = getMetaContent("video:type");

  return data;
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

/**
 * Get favicon URL for a domain
 */
function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Use Google's favicon service as fallback
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return "";
  }
}

/**
 * Normalize URL for consistent caching
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "fbclid", "gclid"];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: "Invalid URL protocol" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(url);

    // Check database cache first
    try {
      const cacheResult = await pool.query<LinkPreviewRow>(
        `SELECT * FROM link_previews WHERE url = $1 AND expires_at > NOW()`,
        [normalizedUrl]
      );

      if (cacheResult.rows[0] && cacheResult.rows[0].title) {
        const preview = cacheResult.rows[0];
        return NextResponse.json({
          url: normalizedUrl,
          title: preview.title,
          description: preview.description,
          image: preview.image,
          siteName: preview.site_name,
          favicon: getFaviconUrl(normalizedUrl),
          type: preview.type || "website",
          videoUrl: preview.video_url,
          videoType: preview.video_type,
          isCached: true,
        });
      }
    } catch (dbError) {
      // Table might not exist yet, continue to fetch
      console.warn("[Unfurl API] Cache check failed:", dbError);
    }

    // Fetch the URL
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let response: Response;
    try {
      response = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Try to store error in cache
      try {
        await pool.query(
          `INSERT INTO link_previews (url, fetch_error, retry_count)
           VALUES ($1, $2, 1)
           ON CONFLICT (url) DO UPDATE SET
             fetch_error = EXCLUDED.fetch_error,
             retry_count = link_previews.retry_count + 1`,
          [normalizedUrl, fetchError instanceof Error ? fetchError.message : "Fetch failed"]
        );
      } catch {
        // Ignore cache write errors
      }

      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 502 }
      );
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `URL returned ${response.status}` },
        { status: 502 }
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      // Not HTML - return basic info
      return NextResponse.json({
        url: normalizedUrl,
        title: parsedUrl.pathname.split("/").pop() || parsedUrl.hostname,
        siteName: parsedUrl.hostname,
        favicon: getFaviconUrl(normalizedUrl),
        type: contentType.startsWith("image/") ? "image" : "website",
      });
    }

    // Read and parse HTML
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: "Cannot read response" },
        { status: 502 }
      );
    }

    let html = "";
    const decoder = new TextDecoder();

    while (html.length < MAX_HTML_SIZE) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });

      // Early exit if we have </head> (OG tags are in head)
      if (html.includes("</head>")) break;
    }

    reader.releaseLock();

    // Parse Open Graph data
    const ogData = parseOpenGraph(html, normalizedUrl);

    // Determine type
    let type: "article" | "video" | "image" | "website" = "website";
    if (ogData.type === "video" || ogData.type === "video.other" || ogData.videoUrl) {
      type = "video";
    } else if (ogData.type === "article") {
      type = "article";
    } else if (ogData.type === "image" || contentType.startsWith("image/")) {
      type = "image";
    }

    // Build response
    const result = {
      url: normalizedUrl,
      title: ogData.title || parsedUrl.hostname,
      description: ogData.description,
      image: ogData.image,
      siteName: ogData.siteName || parsedUrl.hostname,
      favicon: getFaviconUrl(normalizedUrl),
      type,
      videoUrl: ogData.videoUrl,
      videoType: ogData.videoType,
      isCached: false,
    };

    // Cache in database
    try {
      await pool.query(
        `INSERT INTO link_previews (url, title, description, image, site_name, favicon, type, video_url, video_type, fetched_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW() + INTERVAL '7 days')
         ON CONFLICT (url) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           image = EXCLUDED.image,
           site_name = EXCLUDED.site_name,
           favicon = EXCLUDED.favicon,
           type = EXCLUDED.type,
           video_url = EXCLUDED.video_url,
           video_type = EXCLUDED.video_type,
           fetched_at = NOW(),
           expires_at = NOW() + INTERVAL '7 days',
           fetch_error = NULL`,
        [
          normalizedUrl,
          result.title,
          result.description,
          result.image,
          result.siteName,
          result.favicon,
          result.type,
          result.videoUrl,
          result.videoType,
        ]
      );
    } catch {
      // Ignore cache write errors
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Unfurl API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
