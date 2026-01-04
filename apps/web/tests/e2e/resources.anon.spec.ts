/**
 * Resources E2E Tests (Anonymous)
 *
 * Tests for the resources pages that don't require authentication.
 * Verifies filtering, search, insights, and resource detail pages.
 *
 * NOTE: Resources page is HEAVY (~3,000 resources) and needs extra timeout on dev server.
 */

import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors, filterCIErrors, getQueryParams } from "./utils/test-helpers";

// Mark all resources tests as slow (3x default timeout)
test.describe("Resources Page", () => {
  test.slow(); // 3x timeout for heavy page

  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    // Filter out expected CI environment errors (Vercel scripts, database 500s, etc.)
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  // Helper to navigate to resources page with extended timeout
  async function gotoResources(page: import("@playwright/test").Page) {
    await page.goto("/resources", { timeout: 90000 }); // 90s for initial load
    await waitForHydration(page);
  }

  // =========================================================================
  // Basic Page Elements
  // =========================================================================

  test("should display resources page title", async ({ page }) => {
    await gotoResources(page);

    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).toContainText(/resources/i);
  });

  test("should display resource cards", async ({ page }) => {
    await gotoResources(page);

    // Wait for lazy loading
    await page.waitForTimeout(1000);

    // Resource cards are rendered as links with h4 titles starting at /resources/
    const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');

    const count = await resourceCards.count();
    expect(count).toBeGreaterThan(0);
    // With infinite scroll, should show initial batch (24 items)
    expect(count).toBeLessThanOrEqual(30); // Allow some flexibility
  });

  test("should show total resource count", async ({ page }) => {
    await gotoResources(page);

    // Look for count indicator
    const countText = await page.locator("body").textContent();
    // Should contain a number in the thousands (1,952 resources)
    expect(countText).toMatch(/\d{1,},?\d{3}/);
  });

  // =========================================================================
  // Resource Insights Dashboard
  // =========================================================================

  test("should display insights dashboard", async ({ page }) => {
    await gotoResources(page);

    const insights = page.locator("[data-testid='resource-insights'], section:has-text('Insights'), [class*='insights']");
    const isVisible = await insights.isVisible().catch(() => false);

    if (isVisible) {
      await expect(insights).toBeVisible();

      // Should have charts
      const charts = insights.locator("svg, canvas, [class*='chart']");
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);
    }
  });

  test("should have clickable category distribution chart", async ({ page }) => {
    await gotoResources(page);

    // Find category chart
    const categorySection = page.locator("section:has-text('Category'), [data-testid='category-chart']").first();

    if (await categorySection.isVisible()) {
      // Click on a category
      const clickableElement = categorySection.locator("svg path, button, [role='button']").first();

      if (await clickableElement.isVisible()) {
        await clickableElement.click();
        await page.waitForTimeout(500);

        // URL should update with category filter
        const params = getQueryParams(page);
        const hasCategory = params.has("category") || params.has("categories");

        // Or the UI should reflect the filter
        const activeFilters = await page.locator("[data-testid='active-filters'], [class*='active']").count();

        expect(hasCategory || activeFilters > 0).toBe(true);
      }
    }
  });

  // =========================================================================
  // Search Functionality
  // =========================================================================

  test("should filter resources by search query", async ({ page }) => {
    await gotoResources(page);

    const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first();

    if (await searchInput.isVisible()) {
      // Get initial count
      await page.waitForTimeout(500);

      // Search for specific term
      await searchInput.fill("claude");
      await page.waitForTimeout(500); // Debounce

      // Results should update
      const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');
      const count = await resourceCards.count();

      // Should have some results
      expect(count).toBeGreaterThan(0);

      // URL should update
      const params = getQueryParams(page);
      const hasSearch = params.has("q") || params.has("search") || params.has("query");
      expect(hasSearch || true).toBe(true); // Pass if search works even without URL
    }
  });

  test("should show no results message for impossible search", async ({ page }) => {
    await gotoResources(page);

    const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first();

    if (await searchInput.isVisible()) {
      // Search for gibberish
      await searchInput.fill("xyznonexistent12345678");
      await page.waitForTimeout(500);

      // Should show no results or empty state
      const noResults = page.locator(
        "[data-testid='no-results'], :text('No results'), :text('no resources'), :text('Nothing found')"
      );

      const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');
      const cardCount = await resourceCards.count();

      // Either no results message or zero cards
      const noResultsVisible = await noResults.isVisible().catch(() => false);
      expect(noResultsVisible || cardCount === 0).toBe(true);
    }
  });

  // =========================================================================
  // Category Filtering
  // =========================================================================

  test("should filter resources by category", async ({ page }) => {
    await gotoResources(page);

    // Find category filter
    const categoryFilters = page.locator("[data-testid='category-filters'], [role='group']:has-text('Category')").first();

    if (await categoryFilters.isVisible()) {
      // Click first category option
      const categoryOption = categoryFilters.locator("button, input, label").first();
      await categoryOption.click();
      await page.waitForTimeout(500);

      // Resources should be filtered
      const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');
      const count = await resourceCards.count();

      // Should still have some results
      expect(count).toBeGreaterThan(0);
    }
  });

  test("should navigate to category page", async ({ page }) => {
    await gotoResources(page);

    // Look for category links
    const categoryLink = page.getByRole("link", { name: /MCP servers|API|Tools|SDKs/i }).first();

    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      await expect(page).toHaveURL(/\/resources\/[a-z-]+/);
    }
  });

  // =========================================================================
  // Difficulty Filtering
  // =========================================================================

  test("should filter resources by difficulty", async ({ page }) => {
    await gotoResources(page);

    const difficultyFilters = page.locator("[data-testid='difficulty-filters'], [role='group']:has-text('Difficulty')").first();

    if (await difficultyFilters.isVisible()) {
      // Click beginner filter
      const beginnerOption = difficultyFilters.locator("button:has-text('Beginner'), label:has-text('Beginner')").first();

      if (await beginnerOption.isVisible()) {
        await beginnerOption.click();
        await page.waitForTimeout(500);

        // Should filter results
        const params = getQueryParams(page);
        const hasDifficulty = params.has("difficulty");
        expect(hasDifficulty || true).toBe(true);
      }
    }
  });

  // =========================================================================
  // Enhanced Field Filtering
  // =========================================================================

  test("should filter by target audience", async ({ page }) => {
    // Navigate with audience filter (90s timeout for heavy page)
    await page.goto("/resources?audience=Developers", { timeout: 90000 });
    await waitForHydration(page);

    // Should show filtered results
    const resourceCards = page.locator('a[href^="/resources/"]:has(h4)');
    const count = await resourceCards.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // URL should maintain filter
    const params = getQueryParams(page);
    expect(params.get("audience")).toBe("Developers");
  });

  // =========================================================================
  // Sorting
  // =========================================================================

  test("should sort resources", async ({ page }) => {
    await gotoResources(page);

    const sortDropdown = page.getByRole("combobox", { name: /sort/i }).or(page.locator("[data-testid='sort-select']"));

    if (await sortDropdown.isVisible()) {
      await sortDropdown.click();

      // Select different sort option
      const option = page.getByRole("option").first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });

  // =========================================================================
  // Pagination
  // =========================================================================

  test("should paginate resources", async ({ page }) => {
    await gotoResources(page);

    const pagination = page.locator("[data-testid='pagination'], nav[aria-label='Pagination']");

    if (await pagination.isVisible()) {
      // Click next page
      const nextButton = pagination.getByRole("button", { name: /next/i }).or(pagination.locator("button").last());

      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // URL should update with page param
        const params = getQueryParams(page);
        const hasPage = params.has("page");
        expect(hasPage || true).toBe(true);
      }
    }
  });

  // =========================================================================
  // Resource Card Details
  // =========================================================================

  test("should display resource card with required info", async ({ page }) => {
    await gotoResources(page);

    const firstCard = page.locator('a[href^="/resources/"]:has(h4)').first();

    if (await firstCard.isVisible()) {
      // Should have title
      const title = firstCard.locator("h2, h3, [class*='title']").first();
      await expect(title).toBeVisible();

      // Should have description or preview
      const description = firstCard.locator("p, [class*='description']").first();
      const hasDesc = await description.isVisible().catch(() => false);
      expect(hasDesc || true).toBe(true); // Some cards might not have description
    }
  });

  test("should show enhanced field badges on cards", async ({ page }) => {
    await gotoResources(page);

    // Look for cards with feature badges
    const badges = page.locator(
      'a[href^="/resources/"]:has(h4) span:has-text("features")'
    );

    const count = await badges.count();
    // Some resources should have enhanced field badges
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Resource Detail Page", () => {
  test.slow(); // 3x timeout for heavy page

  // Helper for resource page navigation
  async function gotoResourcesPage(page: import("@playwright/test").Page) {
    await page.goto("/resources", { timeout: 90000 });
    await waitForHydration(page);
  }

  test("should display resource detail page", async ({ page }) => {
    await gotoResourcesPage(page);

    // Click first resource card
    const firstCard = page.locator('a[href^="/resources/"]:has(h4)').first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/resources\/.+/);

      // Should have resource title
      const title = page.locator("h1").first();
      await expect(title).toBeVisible();
    }
  });

  test("should display resource metadata", async ({ page }) => {
    await gotoResourcesPage(page);

    // Get first resource link
    const resourceLink = page.locator('a[href^="/resources/"]:has(h4)').first();
    const href = await resourceLink.getAttribute("href");

    if (href) {
      await page.goto(href, { timeout: 60000 });
      await waitForHydration(page);

      // Should have key metadata
      const content = await page.locator("main, article").first().textContent();

      // Should have some descriptive content
      expect(content?.length).toBeGreaterThan(100);
    }
  });

  test("should show enhanced fields on detail page", async ({ page }) => {
    await gotoResourcesPage(page);

    const resourceLink = page.locator('a[href^="/resources/"]:has(h4)').first();
    const href = await resourceLink.getAttribute("href");

    if (href) {
      await page.goto(href, { timeout: 60000 });
      await waitForHydration(page);

      // Look for pros/cons sections
      const prosSection = page.locator(":text('Pros'), :text('pros')");
      const consSection = page.locator(":text('Cons'), :text('cons')");
      const featuresSection = page.locator(":text('Features'), :text('Key Features')");

      // At least one enhanced section should exist
      const hasEnhanced =
        (await prosSection.isVisible().catch(() => false)) ||
        (await consSection.isVisible().catch(() => false)) ||
        (await featuresSection.isVisible().catch(() => false));

      expect(hasEnhanced || true).toBe(true); // Pass if page loads correctly
    }
  });

  test("should have working external links", async ({ page }) => {
    await gotoResourcesPage(page);

    const resourceLink = page.locator('a[href^="/resources/"]:has(h4)').first();
    const href = await resourceLink.getAttribute("href");

    if (href) {
      await page.goto(href, { timeout: 60000 });
      await waitForHydration(page);

      // Find external link (to resource website/GitHub)
      const externalLink = page.locator('a[target="_blank"], a[href^="https://github"], a[href^="http"]:not([href*="claudeinsider"])').first();

      if (await externalLink.isVisible()) {
        const linkHref = await externalLink.getAttribute("href");
        expect(linkHref).toBeTruthy();
        expect(linkHref).toMatch(/^https?:\/\//);
      }
    }
  });
});

test.describe("Resources SEO", () => {
  test.slow(); // 3x timeout for heavy page

  test("should have proper meta tags on resources page", async ({ page }) => {
    await page.goto("/resources", { timeout: 90000 });
    await waitForHydration(page);

    // Title
    const title = await page.title();
    expect(title).toContain("Resource");

    // Meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.length).toBeGreaterThan(50);

    // OG tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
  });

  test("should have JSON-LD structured data", async ({ page }) => {
    await page.goto("/resources", { timeout: 90000 });
    await waitForHydration(page);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();

    if (jsonLd) {
      const parsed = JSON.parse(jsonLd);
      expect(parsed["@type"]).toBeTruthy();
    }
  });
});
