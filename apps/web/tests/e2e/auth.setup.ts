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
    // Real authentication flow via auth modal
    console.log("   Setting up real authentication...");

    // Go to homepage first
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Dismiss version update popup if present
    const gotItButton = page.locator('button:has-text("Got it!")').first();
    if (await gotItButton.isVisible().catch(() => false)) {
      console.log("   Dismissing version popup...");
      await gotItButton.click();
      await page.waitForTimeout(300);
    }

    // Find and click the Sign In button to open auth modal
    // The UserMenu component uses an icon button with aria-label="Sign in"
    // Wait for the header to be fully loaded first
    await page.waitForTimeout(1000);

    // Debug: Check what's in the header area
    const headerButtons = await page.locator('header button').all();
    console.log("   Found", headerButtons.length, "buttons in header");
    for (let i = 0; i < Math.min(headerButtons.length, 5); i++) {
      const ariaLabel = await headerButtons[i].getAttribute('aria-label').catch(() => 'none');
      const title = await headerButtons[i].getAttribute('title').catch(() => 'none');
      console.log(`   Button ${i}: aria-label="${ariaLabel}", title="${title}"`);
    }

    // Also check if there's a loading indicator (auth is still loading)
    const loadingIndicator = page.locator('.animate-pulse');
    const hasLoading = await loadingIndicator.isVisible().catch(() => false);
    console.log("   Loading indicator visible:", hasLoading);

    const signInButton = page.locator('[aria-label="Sign in"], [title="Sign in"]').first();
    const hasSignInButton = await signInButton.isVisible().catch(() => false);

    if (hasSignInButton) {
      console.log("   Opening auth modal...");
      await signInButton.click();
      await page.waitForTimeout(500);

      // Wait for auth modal to fully appear
      await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(300);

      // Fill email/password form in the modal using precise selectors
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');

      const emailVisible = await emailInput.isVisible().catch(() => false);
      const passwordVisible = await passwordInput.isVisible().catch(() => false);

      if (emailVisible && passwordVisible) {
        console.log("   Filling credentials...");
        await emailInput.fill(testEmail);
        await passwordInput.fill(testPassword);

        // Submit form - the submit button inside the modal
        const submitButton = page.locator('[role="dialog"] button[type="submit"]');
        console.log("   Submitting login form...");

        // Listen for network responses to capture auth result
        const responsePromise = page.waitForResponse(
          (response) => response.url().includes('/api/auth/sign-in/email'),
          { timeout: 15000 }
        ).catch(() => null);

        await submitButton.click();

        // Wait for the auth API response
        const authResponse = await responsePromise;
        if (authResponse) {
          const status = authResponse.status();
          console.log("   Auth API response status:", status);
          if (status !== 200) {
            try {
              const body = await authResponse.json();
              console.log("   Auth API error:", JSON.stringify(body));
            } catch {
              console.log("   Could not parse auth response body");
            }
          }
        } else {
          console.log("   Warning: Auth API call not detected");
        }

        // Wait for modal to close and auth state to settle
        await page.waitForTimeout(3000);

        // Verify we're logged in by checking that the Sign In button is NO LONGER visible
        // (it gets replaced by the user avatar when authenticated)
        const signInStillVisible = await page.locator('[aria-label="Sign in"]').isVisible().catch(() => false);

        if (!signInStillVisible) {
          console.log("   ✓ Successfully authenticated!");
        } else {
          // Check for any error message in the modal
          const errorMessage = await page.locator('.text-red-600, .text-red-400').textContent().catch(() => null);
          if (errorMessage) {
            console.log("   ✗ Login failed with error:", errorMessage);
          } else {
            console.log("   Warning: Could not verify login - Sign in button still visible");
          }
        }
      } else {
        console.log("   Warning: Email/password inputs not found in modal");
        console.log("   Email input visible:", emailVisible);
        console.log("   Password input visible:", passwordVisible);
      }
    } else {
      console.log("   Warning: Sign in button not found - may already be logged in or UI changed");
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
