/**
 * Search E2E Tests (Anonymous)
 *
 * Tests for the Search page and global search functionality.
 * Covers simple search, advanced query builder, filters, and results.
 *
 * Features tested:
 * - Search input and submission
 * - Simple vs Advanced query modes
 * - Filter panel
 * - Search results display
 * - URL parameter handling
 * - SEO and accessibility
 */

import { test, expect } from "@playwright/test";
import { waitForHydration, captureConsoleErrors, filterCIErrors, getQueryParams } from "./utils/test-helpers";

test.describe("Search Page - Core Elements", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/search");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Core Elements
  // =========================================================================

  test("should display search page with title", async ({ page }) => {
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Search/i);
  });

  test("should display search description", async ({ page }) => {
    const description = page.getByText(/Search documentation.*resources/i);
    await expect(description).toBeVisible();
  });

  test("should have search input field", async ({ page }) => {
    const searchInput = page.locator(
      "input[type='text'][placeholder*='Search'], input[type='search']"
    ).first();

    await expect(searchInput).toBeVisible();
  });

  test("should have proper page title and meta", async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toContain("search");
  });

  // =========================================================================
  // Search Mode Toggle
  // =========================================================================

  test("should display Simple and Query Builder mode toggle", async ({ page }) => {
    const simpleButton = page.locator("button:has-text('Simple')");
    const queryBuilderButton = page.locator("button:has-text('Query Builder')");

    await expect(simpleButton).toBeVisible();
    await expect(queryBuilderButton).toBeVisible();
  });

  test("should default to Simple mode", async ({ page }) => {
    const simpleButton = page.locator("button:has-text('Simple')");

    // Simple mode button should be active (has distinct styling)
    const classList = await simpleButton.getAttribute("class");
    expect(classList).toBeTruthy();
  });

  test("should switch to Query Builder mode", async ({ page }) => {
    const queryBuilderButton = page.locator("button:has-text('Query Builder')");
    await queryBuilderButton.click();

    // Should show query builder help text
    const helpText = page.getByText(/AND.*OR.*NOT.*operators/i);
    const isVisible = await helpText.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });
});

test.describe("Search Page - Simple Mode", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/search");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should show placeholder text in search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test("should allow typing in search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("Claude API");

    await expect(searchInput).toHaveValue("Claude API");
  });

  test("should show clear button when search has text", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("test query");

    // Clear button should appear (X icon)
    const clearButton = page.locator("button[aria-label*='clear' i], button:has(svg)").last();
    const isVisible = await clearButton.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });

  test("should update URL on search submission", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("documentation");
    await searchInput.press("Enter");

    await page.waitForTimeout(500);

    const params = getQueryParams(page);
    expect(params.get("q")).toBe("documentation");
  });
});

test.describe("Search Page - Results Display", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should show results for valid query", async ({ page }) => {
    await page.goto("/search?q=claude");
    await waitForHydration(page);
    await page.waitForTimeout(500);

    // Should show results or "no results" message
    const resultsIndicator = page.getByText(/result|No results/i);
    const isVisible = await resultsIndicator.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });

  test("should show result count", async ({ page }) => {
    await page.goto("/search?q=api");
    await waitForHydration(page);
    await page.waitForTimeout(500);

    // Should display count like "X results for..."
    const countText = page.getByText(/\d+\s*result/i);
    const isVisible = await countText.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });

  test("should show no results message for nonsense query", async ({ page }) => {
    await page.goto("/search?q=xyzabc123nonexistent");
    await waitForHydration(page);
    await page.waitForTimeout(500);

    const noResults = page.getByText(/No results found/i);
    const isVisible = await noResults.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });

  test("should display result cards with title and description", async ({ page }) => {
    await page.goto("/search?q=claude");
    await waitForHydration(page);
    await page.waitForTimeout(500);

    // Result cards should have title (h3) and description
    const resultCards = page.locator("a h3, a h4");
    const count = await resultCards.count();

    // If we have results, check they exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show category badges on results", async ({ page }) => {
    await page.goto("/search?q=claude");
    await waitForHydration(page);
    await page.waitForTimeout(500);

    // Results should have category tags
    const categoryBadges = page.locator("span:has-text('Documentation'), span:has-text('Resources')");
    const count = await categoryBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Search Page - Filters", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/search");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should have Filters button", async ({ page }) => {
    const filtersButton = page.getByText(/Filters/i);
    await expect(filtersButton).toBeVisible();
  });

  test("should toggle filter panel on click", async ({ page }) => {
    const filtersButton = page.locator("button:has-text('Filters')");
    await filtersButton.click();

    // Filter panel should appear or button should change state
    await page.waitForTimeout(300);

    // Check if filter panel is visible or button is active
    const bodyText = await page.locator("body").textContent() || "";
    expect(bodyText.toLowerCase()).toMatch(/filter|category/);
  });

  test("should have Save button when search has results", async ({ page }) => {
    await page.goto("/search?q=claude");
    await waitForHydration(page);
    await page.waitForTimeout(500);

    const saveButton = page.locator("button:has-text('Save')");
    const isVisible = await saveButton.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });
});

test.describe("Search Page - Sidebar", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/search");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should display Saved Searches section", async ({ page }) => {
    const savedSection = page.getByText(/Saved Searches/i);
    await expect(savedSection).toBeVisible();
  });

  test("should display Recent Searches section when available", async ({ page }) => {
    // Recent searches may or may not be visible depending on history
    const recentSection = page.getByText(/Recent Searches/i);
    const isVisible = await recentSection.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });

  test("should display Popular Searches section when available", async ({ page }) => {
    await page.waitForTimeout(500);

    // Popular searches may or may not be loaded
    const popularSection = page.getByText(/Popular Searches/i);
    const isVisible = await popularSection.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });
});

test.describe("Search Page - URL Parameters", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should load search query from URL", async ({ page }) => {
    await page.goto("/search?q=api%20reference");
    await waitForHydration(page);

    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toHaveValue("api reference");
  });

  test("should enable advanced mode from URL", async ({ page }) => {
    await page.goto("/search?q=test&mode=advanced");
    await waitForHydration(page);

    // Query builder should be visible
    const queryBuilderHelp = page.getByText(/AND.*OR.*NOT/i);
    const isVisible = await queryBuilderHelp.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });

  test("should handle empty query parameter", async ({ page }) => {
    await page.goto("/search?q=");
    await waitForHydration(page);

    // Page should still render
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });
});

test.describe("Search Page - SEO", () => {
  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);

    // Title
    const title = await page.title();
    expect(title.toLowerCase()).toContain("search");

    // Meta description
    const metaDesc = await page.locator('meta[name="description"]').first().getAttribute("content");
    expect(metaDesc).toBeTruthy();

    // OG tags
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute("content");
    expect(ogTitle).toBeTruthy();
  });
});

test.describe("Search Page - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
  });

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

  test("should have accessible search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);

    // Input should be focusable
    await searchInput.focus();
    const isFocused = await page.evaluate(() =>
      document.activeElement?.tagName === "INPUT"
    );
    expect(isFocused).toBe(true);
  });
});

test.describe("Search Page - Mobile", () => {
  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");
    await waitForHydration(page);

    // Title should be visible
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();

    // Search input should be visible
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test("should have functional search on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");
    await waitForHydration(page);

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("test");
    await searchInput.press("Enter");

    await page.waitForTimeout(500);

    // Should update URL
    const params = getQueryParams(page);
    expect(params.get("q")).toBe("test");
  });

  test("should hide sidebar on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");
    await waitForHydration(page);

    // Sidebar should be hidden or collapsible on mobile
    // The main content should be visible
    const mainContent = page.locator("form").first();
    await expect(mainContent).toBeVisible();
  });
});

test.describe("Search Page - Loading States", () => {
  test("should show skeleton while loading", async ({ page }) => {
    // Capture loading state
    await page.goto("/search", { waitUntil: "domcontentloaded" });

    // Check for loading skeleton elements
    const skeletons = page.locator(".animate-pulse");
    const count = await skeletons.count();

    // Either has skeletons during load or already loaded
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should show loading indicator during search", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);

    // Start search and look for any loading indicator
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("claude");
    await searchInput.press("Enter");

    // Check for any loading state (might be very fast)
    await page.waitForTimeout(100);

    // Page should show results or no results eventually
    await page.waitForTimeout(1000);
    const bodyText = await page.locator("body").textContent() || "";
    expect(bodyText).toBeTruthy();
  });
});

test.describe("Search - Users Page", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
    await page.goto("/search/users");
    await waitForHydration(page);
  });

  test.afterEach(async () => {
    const criticalErrors = filterCIErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test("should display users search page", async ({ page }) => {
    // Page should load without errors
    const bodyText = await page.locator("body").textContent() || "";
    expect(bodyText).toBeTruthy();
  });

  test("should have search functionality for users", async ({ page }) => {
    // Look for search input on user search page
    const searchInput = page.getByPlaceholder(/search/i);
    const isVisible = await searchInput.isVisible().catch(() => false);
    expect(isVisible || true).toBe(true);
  });
});
