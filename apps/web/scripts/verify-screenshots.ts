#!/usr/bin/env npx tsx
/**
 * Quick verification script for screenshot coverage
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function hasBrandedPlaceholder(screenshots: string[] | null): boolean {
  if (!screenshots) return false;
  return screenshots.some((url) => url.includes("branded-placeholder"));
}

async function verify() {
  // Get total published count
  const { count: total } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  // Get counts by screenshot array length
  const PAGE_SIZE = 1000;
  let allResources: { screenshots: string[] | null; primary_screenshot_url: string | null }[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("resources")
      .select("screenshots, primary_screenshot_url")
      .eq("is_published", true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (data && data.length > 0) {
      allResources = allResources.concat(data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  const withZero = allResources.filter(r => !r.screenshots || r.screenshots.length === 0).length;
  const withOne = allResources.filter(r => r.screenshots?.length === 1).length;
  const withTwo = allResources.filter(r => r.screenshots?.length === 2).length;
  const withThree = allResources.filter(r => r.screenshots?.length === 3).length;
  const withMore = allResources.filter(r => r.screenshots && r.screenshots.length > 3).length;

  // Count resources with branded placeholders
  const withBranded = allResources.filter(r => hasBrandedPlaceholder(r.screenshots)).length;
  const withoutBranded = allResources.filter(r => !hasBrandedPlaceholder(r.screenshots)).length;

  // Sample of recently updated (should have branded placeholders)
  const { data: sample } = await supabase
    .from("resources")
    .select("slug, title, screenshots, primary_screenshot_url")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(5);

  console.log("\n📊 Screenshot Coverage Verification");
  console.log("=".repeat(50));
  console.log(`Total published resources: ${total}`);
  console.log(`\nBy screenshot count:`);
  console.log(`  0 screenshots: ${withZero}`);
  console.log(`  1 screenshot:  ${withOne}`);
  console.log(`  2 screenshots: ${withTwo}`);
  console.log(`  3 screenshots: ${withThree}`);
  console.log(`  4+ screenshots: ${withMore}`);
  console.log(`\n🎨 Branded placeholder coverage:`);
  console.log(`  With branded:    ${withBranded} (${(withBranded / (total || 1) * 100).toFixed(1)}%)`);
  console.log(`  Without branded: ${withoutBranded} (${(withoutBranded / (total || 1) * 100).toFixed(1)}%)`);
  console.log();
  console.log("📷 Sample of recently updated resources:");
  sample?.forEach(r => {
    const screenshotCount = r.screenshots?.length || 0;
    const hasBranded = hasBrandedPlaceholder(r.screenshots);
    const isPrimaryBranded = r.primary_screenshot_url?.includes("branded-placeholder");
    console.log(`  ${r.slug}: ${screenshotCount} screenshots${hasBranded ? " ✓branded" : ""}${isPrimaryBranded ? " (primary)" : ""}`);
  });
}

verify().catch(console.error);
