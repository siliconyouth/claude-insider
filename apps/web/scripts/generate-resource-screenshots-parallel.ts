#!/usr/bin/env npx tsx
/**
 * High-Performance Resource Screenshot Generator
 *
 * Captures dark mode screenshots for ALL resources in parallel with:
 * - Browser pool pattern (reuse browsers for efficiency)
 * - Bot detection evasion (stealth mode, realistic behavior)
 * - Direct database updates (screenshot_metadata, primary_screenshot_url)
 * - Progress tracking and resume capability
 * - Supabase Storage upload
 *
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/generate-resource-screenshots-parallel.ts
 *   npx dotenvx run -- npx tsx scripts/generate-resource-screenshots-parallel.ts --force
 *   npx dotenvx run -- npx tsx scripts/generate-resource-screenshots-parallel.ts --limit 100
 *   npx dotenvx run -- npx tsx scripts/generate-resource-screenshots-parallel.ts --category mcp-servers
 *
 * Created: 2025-01-07 for Claude Insider v1.18.2
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Check if retry mode (extended timeouts for failed resources)
const RETRY_MODE = process.argv.includes("--retry-failed");

const CONFIG = {
  // Parallelization settings
  CONCURRENT_BROWSERS: RETRY_MODE ? 10 : 15, // Fewer browsers for retry (more patience)
  MAX_RETRIES: RETRY_MODE ? 3 : 2, // More retries in retry mode
  BATCH_SIZE: 50, // Process in batches for progress saves

  // Screenshot settings
  VIEWPORT: { width: 1440, height: 900 }, // Larger viewport for better quality
  TIMEOUT_MS: RETRY_MODE ? 60000 : 25000, // 60s timeout in retry mode, 25s normal
  WAIT_AFTER_LOAD_MS: RETRY_MODE ? 3000 : 1500, // Longer wait in retry mode

  // Storage
  SCREENSHOT_BUCKET: "resource-screenshots",
  PROGRESS_FILE: ".screenshot-progress.json",
  LOCAL_CACHE_DIR: "tmp/screenshots-cache",

  // Skip patterns (auth required, problematic sites)
  SKIP_DOMAINS: [
    "console.anthropic.com", // Auth required
    "x.com", // Twitter/X blocks bots
    "twitter.com", // Twitter blocks bots
    "linkedin.com", // Auth required
    "facebook.com", // Auth required
    "instagram.com", // Auth required
    "discord.com/channels", // Auth required
    "app.slack.com", // Auth required
    "notion.so", // Auth walls
    "localhost", // Local URLs
    "127.0.0.1", // Local URLs
    "skilljar.com", // Enterprise auth required (Anthropic courses)
    "claude.ai", // Auth required
  ],

  // Skip file extensions (not web pages)
  SKIP_EXTENSIONS: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip", ".tar"],
};

// ============================================================================
// BOT EVASION - STEALTH MODE
// ============================================================================

// Realistic user agents (Chrome on different platforms)
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

// Stealth browser launch args
const STEALTH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--disable-features=IsolateOrigins,site-per-process",
  "--disable-site-isolation-trials",
  "--disable-web-security",
  "--disable-setuid-sandbox",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
  "--window-size=1440,900",
  "--hide-scrollbars",
  "--mute-audio",
];

// ============================================================================
// TYPES
// ============================================================================

interface Resource {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  primary_screenshot_url: string | null;
  screenshots: string[] | null;
  screenshot_metadata: ScreenshotMetadata[] | null;
}

interface ScreenshotMetadata {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  order: number;
  captured_at: string;
}

interface ScreenshotResult {
  resourceId: string;
  slug: string;
  success: boolean;
  screenshotUrl?: string;
  localPath?: string;
  error?: string;
  duration?: number;
}

interface Progress {
  completed: string[];
  failed: string[];
  lastRun: string;
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
// PROGRESS TRACKING
// ============================================================================

function loadProgress(): Progress {
  const progressPath = path.join(process.cwd(), CONFIG.PROGRESS_FILE);
  if (fs.existsSync(progressPath)) {
    try {
      return JSON.parse(fs.readFileSync(progressPath, "utf-8"));
    } catch {
      // Ignore corrupted progress file
    }
  }
  return { completed: [], failed: [], lastRun: "" };
}

function saveProgress(progress: Progress): void {
  const progressPath = path.join(process.cwd(), CONFIG.PROGRESS_FILE);
  progress.lastRun = new Date().toISOString();
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
}

// ============================================================================
// URL VALIDATION
// ============================================================================

function shouldSkipUrl(url: string): { skip: boolean; reason?: string } {
  // Check for skip domains
  for (const domain of CONFIG.SKIP_DOMAINS) {
    if (url.includes(domain)) {
      return { skip: true, reason: `Domain blocked: ${domain}` };
    }
  }

  // Skip non-HTTP URLs
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { skip: true, reason: "Invalid URL scheme" };
  }

  // Skip file downloads (PDFs, docs, etc.)
  const urlLower = url.toLowerCase();
  for (const ext of CONFIG.SKIP_EXTENSIONS) {
    if (urlLower.endsWith(ext)) {
      return { skip: true, reason: `File type not supported: ${ext}` };
    }
  }

  return { skip: false };
}

// ============================================================================
// BROWSER POOL
// ============================================================================

class BrowserPool {
  private browsers: Browser[] = [];
  private available: Browser[] = [];
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  async initialize(): Promise<void> {
    console.log(`🚀 Launching ${this.size} browsers in stealth mode...`);

    const launches = Array(this.size)
      .fill(null)
      .map(async () => {
        const browser = await chromium.launch({
          headless: true,
          args: STEALTH_ARGS,
        });
        this.browsers.push(browser);
        this.available.push(browser);
        return browser;
      });

    await Promise.all(launches);
    console.log(`✅ ${this.size} browsers ready\n`);
  }

  async acquire(): Promise<Browser> {
    while (this.available.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return this.available.pop()!;
  }

  release(browser: Browser): void {
    this.available.push(browser);
  }

  async close(): Promise<void> {
    console.log("\n🔒 Closing all browsers...");
    await Promise.all(this.browsers.map((b) => b.close()));
  }
}

// ============================================================================
// SCREENSHOT CAPTURE
// ============================================================================

async function captureScreenshot(
  browser: Browser,
  resource: Resource
): Promise<ScreenshotResult> {
  const startTime = Date.now();
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    // Random user agent for each request
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // Small viewport variation for uniqueness
    const viewportVariation = {
      width: CONFIG.VIEWPORT.width + Math.floor(Math.random() * 20) - 10,
      height: CONFIG.VIEWPORT.height + Math.floor(Math.random() * 20) - 10,
    };

    // Create stealth context with dark mode
    context = await browser.newContext({
      viewport: viewportVariation,
      userAgent,
      colorScheme: "dark", // DARK MODE!
      locale: "en-US",
      timezoneId: "America/New_York",
      deviceScaleFactor: 2, // 2x resolution for crisp screenshots
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
      bypassCSP: true,
    });

    // Inject stealth scripts before page creation
    await context.addInitScript(() => {
      // Override navigator properties to avoid detection
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      // Mock Chrome-specific properties
      // @ts-expect-error - Mocking Chrome properties
      window.chrome = { runtime: {} };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: "denied" } as PermissionStatus)
          : originalQuery(parameters);
    });

    page = await context.newPage();
    page.setDefaultTimeout(CONFIG.TIMEOUT_MS);

    // Navigate to URL
    await page.goto(resource.url, {
      waitUntil: "networkidle",
      timeout: CONFIG.TIMEOUT_MS,
    });

    // Wait for animations to settle
    await page.waitForTimeout(CONFIG.WAIT_AFTER_LOAD_MS);

    // Try to dismiss cookie banners and popups
    await dismissPopups(page);

    // Simulate human-like behavior (small mouse movement)
    await page.mouse.move(
      Math.random() * CONFIG.VIEWPORT.width,
      Math.random() * CONFIG.VIEWPORT.height
    );

    // Create local cache directory
    const cacheDir = path.join(process.cwd(), CONFIG.LOCAL_CACHE_DIR, resource.category);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Capture screenshot
    const filename = `${resource.slug}.png`;
    const localPath = path.join(cacheDir, filename);

    await page.screenshot({
      path: localPath,
      type: "png",
      fullPage: false, // Viewport only for consistency
    });

    await context.close();

    return {
      resourceId: resource.id,
      slug: resource.slug,
      success: true,
      localPath,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    if (context) {
      try {
        await context.close();
      } catch {
        // Ignore cleanup errors
      }
    }

    return {
      resourceId: resource.id,
      slug: resource.slug,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

// Attempt to dismiss common popups and cookie banners
async function dismissPopups(page: Page): Promise<void> {
  const popupSelectors = [
    // Cookie banners
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("I accept")',
    'button:has-text("Got it")',
    'button:has-text("OK")',
    'button:has-text("Agree")',
    '[class*="cookie"] button',
    '[id*="cookie"] button',
    // Close buttons
    'button[aria-label="Close"]',
    'button[aria-label="Dismiss"]',
    '[class*="close-button"]',
    '[class*="dismiss"]',
  ];

  for (const selector of popupSelectors) {
    try {
      const button = await page.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) {
        await button.click({ timeout: 1000 });
        await page.waitForTimeout(300);
      }
    } catch {
      // Ignore - popup not found or not clickable
    }
  }
}

// ============================================================================
// SUPABASE UPLOAD
// ============================================================================

async function uploadToStorage(
  supabase: SupabaseClient,
  localPath: string,
  resourceSlug: string
): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const timestamp = Date.now();
    const storagePath = `${resourceSlug}/${timestamp}-screenshot.png`;

    const { data, error } = await supabase.storage
      .from(CONFIG.SCREENSHOT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ Upload failed: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(CONFIG.SCREENSHOT_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`  ❌ Upload error:`, error);
    return null;
  }
}

// ============================================================================
// DATABASE UPDATE
// ============================================================================

async function updateResourceScreenshot(
  supabase: SupabaseClient,
  resourceId: string,
  screenshotUrl: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // Create new screenshot metadata
    const newMetadata: ScreenshotMetadata = {
      url: screenshotUrl,
      width: CONFIG.VIEWPORT.width * 2, // 2x device scale
      height: CONFIG.VIEWPORT.height * 2,
      alt: "Resource screenshot (dark mode)",
      caption: `Captured ${new Date().toLocaleDateString()}`,
      order: 0, // Primary screenshot
      captured_at: now,
    };

    // Update resource with new screenshot as primary
    const { error } = await supabase
      .from("resources")
      .update({
        primary_screenshot_url: screenshotUrl,
        screenshot_metadata: [newMetadata], // Set as array with new screenshot first
        screenshots: supabase.rpc
          ? undefined
          : [screenshotUrl], // Also update the screenshots array
        updated_at: now,
      })
      .eq("id", resourceId);

    if (error) {
      console.error(`  ❌ DB update failed: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ DB error:`, error);
    return false;
  }
}

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

async function processResources(
  resources: Resource[],
  supabase: SupabaseClient,
  progress: Progress,
  pool: BrowserPool
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  // Process in batches for progress saving
  for (let batchStart = 0; batchStart < resources.length; batchStart += CONFIG.BATCH_SIZE) {
    const batch = resources.slice(batchStart, batchStart + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(batchStart / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(resources.length / CONFIG.BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} resources)`);
    console.log("─".repeat(50));

    // Process batch in parallel using browser pool
    const batchPromises = batch.map(async (resource) => {
      // Acquire browser from pool
      const browser = await pool.acquire();

      try {
        // Check if URL should be skipped
        const skipCheck = shouldSkipUrl(resource.url);
        if (skipCheck.skip) {
          console.log(`⏭️  [${resource.slug}] Skipped: ${skipCheck.reason}`);
          return { success: false, skipped: true };
        }

        console.log(`📸 [${resource.slug}] Capturing...`);

        // Capture screenshot with retry logic
        let result: ScreenshotResult | null = null;
        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
          result = await captureScreenshot(browser, resource);
          if (result.success) break;
          if (attempt < CONFIG.MAX_RETRIES) {
            console.log(`  ⚠️  Retry ${attempt}/${CONFIG.MAX_RETRIES - 1}...`);
          }
        }

        if (!result?.success || !result.localPath) {
          console.log(`  ❌ [${resource.slug}] Failed: ${result?.error}`);
          progress.failed.push(resource.id);
          return { success: false };
        }

        // Upload to storage
        const screenshotUrl = await uploadToStorage(
          supabase,
          result.localPath,
          resource.slug
        );

        if (!screenshotUrl) {
          progress.failed.push(resource.id);
          return { success: false };
        }

        // Update database
        const dbUpdated = await updateResourceScreenshot(
          supabase,
          resource.id,
          screenshotUrl
        );

        if (!dbUpdated) {
          progress.failed.push(resource.id);
          return { success: false };
        }

        console.log(`  ✅ [${resource.slug}] Done (${result.duration}ms)`);
        progress.completed.push(resource.id);
        return { success: true };
      } finally {
        // Release browser back to pool
        pool.release(browser);
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);

    // Count results
    const batchSuccessful = batchResults.filter((r) => r.success).length;
    const batchFailed = batchResults.filter((r) => !r.success && !r.skipped).length;
    successful += batchSuccessful;
    failed += batchFailed;

    // Save progress after each batch
    saveProgress(progress);
    console.log(`\n📊 Batch ${batchNum} complete: ✅ ${batchSuccessful} | ❌ ${batchFailed}`);
  }

  return { successful, failed };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🖼️  High-Performance Resource Screenshot Generator");
  if (RETRY_MODE) {
    console.log("   🔄 RETRY MODE - Extended timeouts for failed resources");
  } else {
    console.log("   Dark Mode | Parallel | Bot Evasion | Database Updates");
  }
  console.log("═".repeat(60) + "\n");

  // Parse command line args
  const args = process.argv.slice(2);
  const forceAll = args.includes("--force");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] || "0") : 0;
  const categoryArg = args.find((a) => a.startsWith("--category="));
  const category = categoryArg ? categoryArg.split("=")[1] : null;

  // Initialize
  const supabase = getSupabaseClient();
  let progress = forceAll ? { completed: [], failed: [], lastRun: "" } : loadProgress();

  // In retry mode, clear failed entries so they get reprocessed
  if (RETRY_MODE && progress.failed.length > 0) {
    console.log(`🔄 Clearing ${progress.failed.length} failed entries for retry...`);
    progress = { ...progress, failed: [] };
    saveProgress(progress);
  }

  console.log(`📋 Options:`);
  console.log(`   Retry mode: ${RETRY_MODE}`);
  console.log(`   Timeout: ${CONFIG.TIMEOUT_MS / 1000}s`);
  console.log(`   Force all: ${forceAll}`);
  console.log(`   Limit: ${limit || "none"}`);
  console.log(`   Category: ${category || "all"}`);
  console.log(`   Concurrent browsers: ${CONFIG.CONCURRENT_BROWSERS}`);
  console.log(`   Previously completed: ${progress.completed.length}`);
  console.log("");

  // Fetch resources from database
  console.log("📡 Fetching resources from database...");

  // Fetch all resources with pagination (Supabase has 1000 row default limit)
  const allResources: Resource[] = [];
  const PAGE_SIZE = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("resources")
      .select("id, slug, title, url, category, primary_screenshot_url, screenshots, screenshot_metadata")
      .eq("is_published", true)
      .order("category")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data: pageData, error: pageError } = await query;

    if (pageError) {
      console.error("❌ Failed to fetch resources:", pageError.message);
      process.exit(1);
    }

    if (pageData && pageData.length > 0) {
      allResources.push(...(pageData as Resource[]));
      page++;
      console.log(`   Fetched page ${page}: ${pageData.length} resources`);
      hasMore = pageData.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  if (allResources.length === 0) {
    console.log("✨ No resources found!");
    return;
  }

  console.log(`📊 Total resources: ${allResources.length}`);

  // Filter resources
  let resourcesToProcess = allResources.filter((r) => {
    // Skip if already completed (unless --force)
    if (!forceAll && progress.completed.includes(r.id)) {
      return false;
    }

    // Skip if already has screenshot (unless --force)
    if (!forceAll && r.primary_screenshot_url) {
      return false;
    }

    return true;
  });

  // Apply limit
  if (limit > 0) {
    resourcesToProcess = resourcesToProcess.slice(0, limit);
  }

  console.log(`📋 Resources to process: ${resourcesToProcess.length}`);

  if (resourcesToProcess.length === 0) {
    console.log("✨ All resources already have screenshots!");
    return;
  }

  // Initialize browser pool
  const pool = new BrowserPool(CONFIG.CONCURRENT_BROWSERS);
  await pool.initialize();

  try {
    // Process resources
    const { successful, failed } = await processResources(
      resourcesToProcess as Resource[],
      supabase,
      progress,
      pool
    );

    // Final summary
    console.log("\n" + "═".repeat(60));
    console.log("📊 FINAL SUMMARY");
    console.log("═".repeat(60));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${resourcesToProcess.length - successful - failed}`);
    console.log(`📁 Total processed: ${resourcesToProcess.length}`);
    console.log("═".repeat(60) + "\n");

    // Save final progress
    saveProgress(progress);

    if (failed > 0) {
      console.log("Failed resources (IDs):");
      progress.failed.slice(-10).forEach((id) => console.log(`  - ${id}`));
      if (progress.failed.length > 10) {
        console.log(`  ... and ${progress.failed.length - 10} more`);
      }
    }
  } finally {
    // Always close browsers
    await pool.close();
  }

  // Cleanup local cache
  console.log("\n🧹 Cleanup: Local cache kept at", CONFIG.LOCAL_CACHE_DIR);
  console.log("   Run 'rm -rf tmp/screenshots-cache' to remove\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
