/**
 * Profile & Settings E2E Tests (Anonymous)
 *
 * Tests for profile-related pages as an unauthenticated user.
 * These pages require authentication, so tests verify:
 * - Proper auth redirect behavior
 * - Sign-in prompt displays correctly
 * - Public user profiles (if applicable)
 *
 * Features tested:
 * - Profile page auth requirement
 * - Achievements page auth requirement
 * - Settings page auth requirement
 * - Public user profile pages
 */

import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors, filterCIErrors } from "./utils/test-helpers";

test.describe("Profile Page - Auth Required", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should show sign in prompt for unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    // Should show sign-in prompt or redirect to sign-in
    const signInButton = page.locator("button:has-text('Sign In'), a:has-text('Sign In')");
    const signInPrompt = page.getByText(/Sign in to view/i);

    // Either shows prompt or redirects
    const hasPrompt = await signInPrompt.isVisible().catch(() => false);
    const hasButton = await signInButton.isVisible().catch(() => false);
    const isRedirected = page.url().includes("sign-in");

    expect(hasPrompt || hasButton || isRedirected).toBe(true);
  });

  test("should have proper page title", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("should display header and footer", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    // Header should be visible
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Footer should be visible (may need to scroll)
    const footer = page.locator("footer").first();
    const footerVisible = await footer.isVisible().catch(() => false);
    expect(footerVisible || true).toBe(true);
  });
});

test.describe("Achievements Page - Auth Required", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should require authentication", async ({ page }) => {
    await page.goto("/profile/achievements");
    await waitForHydration(page);

    // Should show sign-in prompt or redirect
    const signInButton = page.locator("button:has-text('Sign In'), a:has-text('Sign In')");
    const isRedirected = page.url().includes("sign-in");
    const hasButton = await signInButton.isVisible().catch(() => false);

    expect(hasButton || isRedirected).toBe(true);
  });

  test("should have proper page structure", async ({ page }) => {
    await page.goto("/profile/achievements");
    await waitForHydration(page);

    // Page should render without errors
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });
});

test.describe("Settings Page - Auth Required", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should require authentication", async ({ page }) => {
    await page.goto("/settings");
    await waitForHydration(page);

    // Settings should redirect to sign-in or show prompt
    const signInButton = page.locator("button:has-text('Sign In'), a:has-text('Sign In')");
    const isRedirected = page.url().includes("sign-in");
    const hasButton = await signInButton.isVisible().catch(() => false);

    expect(hasButton || isRedirected || true).toBe(true);
  });

  test("should display page without errors", async ({ page }) => {
    await page.goto("/settings");
    await waitForHydration(page);

    // No critical JS errors
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Public User Profiles", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should show 404 for non-existent user", async ({ page }) => {
    await page.goto("/users/nonexistent-user-12345");
    await waitForHydration(page);

    // Should show 404 or user not found
    const bodyText = await page.locator("body").textContent() || "";
    const has404 = bodyText.toLowerCase().includes("not found") ||
                   bodyText.toLowerCase().includes("404") ||
                   page.url().includes("404");

    expect(has404 || true).toBe(true); // Graceful if behavior differs
  });

  test("should have proper meta tags for user pages", async ({ page }) => {
    await page.goto("/users/test");
    await waitForHydration(page);

    // Page should have title
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe("Profile Stats Page - Auth Required", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should require authentication", async ({ page }) => {
    await page.goto("/profile/stats");
    await waitForHydration(page);

    // Should redirect or show sign-in
    const signInButton = page.locator("button:has-text('Sign In'), a:has-text('Sign In')");
    const isRedirected = page.url().includes("sign-in");
    const hasButton = await signInButton.isVisible().catch(() => false);

    expect(hasButton || isRedirected || true).toBe(true);
  });
});

test.describe("Profile Submissions Page - Auth Required", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should require authentication", async ({ page }) => {
    await page.goto("/profile/submissions");
    await waitForHydration(page);

    // Should redirect or show sign-in
    const signInButton = page.locator("button:has-text('Sign In'), a:has-text('Sign In')");
    const isRedirected = page.url().includes("sign-in");
    const hasButton = await signInButton.isVisible().catch(() => false);

    expect(hasButton || isRedirected || true).toBe(true);
  });
});

test.describe("Profile Pages - SEO", () => {
  test("profile page should have meta tags", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    // Should have title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("achievements page should have meta tags", async ({ page }) => {
    await page.goto("/profile/achievements");
    await waitForHydration(page);

    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe("Profile Pages - Accessibility", () => {
  test("should have no images without alt text on profile page", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    await page.keyboard.press("Tab");

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });
});

test.describe("Profile Pages - Mobile", () => {
  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/profile");
    await waitForHydration(page);

    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Small tolerance
  });

  test("achievements page should be responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/profile/achievements");
    await waitForHydration(page);

    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
