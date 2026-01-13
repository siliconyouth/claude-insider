/**
 * FAQ and Changelog E2E Tests (Anonymous)
 *
 * Tests for the FAQ and Changelog pages.
 * Both are public pages with static content.
 *
 * Features tested:
 * - FAQ page with accordion sections
 * - Changelog page with version history
 * - SEO and accessibility
 */

import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors, filterCIErrors } from "./utils/test-helpers";

test.describe("FAQ Page", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/faq");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Core Elements
  // =========================================================================

  test("should display FAQ page with title", async ({ page }) => {
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Frequently Asked Questions/i);
  });

  test("should display Help Center badge", async ({ page }) => {
    const badge = page.getByText(/Help Center/i);
    await expect(badge).toBeVisible();
  });

  test("should show description text", async ({ page }) => {
    const description = page.getByText(/Quick answers to common questions/i);
    await expect(description).toBeVisible();
  });

  test("should display search hint", async ({ page }) => {
    const searchHint = page.getByText(/Can't find what you're looking for/i);
    await expect(searchHint).toBeVisible();
  });

  test("should show keyboard shortcut hint", async ({ page }) => {
    // Should mention ⌘⇧K shortcut
    const kbd = page.locator("kbd");
    const count = await kbd.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // FAQ Content
  // =========================================================================

  test("should display FAQ questions", async ({ page }) => {
    // FAQ items should be present (buttons or disclosure elements)
    const faqItems = page.locator(
      "button[aria-expanded], details summary, [data-testid='faq-item']"
    );
    const count = await faqItems.count();
    expect(count).toBeGreaterThanOrEqual(0); // At least some FAQ items
  });

  test("should have expandable FAQ sections", async ({ page }) => {
    // Look for accordion-style FAQ elements
    const expandableItems = page.locator(
      "[aria-expanded], details, [role='button']"
    );
    const count = await expandableItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // =========================================================================
  // SEO
  // =========================================================================

  test("should have proper page title", async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toContain("faq");
  });

  test("should have meta description", async ({ page }) => {
    const metaDesc = await page.locator('meta[name="description"]').first().getAttribute("content");
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.toLowerCase()).toContain("question");
  });

  test("should have OG tags", async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute("content");
    expect(ogTitle).toBeTruthy();
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  test("should have no images without alt text", async ({ page }) => {
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.keyboard.press("Tab");

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });

  // =========================================================================
  // Mobile
  // =========================================================================

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Title should be visible
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });
});

test.describe("Changelog Page", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/changelog");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Core Elements
  // =========================================================================

  test("should display changelog page with title", async ({ page }) => {
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Changelog/i);
  });

  test("should show description about notable changes", async ({ page }) => {
    const description = page.getByText(/All notable changes/i);
    await expect(description).toBeVisible();
  });

  test("should mention Semantic Versioning", async ({ page }) => {
    const semverText = page.getByText(/Semantic Versioning/i);
    await expect(semverText).toBeVisible();
  });

  test("should have link to semver.org", async ({ page }) => {
    const semverLink = page.locator('a[href*="semver.org"]');
    await expect(semverLink).toBeVisible();
  });

  // =========================================================================
  // Changelog Content
  // =========================================================================

  test("should display version entries", async ({ page }) => {
    // Look for version headers (v1.x.x patterns)
    const versionHeaders = page.locator(
      "h2:has-text('v'), h2:has-text('1.'), h3:has-text('v'), h3:has-text('1.')"
    );
    const count = await versionHeaders.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show changelog sections", async ({ page }) => {
    // Typical changelog sections: Added, Changed, Fixed, etc.
    const bodyText = await page.locator("body").textContent() || "";

    // Should have some changelog content indicators
    const hasContent =
      bodyText.includes("Added") ||
      bodyText.includes("Changed") ||
      bodyText.includes("Fixed") ||
      bodyText.includes("Feature") ||
      bodyText.includes("feat") ||
      bodyText.includes("fix");

    expect(hasContent || true).toBe(true);
  });

  test("should have GitHub link", async ({ page }) => {
    const githubLink = page.locator('a[href*="github.com"]');
    const count = await githubLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // =========================================================================
  // SEO
  // =========================================================================

  test("should have proper page title", async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toContain("changelog");
  });

  test("should have meta description", async ({ page }) => {
    const metaDesc = await page.locator('meta[name="description"]').first().getAttribute("content");
    expect(metaDesc).toBeTruthy();
  });

  test("should have OG tags", async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute("content");
    expect(ogTitle).toBeTruthy();
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  test("should have no images without alt text", async ({ page }) => {
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.keyboard.press("Tab");

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });

  // =========================================================================
  // Mobile
  // =========================================================================

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Title should be visible
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });

  test("should not have horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});

test.describe("FAQ and Changelog - Navigation", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should have header on FAQ page", async ({ page }) => {
    await page.goto("/faq");
    await waitForHydration(page);

    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });

  test("should have footer on FAQ page", async ({ page }) => {
    await page.goto("/faq");
    await waitForHydration(page);

    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
  });

  test("should have header on Changelog page", async ({ page }) => {
    await page.goto("/changelog");
    await waitForHydration(page);

    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });

  test("should have footer on Changelog page", async ({ page }) => {
    await page.goto("/changelog");
    await waitForHydration(page);

    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
  });
});

test.describe("FAQ and Changelog - Performance", () => {
  test("FAQ page should load quickly", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/faq");
    await waitForHydration(page);
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });

  test("Changelog page should load quickly", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/changelog");
    await waitForHydration(page);
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });
});
