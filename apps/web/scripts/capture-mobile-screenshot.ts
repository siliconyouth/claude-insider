#!/usr/bin/env npx tsx
/**
 * Mobile Screenshot Capture Script
 *
 * Captures a dark theme screenshot of the Claude Insider homepage
 * for the iPhone 17 Pro Max device mockup.
 *
 * Requirements (from device-mockups.tsx):
 * - Viewport: 446x932 (matches mockup 224:468 aspect ratio)
 * - Dark mode enabled
 * - Header visible below Dynamic Island
 * - Bottom mobile navigation visible
 * - Hero section with device mockups captured
 *
 * Usage: npx tsx scripts/capture-mobile-screenshot.ts [--local]
 * --local: Use localhost:3001 instead of production URL
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const VIEWPORT = { width: 446, height: 932 };
const OUTPUT_PATH = "public/images/mobile-screenshot.png";

async function captureScreenshot() {
  const useLocal = process.argv.includes("--local");
  const targetUrl = useLocal
    ? "http://localhost:3001"
    : "https://www.claudeinsider.com";

  console.log("\n" + "=".repeat(50));
  console.log("📱 Mobile Screenshot Capture");
  console.log("=".repeat(50));
  console.log(`🎯 Target: ${targetUrl}`);
  console.log(`📐 Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`📁 Output: ${OUTPUT_PATH}\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      colorScheme: "dark", // Force dark mode
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      deviceScaleFactor: 3, // Retina 3x for crisp screenshots
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    console.log("🚀 Navigating to page...");
    await page.goto(targetUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Wait for page to fully render
    console.log("⏳ Waiting for content to load...");
    await page.waitForTimeout(3000);

    // Ensure dark mode is active (in case cookie isn't set)
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });

    // Wait a bit for dark mode styles to apply
    await page.waitForTimeout(1000);

    // Create output directory if needed
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Capture screenshot
    console.log("📸 Capturing screenshot...");
    await page.screenshot({
      path: OUTPUT_PATH,
      type: "png",
      fullPage: false, // Only viewport, not full page
    });

    // Get file size
    const stats = fs.statSync(OUTPUT_PATH);
    const fileSizeKB = Math.round(stats.size / 1024);

    console.log(`\n✅ Screenshot saved to ${OUTPUT_PATH}`);
    console.log(`📊 File size: ${fileSizeKB} KB`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Error capturing screenshot:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshot().catch(console.error);
