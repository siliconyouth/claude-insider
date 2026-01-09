#!/usr/bin/env npx tsx
/**
 * Branded Placeholder Generator
 *
 * Generates branded placeholder images for resources that don't have OG images.
 * Design follows Claude Insider's design system:
 * - Dark background (#0a0a0a)
 * - Resource name in center (white, Inter font)
 * - Claude Insider logo beneath
 * - claudeinsider.com at bottom
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/generate-branded-placeholders.ts
 *
 * Options:
 *   --limit=100        Process only N resources
 *   --category=tools   Filter by category
 *   --dry-run          Show what would be processed
 *   --concurrency=25   Number of parallel operations (default: 25)
 */

import PQueue from "p-queue";
import sharp from "sharp";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Configuration
const DEFAULT_CONCURRENCY = 25;
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 800;
const SCREENSHOT_BUCKET = "resource-screenshots";

// Design System Colors (Dark Theme)
const COLORS = {
  background: "#0a0a0a",
  text: "#ffffff",
  textMuted: "#9ca3af", // gray-400
  gradientStart: "#A855F7", // violet-500
  gradientMid: "#3B82F6", // blue-500
  gradientEnd: "#06B6D4", // cyan-500
};

interface Resource {
  id: string;
  slug: string;
  title: string;
  category: string;
  screenshots: string[] | null;
}

interface ProcessResult {
  id: string;
  slug: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Parse command line arguments
function parseArgs(): {
  limit?: number;
  category?: string;
  dryRun: boolean;
  concurrency: number;
} {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
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

// Format resource name for display
function formatResourceName(title: string): string {
  // Truncate if too long
  if (title.length > 40) {
    return title.substring(0, 37) + "...";
  }
  return title;
}

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Generate branded SVG placeholder
function generateBrandedSvg(resourceTitle: string): string {
  const displayName = escapeXml(formatResourceName(resourceTitle));

  // Calculate font size based on text length
  let fontSize = 64;
  if (displayName.length > 30) fontSize = 48;
  else if (displayName.length > 20) fontSize = 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TARGET_WIDTH} ${TARGET_HEIGHT}" width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}">
  <defs>
    <!-- Logo gradient -->
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.gradientStart}"/>
      <stop offset="50%" stop-color="${COLORS.gradientMid}"/>
      <stop offset="100%" stop-color="${COLORS.gradientEnd}"/>
    </linearGradient>
    <!-- Subtle background gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${COLORS.gradientMid}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${COLORS.background}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Dark background -->
  <rect width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}" fill="${COLORS.background}"/>

  <!-- Subtle glow effect -->
  <rect width="${TARGET_WIDTH}" height="${TARGET_HEIGHT}" fill="url(#bgGlow)"/>

  <!-- Resource name (main text) -->
  <text
    x="${TARGET_WIDTH / 2}"
    y="${TARGET_HEIGHT / 2 - 40}"
    font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${COLORS.text}"
    text-anchor="middle"
    dominant-baseline="middle"
  >${displayName}</text>

  <!-- Claude Insider logo (Ci icon) -->
  <g transform="translate(${TARGET_WIDTH / 2 - 40}, ${TARGET_HEIGHT / 2 + 40})">
    <!-- Logo background -->
    <rect width="80" height="80" rx="16" fill="url(#logoGradient)"/>
    <!-- Ci text -->
    <text
      x="40"
      y="58"
      font-family="Inter, -apple-system, sans-serif"
      font-size="48"
      font-weight="800"
      fill="${COLORS.text}"
      text-anchor="middle"
    >Ci</text>
  </g>

  <!-- claudeinsider.com -->
  <text
    x="${TARGET_WIDTH / 2}"
    y="${TARGET_HEIGHT - 50}"
    font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="24"
    font-weight="500"
    fill="${COLORS.textMuted}"
    text-anchor="middle"
  >claudeinsider.com</text>
</svg>`;
}

// Convert SVG to PNG using Sharp
async function svgToPng(svg: string): Promise<Buffer> {
  const buffer = Buffer.from(svg);
  return await sharp(buffer)
    .png()
    .toBuffer();
}

// Upload image to Supabase Storage
async function uploadImage(
  supabase: SupabaseClient,
  buffer: Buffer,
  resourceSlug: string
): Promise<string | null> {
  const timestamp = Date.now();
  const storagePath = `${resourceSlug}/${timestamp}-branded-placeholder.png`;

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
async function updateResourceWithPlaceholder(
  supabase: SupabaseClient,
  resourceId: string,
  newPrimaryUrl: string,
  existingScreenshots: string[] | null
): Promise<boolean> {
  // New placeholder goes first, existing screenshot becomes secondary
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
  resource: Resource
): Promise<ProcessResult> {
  try {
    // Generate SVG
    const svg = generateBrandedSvg(resource.title);

    // Convert to PNG
    const pngBuffer = await svgToPng(svg);

    // Upload to storage
    const uploadedUrl = await uploadImage(supabase, pngBuffer, resource.slug);

    if (!uploadedUrl) {
      return {
        id: resource.id,
        slug: resource.slug,
        success: false,
        error: "Upload failed",
      };
    }

    // Update database - placeholder becomes PRIMARY
    const updated = await updateResourceWithPlaceholder(
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
      error: updated ? undefined : "Database update failed",
    };
  } catch (error) {
    return {
      id: resource.id,
      slug: resource.slug,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get resources without OG images (only 1 screenshot)
async function getResourcesNeedingPlaceholders(
  supabase: SupabaseClient,
  options: { limit?: number; category?: string }
): Promise<Resource[]> {
  const PAGE_SIZE = 1000;
  let allResources: Resource[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("resources")
      .select("id, slug, title, category, screenshots")
      .eq("is_published", true);

    if (options.category) {
      query = query.eq("category", options.category);
    }

    query = query
      .order("category")
      .order("slug")
      .range(offset, offset + PAGE_SIZE - 1);

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

  // Filter to only resources with exactly 1 screenshot (no OG image)
  let filtered = allResources.filter(
    (r) => r.screenshots && r.screenshots.length === 1
  );

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
  console.log("🎨 Branded Placeholder Generator");
  console.log("=".repeat(60));
  console.log(`Concurrency: ${options.concurrency}`);
  console.log(`Dimensions: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
  if (options.limit) console.log(`Limit: ${options.limit} resources`);
  if (options.category) console.log(`Category filter: ${options.category}`);
  if (options.dryRun) console.log("Mode: DRY RUN");
  console.log("");

  const supabase = getSupabaseClient();

  console.log("📊 Fetching resources needing placeholders...");
  const resources = await getResourcesNeedingPlaceholders(supabase, options);

  console.log(`\n📋 Found ${resources.length} resources needing placeholders`);

  if (resources.length === 0) {
    console.log("✨ All resources already have images!");
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

  if (options.dryRun) {
    console.log("\n🔍 DRY RUN - Would generate placeholders for:\n");
    resources.slice(0, 20).forEach((r) => console.log(`  ${r.slug}: ${r.title}`));
    if (resources.length > 20) {
      console.log(`  ... and ${resources.length - 20} more`);
    }
    return;
  }

  const estimatedSeconds = Math.ceil(resources.length / options.concurrency);
  console.log(`\n⏱️  Estimated time: ~${Math.ceil(estimatedSeconds / 60)} minutes`);

  const queue = new PQueue({ concurrency: options.concurrency });

  console.log(`\n🚀 Generating branded placeholders...\n`);

  const results: ProcessResult[] = [];
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();

  const promises = resources.map((resource) =>
    queue.add(async () => {
      const result = await processResource(supabase, resource);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

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

  console.log("\n\n" + "=".repeat(60));
  console.log("📊 Placeholder Generation Summary");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total processed: ${results.length}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(
    `⚡ Rate: ${(results.length / Math.max(duration, 1)).toFixed(1)} resources/second`
  );
  console.log("=".repeat(60) + "\n");

  const failures = results.filter((r) => !r.success);
  if (failures.length > 0 && failures.length <= 20) {
    console.log("Failed resources:");
    failures.forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
  } else if (failures.length > 20) {
    console.log(`\n${failures.length} resources failed. First 10:`);
    failures
      .slice(0, 10)
      .forEach((r) => console.log(`  ${r.slug}: ${r.error}`));
  }
}

main().catch(console.error);
