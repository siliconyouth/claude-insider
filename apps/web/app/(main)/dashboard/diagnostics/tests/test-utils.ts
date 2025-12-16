/**
 * Test Utilities for Diagnostics
 *
 * Provides factory functions and helpers to reduce boilerplate in test definitions.
 */

import type { DiagnosticResult, TestSuite } from "../diagnostics.types";

/**
 * Creates a test suite with standard error handling and timing.
 */
export function createTest(
  name: string,
  category: string,
  runner: () => Promise<Omit<DiagnosticResult, "name" | "category" | "duration">>
): TestSuite {
  return {
    name,
    category,
    run: async (): Promise<DiagnosticResult> => {
      const start = Date.now();
      try {
        const result = await runner();
        return {
          ...result,
          name,
          category,
          duration: Date.now() - start,
        };
      } catch (e) {
        return {
          name,
          category,
          status: "error",
          message: e instanceof Error ? e.message : "Test failed",
          duration: Date.now() - start,
        };
      }
    },
  };
}

/**
 * Creates a simple API test that checks endpoint availability.
 */
export function createApiTest(
  name: string,
  endpoint: string,
  options: {
    category?: string;
    method?: string;
    successMessage?: string;
    parseResponse?: boolean;
    formatSuccess?: (data: Record<string, unknown>) => string;
    requiredRole?: string;
  } = {}
): TestSuite {
  const {
    category = "api",
    method = "GET",
    successMessage = "API accessible",
    parseResponse = false,
    formatSuccess,
    requiredRole,
  } = options;

  return createTest(name, category, async () => {
    const response = await fetch(endpoint, { method });

    if (response.ok) {
      let message = successMessage;
      let details: Record<string, unknown> = { status: response.status };

      if (parseResponse || formatSuccess) {
        const data = await response.json();
        if (formatSuccess) {
          message = formatSuccess(data);
        }
        details = { ...details, ...data };
      }

      return { status: "success", message, details };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        status: "warning",
        message: requiredRole
          ? `Access denied (requires ${requiredRole} role)`
          : "Authentication required",
        details: { status: response.status },
      };
    }

    return {
      status: "error",
      message: `Error: ${response.status}`,
      details: { status: response.status },
    };
  });
}

/**
 * Creates a database check test from the users-check endpoint.
 */
export function createDbCheckTest(
  name: string,
  checkKey: "env" | "supabaseAdmin" | "directPool" | "rlsStatus",
  evaluator: (
    data: Record<string, unknown>
  ) => Omit<DiagnosticResult, "name" | "category" | "duration">
): TestSuite {
  return createTest(name, checkKey === "env" ? "infrastructure" : "database", async () => {
    const response = await fetch("/api/debug/users-check");
    const data = await response.json();
    const checkData = data.checks?.[checkKey];
    return evaluator(checkData);
  });
}

/**
 * Type guard for checking if performance API is available.
 */
export function hasPerformanceApi(): boolean {
  return typeof window !== "undefined" && !!window.performance;
}

/**
 * Type guard for checking if Notification API is available.
 */
export function hasNotificationApi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Extended Performance type with memory (Chrome only).
 */
export interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Extended Navigator type with connection info (Chrome only).
 */
export interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}
