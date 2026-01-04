/**
 * Custom Playwright Test Fixtures
 *
 * Extends Playwright's test with:
 * - Page Object Models (POM) for common pages
 * - Helper functions for common operations
 * - Custom assertions
 *
 * @see https://playwright.dev/docs/test-fixtures
 */

import { test as base, expect, type Page, type Locator } from "@playwright/test";

// =============================================================================
// Page Object Models
// =============================================================================

/**
 * Homepage Page Object Model
 */
export class HomePage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly ctaButton: Locator;
  readonly searchButton: Locator;
  readonly resourcesSection: Locator;
  readonly categoriesSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator("h1").first();
    this.heroSubtitle = page.locator("[class*='hero'] p, section p").first();
    this.ctaButton = page.getByRole("link", { name: /explore|get started/i });
    this.searchButton = page.getByRole("button", { name: /search/i });
    this.resourcesSection = page.locator("[data-testid='resources-section'], section:has-text('Resources')");
    this.categoriesSection = page.locator("[data-testid='categories-section'], section:has-text('Categories')");
  }

  async goto() {
    await this.page.goto("/");
  }

  async openSearch() {
    await this.searchButton.click();
  }
}

/**
 * Documentation Page Object Model
 */
export class DocsPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly content: Locator;
  readonly breadcrumbs: Locator;
  readonly tocNav: Locator;
  readonly codeBlocks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator("nav[aria-label='Sidebar'], aside nav, [data-testid='docs-sidebar']");
    this.content = page.locator("article, main [class*='prose']");
    this.breadcrumbs = page.locator("nav[aria-label='Breadcrumb'], [data-testid='breadcrumbs']");
    this.tocNav = page.locator("[data-testid='toc'], nav:has-text('On this page')");
    this.codeBlocks = page.locator("pre code");
  }

  async goto(slug: string = "getting-started") {
    await this.page.goto(`/docs/${slug}`);
  }

  async navigateTo(linkText: string) {
    await this.sidebar.getByRole("link", { name: linkText }).click();
  }

  async getCodeBlockContent(index: number = 0): Promise<string> {
    const blocks = await this.codeBlocks.all();
    if (blocks[index]) {
      return blocks[index].textContent() || "";
    }
    return "";
  }
}

/**
 * Resources Page Object Model
 */
export class ResourcesPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categoryFilters: Locator;
  readonly difficultyFilters: Locator;
  readonly resourceCards: Locator;
  readonly insightsPanel: Locator;
  readonly sortDropdown: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i));
    this.categoryFilters = page.locator("[data-testid='category-filters'], [role='group']:has-text('Category')");
    this.difficultyFilters = page.locator("[data-testid='difficulty-filters'], [role='group']:has-text('Difficulty')");
    this.resourceCards = page.locator("[data-testid='resource-card'], article[class*='resource']");
    this.insightsPanel = page.locator("[data-testid='resource-insights'], section:has-text('Insights')");
    this.sortDropdown = page.getByRole("combobox", { name: /sort/i });
    this.pagination = page.locator("[data-testid='pagination'], nav[aria-label='Pagination']");
  }

  async goto(params?: string) {
    await this.page.goto(`/resources${params ? `?${params}` : ""}`);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for search debounce
    await this.page.waitForTimeout(400);
  }

  async getResourceCount(): Promise<number> {
    return this.resourceCards.count();
  }

  async clickResource(index: number = 0) {
    const cards = await this.resourceCards.all();
    if (cards[index]) {
      await cards[index].click();
    }
  }
}

/**
 * Authentication Page Object Model
 */
export class AuthPage {
  readonly page: Page;
  readonly signInButton: Locator;
  readonly signOutButton: Locator;
  readonly userMenu: Locator;
  readonly githubSignIn: Locator;
  readonly googleSignIn: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInButton = page.getByRole("button", { name: /sign in/i }).or(page.getByRole("link", { name: /sign in/i }));
    this.signOutButton = page.getByRole("button", { name: /sign out|logout/i });
    this.userMenu = page.locator("[data-testid='user-menu'], button:has([alt*='avatar'])");
    this.githubSignIn = page.getByRole("button", { name: /github/i });
    this.googleSignIn = page.getByRole("button", { name: /google/i });
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
  }

  async goto() {
    await this.page.goto("/sign-in");
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.userMenu.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Messaging Page Object Model
 */
export class MessagingPage {
  readonly page: Page;
  readonly conversationList: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageList: Locator;
  readonly typingIndicator: Locator;
  readonly replyButton: Locator;
  readonly inboxDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    this.conversationList = page.locator("[data-testid='conversation-list'], [class*='conversation-list']");
    this.messageInput = page.getByRole("textbox", { name: /message/i }).or(page.getByPlaceholder(/type a message/i));
    this.sendButton = page.getByRole("button", { name: /send/i });
    this.messageList = page.locator("[data-testid='message-list'], [class*='message-list']");
    this.typingIndicator = page.locator("[data-testid='typing-indicator'], [class*='typing']");
    this.replyButton = page.getByRole("button", { name: /reply/i });
    this.inboxDropdown = page.locator("[data-testid='inbox-dropdown'], button[title='Messages']");
  }

  async goto(conversationId?: string) {
    if (conversationId) {
      await this.page.goto(`/inbox/${conversationId}`);
    } else {
      await this.page.goto("/inbox");
    }
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async getMessageCount(): Promise<number> {
    const messages = this.page.locator("[data-testid='message'], [class*='message-bubble']");
    return messages.count();
  }

  async openInboxDropdown() {
    await this.inboxDropdown.click();
  }
}

/**
 * Search Modal Page Object Model
 */
export class SearchModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly searchInput: Locator;
  readonly results: Locator;
  readonly closeButton: Locator;
  readonly recentSearches: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator("[role='dialog']:has-text('Search'), [data-testid='search-modal']");
    this.searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i));
    this.results = page.locator("[data-testid='search-results'], [role='listbox'] [role='option']");
    this.closeButton = page.getByRole("button", { name: /close/i });
    this.recentSearches = page.locator("[data-testid='recent-searches']");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for search results
    await this.page.waitForTimeout(500);
  }

  async getResultCount(): Promise<number> {
    return this.results.count();
  }

  async clickResult(index: number = 0) {
    const resultsList = await this.results.all();
    if (resultsList[index]) {
      await resultsList[index].click();
    }
  }
}

// =============================================================================
// Custom Fixtures
// =============================================================================

type CustomFixtures = {
  homePage: HomePage;
  docsPage: DocsPage;
  resourcesPage: ResourcesPage;
  authPage: AuthPage;
  messagingPage: MessagingPage;
  searchModal: SearchModal;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  docsPage: async ({ page }, use) => {
    await use(new DocsPage(page));
  },

  resourcesPage: async ({ page }, use) => {
    await use(new ResourcesPage(page));
  },

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  messagingPage: async ({ page }, use) => {
    await use(new MessagingPage(page));
  },

  searchModal: async ({ page }, use) => {
    await use(new SearchModal(page));
  },
});

export { expect };

// =============================================================================
// Helper Utilities
// =============================================================================

/**
 * Wait for page to be fully loaded (network idle)
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for hydration to complete (React)
 */
export async function waitForHydration(page: Page) {
  // Wait for Next.js hydration marker or any React content
  await page.waitForFunction(() => {
    return document.readyState === "complete" && document.body.innerHTML.length > 100;
  });
}

/**
 * Take a full-page screenshot with a descriptive name
 */
export async function takeSnapshot(page: Page, name: string) {
  await page.screenshot({
    path: `tests/e2e/test-results/snapshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string | RegExp, response: object) {
  await page.route(url, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/**
 * Check for console errors
 */
export async function checkNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Check accessibility violations (basic)
 */
export async function checkBasicA11y(page: Page) {
  // Check for images without alt text
  const imagesWithoutAlt = await page.locator("img:not([alt])").count();
  expect(imagesWithoutAlt).toBe(0);

  // Check for buttons without accessible names
  const buttonsWithoutLabel = await page.locator("button:not([aria-label]):not(:has-text(*))").count();
  expect(buttonsWithoutLabel).toBe(0);

  // Check for form inputs without labels
  const inputsWithoutLabels = await page.locator("input:not([aria-label]):not([id])").count();
  expect(inputsWithoutLabels).toBe(0);
}
