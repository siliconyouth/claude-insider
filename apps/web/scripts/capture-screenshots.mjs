#!/usr/bin/env node
/**
 * Capture Screenshots for Resources
 *
 * This script captures screenshots for resources that don't have them.
 * Uses Playwright to navigate to URLs and capture full-page screenshots.
 *
 * Usage: node scripts/capture-screenshots.mjs [--all] [--resource=id]
 *
 * Options:
 *   --all           Capture screenshots for ALL resources (overwrites existing)
 *   --resource=id   Capture screenshot for a specific resource
 *   (default)       Only capture for resources missing screenshots
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const RESOURCES_DIR = path.join(ROOT_DIR, "data/resources");
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "public/images/resources");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(msg, color = "") {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Load all resources from JSON files
 */
function loadAllResources() {
  const files = fs
    .readdirSync(RESOURCES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.ts" && f !== "schema.ts");

  const allResources = [];
  for (const file of files) {
    const filePath = path.join(RESOURCES_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const category = file.replace(".json", "");

    if (Array.isArray(content)) {
      for (const resource of content) {
        allResources.push({
          ...resource,
          _file: file,
          _filePath: filePath,
          _category: category,
        });
      }
    }
  }
  return allResources;
}

/**
 * Check if resource has a screenshot
 */
function hasScreenshot(resource) {
  // Check if screenshotUrl exists in JSON
  if (resource.screenshotUrl) return true;

  // Check if file exists locally
  const possibleNames = [
    `${resource.id}.png`,
    `${resource.id.replace(/-/g, "_")}.png`,
  ];

  for (const name of possibleNames) {
    if (fs.existsSync(path.join(SCREENSHOTS_DIR, name))) {
      return true;
    }
  }

  return false;
}

/**
 * Capture screenshot using Playwright
 */
async function captureScreenshot(browser, resource) {
  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate with timeout
    await page.goto(resource.url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait a bit for any animations
    await page.waitForTimeout(2000);

    // Try to dismiss common cookie/popup elements
    const dismissSelectors = [
      '[class*="cookie"] button',
      '[class*="consent"] button',
      '[class*="popup"] button[class*="close"]',
      '[class*="modal"] button[class*="close"]',
      'button[aria-label="Close"]',
      'button[aria-label="Dismiss"]',
      'button:has-text("Accept")',
      'button:has-text("Got it")',
      'button:has-text("I agree")',
    ];

    for (const selector of dismissSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 500 })) {
          await element.click();
          await page.waitForTimeout(500);
        }
      } catch {
        // Ignore - element not found
      }
    }

    // Capture screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${resource.id}.png`);
    await page.screenshot({
      path: screenshotPath,
      type: "png",
      fullPage: false, // Just viewport
    });

    return { success: true, path: screenshotPath };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await page.close();
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const captureAll = args.includes("--all");
  const specificArg = args.find((a) => a.startsWith("--resource="));
  const specificResource = specificArg ? specificArg.split("=")[1] : null;

  console.log("\n" + colors.cyan + colors.bright);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              RESOURCE SCREENSHOT CAPTURE                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Load resources
  const allResources = loadAllResources();
  log(`  📦 Loaded ${allResources.length} total resources`, colors.dim);

  // Filter resources to capture
  let resourcesToCapture = [];

  if (specificResource) {
    const resource = allResources.find((r) => r.id === specificResource);
    if (resource) {
      resourcesToCapture = [resource];
    } else {
      log(`  ❌ Resource not found: ${specificResource}`, colors.red);
      process.exit(1);
    }
  } else if (captureAll) {
    resourcesToCapture = allResources;
  } else {
    resourcesToCapture = allResources.filter((r) => !hasScreenshot(r));
  }

  if (resourcesToCapture.length === 0) {
    log("\n  ✅ All resources have screenshots!", colors.green);
    return;
  }

  log(`\n  📸 Capturing ${resourcesToCapture.length} screenshots...`, colors.bright);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  });

  let successCount = 0;
  let errorCount = 0;

  for (const resource of resourcesToCapture) {
    log(`\n  [${resource.id}] ${resource.title}`, colors.bright);
    log(`    URL: ${resource.url}`, colors.dim);

    const result = await captureScreenshot(browser, resource);

    if (result.success) {
      log(`    ✅ Saved: ${path.basename(result.path)}`, colors.green);
      successCount++;
    } else {
      log(`    ❌ Failed: ${result.error}`, colors.red);
      errorCount++;
    }
  }

  await browser.close();

  // Summary
  console.log("\n" + colors.cyan + colors.bright);
  console.log("════════════════════════════════════════════════════════════════");
  console.log("                         SUMMARY                                 ");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(colors.reset);

  log(`  Total attempted:  ${resourcesToCapture.length}`, colors.bright);
  log(`  Successful:       ${successCount}`, colors.green);
  log(`  Failed:           ${errorCount}`, errorCount > 0 ? colors.red : colors.green);

  if (successCount > 0) {
    log(`\n  📁 Screenshots saved to: ${SCREENSHOTS_DIR}`, colors.dim);
    log(`\n  Next steps:`, colors.bright);
    log(`    1. Run: node scripts/upload-screenshots-to-supabase.mjs`, colors.cyan);
    log(`    2. Run: node scripts/sync-screenshots-to-db.mjs`, colors.cyan);
  }

  console.log("\n" + colors.cyan);
  console.log("════════════════════════════════════════════════════════════════");
  console.log(colors.reset);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
