/**
 * URL Scraping API
 *
 * POST /api/admin/resources/scrape
 *
 * Scrapes a URL using Firecrawl to extract content.
 * Requires admin or moderator authentication.
 *
 * Request body:
 * - url: string (required) - The URL to scrape
 * - mode: 'scrape' | 'map' | 'search' (default: 'scrape')
 * - options: object (optional) - Mode-specific options
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { scrapeUrl, mapSite, searchWeb } from "@/lib/firecrawl";
import { hasRole } from "@/collections/Users";
import {
  checkRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Extract the payload-token from cookies
    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user using Payload's auth
    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(user.id, "scrape");
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Parse request body
    const body = await request.json();
    const { url, mode = "scrape", query, options = {} } = body;

    // Validate based on mode
    if (mode === "search") {
      if (!query || typeof query !== "string") {
        return NextResponse.json(
          { error: "Query is required for search mode" },
          { status: 400 }
        );
      }
    } else {
      if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }

    // Execute based on mode
    let result;
    switch (mode) {
      case "scrape":
        result = await scrapeUrl(url, {
          formats: options.formats || ["markdown"],
          onlyMainContent: options.onlyMainContent ?? true,
          waitFor: options.waitFor,
          maxAge: options.maxAge,
        });
        break;

      case "map":
        result = await mapSite(url, {
          search: options.search,
          limit: options.limit || 100,
          includeSubdomains: options.includeSubdomains,
          ignoreQueryParameters: options.ignoreQueryParameters,
        });
        break;

      case "search":
        result = await searchWeb(query, {
          limit: options.limit || 10,
          scrapeResults: options.scrapeResults,
          formats: options.formats,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid mode. Use 'scrape', 'map', or 'search'" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Scraping failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mode,
      url: mode !== "search" ? url : undefined,
      query: mode === "search" ? query : undefined,
      ...result,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scraping failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "POST to scrape a URL. Modes: 'scrape' (single URL), 'map' (discover URLs), 'search' (web search)",
    examples: {
      scrape: { url: "https://example.com", mode: "scrape" },
      map: { url: "https://example.com", mode: "map", options: { limit: 50 } },
      search: {
        query: "claude ai tools",
        mode: "search",
        options: { limit: 5 },
      },
    },
  });
}
