#!/usr/bin/env npx tsx
/**
 * Parallel OpenGraph Image Fetcher
 *
 * Fetches OpenGraph/meta images for all resources and makes them the PRIMARY
 * photo in the gallery. Existing screenshots move to secondary position.
 *
 * Priority order:
 * 1. og:image (OpenGraph)
 * 2. twitter:image
 * 3. PWA manifest icons (highest resolution)
 * 4. apple-touch-icon
 * 5. Large favicon
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/fetch-og-images-parallel.ts
 *
 * Options:
 *   --limit=100        Process only N resources
 *   --category=tools   Filter by category
 *   --dry-run          Show what would be processed
 *   --skip-existing    Skip resources that already have 2+ screenshots
 *   --concurrency=50   Number of parallel requests (default: 50)
 */

import * as cheerio from "cheerio";
import PQueue from "p-queue";
import sharp from "sharp";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Configuration
const DEFAULT_CONCURRENCY = 50;
const IMAGE_DOWNLOAD_CONCURRENCY = 25;
const REQUEST_TIMEOUT = 12000; // 12 seconds
const MIN_IMAGE_SIZE = 5000; // 5KB minimum
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB maximum
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 800;
const SCREENSHOT_BUCKET = "resource-screenshots";

// Dark background for centering images
const BACKGROUND_COLOR = { r: 17, g: 17, b: 17, alpha: 1 }; // #111111

// Skip patterns for URLs that won't work
const SKIP_PATTERNS = [
  "console.anthropic.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "github.com/login",
  "localhost",
  "127.0.0.1",
];

// User agent to avoid blocks
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface Resource {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  screenshots: string[] | null;
  primary_screenshot_url: string | null;
}

interface ProcessResult {
  id: string;
  slug: string;
  success: boolean;
  imageUrl?: string;
  source?: string;
  error?: string;
  duration?: number;
}

interface ImageCandidate {
  url: string;
  source: string;
  priority: number;
  width?: number;
  height?: number;
}

// Parse command line arguments
function parseArgs(): {
  limit?: number;
  category?: string;
  dryRun: boolean;
  skipExisting: boolean;
  concurrency: number;
} {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    skipExisting: false,
    concurrency: DEFAULT_CONCURRENCY,
  } as ReturnType<typeof parseArgs>;

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const value = arg.split("=")[1];
      if (value) options.limit = parseInt(value, 10);
    } else if (arg.startsWith("--category=")) {
      const value = arg.split("=")[1];
      if (value) options.category = value;
    } else if (arg.startsWith("--concurrency=")) {
      const value = arg.split("=")[1];
      if (value) options.concurrency = parseInt(value, 10);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-existing") {
      options.skipExisting = true;
    }
  }

  return options;
}

// Get Supabase client
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

// Check if URL should be skipped
function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some((pattern) => url.includes(pattern));
}

// Resolve relative URL to absolute
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

// Fetch HTML with timeout
async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Fetch and parse PWA manifest
async function fetchManifest(
  manifestUrl: string
): Promise<ImageCandidate[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(manifestUrl, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const manifest = await response.json();
    if (!manifest.icons || !Array.isArray(manifest.icons)) return null;

    return manifest.icons
      .filter((icon: { sizes?: string }) => {
        if (!icon.sizes) return false;
        const size = parseInt(icon.sizes.split("x")[0] || "0", 10);
        return size >= 128; // Minimum useful size
      })
      .map((icon: { src: string; sizes: string }, index: number) => {
        const size = parseInt(icon.sizes.split("x")[0] || "0", 10);
        return {
          url: resolveUrl(icon.src, manifestUrl),
          source: "manifest",
          priority: 30 + index, // Lower than OG but with size consideration
          width: size,
          height: size,
        };
      })
      .sort(
        (a: ImageCandidate, b: ImageCandidate) =>
          (b.width || 0) - (a.width || 0)
      ); // Sort by size descending
  } catch {
    return null;
  }
}

// Extract image candidates from HTML
async function extractImageCandidates(
  html: string,
  baseUrl: string
): Promise<ImageCandidate[]> {
  const $ = cheerio.load(html);
  const candidates: ImageCandidate[] = [];

  // 1. OpenGraph image (highest priority)
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    candidates.push({
      url: resolveUrl(ogImage, baseUrl),
      source: "og:image",
      priority: 10,
    });
  }

  // 2. Twitter image
  const twitterImage =
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[name="twitter:image:src"]').attr("content") ||
    $('meta[property="twitter:image"]').attr("content");
  if (twitterImage) {
    candidates.push({
      url: resolveUrl(twitterImage, baseUrl),
      source: "twitter:image",
      priority: 20,
    });
  }

  // 3. PWA manifest icons
  const manifestHref = $('link[rel="manifest"]').attr("href");
  if (manifestHref) {
    const manifestUrl = resolveUrl(manifestHref, baseUrl);
    const manifestIcons = await fetchManifest(manifestUrl);
    if (manifestIcons) {
      candidates.push(...manifestIcons);
    }
  } else {
    // Try default manifest.json location
    const origin = new URL(baseUrl).origin;
    const defaultManifest = await fetchManifest(`${origin}/manifest.json`);
    if (defaultManifest) {
      candidates.push(...defaultManifest);
    }
  }

  // 4. Apple touch icon
  const appleTouchIcon =
    $('link[rel="apple-touch-icon"]').attr("href") ||
    $('link[rel="apple-touch-icon-precomposed"]').attr("href");
  if (appleTouchIcon) {
    candidates.push({
      url: resolveUrl(appleTouchIcon, baseUrl),
      source: "apple-touch-icon",
      priority: 40,
      width: 180,
      height: 180,
    });
  }

  // 5. Large favicon (with sizes)
  $('link[rel="icon"]').each((_, el) => {
    const href = $(el).attr("href");
    const sizes = $(el).attr("sizes");
    if (href && sizes) {
      const size = parseInt(sizes.split("x")[0] || "0", 10);
      if (size >= 64) {
        candidates.push({
          url: resolveUrl(href, baseUrl),
          source: "favicon",
          priority: 50,
          width: size,
          height: size,
        });
      }
    }
  });

  // Sort by priority (lower = better)
  return candidates.sort((a, b) => a.priority - b.priority);
}

// Download and process image
async function downloadAndProcessImage(
  imageUrl: string
): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/*",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("image/") &&
      !contentType.includes("application/octet-stream")
    ) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate size
    if (buffer.length < MIN_IMAGE_SIZE || buffer.length > MAX_IMAGE_SIZE) {
      return null;
    }

    // Process with sharp - center on target canvas
    const processed = await sharp(buffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "contain",
        background: BACKGROUND_COLOR,
      })
      .png()
      .toBuffer();

    return processed;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Upload image to Supabase Storage
async function uploadImage(
  supabase: SupabaseClient,
  buffer: Buffer,
  resourceSlug: string,
  source: string
): Promise<string | null> {
  const timestamp = Date.now();
  const storagePath = `${resourceSlug}/${timestamp}-${source.replace(":", "-")}.png`;

  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error(`Upload failed for ${resourceSlug}: ${error.message}`);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(SCREENSHOT_BUCKET)
    .getPublicUrl(data.path);
  return urlData.publicUrl;
}

// Update resource with new primary image
async function updateResourceWithOgImage(
  supabase: SupabaseClient,
  resourceId: string,
  newPrimaryUrl: string,
  existingScreenshots: string[] | null
): Promise<boolean> {
  // New primary (OG image) goes first, existing screenshot becomes secondary
  const existingPrimary = existingScreenshots?.[0];
  const newScreenshots = existingPrimary
    ? [newPrimaryUrl, existingPrimary]
    : [newPrimaryUrl];

  const { error } = await supabase
    .from("resources")
    .update({
      screenshots: newScreenshots,
      primary_screenshot_url: newPrimaryUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId);

  return !error;
}

// Process a single resource
async function processResource(
  supabase: SupabaseClient,
  resource: Resource,
  imageQueue: PQueue
): Promise<ProcessResult> {
  const startTime = Date.now();

  try {
    // Fetch HTML
    const html = await fetchHtml(resource.url);
    if (!html) {
      return {
        id: resource.id,
        slug: resource.slug,
        success: false,
        error: "Failed to fetch HTML",
        duration: Date.now() - startTime,
      };
    }

    // Extract image candidates
    const candidates = await extractImageCandidates(html, resource.url);
    if (candidates.length === 0) {
      return {
        id: resource.id,
        slug: resource.slug,
        success: false,
        error: "No image candidates found",
        duration: Date.now() - startTime,
      };
    }

    // Try each candidate in order
    for (const candidate of candidates) {
      // Queue image download to respect concurrency
      const imageBuffer = await imageQueue.add(() =>
        downloadAndProcessImage(candidate.url)
      );

      if (imageBuffer) {
        // Upload to storage
        const uploadedUrl = await uploadImage(
          supabase,
          imageBuffer,
          resource.slug,
          candidate.source
        );

        if (uploadedUrl) {
          // Update database - OG image becomes PRIMARY
          const updated = await updateResourceWithOgImage(
            supabase,
            resource.id,
            uploadedUrl,
            resource.screenshots
          );

          return {
            id: resource.id,
            slug: resource.slug,
            success: updated,
            imageUrl: uploadedUrl,
            source: candidate.source,
            error: updated ? undefined : "Database update failed",
            duration: Date.now() - startTime,
          };
        }
      }
    }

    return {
      id: resource.id,
      slug: resource.slug,
      success: false,
      error: `All ${candidates.length} candidates failed`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      id: resource.id,
      slug: resource.slug,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

// Get resources from database
async function getResources(
  supabase: SupabaseClient,
  options: { limit?: number; category?: string; skipExisting: boolean }
): Promise<Resource[]> {
  const PAGE_SIZE = 1000;
  let allResources: Resource[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("resources")
      .select("id, slug, title, url, category, screenshots, primary_screenshot_url")
      .eq("is_published", true);

    if (options.category) {
      query = query.eq("category", options.category);
    }

    query = query.order("category").order("slug").range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    if (data && data.length > 0) {
      allResources = allResources.concat(data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  // Filter out problematic URLs
  let filtered = allResources.filter((r) => !shouldSkip(r.url));

  // Skip resources that already have 2+ screenshots
  if (options.skipExisting) {
    filtered = filtered.filter(
      (r) => !r.screenshots || r.screenshots.length < 2
    );
  }

  // Apply limit
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

// Main
async function main() {
  const options = parseArgs();

  console.log("\n" + "=".repeat(60));
  console.log("🖼️  Parallel OpenGraph Image Fetcher");
  console.log("=".repeat(60));
  console.log(`Concurrency: ${options.concurrency} HTML fetches, ${IMAGE_DOWNLOAD_CONCURRENCY} image downloads`);
  if (options.limit) console.log(`Limit: ${options.limit} resources`);
  if (options.category) console.log(`Category filter: ${options.category}`);
  if (options.dryRun) console.log("Mode: DRY RUN");
  if (options.skipExisting) console.log("Skip: Resources with 2+ screenshots");
  console.log("");

  const supabase = getSupabaseClient();

  // Get resources
  console.log("📊 Fetching resources from database...");
  const resources = await getResources(supabase, options);

  console.log(`\n📋 Found ${resources.length} resources to process`);

  if (resources.length === 0) {
    console.log("✨ No resources to process!");
    return;
  }

  // Show category breakdown
  const byCategory: Record<string, number> = {};
  resources.forEach((r) => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });

  console.log("\nBy category:");
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  // Dry run
  if (options.dryRun) {
    console.log("\n🔍 DRY RUN - Would process these resources:\n");
    resources.slice(0, 20).forEach((r) => console.log(`  ${r.slug}: ${r.url}`));
    if (resources.length > 20) {
      console.log(`  ... and ${resources.length - 20} more`);
    }
    return;
  }

  // Estimate time
  const estimatedSeconds = Math.ceil(
    (resources.length / options.concurrency) * 1.5
  );
  console.log(`\n⏱️  Estimated time: ~${Math.ceil(estimatedSeconds / 60)} minutes`);

  // Create queues
  const fetchQueue = new PQueue({ concurrency: options.concurrency });
  const imageQueue = new PQueue({ concurrency: IMAGE_DOWNLOAD_CONCURRENCY });

  console.log(`\n🚀 Starting parallel fetch...\n`);

  const results: ProcessResult[] = [];
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();

  // Process all resources
  const promises = resources.map((resource) =>
    fetchQueue.add(async () => {
      const result = await processResource(supabase, resource, imageQueue);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Progress update every 50 resources
      if ((successful + failed) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        process.stdout.write(
          `\r📦 Progress: ${successful + failed}/${resources.length} | ✅ ${successful} | ❌ ${failed} | ⏱️  ${elapsed}s`
        );
      }

      return result;
    })
  );

  await Promise.all(promises);

  const duration = Math.round((Date.now() - startTime) / 1000);

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 OpenGraph Image Fetch Summary");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total processed: ${results.length}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(
    `⚡ Rate: ${(results.length / duration).toFixed(1)} resources/second`
  );

  // Source breakdown
  const bySources: Record<string, number> = {};
  results
    .filter((r) => r.success && r.source)
    .forEach((r) => {
      bySources[r.source!] = (bySources[r.source!] || 0) + 1;
    });

  if (Object.keys(bySources).length > 0) {
    console.log("\nBy image source:");
    Object.entries(bySources)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => console.log(`  ${source}: ${count}`));
  }

  console.log("=".repeat(60) + "\n");

  // Show failures
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0 && failures.length <= 30) {
    console.log("Failed resources:");
    failures.forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
  } else if (failures.length > 30) {
    console.log(`\n${failures.length} resources failed. First 20:`);
    failures
      .slice(0, 20)
      .forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
  }
}

main().catch(console.error);
