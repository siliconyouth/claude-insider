/**
 * Performance Tests
 *
 * Tests for page performance, memory usage, API latency, and network speed.
 */

import type { TestSuite } from "../diagnostics.types";
import {
  createTest,
  hasPerformanceApi,
  type NavigatorWithConnection,
  type PerformanceWithMemory,
} from "./test-utils";

export const performanceTests: TestSuite[] = [
  createTest("Page Performance", "performance", async () => {
    if (!hasPerformanceApi()) {
      return {
        status: "warning",
        message: "Performance API not available",
      };
    }

    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    const fcpEntry = paint.find((p) => p.name === "first-contentful-paint");
    const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;
    const domComplete = navigation ? Math.round(navigation.domComplete) : null;
    const loadTime = navigation
      ? Math.round(navigation.loadEventEnd - navigation.startTime)
      : null;

    const status =
      fcp && fcp < 1800 ? "success" : fcp && fcp < 3000 ? "warning" : "error";

    return {
      status,
      message: fcp ? `FCP: ${fcp}ms, Load: ${loadTime}ms` : "Metrics pending",
      details: {
        firstContentfulPaint: fcp,
        domComplete,
        loadTime,
        transferSize: navigation?.transferSize,
      },
    };
  }),

  createTest("Memory Usage", "performance", async () => {
    const perfWithMemory = performance as PerformanceWithMemory;

    if (!perfWithMemory.memory) {
      return {
        status: "warning",
        message: "Memory API not available (Chrome only)",
      };
    }

    const usedMB = Math.round(
      perfWithMemory.memory.usedJSHeapSize / 1024 / 1024
    );
    const totalMB = Math.round(
      perfWithMemory.memory.totalJSHeapSize / 1024 / 1024
    );
    const limitMB = Math.round(
      perfWithMemory.memory.jsHeapSizeLimit / 1024 / 1024
    );
    const usagePercent = Math.round((usedMB / limitMB) * 100);

    const status =
      usagePercent < 50 ? "success" : usagePercent < 75 ? "warning" : "error";

    return {
      status,
      message: `${usedMB}MB / ${totalMB}MB (${usagePercent}% of limit)`,
      details: {
        usedHeapMB: usedMB,
        totalHeapMB: totalMB,
        heapLimitMB: limitMB,
        usagePercent,
      },
    };
  }),

  createTest("API Latency", "performance", async () => {
    const endpoints = ["/api/health", "/api/dashboard/stats"];
    const results: number[] = [];

    for (const endpoint of endpoints) {
      const endpointStart = Date.now();
      try {
        await fetch(endpoint, { method: "GET" });
        results.push(Date.now() - endpointStart);
      } catch {
        // Ignore individual endpoint failures
      }
    }

    if (results.length === 0) {
      return {
        status: "error",
        message: "No API endpoints responded",
      };
    }

    const avgLatency = Math.round(
      results.reduce((a, b) => a + b, 0) / results.length
    );
    // Production thresholds accounting for serverless cold starts + DB latency:
    // <400ms excellent, <800ms acceptable, >800ms needs investigation
    const status =
      avgLatency < 400 ? "success" : avgLatency < 800 ? "warning" : "error";

    return {
      status,
      message: `Avg: ${avgLatency}ms (${results.length} endpoints tested)`,
      details: {
        averageLatency: avgLatency,
        endpointsTested: results.length,
        latencies: results,
      },
    };
  }),

  createTest("Resource Loading", "performance", async () => {
    if (!hasPerformanceApi()) {
      return {
        status: "warning",
        message: "Performance API not available",
      };
    }

    const resources =
      performance.getEntriesByType("resource") as PerformanceResourceTiming[];

    const scripts = resources.filter((r) => r.initiatorType === "script");
    const styles = resources.filter(
      (r) => r.initiatorType === "link" || r.name.endsWith(".css")
    );
    const images = resources.filter((r) => r.initiatorType === "img");

    const totalTransfer = resources.reduce(
      (sum, r) => sum + (r.transferSize || 0),
      0
    );
    const totalTransferKB = Math.round(totalTransfer / 1024);

    // Resources taking >2s are "slow" (1s threshold was too strict for CDN resources)
    const slowResources = resources.filter((r) => r.duration > 2000).length;
    // Complex SPAs with 200+ resources: allow up to 5 very slow before warning, 15 before error
    const status =
      slowResources === 0
        ? "success"
        : slowResources < 5
          ? "success"
          : slowResources < 15
            ? "warning"
            : "error";

    return {
      status,
      message: `${resources.length} resources, ${totalTransferKB}KB transferred`,
      details: {
        totalResources: resources.length,
        scripts: scripts.length,
        styles: styles.length,
        images: images.length,
        totalTransferKB,
        slowResources,
      },
    };
  }),

  createTest("Network Speed", "performance", async () => {
    const nav = navigator as NavigatorWithConnection;

    if (!nav.connection) {
      return {
        status: "warning",
        message: "Network Info API not available",
      };
    }

    const { effectiveType, downlink, rtt, saveData } = nav.connection;
    const status =
      effectiveType === "4g"
        ? "success"
        : effectiveType === "3g"
          ? "warning"
          : "error";

    return {
      status,
      message: `${effectiveType.toUpperCase()} - ${downlink}Mbps, RTT: ${rtt}ms`,
      details: {
        effectiveType,
        downlinkMbps: downlink,
        rttMs: rtt,
        saveData,
      },
    };
  }),
];
