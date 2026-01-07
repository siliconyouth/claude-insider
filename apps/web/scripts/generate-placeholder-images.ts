#!/usr/bin/env npx tsx
/**
 * Branded Placeholder Image Generator
 *
 * Creates professional placeholder images for resources that can't be
 * screenshotted or don't have OG images. Uses Claude Insider design system.
 *
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/generate-placeholder-images.ts
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
  LOCAL_CACHE_DIR: "tmp/placeholder-images",
  IMAGE_WIDTH: 1200,
  IMAGE_HEIGHT: 630,
};

// Category icons (emoji for SVG text)
const CATEGORY_ICONS: Record<string, string> = {
  official: "🏛️",
  tools: "🛠️",
  sdks: "📦",
  "mcp-servers": "🔌",
  community: "👥",
  showcases: "✨",
  tutorials: "📚",
  agents: "🤖",
  integrations: "🔗",
  libraries: "📚",
};

// Category colors (gradient stops)
const CATEGORY_COLORS: Record<string, [string, string]> = {
  official: ["#8B5CF6", "#3B82F6"], // Violet to Blue
  tools: ["#3B82F6", "#06B6D4"], // Blue to Cyan
  sdks: ["#8B5CF6", "#EC4899"], // Violet to Pink
  "mcp-servers": ["#10B981", "#3B82F6"], // Green to Blue
  community: ["#F59E0B", "#EF4444"], // Amber to Red
  showcases: ["#EC4899", "#8B5CF6"], // Pink to Violet
  tutorials: ["#06B6D4", "#3B82F6"], // Cyan to Blue
  agents: ["#8B5CF6", "#06B6D4"], // Violet to Cyan
  integrations: ["#3B82F6", "#10B981"], // Blue to Green
  libraries: ["#6366F1", "#8B5CF6"], // Indigo to Violet
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
// SVG PLACEHOLDER GENERATOR
// ============================================================================

function generatePlaceholderSVG(resource: Resource): string {
  const { title, category, url } = resource;
  const icon = CATEGORY_ICONS[category] || "📄";
  const [color1, color2] = CATEGORY_COLORS[category] || ["#8B5CF6", "#3B82F6"];

  // Extract domain from URL
  let domain = "";
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  // Truncate title if too long
  const displayTitle =
    title.length > 40 ? title.substring(0, 37) + "..." : title;

  // Format category name
  const categoryName = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CONFIG.IMAGE_WIDTH}" height="${CONFIG.IMAGE_HEIGHT}" viewBox="0 0 ${CONFIG.IMAGE_WIDTH} ${CONFIG.IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#1a1a1a"/>
    </linearGradient>

    <!-- Accent gradient -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>

    <!-- Glow filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>

  <!-- Decorative circles -->
  <circle cx="100" cy="100" r="200" fill="${color1}" opacity="0.1" filter="url(#glow)"/>
  <circle cx="1100" cy="530" r="150" fill="${color2}" opacity="0.1" filter="url(#glow)"/>

  <!-- Grid pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-opacity="0.03" stroke-width="1"/>
  </pattern>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Top accent line -->
  <rect x="0" y="0" width="100%" height="4" fill="url(#accentGradient)"/>

  <!-- Icon circle -->
  <circle cx="600" cy="200" r="60" fill="url(#accentGradient)" opacity="0.2"/>
  <text x="600" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="48" text-anchor="middle" fill="white">${icon}</text>

  <!-- Title -->
  <text x="600" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="700" text-anchor="middle" fill="white">${escapeXml(displayTitle)}</text>

  <!-- Category badge -->
  <rect x="500" y="380" width="200" height="36" rx="18" fill="url(#accentGradient)" opacity="0.3"/>
  <text x="600" y="405" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" text-anchor="middle" fill="white" opacity="0.9">${categoryName.toUpperCase()}</text>

  <!-- Domain -->
  <text x="600" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="18" text-anchor="middle" fill="white" opacity="0.5">${escapeXml(domain)}</text>

  <!-- Claude Insider branding -->
  <text x="600" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="14" text-anchor="middle" fill="white" opacity="0.3">Claude Insider</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================================================
// UPLOAD AND UPDATE
// ============================================================================

async function uploadPlaceholder(
  supabase: SupabaseClient,
  resource: Resource,
  svg: string
): Promise<string | null> {
  const buffer = Buffer.from(svg, "utf-8");
  const filePath = `${resource.category}/${resource.slug}-placeholder.svg`;

  // Cache locally
  const cacheDir = path.join(process.cwd(), CONFIG.LOCAL_CACHE_DIR);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(path.join(cacheDir, `${resource.slug}.svg`), svg);

  const { error } = await supabase.storage
    .from(CONFIG.SCREENSHOT_BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (error) {
    console.error(`   Upload error: ${error.message}`);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CONFIG.SCREENSHOT_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

async function updateResourceScreenshot(
  supabase: SupabaseClient,
  resourceId: string,
  screenshotUrl: string,
  title: string
): Promise<boolean> {
  const metadata = {
    url: screenshotUrl,
    width: CONFIG.IMAGE_WIDTH,
    height: CONFIG.IMAGE_HEIGHT,
    alt: `${title} placeholder`,
    caption: "Generated placeholder image",
    order: 0,
    captured_at: new Date().toISOString(),
    source: "placeholder",
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
// MAIN
// ============================================================================

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🎨 Branded Placeholder Image Generator");
  console.log("   Creating professional placeholders for remaining resources");
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
  let successful = 0;
  let failed = 0;

  for (const resource of resources as Resource[]) {
    process.stdout.write(`🎨 [${resource.slug}] Generating placeholder... `);

    // Generate SVG
    const svg = generatePlaceholderSVG(resource);

    // Upload to Supabase
    const uploadedUrl = await uploadPlaceholder(supabase, resource, svg);
    if (!uploadedUrl) {
      failed++;
      console.log("❌ Upload failed");
      continue;
    }

    // Update database
    const updated = await updateResourceScreenshot(
      supabase,
      resource.id,
      uploadedUrl,
      resource.title
    );

    if (updated) {
      successful++;
      console.log("✅ Done");
    } else {
      failed++;
      console.log("❌ Database update failed");
    }
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("═".repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total processed: ${resources.length}`);
  console.log("═".repeat(60));
}

main().catch(console.error);
