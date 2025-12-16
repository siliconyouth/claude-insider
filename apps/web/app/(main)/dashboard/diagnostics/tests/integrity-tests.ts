/**
 * Integrity Tests
 *
 * Tests for website links and browser environment.
 */

import type { LinkCheckSummary, TestSuite } from "../diagnostics.types";
import { createTest } from "./test-utils";

/**
 * Creates the Website Links test.
 * This test has a side effect (updates linkCheckResults state), so it accepts an optional callback.
 */
export function createWebsiteLinksTest(
  onResult?: (summary: LinkCheckSummary) => void
): TestSuite {
  return createTest("Website Links", "integrity", async () => {
    const response = await fetch("/api/debug/link-check");

    if (response.ok) {
      const data = await response.json();
      const summary = data.summary as LinkCheckSummary;

      onResult?.(summary);

      const brokenCount = summary?.brokenLinks?.length || 0;
      const totalLinks = summary?.totalLinks || 0;

      return {
        status:
          brokenCount === 0 ? "success" : brokenCount > 3 ? "error" : "warning",
        message:
          brokenCount === 0
            ? `All ${totalLinks} links valid`
            : `${brokenCount}/${totalLinks} links broken`,
        details: {
          totalLinks,
          successfulLinks: summary?.successfulLinks || 0,
          brokenLinks: brokenCount,
          avgResponseTime: summary?.averageResponseTime || 0,
        },
      };
    }

    if (response.status === 403) {
      return {
        status: "warning",
        message: "Admin role required for link check",
      };
    }

    return {
      status: "error",
      message: `Link check failed: ${response.status}`,
    };
  });
}

/**
 * Creates the Browser Environment test.
 * This test has a side effect (calls collectBrowserEnvironment), so it accepts an optional callback.
 */
export function createBrowserEnvironmentTest(
  collectBrowserEnvironment?: () => Promise<void>
): TestSuite {
  return createTest("Browser Environment", "client", async () => {
    // Collect browser environment data
    await collectBrowserEnvironment?.();

    const browser = navigator.userAgent.includes("Chrome")
      ? "Chrome"
      : navigator.userAgent.includes("Firefox")
        ? "Firefox"
        : navigator.userAgent.includes("Safari")
          ? "Safari"
          : "Browser";

    return {
      status: "success",
      message: `${browser} | ${screen.width}x${screen.height}`,
      details: {
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        language: navigator.language,
      },
    };
  });
}
