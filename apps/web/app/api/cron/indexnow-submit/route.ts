/**
 * IndexNow Bulk Submit Cron Job
 *
 * Submits all indexed URLs to IndexNow endpoints for instant indexing.
 * Run weekly or after major content updates.
 *
 * Vercel Cron: 0 4 * * 0 (Every Sunday at 4 AM UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllDocPaths } from "@/lib/mdx";
import { getAllResourceSlugs } from "@/lib/resources/queries";

const INDEXNOW_KEY = "6a65eb75c5cef7d4c6fb4c1cdf37cd1f";
const HOST = "www.claudeinsider.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// Resource categories
const RESOURCE_CATEGORIES = [
  "official",
  "tools",
  "mcp-servers",
  "rules",
  "prompts",
  "agents",
  "tutorials",
  "sdks",
  "showcases",
  "community",
];

// Static pages
const STATIC_PAGES = [
  "/",
  "/docs",
  "/resources",
  "/stats",
  "/users",
  "/changelog",
  "/faq",
  "/search",
  "/suggestions",
  "/feed",
  "/donate",
  "/donors",
  "/privacy",
  "/terms",
  "/accessibility",
  "/disclaimer",
];

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Collect all URLs
    const urls: string[] = [];

    // 1. Static pages
    urls.push(...STATIC_PAGES.map((p) => `https://${HOST}${p}`));

    // 2. Resource category pages
    urls.push(...RESOURCE_CATEGORIES.map((c) => `https://${HOST}/resources/${c}`));

    // 3. Individual resources
    const resourceSlugs = await getAllResourceSlugs();
    urls.push(
      ...resourceSlugs
        .filter((slug) => !RESOURCE_CATEGORIES.includes(slug))
        .map((slug) => `https://${HOST}/resources/${slug}`)
    );

    // 4. Documentation pages
    const docPaths = getAllDocPaths();
    urls.push(
      ...docPaths
        .filter((path) => path.length > 0)
        .map((path) => `https://${HOST}/docs/${path.join("/")}`)
    );

    console.log(`[IndexNow Cron] Submitting ${urls.length} URLs...`);

    // IndexNow supports 10,000 URLs per request, but let's batch by 1000 for reliability
    const batchSize = 1000;
    const batches = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failCount = 0;

    for (const batch of batches) {
      try {
        const response = await fetch(INDEXNOW_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: batch,
          }),
        });

        if (response.ok || response.status === 202) {
          successCount += batch.length;
        } else {
          console.warn(`[IndexNow Cron] Batch failed with status ${response.status}`);
          failCount += batch.length;
        }
      } catch (error) {
        console.error(`[IndexNow Cron] Batch error:`, error);
        failCount += batch.length;
      }
    }

    console.log(`[IndexNow Cron] Complete: ${successCount} submitted, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      totalUrls: urls.length,
      submitted: successCount,
      failed: failCount,
      breakdown: {
        static: STATIC_PAGES.length,
        categories: RESOURCE_CATEGORIES.length,
        resources: resourceSlugs.filter((s) => !RESOURCE_CATEGORIES.includes(s)).length,
        docs: docPaths.filter((p) => p.length > 0).length,
      },
    });
  } catch (error) {
    console.error("[IndexNow Cron] Error:", error);
    return NextResponse.json({ error: "Failed to submit URLs" }, { status: 500 });
  }
}
