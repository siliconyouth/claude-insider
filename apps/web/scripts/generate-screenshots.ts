#!/usr/bin/env npx tsx
/**
 * Screenshot Generator Script
 *
 * Captures screenshots for resources that don't have them yet.
 * Uses Playwright for fast parallel screenshot capture.
 *
 * Usage: npx tsx scripts/generate-screenshots.ts
 */

import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Configuration
const CONCURRENT_BROWSERS = 5;
const VIEWPORT = { width: 1280, height: 800 };
const SCREENSHOT_DIR = "public/screenshots";
const RESOURCES_DIR = "data/resources";
const SCREENSHOT_BUCKET = "resource-screenshots";

// Resource interface
interface Resource {
  id: string;
  title: string;
  url: string;
  category: string;
  screenshotUrl?: string;
  [key: string]: unknown;
}

// Get Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("⚠️  Supabase credentials not found, saving locally only");
    return null;
  }

  return createClient(url, key);
}

// Find all resources without screenshots
function findResourcesWithoutScreenshots(): Resource[] {
  const resourceFiles = fs.readdirSync(RESOURCES_DIR).filter((f) => f.endsWith(".json"));
  const resourcesWithoutScreenshots: Resource[] = [];

  for (const file of resourceFiles) {
    const filePath = path.join(RESOURCES_DIR, file);
    const resources: Resource[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const resource of resources) {
      if (!resource.screenshotUrl || resource.screenshotUrl.length === 0) {
        resourcesWithoutScreenshots.push(resource);
      }
    }
  }

  return resourcesWithoutScreenshots;
}

// Capture screenshot for a single resource
async function captureScreenshot(
  browser: Browser,
  resource: Resource,
  outputDir: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  let page: Page | null = null;

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    page = await context.newPage();

    // Set timeout for navigation
    page.setDefaultTimeout(30000);

    console.log(`📸 Capturing: ${resource.id} (${resource.url})`);

    // Navigate to URL
    await page.goto(resource.url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait a bit for any animations to settle
    await page.waitForTimeout(2000);

    // Create output directory if needed
    const categoryDir = path.join(outputDir, resource.category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    // Capture screenshot
    const filename = `${resource.id}.png`;
    const filePath = path.join(categoryDir, filename);

    await page.screenshot({
      path: filePath,
      type: "png",
      fullPage: false,
    });

    await context.close();

    console.log(`✅ Captured: ${resource.id}`);
    return { success: true, filePath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed: ${resource.id} - ${errorMessage}`);

    if (page) {
      try {
        await page.context().close();
      } catch {
        // Ignore cleanup errors
      }
    }

    return { success: false, error: errorMessage };
  }
}

// Upload screenshot to Supabase Storage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadToSupabase(
  supabase: any,
  filePath: string,
  resourceId: string,
  _category: string
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const timestamp = Date.now();
    const storagePath = `${resourceId}/${timestamp}-${resourceId}.png`;

    const { data, error } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`❌ Upload failed for ${resourceId}: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Upload error for ${resourceId}:`, error);
    return null;
  }
}

// Update resource JSON file with screenshot URL
function updateResourceFile(resourceId: string, category: string, screenshotUrl: string): void {
  // Find the category file
  const resourceFiles = fs.readdirSync(RESOURCES_DIR).filter((f) => f.endsWith(".json"));

  for (const file of resourceFiles) {
    const filePath = path.join(RESOURCES_DIR, file);
    const resources: Resource[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const resourceIndex = resources.findIndex((r) => r.id === resourceId);
    if (resourceIndex !== -1 && resources[resourceIndex]) {
      resources[resourceIndex].screenshotUrl = screenshotUrl;
      fs.writeFileSync(filePath, JSON.stringify(resources, null, 2) + "\n");
      console.log(`📝 Updated ${file} with screenshot for ${resourceId}`);
      return;
    }
  }
}

// Process resources in parallel batches
async function processResources(resources: Resource[]): Promise<void> {
  const supabase = getSupabaseClient();

  // Create local screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Launch browsers
  console.log(`\n🚀 Launching ${CONCURRENT_BROWSERS} parallel browsers...\n`);

  const browsers: Browser[] = [];
  for (let i = 0; i < CONCURRENT_BROWSERS; i++) {
    const browser = await chromium.launch({
      headless: true,
    });
    browsers.push(browser);
  }

  // Process in batches
  const results: { id: string; success: boolean; url?: string }[] = [];

  for (let i = 0; i < resources.length; i += CONCURRENT_BROWSERS) {
    const batch = resources.slice(i, i + CONCURRENT_BROWSERS);
    console.log(`\n📦 Processing batch ${Math.floor(i / CONCURRENT_BROWSERS) + 1}/${Math.ceil(resources.length / CONCURRENT_BROWSERS)}\n`);

    const batchPromises = batch.map(async (resource, index) => {
      const browser = browsers[index % browsers.length]!;
      const result = await captureScreenshot(browser, resource, SCREENSHOT_DIR);

      if (result.success && result.filePath) {
        let screenshotUrl: string | null = null;

        // Upload to Supabase if available
        if (supabase) {
          screenshotUrl = await uploadToSupabase(supabase, result.filePath, resource.id, resource.category);
        }

        // If upload failed or no Supabase, use local path
        if (!screenshotUrl) {
          screenshotUrl = `/${result.filePath.replace("public/", "")}`;
        }

        // Update resource file
        updateResourceFile(resource.id, resource.category, screenshotUrl);

        return { id: resource.id, success: true, url: screenshotUrl };
      }

      return { id: resource.id, success: false };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Close all browsers
  console.log("\n🔒 Closing browsers...");
  await Promise.all(browsers.map((b) => b.close()));

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("\n" + "=".repeat(50));
  console.log("📊 Screenshot Generation Summary");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total processed: ${results.length}`);
  console.log("=".repeat(50) + "\n");

  if (failed > 0) {
    console.log("Failed resources:");
    results.filter((r) => !r.success).forEach((r) => console.log(`  - ${r.id}`));
  }
}

// Skip list for URLs that won't work (auth required, etc.)
const SKIP_LIST = [
  "console.anthropic.com", // Requires authentication
  "x.com", // Twitter/X dynamic content issues
  "twitter.com", // Twitter dynamic content issues
];

function shouldSkip(url: string): boolean {
  return SKIP_LIST.some((skip) => url.includes(skip));
}

// Main
async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("🖼️  Resource Screenshot Generator");
  console.log("=".repeat(50) + "\n");

  // Find resources without screenshots
  let resources = findResourcesWithoutScreenshots();
  console.log(`Found ${resources.length} resources without screenshots\n`);

  // Filter out URLs that won't work
  const skipped = resources.filter((r) => shouldSkip(r.url));
  resources = resources.filter((r) => !shouldSkip(r.url));

  if (skipped.length > 0) {
    console.log(`⏭️  Skipping ${skipped.length} resources (auth required or problematic):`);
    skipped.forEach((r) => console.log(`   - ${r.id}: ${r.url}`));
    console.log("");
  }

  if (resources.length === 0) {
    console.log("✨ All resources already have screenshots!");
    return;
  }

  console.log(`📋 Resources to process: ${resources.length}`);
  resources.forEach((r) => console.log(`   - ${r.id}: ${r.url}`));

  // Process resources
  await processResources(resources);
}

main().catch(console.error);
