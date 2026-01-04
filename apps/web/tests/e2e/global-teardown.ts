/**
 * Global Teardown for Playwright Tests
 *
 * Runs once after all tests complete. Used for:
 * - Cleaning up test data
 * - Generating reports
 * - Closing connections
 */

import { type FullConfig } from "@playwright/test";

async function globalTeardown(_config: FullConfig) {
  console.log("\n🧹 Cleaning up test environment...");

  // Add any cleanup logic here
  // e.g., Delete test users, reset database state, etc.

  console.log("   ✓ Global teardown complete\n");
}

export default globalTeardown;
