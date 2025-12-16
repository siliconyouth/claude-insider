/**
 * API Tests
 *
 * Tests for various API endpoints (Dashboard, Resources, Notifications, AI).
 */

import type { TestSuite } from "../diagnostics.types";
import { createApiTest, createTest } from "./test-utils";

export const apiTests: TestSuite[] = [
  createApiTest("Dashboard Users API", "/api/dashboard/users?limit=1", {
    requiredRole: "admin",
  }),

  createApiTest("Dashboard Stats API", "/api/dashboard/stats", {
    parseResponse: true,
    requiredRole: "moderator",
    formatSuccess: (data) => {
      const users = data?.users as { total?: number } | undefined;
      const feedback = data?.feedback as { total?: number } | undefined;
      return `${users?.total || 0} users, ${feedback?.total || 0} feedback`;
    },
  }),

  createApiTest("Resources API", "/api/resources", {
    parseResponse: true,
    formatSuccess: (data) => {
      const resources = data?.resources as unknown[];
      return `${resources?.length || 0} resources available`;
    },
  }),

  createApiTest("Notifications API", "/api/notifications", {
    requiredRole: "user",
  }),

  createTest("AI Assistant API", "api", async () => {
    // Test chat API availability (without sending a real request)
    const response = await fetch("/api/assistant/chat", {
      method: "OPTIONS",
    });
    return {
      status: response.status !== 500 ? "success" : "error",
      message:
        response.status !== 500 ? "Chat endpoint available" : "Server error",
      details: { status: response.status },
    };
  }),
];

/**
 * Creates the Anthropic API Key test.
 * This test has a side effect (updates apiKeyResult state), so it accepts an optional callback.
 */
export function createAnthropicApiKeyTest(
  onResult?: (data: Record<string, unknown>) => void
): TestSuite {
  return createTest("Anthropic API Key", "api", async () => {
    const response = await fetch("/api/debug/api-key-test");

    if (response.ok) {
      const data = await response.json();
      onResult?.(data);

      const siteKey = data.siteKey as {
        valid?: boolean;
        model?: string;
        error?: string;
        keyPrefix?: string;
        responseTime?: number;
        errorType?: string;
      };

      return {
        status: siteKey?.valid ? "success" : "error",
        message: siteKey?.valid
          ? `Valid - ${siteKey.model || "API accessible"}`
          : siteKey?.error || "Invalid key",
        details: {
          keyPrefix: siteKey?.keyPrefix,
          responseTime: siteKey?.responseTime,
          errorType: siteKey?.errorType,
        },
      };
    }

    if (response.status === 403) {
      return {
        status: "warning",
        message: "Admin role required",
      };
    }

    return {
      status: "error",
      message: `Error: ${response.status}`,
    };
  });
}
