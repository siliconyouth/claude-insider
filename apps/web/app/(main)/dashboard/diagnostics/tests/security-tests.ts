/**
 * Security Tests
 *
 * Tests for bot detection, honeypots, fingerprinting, and security logs.
 */

import type { TestSuite } from "../diagnostics.types";
import { createApiTest, createTest } from "./test-utils";

/**
 * Creates the Bot Detection test.
 * This test has a side effect (updates botDetectionResult state), so it accepts an optional callback.
 */
export function createBotDetectionTest(
  onResult?: (data: Record<string, unknown>) => void
): TestSuite {
  return createTest("Bot Detection", "security", async () => {
    const response = await fetch("/api/debug/bot-status");

    if (response.ok) {
      const data = await response.json();
      onResult?.(data);

      const test = data.test as {
        isBot?: boolean;
        isVerifiedBot?: boolean;
        verifiedBotName?: string;
        responseTime?: number;
      };
      const config = data.config as {
        provider?: string;
        protectedRoutes?: string[];
      };

      return {
        status: "success",
        message: test?.isBot
          ? test?.isVerifiedBot
            ? `Active - verified: ${test?.verifiedBotName || "crawler"}`
            : "Active (system operational)"
          : `Active - ${config?.provider || "Vercel BotID"}`,
        details: {
          provider: config?.provider,
          responseTime: test?.responseTime,
          protectedRoutes: config?.protectedRoutes?.length,
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

export const securityTests: TestSuite[] = [
  createApiTest("Security Stats API", "/api/dashboard/security/stats", {
    category: "security",
    parseResponse: true,
    requiredRole: "admin",
    formatSuccess: (data) => {
      const stats = data.stats as { totalRequests?: number };
      return `Active - ${stats?.totalRequests || 0} total requests logged`;
    },
  }),

  createApiTest("Security Logs API", "/api/dashboard/security/logs?limit=5", {
    category: "security",
    parseResponse: true,
    requiredRole: "admin",
    formatSuccess: (data) => `Active - ${data.total || 0} total log entries`,
  }),

  createApiTest("Honeypot Config API", "/api/dashboard/security/honeypots", {
    category: "security",
    parseResponse: true,
    requiredRole: "admin",
    formatSuccess: (data) => {
      const honeypots = data.honeypots as { enabled: boolean }[];
      const activeCount = honeypots?.filter((h) => h.enabled).length || 0;
      return `Active - ${activeCount} honeypot(s) enabled`;
    },
  }),

  createTest("Visitor Fingerprinting", "security", async () => {
    // Check if fingerprint is available in window
    const visitorId =
      typeof window !== "undefined"
        ? (window as unknown as { __visitorId?: string }).__visitorId
        : null;

    if (visitorId) {
      return {
        status: "success",
        message: `Active - ID: ${visitorId.substring(0, 8)}...`,
        details: {
          visitorIdLength: visitorId.length,
          hasFingerprint: true,
        },
      };
    }

    // Check localStorage for cached fingerprint
    const cached = localStorage.getItem("fp_visitor_id");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        status: "success",
        message: `Cached - ID: ${parsed.visitorId?.substring(0, 8) || "unknown"}...`,
        details: {
          cached: true,
          confidence: parsed.confidence,
        },
      };
    }

    return {
      status: "warning",
      message: "Not initialized - fingerprint pending",
    };
  }),
];
