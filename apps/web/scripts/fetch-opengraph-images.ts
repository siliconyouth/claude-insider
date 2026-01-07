#!/usr/bin/env npx tsx
/**
 * OpenGraph Image Fallback Script
 *
 * Fetches OpenGraph images for resources that couldn't be screenshotted.
 * Uses og:image, twitter:image, or other meta tags as fallback visuals.
 *
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/fetch-opengraph-images.ts
 *
 * Created: 2025-01-07 for Claude Insider v1.18.2
 */

import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SCREENSHOT_BUCKET: "resource-screenshots",
  LOCAL_CACHE_DIR: "tmp/og-images-cache",
  TIMEOUT_MS: 15000,
  USER_AGENT:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

// ============================================================================
// TYPES
// ============================================================================

interface Resource {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
}

interface OGResult {
  resourceId: string;
  slug: string;
  success: boolean;
  imageUrl?: string;
  uploadedUrl?: string;
  error?: string;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  return createClient(url, key);
}

// ============================================================================
// HTML PARSING - Extract OG Image
// ============================================================================

function extractOGImage(html: string, baseUrl: string): string | null {
  // Try different meta tags in order of preference
  const patterns = [
    // OpenGraph image
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    // Twitter card image
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    // Generic image meta
    /<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["']/i,
    // Link rel image
    /<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let imageUrl = match[1];

      // Handle relative URLs
      if (imageUrl.startsWith("/")) {
        try {
          const base = new URL(baseUrl);
          imageUrl = `${base.protocol}//${base.host}${imageUrl}`;
        } catch {
          // Keep as-is if URL parsing fails
        }
      } else if (!imageUrl.startsWith("http")) {
        // Relative path without leading slash
        try {
          const base = new URL(baseUrl);
          imageUrl = `${base.protocol}//${base.host}/${imageUrl}`;
        } catch {
          // Keep as-is
        }
      }

      return imageUrl;
    }
  }

  return null;
}

// ============================================================================
// FETCH PAGE HTML
// ============================================================================

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        "User-Agent": CONFIG.USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

// ============================================================================
// DOWNLOAD IMAGE
// ============================================================================

async function downloadImage(
  imageUrl: string,
  slug: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": CONFIG.USER_AGENT,
        Accept: "image/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/png";

    // Only accept images
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Skip tiny images (likely tracking pixels)
    if (buffer.length < 5000) {
      return null;
    }

    // Cache locally
    const cacheDir = path.join(process.cwd(), CONFIG.LOCAL_CACHE_DIR);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const ext = contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : contentType.includes("webp")
        ? "webp"
        : "png";
    const localPath = path.join(cacheDir, `${slug}.${ext}`);
    fs.writeFileSync(localPath, buffer);

    return { buffer, contentType };
  } catch {
    return null;
  }
}

// ============================================================================
// UPLOAD TO SUPABASE
// ============================================================================

async function uploadToSupabase(
  supabase: SupabaseClient,
  buffer: Buffer,
  contentType: string,
  slug: string,
  category: string
): Promise<string | null> {
  const ext = contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : "png";

  const filePath = `${category}/${slug}-og.${ext}`;

  const { error } = await supabase.storage
    .from(CONFIG.SCREENSHOT_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`   Upload error: ${error.message}`);
    return null;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(CONFIG.SCREENSHOT_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

// ============================================================================
// UPDATE DATABASE
// ============================================================================

async function updateResourceScreenshot(
  supabase: SupabaseClient,
  resourceId: string,
  screenshotUrl: string,
  title: string
): Promise<boolean> {
  const metadata = {
    url: screenshotUrl,
    width: 1200, // OG images are typically 1200x630
    height: 630,
    alt: `${title} preview`,
    caption: "OpenGraph preview image",
    order: 0,
    captured_at: new Date().toISOString(),
    source: "opengraph",
  };

  const { error } = await supabase
    .from("resources")
    .update({
      primary_screenshot_url: screenshotUrl,
      screenshot_metadata: [metadata],
    })
    .eq("id", resourceId);

  return !error;
}

// ============================================================================
// PROCESS SINGLE RESOURCE
// ============================================================================

async function processResource(
  supabase: SupabaseClient,
  resource: Resource
): Promise<OGResult> {
  const { id, slug, title, url, category } = resource;

  // 1. Fetch HTML
  const html = await fetchPageHtml(url);
  if (!html) {
    return { resourceId: id, slug, success: false, error: "Failed to fetch page" };
  }

  // 2. Extract OG image URL
  const imageUrl = extractOGImage(html, url);
  if (!imageUrl) {
    return { resourceId: id, slug, success: false, error: "No OG image found" };
  }

  // 3. Download image
  const imageData = await downloadImage(imageUrl, slug);
  if (!imageData) {
    return {
      resourceId: id,
      slug,
      success: false,
      error: "Failed to download image",
      imageUrl,
    };
  }

  // 4. Upload to Supabase
  const uploadedUrl = await uploadToSupabase(
    supabase,
    imageData.buffer,
    imageData.contentType,
    slug,
    category
  );
  if (!uploadedUrl) {
    return {
      resourceId: id,
      slug,
      success: false,
      error: "Failed to upload to storage",
      imageUrl,
    };
  }

  // 5. Update database
  const updated = await updateResourceScreenshot(supabase, id, uploadedUrl, title);
  if (!updated) {
    return {
      resourceId: id,
      slug,
      success: false,
      error: "Failed to update database",
      imageUrl,
      uploadedUrl,
    };
  }

  return { resourceId: id, slug, success: true, imageUrl, uploadedUrl };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🖼️  OpenGraph Image Fallback Script");
  console.log("   Fetching OG images for resources without screenshots");
  console.log("═".repeat(60) + "\n");

  const supabase = getSupabaseClient();

  // Fetch resources without screenshots
  console.log("📡 Fetching resources without screenshots...");

  const { data: resources, error } = await supabase
    .from("resources")
    .select("id, slug, title, url, category")
    .eq("is_published", true)
    .is("primary_screenshot_url", null)
    .order("category");

  if (error) {
    console.error("❌ Failed to fetch resources:", error.message);
    process.exit(1);
  }

  if (!resources || resources.length === 0) {
    console.log("✨ All resources have screenshots!");
    return;
  }

  console.log(`📊 Found ${resources.length} resources without screenshots\n`);

  // Process each resource
  const results: OGResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const resource of resources as Resource[]) {
    process.stdout.write(`📸 [${resource.slug}] Fetching OG image... `);

    const result = await processResource(supabase, resource);
    results.push(result);

    if (result.success) {
      successful++;
      console.log(`✅ Done`);
    } else {
      failed++;
      console.log(`❌ ${result.error}`);
    }

    // Small delay to be polite
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("═".repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total processed: ${resources.length}`);
  console.log("═".repeat(60));

  if (failed > 0) {
    console.log("\nFailed resources:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  • [${r.slug}] ${r.error}`);
      });
  }
}

main().catch(console.error);
