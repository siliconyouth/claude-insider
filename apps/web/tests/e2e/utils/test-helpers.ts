/**
 * Test Helper Utilities
 *
 * Common utilities used across E2E tests.
 */

import { type Page, type BrowserContext } from "@playwright/test";

// =============================================================================
// URL Helpers
// =============================================================================

/**
 * Wait for URL to match pattern
 */
export async function waitForUrl(page: Page, pattern: string | RegExp, timeout = 10000) {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Get current URL path (without query params)
 */
export function getCurrentPath(page: Page): string {
  return new URL(page.url()).pathname;
}

/**
 * Get query parameters from current URL
 */
export function getQueryParams(page: Page): URLSearchParams {
  return new URL(page.url()).searchParams;
}

// =============================================================================
// Network Helpers
// =============================================================================

/**
 * Wait for specific API call to complete
 */
export async function waitForApi(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse((response) => {
    if (typeof urlPattern === "string") {
      return response.url().includes(urlPattern);
    }
    return urlPattern.test(response.url());
  });
}

/**
 * Mock API endpoint with custom response
 */
export async function mockApi(page: Page, urlPattern: string | RegExp, response: {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: response.status || 200,
      contentType: "application/json",
      body: JSON.stringify(response.body || {}),
      headers: response.headers,
    });
  });
}

/**
 * Block specific requests (useful for testing offline behavior)
 */
export async function blockRequests(page: Page, urlPattern: string | RegExp) {
  await page.route(urlPattern, (route) => route.abort());
}

// =============================================================================
// Form Helpers
// =============================================================================

/**
 * Fill form fields by label
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    const input = page.getByLabel(new RegExp(label, "i"));
    await input.fill(value);
  }
}

/**
 * Submit form and wait for navigation or response
 */
export async function submitForm(page: Page, buttonText = "Submit") {
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: new RegExp(buttonText, "i") }).click(),
  ]);
}

// =============================================================================
// Storage Helpers
// =============================================================================

/**
 * Get localStorage value
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set localStorage value
 */
export async function setLocalStorage(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}

/**
 * Clear localStorage
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Get sessionStorage value
 */
export async function getSessionStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => sessionStorage.getItem(k), key);
}

// =============================================================================
// Cookie Helpers
// =============================================================================

/**
 * Get cookie by name
 */
export async function getCookie(context: BrowserContext, name: string) {
  const cookies = await context.cookies();
  return cookies.find((c) => c.name === name);
}

/**
 * Set cookie
 */
export async function setCookie(context: BrowserContext, name: string, value: string, domain = "localhost") {
  await context.addCookies([{ name, value, domain, path: "/" }]);
}

// =============================================================================
// Wait Helpers
// =============================================================================

/**
 * Wait for element to be stable (no animations)
 */
export async function waitForStable(page: Page, selector: string, timeout = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: "visible", timeout });

  // Wait for element to stop moving
  let lastBox = await element.boundingBox();
  let stable = false;

  const startTime = Date.now();
  while (!stable && Date.now() - startTime < timeout) {
    await page.waitForTimeout(100);
    const newBox = await element.boundingBox();

    if (
      lastBox &&
      newBox &&
      lastBox.x === newBox.x &&
      lastBox.y === newBox.y &&
      lastBox.width === newBox.width &&
      lastBox.height === newBox.height
    ) {
      stable = true;
    }
    lastBox = newBox;
  }
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimations(page: Page) {
  await page.waitForFunction(() => {
    const animations = document.getAnimations();
    return animations.every((a) => a.playState === "finished" || a.playState === "idle");
  });
}

/**
 * Wait for React hydration to complete
 * Uses a longer timeout for dev server which needs time to compile pages
 * Also dismisses any modal popups that might block interactions
 *
 * Chunk Load Resilience (v1.18.5):
 * - Gracefully handles ChunkLoadError from failed dynamic imports
 * - Continues test if page content is present despite chunk failures
 * - Logs warning instead of failing test for non-critical chunk errors
 */
export async function waitForHydration(page: Page, timeout = 45000) {
  // First, wait for the page to finish loading
  await page.waitForLoadState("domcontentloaded", { timeout });

  // Then wait for network to be relatively idle (no requests for 500ms)
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // Network idle timeout is acceptable - some pages have long-polling
  }

  // Check for chunk load errors before hydration check
  const hasChunkError = await page.evaluate(() => {
    // Check if any ChunkLoadError occurred (stored by error boundary)
    const errors = (window as unknown as { __CHUNK_ERRORS__?: string[] }).__CHUNK_ERRORS__ || [];
    return errors.some(e => e.includes("ChunkLoadError") || e.includes("Failed to load chunk"));
  }).catch(() => false);

  // Finally, check for Next.js App Router hydration
  // App Router doesn't use __NEXT_DATA__, so we check for rendered content instead
  try {
    await page.waitForFunction(
      () => {
        // Check document is fully loaded
        if (document.readyState !== "complete") return false;

        // Check for meaningful content (header + main content)
        const header = document.querySelector("header");
        const main = document.querySelector("main");
        const hasContent = document.body.textContent && document.body.textContent.length > 100;

        // Page is hydrated if we have header, main, and content
        return !!(header && main && hasContent);
      },
      { timeout }
    );
  } catch (error) {
    // If we have chunk errors but the page has content, continue gracefully
    if (hasChunkError) {
      const hasBasicContent = await page.evaluate(() => {
        const header = document.querySelector("header");
        const main = document.querySelector("main");
        return !!(header || main);
      }).catch(() => false);

      if (hasBasicContent) {
        console.warn("[waitForHydration] Chunk load error detected, but page has content - continuing");
        return;
      }
    }
    throw error;
  }

  // Dismiss any popups that might block interactions
  // Version update popup
  const gotItButton = page.locator('button:has-text("Got it!")');
  if (await gotItButton.isVisible({ timeout: 500 }).catch(() => false)) {
    await gotItButton.click();
    await page.waitForTimeout(300); // Wait for animation
  }
}

/**
 * Dismiss any modal popups that might block interactions
 * (e.g., version update popups, cookie consent, etc.)
 */
export async function dismissPopups(page: Page): Promise<void> {
  // Version update popup
  const gotItButton = page.locator('button:has-text("Got it!")');
  if (await gotItButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await gotItButton.click();
    await page.waitForTimeout(300); // Wait for animation
  }

  // Cookie consent (if any)
  const cookieButton = page.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("Close")').first();
  if (await cookieButton.isVisible({ timeout: 500 }).catch(() => false)) {
    await cookieButton.click();
    await page.waitForTimeout(200);
  }
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert no JavaScript errors in console
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Filter out expected CI environment errors from console errors
 * These are errors that occur in CI but not in production:
 * - Vercel Analytics scripts (not available outside Vercel)
 * - Database-dependent routes returning 500 with placeholder credentials
 * - Static assets that may not exist in test builds
 *
 * Network Resilience (v1.18.5):
 * - ChunkLoadError from dynamic import failures
 * - Session refresh failures (handled by retry logic)
 * - ErrorBoundary caught errors (gracefully degraded)
 */
export function filterCIErrors(errors: string[]): string[] {
  const ignoredPatterns = [
    // Vercel-specific scripts not available in CI
    /_vercel\/insights/,
    /_vercel\/speed-insights/,
    // Common 404s and expected errors
    /favicon/i,
    /404/,
    /hydration/i,
    // 500 errors from database-dependent routes (expected in CI without real DB)
    /500.*Internal Server Error/,
    /Failed to load resource.*500/,
    // MIME type errors for scripts that 404/500
    /MIME type.*not executable/,
    // Network errors in CI
    /net::ERR_/,
    // Supabase placeholder errors
    /placeholder\.supabase\.co/,
    /Invalid API key/,
    // TLS handshake errors (WebKit/Firefox in CI)
    /TLS handshake/i,
    /Error performing TLS/i,
    // Failed to load resource generic (covers most CI network issues)
    /Failed to load resource/i,
    // Service worker errors (Firefox/WebKit in CI without HTTPS)
    /Service worker/i,
    /BrowserNotifications/i,

    // ==========================================================================
    // Dynamic Import & Lazy Provider Errors (v1.18.5)
    // These are handled by ErrorBoundary with graceful degradation
    // ==========================================================================
    /ChunkLoadError/i,
    /Failed to load chunk/i,
    /Failed to fetch dynamically imported module/i,
    // Session refresh failures (handled by retry logic in auth-provider)
    /Session refresh failed/i,
    /Session fetch failed/i,
    /Session fetch retry/i,
    // ErrorBoundary caught errors (logged as warnings)
    /\[Lazy.*Provider\].*Chunk load failed/i,
    /continuing without/i,
  ];

  return errors.filter((err) =>
    !ignoredPatterns.some((pattern) => pattern.test(err))
  );
}

/**
 * Assert no uncaught exceptions
 */
export function capturePageErrors(page: Page): Error[] {
  const errors: Error[] = [];

  page.on("pageerror", (error) => {
    errors.push(error);
  });

  return errors;
}

// =============================================================================
// Mobile Helpers
// =============================================================================

/**
 * Check if running on mobile viewport
 */
export async function isMobileViewport(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return !!viewport && viewport.width < 768;
}

/**
 * Open mobile menu (hamburger)
 */
export async function openMobileMenu(page: Page) {
  const menuButton = page.getByRole("button", { name: /menu/i }).or(page.locator("[data-testid='mobile-menu-button']"));
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
}

// =============================================================================
// Theme Helpers
// =============================================================================

/**
 * Toggle dark mode
 */
export async function toggleDarkMode(page: Page) {
  const themeButton = page.getByRole("button", { name: /theme|dark|light/i });
  await themeButton.click();
}

/**
 * Check if dark mode is active
 */
export async function isDarkMode(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.classList.contains("dark");
  });
}

// =============================================================================
// Performance Helpers
// =============================================================================

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    const fcp = paint.find((p) => p.name === "first-contentful-paint");
    const lcp = paint.find((p) => p.name === "largest-contentful-paint");

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      load: navigation.loadEventEnd - navigation.startTime,
      fcp: fcp?.startTime,
      lcp: lcp?.startTime,
      ttfb: navigation.responseStart - navigation.requestStart,
    };
  });
}

/**
 * Assert page loads within threshold
 */
export async function assertPageLoadTime(page: Page, maxMs: number) {
  const metrics = await getPerformanceMetrics(page);
  if (metrics.load > maxMs) {
    throw new Error(`Page load time ${metrics.load}ms exceeds threshold ${maxMs}ms`);
  }
}
