/**
 * Unit Tests for Presence Utilities
 *
 * Tests the presence status computation logic.
 * These are critical path tests for real-time features.
 */

import { describe, it, expect } from "vitest";
import {
  computePresenceStatus,
  ONLINE_THRESHOLD_MS,
  IDLE_THRESHOLD_MS,
  PresenceStatus,
} from "@/lib/presence-utils";

// ============================================
// THRESHOLD CONSTANT TESTS
// ============================================

describe("Presence Thresholds", () => {
  it("should have correct online threshold (45 seconds)", () => {
    expect(ONLINE_THRESHOLD_MS).toBe(45 * 1000);
  });

  it("should have correct idle threshold (5 minutes)", () => {
    expect(IDLE_THRESHOLD_MS).toBe(5 * 60 * 1000);
  });

  it("should have idle threshold greater than online threshold", () => {
    expect(IDLE_THRESHOLD_MS).toBeGreaterThan(ONLINE_THRESHOLD_MS);
  });
});

// ============================================
// computePresenceStatus TESTS
// ============================================

describe("computePresenceStatus", () => {
  // Use a fixed "now" time for consistent testing
  const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC

  describe("Online status", () => {
    it("should return online when active within threshold", () => {
      const activeAt = new Date(NOW - 10000).toISOString(); // 10 seconds ago
      expect(computePresenceStatus(activeAt, NOW)).toBe("online");
    });

    it("should return online at exactly now", () => {
      const activeAt = new Date(NOW).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("online");
    });

    it("should return online at 44 seconds ago", () => {
      const activeAt = new Date(NOW - 44000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("online");
    });
  });

  describe("Idle status", () => {
    it("should return idle at exactly 45 seconds ago", () => {
      const activeAt = new Date(NOW - 45000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("idle");
    });

    it("should return idle at 1 minute ago", () => {
      const activeAt = new Date(NOW - 60000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("idle");
    });

    it("should return idle at 4 minutes ago", () => {
      const activeAt = new Date(NOW - 4 * 60000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("idle");
    });

    it("should return idle at 4:59 minutes ago", () => {
      const activeAt = new Date(NOW - (5 * 60000 - 1000)).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("idle");
    });
  });

  describe("Offline status", () => {
    it("should return offline at exactly 5 minutes ago", () => {
      const activeAt = new Date(NOW - 5 * 60000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("offline");
    });

    it("should return offline at 10 minutes ago", () => {
      const activeAt = new Date(NOW - 10 * 60000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("offline");
    });

    it("should return offline at 1 hour ago", () => {
      const activeAt = new Date(NOW - 60 * 60000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("offline");
    });

    it("should return offline at 1 day ago", () => {
      const activeAt = new Date(NOW - 24 * 60 * 60000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("offline");
    });
  });

  describe("Null/undefined handling", () => {
    it("should return offline for null lastActiveAt", () => {
      expect(computePresenceStatus(null, NOW)).toBe("offline");
    });

    it("should return offline for undefined lastActiveAt", () => {
      expect(computePresenceStatus(undefined, NOW)).toBe("offline");
    });

    it("should return offline for empty string lastActiveAt", () => {
      // Empty string creates invalid date
      expect(computePresenceStatus("", NOW)).toBe("offline");
    });
  });

  describe("Edge cases", () => {
    it("should use current time when now is not provided", () => {
      // Active 1 second ago should be online
      const activeAt = new Date(Date.now() - 1000).toISOString();
      expect(computePresenceStatus(activeAt)).toBe("online");
    });

    it("should handle future timestamps as online", () => {
      // If timestamp is in the future, diff is negative, so < threshold
      const activeAt = new Date(NOW + 10000).toISOString();
      expect(computePresenceStatus(activeAt, NOW)).toBe("online");
    });

    it("should handle very old timestamps", () => {
      const activeAt = new Date(0).toISOString(); // 1970-01-01
      expect(computePresenceStatus(activeAt, NOW)).toBe("offline");
    });
  });

  describe("ISO string format handling", () => {
    it("should parse standard ISO format", () => {
      const activeAt = "2024-01-01T00:00:00.000Z";
      const now = new Date("2024-01-01T00:00:10.000Z").getTime();
      expect(computePresenceStatus(activeAt, now)).toBe("online");
    });

    it("should parse ISO format with timezone offset", () => {
      const activeAt = "2024-01-01T00:00:00.000+00:00";
      const now = new Date("2024-01-01T00:00:30.000Z").getTime();
      expect(computePresenceStatus(activeAt, now)).toBe("online");
    });
  });
});

// ============================================
// INTEGRATION SCENARIOS
// ============================================

describe("Presence Integration Scenarios", () => {
  it("should handle heartbeat-based presence correctly", () => {
    const heartbeatInterval = 30000; // 30 seconds (typical heartbeat)
    const now = Date.now();

    // User who just sent heartbeat
    const justSent = new Date(now).toISOString();
    expect(computePresenceStatus(justSent, now)).toBe("online");

    // User who missed one heartbeat (30 seconds ago)
    const missedOne = new Date(now - heartbeatInterval).toISOString();
    expect(computePresenceStatus(missedOne, now)).toBe("online");

    // User who missed two heartbeats (60 seconds ago)
    const missedTwo = new Date(now - 2 * heartbeatInterval).toISOString();
    expect(computePresenceStatus(missedTwo, now)).toBe("idle");

    // User who missed 10 heartbeats (5 minutes ago)
    const missedMany = new Date(now - 10 * heartbeatInterval).toISOString();
    expect(computePresenceStatus(missedMany, now)).toBe("offline");
  });

  it("should transition through all statuses correctly", () => {
    const now = Date.now();
    const statuses: PresenceStatus[] = [];

    // Simulate time progression
    const times = [
      0, // Just now
      30000, // 30s ago
      45000, // 45s ago (boundary)
      60000, // 1m ago
      4 * 60000, // 4m ago
      5 * 60000, // 5m ago (boundary)
      10 * 60000, // 10m ago
    ];

    times.forEach((offset) => {
      const activeAt = new Date(now - offset).toISOString();
      statuses.push(computePresenceStatus(activeAt, now));
    });

    expect(statuses).toEqual([
      "online", // 0s
      "online", // 30s
      "idle", // 45s
      "idle", // 1m
      "idle", // 4m
      "offline", // 5m
      "offline", // 10m
    ]);
  });
});
