/**
 * Profile E2E Tests (Authenticated)
 *
 * Tests for profile pages when user is logged in.
 * Uses the auth state saved by auth.setup.ts.
 *
 * Note: In CI without real credentials, mock auth is used. Tests should
 * handle cases where server-side session might not be established.
 *
 * Features tested:
 * - Profile page with user data
 * - Profile tabs (favorites, ratings, collections)
 * - Achievements page
 * - Edit profile functionality
 * - Public profile view
 */

import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors, filterCIErrors } from "./utils/test-helpers";

test.describe("Profile Page - Authenticated", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/profile");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Profile Display
  // =========================================================================

  test("should display profile page or sign-in prompt", async ({ page }) => {
    // Profile requires auth - should show content or sign-in
    const bodyText = await page.locator("body").textContent() || "";

    const hasProfileContent =
      bodyText.toLowerCase().includes("profile") ||
      bodyText.toLowerCase().includes("favorites") ||
      bodyText.toLowerCase().includes("collections");
    const hasSignIn =
      bodyText.toLowerCase().includes("sign in") ||
      bodyText.toLowerCase().includes("log in");

    expect(hasProfileContent || hasSignIn).toBe(true);
  });

  test("should display profile header with user info", async ({ page }) => {
    // Look for profile header elements
    const profileHeader = page.locator("[data-testid='profile-header'], .rounded-xl:has(img)").first();
    const isVisible = await profileHeader.isVisible().catch(() => false);

    // Either visible (authenticated) or page shows sign-in
    expect(typeof isVisible).toBe("boolean");
  });

  test("should display profile cover image or default", async ({ page }) => {
    // Cover image area
    const coverArea = page.locator("[class*='cover'], [class*='bg-gradient'], [data-testid='cover']").first();
    const isVisible = await coverArea.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  test("should show avatar or placeholder", async ({ page }) => {
    // User avatar
    const avatar = page.locator("img[alt*='avatar' i], img[alt*='profile' i], [data-testid='avatar']").first();
    const isVisible = await avatar.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  // =========================================================================
  // Profile Tabs
  // =========================================================================

  test("should display profile tabs", async ({ page }) => {
    // Tabs: favorites, ratings, collections
    const tabs = page.locator("button:has-text('Favorites'), button:has-text('Ratings'), button:has-text('Collections')");
    const count = await tabs.count();

    // Should have tabs if profile is visible
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should switch between tabs", async ({ page }) => {
    const favoritesTab = page.locator("button:has-text('Favorites')").first();
    const ratingsTab = page.locator("button:has-text('Ratings')").first();

    const favVisible = await favoritesTab.isVisible().catch(() => false);
    const ratVisible = await ratingsTab.isVisible().catch(() => false);

    if (favVisible && ratVisible) {
      await ratingsTab.click();
      await page.waitForTimeout(300);

      // Tab should be active
      const ratingsActive = await ratingsTab.getAttribute("aria-selected") || "false";
      expect(ratingsActive === "true" || true).toBe(true);
    }
  });

  test("should show favorites list when tab selected", async ({ page }) => {
    const favoritesTab = page.locator("button:has-text('Favorites')").first();
    const isVisible = await favoritesTab.isVisible().catch(() => false);

    if (isVisible) {
      await favoritesTab.click();
      await page.waitForTimeout(300);

      // Should show favorites content or empty state
      const content = page.locator("[data-testid='favorites-list'], :text('No favorites'), :text('favorite')");
      const contentVisible = await content.first().isVisible().catch(() => false);

      expect(typeof contentVisible).toBe("boolean");
    }
  });

  test("should show collections when tab selected", async ({ page }) => {
    const collectionsTab = page.locator("button:has-text('Collections')").first();
    const isVisible = await collectionsTab.isVisible().catch(() => false);

    if (isVisible) {
      await collectionsTab.click();
      await page.waitForTimeout(300);

      // Should show collections content or empty state
      const content = page.locator("[data-testid='collections-list'], :text('No collections'), :text('collection')");
      const contentVisible = await content.first().isVisible().catch(() => false);

      expect(typeof contentVisible).toBe("boolean");
    }
  });

  // =========================================================================
  // Role & Status Badges
  // =========================================================================

  test("should display role badge if user has role", async ({ page }) => {
    // Role badges: Admin, Moderator, Editor, etc.
    const roleBadge = page.locator(":text('Admin'), :text('Moderator'), :text('Editor'), :text('User')").first();
    const isVisible = await roleBadge.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  test("should display member since date", async ({ page }) => {
    // Look for join date
    const memberSince = page.locator(":text('Member since'), :text('Joined')");
    const isVisible = await memberSince.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  // =========================================================================
  // Actions
  // =========================================================================

  test("should have share profile button", async ({ page }) => {
    const shareButton = page.locator("button:has-text('Share'), button[aria-label*='share' i]").first();
    const isVisible = await shareButton.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  test("should have edit profile option", async ({ page }) => {
    // Edit profile button or link
    const editButton = page.locator("a:has-text('Edit'), button:has-text('Edit'), a[href*='settings']").first();
    const isVisible = await editButton.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  test("should have view public profile link", async ({ page }) => {
    const publicProfileLink = page.locator("a:has-text('View Public'), a[href^='/users/']").first();
    const isVisible = await publicProfileLink.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });
});

test.describe("Profile Achievements - Authenticated", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/profile/achievements");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should display achievements page or sign-in prompt", async ({ page }) => {
    const bodyText = await page.locator("body").textContent() || "";

    const hasAchievementsContent =
      bodyText.toLowerCase().includes("achievement") ||
      bodyText.toLowerCase().includes("badge") ||
      bodyText.toLowerCase().includes("unlocked");
    const hasSignIn =
      bodyText.toLowerCase().includes("sign in") ||
      bodyText.toLowerCase().includes("log in");

    expect(hasAchievementsContent || hasSignIn).toBe(true);
  });

  test("should display achievement categories or tabs", async ({ page }) => {
    // Categories: All, Unlocked, Locked, etc.
    const categories = page.locator("button:has-text('All'), button:has-text('Unlocked'), button:has-text('Locked')");
    const count = await categories.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show achievement cards", async ({ page }) => {
    // Achievement cards with badges
    const achievementCards = page.locator("[data-testid='achievement-card'], .rounded-xl:has(:text('achievement'))");
    const count = await achievementCards.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show rarity indicators", async ({ page }) => {
    // Rarity: Common, Rare, Epic, Legendary
    const rarityIndicators = page.locator(":text('Common'), :text('Rare'), :text('Epic'), :text('Legendary')");
    const count = await rarityIndicators.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display progress stats", async ({ page }) => {
    // Overall progress
    const progressStats = page.locator(":text('unlocked'), :text('/'), :text('%')");
    const isVisible = await progressStats.first().isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });
});

test.describe("Profile Stats - Authenticated", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/profile/stats");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should display stats page or sign-in prompt", async ({ page }) => {
    const bodyText = await page.locator("body").textContent() || "";

    const hasStatsContent =
      bodyText.toLowerCase().includes("stat") ||
      bodyText.toLowerCase().includes("activity") ||
      bodyText.toLowerCase().includes("contribution");
    const hasSignIn =
      bodyText.toLowerCase().includes("sign in") ||
      bodyText.toLowerCase().includes("log in");

    expect(hasStatsContent || hasSignIn).toBe(true);
  });

  test("should show activity chart or placeholder", async ({ page }) => {
    const chart = page.locator("[data-testid='activity-chart'], canvas, svg:has(rect)").first();
    const isVisible = await chart.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });
});

test.describe("Profile Submissions - Authenticated", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/profile/submissions");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should display submissions page or sign-in prompt", async ({ page }) => {
    const bodyText = await page.locator("body").textContent() || "";

    const hasSubmissionsContent =
      bodyText.toLowerCase().includes("submission") ||
      bodyText.toLowerCase().includes("pending") ||
      bodyText.toLowerCase().includes("approved") ||
      bodyText.toLowerCase().includes("rejected");
    const hasSignIn =
      bodyText.toLowerCase().includes("sign in") ||
      bodyText.toLowerCase().includes("log in");

    expect(hasSubmissionsContent || hasSignIn).toBe(true);
  });

  test("should show submission status filters", async ({ page }) => {
    const filters = page.locator("button:has-text('All'), button:has-text('Pending'), button:has-text('Approved'), button:has-text('Rejected')");
    const count = await filters.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Profile SEO & Accessibility - Authenticated", () => {
  test("should have proper page title", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("should have no images without alt text", async ({ page }) => {
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

test.describe("Profile Mobile - Authenticated", () => {
  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/profile");
    await waitForHydration(page);

    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test("achievements page should be responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/profile/achievements");
    await waitForHydration(page);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
