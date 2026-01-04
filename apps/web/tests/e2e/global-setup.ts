/**
 * Global Setup for Playwright Tests
 *
 * Runs once before all tests. Used for:
 * - Setting up test database state
 * - Creating test fixtures
 * - Preparing auth states
 */

import { chromium, type FullConfig } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as path from "path";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log("\n📦 Setting up test environment...");
  console.log(`   Base URL: ${baseURL}`);

  // Ensure auth directory exists
  const authDir = path.join(process.cwd(), "tests/e2e/.auth");
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true });
  }

  // Create empty auth state file if it doesn't exist
  // Real auth will be set up by auth.setup.ts
  const userAuthPath = path.join(authDir, "user.json");
  if (!existsSync(userAuthPath)) {
    const emptyState = { cookies: [], origins: [] };
    writeFileSync(userAuthPath, JSON.stringify(emptyState, null, 2));
  }

  // Pre-warm the dev server by visiting key routes
  // This triggers Next.js to compile pages before tests run
  if (baseURL) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Routes to pre-warm (most important pages for tests)
    const routesToWarm = [
      "/",
      "/docs",
      "/docs/getting-started",
      "/resources",
    ];

    try {
      console.log("   🔥 Pre-warming dev server...");

      for (const route of routesToWarm) {
        try {
          // Navigate and wait for the page to fully load
          await page.goto(`${baseURL}${route}`, {
            timeout: 90000, // 90s for initial compilation
            waitUntil: "networkidle",
          });
          console.log(`   ✓ Warmed ${route}`);
        } catch (error) {
          // Log but continue - some routes may fail
          console.log(`   ⚠ Failed to warm ${route}: ${(error as Error).message}`);
        }
      }

      console.log("   ✓ Server is ready");
    } catch (error) {
      console.warn("   ⚠ Server check failed (may still work):", error);
    } finally {
      await browser.close();
    }
  }

  console.log("   ✓ Global setup complete\n");
}

export default globalSetup;
