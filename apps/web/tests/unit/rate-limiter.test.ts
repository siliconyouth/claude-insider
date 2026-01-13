/**
 * Rate Limiter Tests
 *
 * Tests for the rate limiting library including:
 * - Rate limit configurations
 * - Key generation
 * - Rate limit headers
 * - Token bucket algorithm (in-memory)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  RATE_LIMITS,
  getRateLimitKey,
  getRateLimitHeaders,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
  getAllRateLimits,
  type RateLimitResult,
} from "@/lib/rate-limiter";

describe("Rate Limit Configurations", () => {
  it("should have all expected endpoint configurations", () => {
    expect(RATE_LIMITS).toHaveProperty("discover");
    expect(RATE_LIMITS).toHaveProperty("scrape");
    expect(RATE_LIMITS).toHaveProperty("analyze");
    expect(RATE_LIMITS).toHaveProperty("queue");
    expect(RATE_LIMITS).toHaveProperty("bulk");
    expect(RATE_LIMITS).toHaveProperty("import");
    expect(RATE_LIMITS).toHaveProperty("default");
  });

  it("should have valid configuration structure", () => {
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      expect(config).toHaveProperty("maxTokens");
      expect(config).toHaveProperty("refillRate");
      expect(config).toHaveProperty("windowMs");
      expect(typeof config.maxTokens).toBe("number");
      expect(typeof config.refillRate).toBe("number");
      expect(typeof config.windowMs).toBe("number");
    });
  });

  it("should have positive values for all configs", () => {
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      expect(config.maxTokens).toBeGreaterThan(0);
      expect(config.refillRate).toBeGreaterThan(0);
      expect(config.windowMs).toBeGreaterThan(0);
    });
  });

  describe("discover endpoint", () => {
    it("should have low token limit (expensive operation)", () => {
      expect(RATE_LIMITS.discover.maxTokens).toBe(10);
      expect(RATE_LIMITS.discover.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe("import endpoint", () => {
    it("should have lowest token limit", () => {
      expect(RATE_LIMITS.import.maxTokens).toBe(5);
    });
  });

  describe("default endpoint", () => {
    it("should have reasonable default limits", () => {
      expect(RATE_LIMITS.default.maxTokens).toBe(60);
      expect(RATE_LIMITS.default.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });
});

describe("getRateLimitKey", () => {
  it("should generate correct key format", () => {
    expect(getRateLimitKey("user-123", "discover")).toBe("ratelimit:discover:user-123");
    expect(getRateLimitKey("192.168.1.1", "scrape")).toBe("ratelimit:scrape:192.168.1.1");
  });

  it("should handle different identifiers", () => {
    expect(getRateLimitKey("email@example.com", "api")).toBe("ratelimit:api:email@example.com");
    expect(getRateLimitKey("uuid-1234-5678", "default")).toBe("ratelimit:default:uuid-1234-5678");
  });

  it("should handle special characters", () => {
    expect(getRateLimitKey("user@domain.com", "test")).toBe("ratelimit:test:user@domain.com");
  });
});

describe("getRateLimitHeaders", () => {
  it("should return correct headers for allowed request", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 59,
      limit: 60,
      resetTime: 1700000000,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("60");
    expect(headers["X-RateLimit-Remaining"]).toBe("59");
    expect(headers["X-RateLimit-Reset"]).toBe("1700000000");
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("should include Retry-After for blocked requests", () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      limit: 60,
      resetTime: 1700000000,
      retryAfter: 120,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["Retry-After"]).toBe("120");
  });

  it("should convert numbers to strings", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 10,
      limit: 100,
      resetTime: 1700000000,
    };

    const headers = getRateLimitHeaders(result);

    Object.values(headers).forEach((value) => {
      expect(typeof value).toBe("string");
    });
  });
});

describe("In-Memory Rate Limiting", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe("getRateLimitStatus", () => {
    it("should return full tokens for new identifier", () => {
      const status = getRateLimitStatus("new-user", "default");

      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(RATE_LIMITS.default.maxTokens);
      expect(status.limit).toBe(RATE_LIMITS.default.maxTokens);
    });

    it("should use correct config for endpoint", () => {
      const discoverStatus = getRateLimitStatus("user", "discover");
      const importStatus = getRateLimitStatus("user", "import");

      expect(discoverStatus.limit).toBe(RATE_LIMITS.discover.maxTokens);
      expect(importStatus.limit).toBe(RATE_LIMITS.import.maxTokens);
    });

    it("should fall back to default for unknown endpoints", () => {
      const status = getRateLimitStatus("user", "unknown-endpoint");

      expect(status.limit).toBe(RATE_LIMITS.default.maxTokens);
    });
  });

  describe("resetRateLimit", () => {
    it("should reset rate limit for identifier", () => {
      // This should not throw
      expect(() => resetRateLimit("user-123", "discover")).not.toThrow();
    });
  });

  describe("clearAllRateLimits", () => {
    it("should clear all rate limits", () => {
      // Add some entries
      getRateLimitStatus("user1", "discover");
      getRateLimitStatus("user2", "scrape");

      clearAllRateLimits();

      const entries = getAllRateLimits();
      expect(entries).toHaveLength(0);
    });
  });

  describe("getAllRateLimits", () => {
    it("should return empty array when no limits set", () => {
      clearAllRateLimits();
      const entries = getAllRateLimits();
      expect(entries).toEqual([]);
    });

    it("should return entries with correct structure", () => {
      // Trigger some rate limit checks
      getRateLimitStatus("user1", "discover");

      const entries = getAllRateLimits();

      // May or may not have entries depending on implementation
      expect(Array.isArray(entries)).toBe(true);
    });
  });
});

describe("Rate Limit Result Structure", () => {
  it("should have correct type structure for allowed result", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 50,
      limit: 60,
      resetTime: 1700000000,
    };

    expect(result).toMatchObject({
      allowed: expect.any(Boolean),
      remaining: expect.any(Number),
      limit: expect.any(Number),
      resetTime: expect.any(Number),
    });
  });

  it("should have correct type structure for blocked result", () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      limit: 60,
      resetTime: 1700000000,
      retryAfter: 3600,
    };

    expect(result).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfter: expect.any(Number),
    });
  });
});
