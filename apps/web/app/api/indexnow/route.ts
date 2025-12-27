/**
 * IndexNow API Endpoint
 *
 * IndexNow is a protocol for instant URL indexing supported by:
 * - Bing (Microsoft)
 * - Yandex
 * - Seznam
 * - Naver
 *
 * When content changes, call this endpoint to notify search engines immediately.
 *
 * Usage:
 * POST /api/indexnow
 * Body: { urls: ["/docs/getting-started", "/resources/new-tool"] }
 *
 * Or submit single URL:
 * POST /api/indexnow
 * Body: { url: "/docs/getting-started" }
 */

import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "6a65eb75c5cef7d4c6fb4c1cdf37cd1f";
const HOST = "www.claudeinsider.com";

// IndexNow endpoints for different search engines
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

interface IndexNowRequest {
  url?: string;
  urls?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for automated submissions
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: IndexNowRequest = await request.json();

    // Normalize to array of URLs
    let urls: string[] = [];
    if (body.url) {
      urls = [body.url];
    } else if (body.urls && Array.isArray(body.urls)) {
      urls = body.urls;
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided. Use 'url' or 'urls' in request body." },
        { status: 400 }
      );
    }

    // Convert relative URLs to absolute
    const absoluteUrls = urls.map((url) =>
      url.startsWith("http") ? url : `https://${HOST}${url.startsWith("/") ? url : "/" + url}`
    );

    // IndexNow supports up to 10,000 URLs per request
    if (absoluteUrls.length > 10000) {
      return NextResponse.json(
        { error: "Maximum 10,000 URLs per request" },
        { status: 400 }
      );
    }

    // Submit to all IndexNow endpoints
    const results = await Promise.allSettled(
      INDEXNOW_ENDPOINTS.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: absoluteUrls,
          }),
        });

        return {
          endpoint,
          status: response.status,
          ok: response.ok,
        };
      })
    );

    // Check results
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length;

    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
    );

    console.log(`[IndexNow] Submitted ${absoluteUrls.length} URLs to ${successful}/${INDEXNOW_ENDPOINTS.length} endpoints`);

    return NextResponse.json({
      success: true,
      submitted: absoluteUrls.length,
      endpoints: {
        successful,
        total: INDEXNOW_ENDPOINTS.length,
      },
      urls: absoluteUrls.slice(0, 10), // Show first 10 URLs
      ...(absoluteUrls.length > 10 && { truncated: true }),
      ...(failed.length > 0 && {
        warnings: failed.map((f) =>
          f.status === "rejected"
            ? { error: "Request failed" }
            : { endpoint: (f as PromiseFulfilledResult<{ endpoint: string; status: number }>).value.endpoint, status: (f as PromiseFulfilledResult<{ endpoint: string; status: number }>).value.status }
        ),
      }),
    });
  } catch (error) {
    console.error("[IndexNow] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit URLs to IndexNow" },
      { status: 500 }
    );
  }
}

/**
 * GET handler to check IndexNow status
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    indexnow: {
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      endpoints: INDEXNOW_ENDPOINTS,
    },
    usage: {
      method: "POST",
      body: {
        url: "/path/to/page",
        // or
        urls: ["/path/to/page1", "/path/to/page2"],
      },
    },
  });
}
