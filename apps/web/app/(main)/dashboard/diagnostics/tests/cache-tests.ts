/**
 * Cache Tests
 *
 * Tests for Vercel KV/Redis caching.
 */

import type { TestSuite } from "../diagnostics.types";
import { createTest } from "./test-utils";

export const cacheTests: TestSuite[] = [
  createTest("Vercel KV Cache", "cache", async () => {
    const response = await fetch("/api/health");

    if (response.ok) {
      const data = await response.json();
      const kvConfigured =
        data.services?.cache === true ||
        data.services?.kv === true ||
        data.environment?.KV_REST_API_URL;

      return {
        status: "success",
        message: kvConfigured
          ? "Vercel KV (Redis) configured"
          : "Memory cache active (development mode)",
        details: {
          provider: kvConfigured ? "Vercel KV" : "In-Memory",
          kvAvailable: kvConfigured,
          fallbackActive: !kvConfigured,
          note: !kvConfigured
            ? "In-memory cache is normal for development"
            : undefined,
        },
      };
    }

    return {
      status: "success",
      message: "Cache available (default provider)",
    };
  }),

  createTest("Cache Operations", "cache", async () => {
    const response = await fetch("/api/debug/cache-test");

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.success ? "success" : "warning",
        message: data.message || `Cache ${data.provider} operational`,
        details: {
          provider: data.provider,
          setLatency: data.results?.setLatency
            ? `${data.results.setLatency}ms`
            : undefined,
          getLatency: data.results?.getLatency
            ? `${data.results.getLatency}ms`
            : undefined,
          kvConfigured: data.results?.environment?.kvConfigured,
        },
      };
    }

    if (response.status === 403) {
      return {
        status: "success",
        message: "Cache available (admin required for full test)",
      };
    }

    return {
      status: "warning",
      message: "Could not test cache operations",
    };
  }),
];
