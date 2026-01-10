import { defineConfig, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local manually
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        let value = valueParts.join("=");
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

/**
 * Playwright Configuration for Claude Insider
 *
 * Integration Test Framework v2.1.0
 *
 * Features:
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 * - Parallel execution with isolated contexts
 * - Screenshot capture on failure
 * - Video recording for debugging
 * - Network mocking capabilities
 * - Mobile viewport testing
 *
 * Browser Availability (v1.18.5):
 * - Firefox/WebKit only run in CI where they're installed
 * - Local development uses Chromium only for faster feedback
 * - Use `pnpm exec playwright install firefox webkit` to enable locally
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// Check if we're in CI environment
const IS_CI = !!process.env.CI;

// Use port 3001 to match the dev server configuration
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",

  // Output directories
  outputDir: "./tests/e2e/test-results",

  // Maximum time one test can run for (60s for dev server compilation)
  timeout: 60 * 1000,

  // Expect timeout for assertions (higher for dev server)
  expect: {
    timeout: 45 * 1000,
  },

  // Run tests in files in parallel (disabled for dev server stability)
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Use single worker locally to reduce dev server load, CI uses 1 for stability
  workers: 1,

  // Reporter to use
  reporter: [
    ["list"],
    ["html", { outputFolder: "./tests/e2e/playwright-report", open: "never" }],
    ...(process.env.CI ? [["github", {}] as const] : []),
  ],

  // Global setup and teardown
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Capture screenshot only on failure
    screenshot: "only-on-failure",

    // Record video only when retrying
    video: "on-first-retry",

    // Browser context options
    contextOptions: {
      // Reduce motion for consistent animations
      reducedMotion: "reduce",
    },

    // Navigation timeout (higher for dev server compilation)
    navigationTimeout: 45 * 1000,

    // Action timeout
    actionTimeout: 15 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    // Auth setup - runs before tests that need authentication
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use prepared auth state
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Firefox - only in CI (requires browser installation)
    // To enable locally: pnpm exec playwright install firefox
    ...(IS_CI ? [{
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    }] : []),

    // WebKit - only in CI (requires browser installation)
    // To enable locally: pnpm exec playwright install webkit
    ...(IS_CI ? [{
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    }] : []),

    // Mobile viewports
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Mobile Safari - only in CI (requires WebKit installation)
    ...(IS_CI ? [{
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    }] : []),

    // Anonymous tests (no auth)
    {
      name: "anonymous",
      testMatch: /.*\.anon\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // No storage state = not logged in
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    // Use production server in CI (faster, more stable), dev server locally
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // CI needs more time for cold start, dev server needs time for compilation
    timeout: process.env.CI ? 60 * 1000 : 180 * 1000,
    // Stdout/stderr to console
    stdout: "pipe",
    stderr: "pipe",
  },
});
