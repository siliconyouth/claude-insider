#!/usr/bin/env npx tsx
/**
 * Mass Screenshot Generator for Database Resources
 *
 * Generates screenshots for all resources in the database that don't have them.
 * Optimized for high-volume processing with parallel browsers.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/generate-screenshots-db.ts
 *
 * Options:
 *   --limit=100     Process only N resources
 *   --category=mcp-servers  Filter by category
 *   --dry-run       Show what would be processed without capturing
 *   --resume        Skip already processed resources
 *   --force         Regenerate ALL screenshots (not just missing ones)
 *   --dark          Use dark mode (prefers-color-scheme: dark)
 */

import { chromium, Browser, BrowserContext } from "playwright";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Configuration
const CONCURRENT_BROWSERS = 10; // Number of parallel browsers
const VIEWPORT = { width: 1280, height: 800 };
const SCREENSHOT_BUCKET = "resource-screenshots";
const NAVIGATION_TIMEOUT = 20000; // 20 seconds max
const SETTLE_TIME = 1500; // 1.5 seconds for animations

// Skip patterns for URLs that won't work
const SKIP_PATTERNS = [
  "console.anthropic.com", // Requires auth
  "x.com", // Twitter dynamic
  "twitter.com", // Twitter dynamic
  "linkedin.com/login", // Login pages
  "github.com/login", // Login pages
  "localhost", // Local URLs
  "127.0.0.1", // Local URLs
];

interface Resource {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  screenshots: string[] | null;
}

interface ProcessResult {
  id: string;
  slug: string;
  success: boolean;
  screenshotUrl?: string;
  error?: string;
  duration?: number;
}

// Parse command line arguments
function parseArgs(): { limit?: number; category?: string; dryRun: boolean; resume: boolean; force: boolean; dark: boolean } {
  const args = process.argv.slice(2);
  const options: { limit?: number; category?: string; dryRun: boolean; resume: boolean; force: boolean; dark: boolean } = {
    dryRun: false,
    resume: false,
    force: false,
    dark: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const value = arg.split("=")[1];
      if (value) options.limit = parseInt(value, 10);
    } else if (arg.startsWith("--category=")) {
      const value = arg.split("=")[1];
      if (value) options.category = value;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--resume") {
      options.resume = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dark") {
      options.dark = true;
    }
  }

  return options;
}

// Get Supabase client
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient(url, key);
}

// Check if URL should be skipped
function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some((pattern) => url.includes(pattern));
}

// Get resources needing screenshots from database
async function getResourcesWithoutScreenshots(
  supabase: SupabaseClient,
  options: { limit?: number; category?: string; force?: boolean }
): Promise<Resource[]> {
  let query = supabase
    .from("resources")
    .select("id, slug, title, url, category, screenshots")
    .eq("is_published", true);

  // Only filter for missing screenshots if not forcing regeneration
  if (!options.force) {
    query = query.or("screenshots.is.null,screenshots.eq.{}");
  }

  if (options.category) {
    query = query.eq("category", options.category);
  }

  query = query.order("category").order("slug");

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch resources: ${error.message}`);
  }

  // Filter out resources with problematic URLs
  return (data || []).filter((r) => !shouldSkip(r.url));
}

// Capture screenshot for a single resource
async function captureScreenshot(
  context: BrowserContext,
  resource: Resource
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  const page = await context.newPage();

  try {
    await page.goto(resource.url, {
      waitUntil: "domcontentloaded", // Faster than networkidle
      timeout: NAVIGATION_TIMEOUT,
    });

    // Wait for page to settle
    await page.waitForTimeout(SETTLE_TIME);

    // Capture screenshot
    const buffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    return { success: true, buffer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  } finally {
    await page.close();
  }
}

// Upload screenshot to Supabase Storage
async function uploadScreenshot(
  supabase: SupabaseClient,
  buffer: Buffer,
  resourceSlug: string
): Promise<string | null> {
  const timestamp = Date.now();
  const storagePath = `${resourceSlug}/${timestamp}-${resourceSlug}.png`;

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

  const { data: urlData } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// Update resource in database with screenshot URL
async function updateResourceScreenshot(
  supabase: SupabaseClient,
  resourceId: string,
  screenshotUrl: string
): Promise<boolean> {
  const { error } = await supabase
    .from("resources")
    .update({ screenshots: [screenshotUrl] })
    .eq("id", resourceId);

  return !error;
}

// Process a single resource
async function processResource(
  context: BrowserContext,
  supabase: SupabaseClient,
  resource: Resource
): Promise<ProcessResult> {
  const startTime = Date.now();

  const result = await captureScreenshot(context, resource);

  if (!result.success || !result.buffer) {
    return {
      id: resource.id,
      slug: resource.slug,
      success: false,
      error: result.error,
      duration: Date.now() - startTime,
    };
  }

  // Upload to Supabase Storage
  const screenshotUrl = await uploadScreenshot(supabase, result.buffer, resource.slug);

  if (!screenshotUrl) {
    return {
      id: resource.id,
      slug: resource.slug,
      success: false,
      error: "Upload failed",
      duration: Date.now() - startTime,
    };
  }

  // Update database
  const updated = await updateResourceScreenshot(supabase, resource.id, screenshotUrl);

  return {
    id: resource.id,
    slug: resource.slug,
    success: updated,
    screenshotUrl,
    error: updated ? undefined : "Database update failed",
    duration: Date.now() - startTime,
  };
}

// Process resources in parallel
async function processResources(
  resources: Resource[],
  supabase: SupabaseClient,
  dryRun: boolean,
  darkMode: boolean = false
): Promise<ProcessResult[]> {
  if (dryRun) {
    console.log("\n🔍 DRY RUN - Would process these resources:\n");
    resources.slice(0, 20).forEach((r) => console.log(`  ${r.slug}: ${r.url}`));
    if (resources.length > 20) {
      console.log(`  ... and ${resources.length - 20} more`);
    }
    return [];
  }

  console.log(`\n🚀 Launching ${CONCURRENT_BROWSERS} parallel browsers${darkMode ? " (dark mode)" : ""}...\n`);

  // Launch browsers with contexts
  const browser = await chromium.launch({ headless: true });
  const contexts: BrowserContext[] = [];

  for (let i = 0; i < CONCURRENT_BROWSERS; i++) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      // Enable dark mode via prefers-color-scheme media query
      colorScheme: darkMode ? "dark" : "light",
    });
    contexts.push(context);
  }

  const results: ProcessResult[] = [];
  let completed = 0;
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < resources.length; i += CONCURRENT_BROWSERS) {
    const batch = resources.slice(i, i + CONCURRENT_BROWSERS);
    const batchNum = Math.floor(i / CONCURRENT_BROWSERS) + 1;
    const totalBatches = Math.ceil(resources.length / CONCURRENT_BROWSERS);

    process.stdout.write(`\r📦 Batch ${batchNum}/${totalBatches} | ✅ ${successful} | ❌ ${failed} | ⏱️  ${Math.round((Date.now() - startTime) / 1000)}s`);

    const batchPromises = batch.map((resource, index) => {
      const context = contexts[index % contexts.length]!;
      return processResource(context, supabase, resource);
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      results.push(result);
      completed++;

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }
  }

  console.log("\n\n🔒 Closing browser...");
  await Promise.all(contexts.map((c) => c.close()));
  await browser.close();

  return results;
}

// Main
async function main() {
  const options = parseArgs();

  console.log("\n" + "=".repeat(60));
  console.log("🖼️  Mass Screenshot Generator (Database)");
  console.log("=".repeat(60));
  console.log(`Concurrency: ${CONCURRENT_BROWSERS} browsers`);
  if (options.limit) console.log(`Limit: ${options.limit} resources`);
  if (options.category) console.log(`Category filter: ${options.category}`);
  if (options.dryRun) console.log("Mode: DRY RUN");
  if (options.force) console.log("Mode: FORCE (regenerate all)");
  if (options.dark) console.log("Theme: 🌙 DARK MODE");
  console.log("");

  const supabase = getSupabaseClient();

  // Get resources needing screenshots
  console.log("📊 Fetching resources from database...");
  const resources = await getResourcesWithoutScreenshots(supabase, options);

  const resourceMsg = options.force
    ? `\n📋 Found ${resources.length} resources to regenerate`
    : `\n📋 Found ${resources.length} resources needing screenshots`;
  console.log(resourceMsg);

  if (resources.length === 0) {
    console.log("✨ All resources already have screenshots!");
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

  // Estimate time
  const estimatedSeconds = Math.ceil((resources.length / CONCURRENT_BROWSERS) * 4);
  console.log(`\n⏱️  Estimated time: ~${Math.ceil(estimatedSeconds / 60)} minutes`);

  // Process resources
  const startTime = Date.now();
  const results = await processResources(resources, supabase, options.dryRun, options.dark);

  if (options.dryRun) {
    return;
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Screenshot Generation Summary");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total processed: ${results.length}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`⚡ Rate: ${(results.length / duration).toFixed(1)} resources/second`);
  console.log("=".repeat(60) + "\n");

  // Show failed resources
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0 && failures.length <= 50) {
    console.log("Failed resources:");
    failures.forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
  } else if (failures.length > 50) {
    console.log(`\n${failures.length} resources failed. First 20:`);
    failures.slice(0, 20).forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
  }
}

main().catch(console.error);
