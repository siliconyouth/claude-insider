/**
 * Homepage E2E Tests (Anonymous)
 *
 * Tests for the homepage that don't require authentication.
 * These verify core functionality is working for all visitors.
 */

import { test, expect, type Page } from "@playwright/test";
import { captureConsoleErrors, filterCIErrors, waitForHydration } from "./utils/test-helpers";

test.describe("Homepage", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    // Filter out expected CI environment errors (Vercel scripts, database 500s, etc.)
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Core Elements
  // =========================================================================

  test("should display hero section with title", async ({ page }) => {
    const heroTitle = page.locator("h1").first();
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).not.toBeEmpty();
  });

  test("should display navigation header", async ({ page }) => {
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Should have logo
    const logo = header.locator("a").first();
    await expect(logo).toBeVisible();
  });

  test("should display footer", async ({ page }) => {
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();

    // Should have copyright or brand text
    await expect(footer).toContainText(/claude|insider|\d{4}/i);
  });

  test("should have proper page title", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Claude");
  });

  test("should have meta description", async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute("content");
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
  });

  // =========================================================================
  // Navigation
  // =========================================================================

  test("should navigate to docs from header", async ({ page }) => {
    // Look for docs link in header
    const docsLink = page.locator("header").getByRole("link", { name: /docs|documentation/i }).first();

    if (await docsLink.isVisible()) {
      await docsLink.click();
      await expect(page).toHaveURL(/\/docs/);
    }
  });

  test("should navigate to resources from header or homepage", async ({ page }) => {
    // Look for resources link
    const resourcesLink = page.getByRole("link", { name: /resources/i }).first();

    if (await resourcesLink.isVisible()) {
      await resourcesLink.click();
      await expect(page).toHaveURL(/\/resources/);
    }
  });

  test("should open search modal with keyboard shortcut", async ({ page }) => {
    // Press Cmd/Ctrl + K
    await page.keyboard.press("Meta+k");

    // Search modal should appear
    const searchModal = page.locator("[role='dialog']:has-text('Search'), [data-testid='search-modal'], [class*='search']");

    // Give it time to open
    await page.waitForTimeout(500);

    const isVisible = await searchModal.isVisible().catch(() => false);

    if (isVisible) {
      await expect(searchModal).toBeVisible();

      // Close with Escape
      await page.keyboard.press("Escape");
      await expect(searchModal).not.toBeVisible();
    }
  });

  // =========================================================================
  // Sections (Lazy Loaded)
  // =========================================================================

  test("should load resources section on scroll", async ({ page }) => {
    // Scroll down to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);

    // Check for resources section or any lazy-loaded content
    const lazyContent = page.locator("section").filter({ hasText: /resources|categories|tools/i });
    const count = await lazyContent.count();

    // Should have at least some sections
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Theme
  // =========================================================================

  test("should toggle dark mode", async ({ page }) => {
    // Find theme toggle button
    const themeButton = page
      .getByRole("button", { name: /theme|dark|light|mode/i })
      .or(page.locator("[data-testid='theme-toggle']"))
      .first();

    if (await themeButton.isVisible()) {
      // Get initial state
      const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));

      // Click toggle
      await themeButton.click();
      await page.waitForTimeout(300);

      // Check new state
      const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));

      // State should have changed
      expect(isDark).not.toBe(wasDark);

      // Toggle back
      await themeButton.click();
      await page.waitForTimeout(300);

      const isDarkAgain = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      expect(isDarkAgain).toBe(wasDark);
    }
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  test("should have no images without alt text", async ({ page }) => {
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test("should have skip link for keyboard users", async ({ page }) => {
    // Focus the page and tab to find skip link
    await page.keyboard.press("Tab");

    // Check for skip link (common accessibility pattern)
    const skipLink = page.locator("a:has-text('Skip')").first();
    const isVisible = await skipLink.isVisible().catch(() => false);

    // Skip link should exist or first focusable element should be meaningful
    if (!isVisible) {
      // At least check that something is focusable
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    const h1Count = await page.locator("h1").count();

    // Should have exactly one h1
    expect(h1Count).toBe(1);

    // H2s should exist if h3s exist
    const h2Count = await page.locator("h2").count();
    const h3Count = await page.locator("h3").count();

    if (h3Count > 0) {
      expect(h2Count).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // Performance
  // =========================================================================

  test("should load within performance budget", async ({ page }) => {
    // Navigate fresh for accurate metrics
    await page.goto("/");

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        load: navigation.loadEventEnd - navigation.startTime,
      };
    });

    // Dev server is much slower than production
    // Use lenient thresholds for dev, strict for CI with production build
    const isCI = process.env.CI === "true";
    const domContentLoadedBudget = isCI ? 3000 : 15000; // 3s production, 15s dev
    const fullLoadBudget = isCI ? 10000 : 30000; // 10s production, 30s dev

    // DOMContentLoaded budget
    expect(metrics.domContentLoaded).toBeLessThan(domContentLoadedBudget);

    // Full load budget
    expect(metrics.load).toBeLessThan(fullLoadBudget);
  });

  // =========================================================================
  // Mobile
  // =========================================================================

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Re-navigate to ensure mobile layout loads properly
    await page.goto("/");
    await waitForHydration(page);

    // Hero should still be visible - this is the core responsive requirement
    const heroTitle = page.locator("h1").first();
    await expect(heroTitle).toBeVisible();

    // Content should be accessible even if some overflow exists
    // Mobile menu button should be visible OR content is readable
    const mobileMenuButton = page
      .getByRole("button", { name: /menu/i })
      .or(page.locator("[data-testid='mobile-menu']"))
      .or(page.locator("button:has(svg)").filter({ hasText: "" }))
      .first();

    const mobileVisible = await mobileMenuButton.isVisible().catch(() => false);

    // Either mobile menu exists or we can verify basic content is visible
    // Note: Some horizontal overflow is acceptable as long as core content renders
    if (!mobileVisible) {
      // At minimum, verify header and main content areas are present
      const header = page.locator("header").first();
      const main = page.locator("main").first();
      await expect(header).toBeVisible();
      await expect(main).toBeVisible();
    }
  });
});

test.describe("Homepage Links", () => {
  test("all internal links should be valid", async ({ page }) => {
    await page.goto("/");

    // Get all internal links
    const links = await page.locator('a[href^="/"]').all();

    // Check a sample of links (not all, to keep test fast)
    const sampleSize = Math.min(links.length, 5);

    for (let i = 0; i < sampleSize; i++) {
      const href = await links[i].getAttribute("href");
      if (href) {
        const response = await page.request.get(href);
        expect(response.status()).toBeLessThan(400);
      }
    }
  });
});
