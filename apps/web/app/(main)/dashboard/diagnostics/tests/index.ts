/**
 * Diagnostics Test Suite Index
 *
 * Exports all test suites for the diagnostics dashboard.
 * Tests are organized by category for better maintainability.
 */

import type { LinkCheckSummary, TestSuite } from "../diagnostics.types";

// Import test suites
import { infrastructureTests } from "./infrastructure-tests";
import { databaseTests } from "./database-tests";
import { apiTests, createAnthropicApiKeyTest } from "./api-tests";
import {
  securityTests,
  createBotDetectionTest,
} from "./security-tests";
import { featureTests } from "./feature-tests";
import {
  createWebsiteLinksTest,
  createBrowserEnvironmentTest,
} from "./integrity-tests";
import { performanceTests } from "./performance-tests";
import { notificationTests, emailTests } from "./notification-tests";
import { messagingTests } from "./messaging-tests";
import { cacheTests } from "./cache-tests";
import { designTests } from "./design-tests";
import { donationTests } from "./donation-tests";
import { e2eeTests } from "./e2ee-tests";

// Re-export utilities
export * from "./test-utils";

// Re-export factory functions for tests with side effects
export { createAnthropicApiKeyTest } from "./api-tests";
export { createBotDetectionTest } from "./security-tests";
export { createWebsiteLinksTest, createBrowserEnvironmentTest } from "./integrity-tests";

/**
 * Creates the complete test suite array.
 *
 * Some tests have side effects (they update component state).
 * For those tests, callbacks can be provided to handle state updates.
 */
export function createTestSuites(callbacks?: {
  onLinkCheckResult?: (summary: LinkCheckSummary) => void;
  onApiKeyResult?: (data: Record<string, unknown>) => void;
  onBotDetectionResult?: (data: Record<string, unknown>) => void;
  collectBrowserEnvironment?: () => Promise<void>;
}): TestSuite[] {
  return [
    // Infrastructure
    ...infrastructureTests,

    // Database
    ...databaseTests,

    // API
    ...apiTests,
    createAnthropicApiKeyTest(callbacks?.onApiKeyResult),

    // Security
    createBotDetectionTest(callbacks?.onBotDetectionResult),
    ...securityTests,

    // Features
    ...featureTests,

    // Integrity
    createWebsiteLinksTest(callbacks?.onLinkCheckResult),
    createBrowserEnvironmentTest(callbacks?.collectBrowserEnvironment),
    ...designTests.filter((t) => t.category === "integrity"),

    // Performance
    ...performanceTests,

    // Notifications & Email
    ...notificationTests,
    ...emailTests,

    // Messaging
    ...messagingTests,

    // Cache
    ...cacheTests,

    // Design
    ...designTests.filter((t) => t.category === "design"),

    // Donations
    ...donationTests,

    // E2EE
    ...e2eeTests,
  ];
}

/**
 * Get all static test suites (without callbacks).
 * Use createTestSuites() for full functionality with state callbacks.
 */
export const staticTestSuites: TestSuite[] = [
  ...infrastructureTests,
  ...databaseTests,
  ...apiTests,
  ...securityTests,
  ...featureTests,
  ...performanceTests,
  ...notificationTests,
  ...emailTests,
  ...messagingTests,
  ...cacheTests,
  ...designTests,
  ...donationTests,
  ...e2eeTests,
];

/**
 * Test categories for grouping in the UI.
 */
export const TEST_CATEGORIES = [
  { id: "infrastructure", name: "Infrastructure", icon: "⚙️" },
  { id: "database", name: "Database", icon: "📊" },
  { id: "auth", name: "Authentication", icon: "🔐" },
  { id: "api", name: "API Endpoints", icon: "🔌" },
  { id: "security", name: "Security", icon: "🛡️" },
  { id: "features", name: "Features", icon: "✨" },
  { id: "integrity", name: "Integrity", icon: "🔗" },
  { id: "client", name: "Client", icon: "🖥️" },
  { id: "performance", name: "Performance", icon: "⚡" },
  { id: "notifications", name: "Notifications", icon: "🔔" },
  { id: "email", name: "Email", icon: "📧" },
  { id: "messaging", name: "Messaging", icon: "💬" },
  { id: "cache", name: "Cache", icon: "💾" },
  { id: "design", name: "Design System", icon: "🎨" },
  { id: "donations", name: "Donations", icon: "💝" },
  { id: "e2ee", name: "E2EE", icon: "🔒" },
] as const;

export type TestCategory = (typeof TEST_CATEGORIES)[number]["id"];
