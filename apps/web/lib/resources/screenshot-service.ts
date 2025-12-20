/**
 * Screenshot Service for Resource Updates
 *
 * Captures screenshots of resource websites using Firecrawl and
 * uploads them to Supabase Storage for permanent hosting.
 *
 * Features:
 * - Batch screenshot capture with error handling per URL
 * - Automatic upload to Supabase Storage
 * - Configurable viewport and quality settings
 * - Full page or viewport-only screenshots
 */

import "server-only";
import { scrapeUrl } from "@/lib/firecrawl";
import { createAdminClient } from "@/lib/supabase/server";

// Storage bucket name for resource screenshots
const SCREENSHOT_BUCKET = "resource-screenshots";

export interface ScreenshotResult {
  url: string;
  screenshotUrl: string | null; // Public URL of uploaded screenshot
  capturedAt: Date;
  viewport: { width: number; height: number };
  error?: string;
}

export interface ScreenshotOptions {
  urls: string[];
  resourceSlug: string; // Used for organizing in storage
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  quality?: number; // 0-100
  waitFor?: number; // ms to wait before screenshot
}

/**
 * Default viewport for screenshots (desktop)
 */
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

/**
 * Default quality for screenshots
 */
const DEFAULT_QUALITY = 85;

/**
 * Capture screenshots of multiple URLs and upload to storage
 */
export async function captureScreenshots(
  options: ScreenshotOptions
): Promise<ScreenshotResult[]> {
  const {
    urls,
    resourceSlug,
    viewport = DEFAULT_VIEWPORT,
    fullPage = false,
    quality = DEFAULT_QUALITY,
    waitFor = 2000, // Wait 2 seconds by default for dynamic content
  } = options;

  // Process URLs in parallel with concurrency limit
  const results: ScreenshotResult[] = [];
  const concurrencyLimit = 3; // Process 3 URLs at a time

  for (let i = 0; i < urls.length; i += concurrencyLimit) {
    const batch = urls.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(
      batch.map((url) =>
        captureAndUploadScreenshot(url, resourceSlug, {
          viewport,
          fullPage,
          quality,
          waitFor,
        })
      )
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Capture a single screenshot and upload to storage
 */
async function captureAndUploadScreenshot(
  url: string,
  resourceSlug: string,
  options: {
    viewport: { width: number; height: number };
    fullPage: boolean;
    quality: number;
    waitFor: number;
  }
): Promise<ScreenshotResult> {
  const baseResult: ScreenshotResult = {
    url,
    screenshotUrl: null,
    capturedAt: new Date(),
    viewport: options.viewport,
  };

  try {
    // Capture screenshot using Firecrawl
    const scrapeResult = await scrapeUrl(url, {
      formats: ["screenshot"],
      onlyMainContent: false, // Need full page for screenshot
      waitFor: options.waitFor,
      screenshot: {
        fullPage: options.fullPage,
        quality: options.quality,
        viewport: options.viewport,
      },
    });

    if (!scrapeResult.success || !scrapeResult.data?.screenshot) {
      return {
        ...baseResult,
        error: scrapeResult.error || "No screenshot data returned",
      };
    }

    // Upload to Supabase Storage
    const screenshotUrl = await uploadScreenshot(
      scrapeResult.data.screenshot,
      resourceSlug,
      url
    );

    return {
      ...baseResult,
      screenshotUrl,
    };
  } catch (error) {
    return {
      ...baseResult,
      error: error instanceof Error ? error.message : "Screenshot capture failed",
    };
  }
}

/**
 * Upload a screenshot to Supabase Storage
 *
 * @param screenshotData Base64 encoded image data or data URI
 * @param resourceSlug Slug for organizing in storage folders
 * @param sourceUrl The URL that was screenshot (for filename)
 * @returns Public URL of the uploaded screenshot
 */
async function uploadScreenshot(
  screenshotData: string,
  resourceSlug: string,
  sourceUrl: string
): Promise<string> {
  const supabase = await createAdminClient();

  // Convert base64 to buffer
  // Handle both base64 and data URI formats
  let base64Data = screenshotData;
  if (screenshotData.startsWith("data:")) {
    // Extract base64 from data URI
    const matches = screenshotData.match(/^data:image\/\w+;base64,(.+)$/);
    if (matches && matches[1]) {
      base64Data = matches[1];
    }
  }

  const buffer = Buffer.from(base64Data, "base64");

  // Generate filename from URL
  const urlHash = generateUrlHash(sourceUrl);
  const timestamp = Date.now();
  const filename = `${resourceSlug}/${timestamp}-${urlHash}.png`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(filename, buffer, {
      contentType: "image/png",
      upsert: true, // Replace if exists
    });

  if (error) {
    throw new Error(`Failed to upload screenshot: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(SCREENSHOT_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Generate a short hash from a URL for filenames
 */
function generateUrlHash(url: string): string {
  // Simple hash function for short, unique-ish filenames
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Delete old screenshots for a resource
 * Call this before uploading new screenshots to clean up storage
 */
export async function deleteResourceScreenshots(
  resourceSlug: string
): Promise<void> {
  const supabase = await createAdminClient();

  // List all files in the resource's folder
  const { data: files, error: listError } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .list(resourceSlug);

  if (listError) {
    console.error("Failed to list screenshots:", listError);
    return;
  }

  if (!files || files.length === 0) {
    return;
  }

  // Delete all files
  const filePaths = files.map((file) => `${resourceSlug}/${file.name}`);
  const { error: deleteError } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .remove(filePaths);

  if (deleteError) {
    console.error("Failed to delete screenshots:", deleteError);
  }
}

/**
 * Get the URLs to screenshot for a resource
 * Determines which URLs are worth screenshotting based on resource data
 */
export function getScreenshotUrls(resource: {
  official_url?: string | null;
  repo_url?: string | null;
  npm_url?: string | null;
  pypi_url?: string | null;
  documentation_url?: string | null;
}): string[] {
  const urls: string[] = [];

  // Priority order for screenshots
  if (resource.official_url) {
    urls.push(resource.official_url);
  }

  if (resource.repo_url) {
    urls.push(resource.repo_url);
  }

  if (resource.documentation_url && resource.documentation_url !== resource.official_url) {
    urls.push(resource.documentation_url);
  }

  // NPM/PyPI pages are less useful for screenshots, skip them
  // They're standardized and don't add visual value

  return urls;
}
