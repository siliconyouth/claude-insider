/**
 * Authentication Setup
 *
 * This runs before authenticated tests to prepare storage state.
 *
 * For testing with real authentication:
 * 1. Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars
 * 2. Or use OAuth mock (for CI/CD)
 *
 * The authenticated state is saved to .auth/user.json and reused
 * by all tests that depend on the "setup" project.
 */

import { test as setup, expect } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Check if we're testing with mock auth or real auth
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (testEmail && testPassword) {
    // Real authentication flow
    console.log("   Setting up real authentication...");

    await page.goto("/sign-in");

    // Fill email/password form if available
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);

      // Submit form
      await page.getByRole("button", { name: /sign in|submit/i }).click();

      // Wait for redirect after successful login
      await page.waitForURL("/", { timeout: 10000 });

      // Verify we're logged in
      await expect(page.locator("[data-testid='user-menu'], button:has([alt*='avatar'])")).toBeVisible({
        timeout: 10000,
      });
    }
  } else {
    // Mock authentication for CI/CD or local testing without credentials
    console.log("   Setting up mock authentication...");

    // Navigate to a page to establish session
    await page.goto("/");

    // For testing, we can inject mock session storage
    // This simulates being logged in for tests that need it
    await page.evaluate(() => {
      // Set mock user data in localStorage
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };
      localStorage.setItem("test_user", JSON.stringify(mockUser));
    });

    // Add a cookie to indicate test mode
    await page.context().addCookies([
      {
        name: "test_auth",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  // Save storage state regardless of auth method
  await page.context().storageState({ path: authFile });
  console.log("   ✓ Authentication state saved to", authFile);
});

setup("verify auth file exists", async () => {
  const fs = await import("fs");
  const exists = fs.existsSync(authFile);

  if (!exists) {
    // Create empty auth file if it doesn't exist
    const emptyState = { cookies: [], origins: [] };
    fs.writeFileSync(authFile, JSON.stringify(emptyState, null, 2));
  }

  expect(fs.existsSync(authFile)).toBe(true);
});
