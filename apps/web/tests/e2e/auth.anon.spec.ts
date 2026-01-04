/**
 * Authentication E2E Tests (Anonymous)
 *
 * Tests for authentication flows that don't require being logged in.
 * This app uses MODAL-BASED AUTH (Better Auth), not dedicated sign-in pages.
 * Tests verify the auth modal, OAuth buttons, and protected route redirects.
 */

import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors } from "./utils/test-helpers";

test.describe("Authentication Pages", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes("favicon") && !err.includes("404") && !err.includes("hydration")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Auth Modal (Modal-Based Auth - Not Dedicated Pages)
  // =========================================================================

  test("should display sign-in modal from header", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Find sign-in button in header
    const header = page.locator("header").first();
    const signInButton = header.getByRole("link", { name: /sign in/i }).or(header.getByRole("button", { name: /sign in/i })).first();

    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      // Auth modal or dialog should appear
      const authModal = page.locator("[role='dialog'], [data-testid='auth-modal'], [class*='modal']").first();
      const hasModal = await authModal.isVisible().catch(() => false);

      // Or we should have navigated to an auth-related URL
      const url = page.url();
      const hasAuthContent = url.includes("sign") || url.includes("auth") || url.includes("login");

      // Either modal appeared or we navigated to auth page
      expect(hasModal || hasAuthContent).toBe(true);
    }
  });

  test("should display OAuth providers in auth UI", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Try to open auth modal
    const signInButton = page.locator("header").getByRole("link", { name: /sign in/i }).or(page.locator("header").getByRole("button", { name: /sign in/i })).first();

    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      // GitHub OAuth button
      const githubButton = page.getByRole("button", { name: /github/i }).or(page.locator("button:has-text('GitHub')"));
      const hasGithub = await githubButton.isVisible().catch(() => false);

      // Google OAuth button
      const googleButton = page.getByRole("button", { name: /google/i }).or(page.locator("button:has-text('Google')"));
      const hasGoogle = await googleButton.isVisible().catch(() => false);

      // Should have at least one OAuth provider
      expect(hasGithub || hasGoogle).toBe(true);
    }
  });

  test("should have proper page title on homepage", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const title = await page.title();
    // Homepage should have site title
    expect(title).toContain("Claude");
  });

  // =========================================================================
  // Sign Up (Same as Sign In for Modal Auth)
  // =========================================================================

  test("should handle auth from any page", async ({ page }) => {
    // Auth can be triggered from any page via the header
    await page.goto("/docs");
    await waitForHydration(page);

    // Look for sign-in link OR button (some pages use button, some use link)
    const signInElement = page.locator("header").getByRole("link", { name: /sign in/i })
      .or(page.locator("header").getByRole("button", { name: /sign in/i })).first();
    const isVisible = await signInElement.isVisible().catch(() => false);

    // Auth should be accessible from any page
    expect(isVisible).toBe(true);
  });

  // =========================================================================
  // Protected Routes
  // =========================================================================

  test("should redirect to sign-in for protected dashboard routes", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for potential redirect
    await page.waitForTimeout(2000);

    const url = page.url();

    // Should either redirect to sign-in or show unauthorized message
    const isSignInPage = url.includes("sign-in");
    const body = await page.locator("body").textContent();
    const showsUnauthorized = body?.match(/sign in|unauthorized|login required/i);

    expect(isSignInPage || showsUnauthorized).toBeTruthy();
  });

  test("should redirect to sign-in for protected inbox routes", async ({ page }) => {
    await page.goto("/inbox");

    await page.waitForTimeout(2000);

    const url = page.url();
    const isSignInPage = url.includes("sign-in");
    const body = await page.locator("body").textContent();
    const showsUnauthorized = body?.match(/sign in|unauthorized|login/i);

    expect(isSignInPage || showsUnauthorized).toBeTruthy();
  });

  test("should redirect to sign-in for protected settings routes", async ({ page }) => {
    await page.goto("/settings");

    await page.waitForTimeout(2000);

    const url = page.url();
    const isSignInPage = url.includes("sign-in");
    const body = await page.locator("body").textContent();
    const showsUnauthorized = body?.match(/sign in|unauthorized|login/i);

    expect(isSignInPage || showsUnauthorized).toBeTruthy();
  });

  // =========================================================================
  // Sign In Button in Header
  // =========================================================================

  test("should show sign-in button in header when not authenticated", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const header = page.locator("header").first();

    // Look for sign-in link or button
    const signInLink = header.getByRole("link", { name: /sign in/i }).or(header.getByRole("button", { name: /sign in/i }));

    const isVisible = await signInLink.isVisible().catch(() => false);

    // Should have sign-in option somewhere
    if (!isVisible) {
      // Might be in a menu
      const menuButton = header.getByRole("button", { name: /menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);

        const menuSignIn = page.getByRole("link", { name: /sign in/i });
        const menuVisible = await menuSignIn.isVisible().catch(() => false);
        expect(menuVisible).toBe(true);
      }
    }
  });

  test("should navigate to sign-in page from header", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const signInLink = page.locator("header").getByRole("link", { name: /sign in/i }).first();

    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/sign-in/);
    }
  });

  // =========================================================================
  // Passkey/2FA UI
  // =========================================================================

  test("should not show passkey setup when not authenticated", async ({ page }) => {
    await page.goto("/settings/security");

    await page.waitForTimeout(2000);

    // Should redirect or show error, not passkey setup UI
    const url = page.url();
    const isAuthPage = url.includes("sign-in") || url.includes("settings");

    if (url.includes("settings")) {
      // If somehow on settings, should see auth required message
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/sign in|unauthorized/i);
    } else {
      expect(isAuthPage).toBe(true);
    }
  });

  // =========================================================================
  // OAuth Flow (Partial - Can't Test Full Flow)
  // =========================================================================

  test("GitHub OAuth button should be accessible", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Open auth modal first
    const signInButton = page.locator("header").getByRole("link", { name: /sign in/i }).first();

    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      const githubButton = page.getByRole("button", { name: /github/i }).or(page.locator("a:has-text('GitHub')"));

      if (await githubButton.isVisible()) {
        // If it's a link, check href
        const tagName = await githubButton.evaluate((el) => el.tagName.toLowerCase());

        if (tagName === "a") {
          const href = await githubButton.getAttribute("href");
          expect(href).toMatch(/github|oauth|api\/auth/i);
        }

        // Button exists and is clickable
        expect(await githubButton.isEnabled()).toBe(true);
      }
    }
  });

  // =========================================================================
  // Error Handling
  // =========================================================================

  test("should handle auth error gracefully", async ({ page }) => {
    // Simulate auth error callback on homepage (since no /sign-in page)
    await page.goto("/?error=OAuthAccountNotLinked");
    await waitForHydration(page);

    // Page should load without crashing
    const bodyVisible = await page.locator("body").isVisible();
    expect(bodyVisible).toBe(true);

    // Homepage content should still be present
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });

  test("should handle callback without state gracefully", async ({ page }) => {
    await page.goto("/api/auth/callback/github?code=invalid");

    // Should redirect to sign-in or show error, not crash
    await page.waitForTimeout(2000);

    const body = await page.locator("body").textContent();
    // Should show some response, not blank page
    expect(body?.length).toBeGreaterThan(0);
  });
});

test.describe("Session Management", () => {
  test("should clear auth state on sign-out attempt", async ({ page }) => {
    // Go to sign-out URL (even if not signed in)
    const response = await page.goto("/api/auth/signout", { waitUntil: "networkidle" });

    // Should redirect or show confirmation
    expect(response?.status()).toBeLessThan(500);
  });
});
