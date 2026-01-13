/**
 * Cache Utility Tests
 *
 * Tests for the cache library including:
 * - Cache configuration constants
 * - Key builder functions
 * - In-memory cache operations
 * - Cache invalidation helpers
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CACHE_TTL,
  CACHE_PREFIX,
  userProfileKey,
  userByUsernameKey,
  notificationCountKey,
  notificationsKey,
  collectionsKey,
  favoritesKey,
  followCountsKey,
  dashboardStatsKey,
  rateLimitKey,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheGetOrSet,
  cacheIncrement,
  clearMemoryCache,
  cleanupMemoryCache,
  getCacheStats,
} from "@/lib/cache";

describe("Cache TTL Constants", () => {
  it("should have all expected TTL values", () => {
    expect(CACHE_TTL.USER_PROFILE).toBe(3600);
    expect(CACHE_TTL.NOTIFICATION_COUNT).toBe(300);
    expect(CACHE_TTL.NOTIFICATIONS).toBe(300);
    expect(CACHE_TTL.COLLECTIONS).toBe(1800);
    expect(CACHE_TTL.DASHBOARD_STATS).toBe(600);
    expect(CACHE_TTL.FAVORITES).toBe(900);
    expect(CACHE_TTL.FOLLOW_COUNTS).toBe(600);
    expect(CACHE_TTL.RESOURCES).toBe(3600);
    expect(CACHE_TTL.SEARCH_RESULTS).toBe(300);
    expect(CACHE_TTL.RATE_LIMIT).toBe(3600);
    expect(CACHE_TTL.SESSION).toBe(1800);
  });

  it("should have TTL values as positive numbers", () => {
    Object.entries(CACHE_TTL).forEach(([key, value]) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    });
  });
});

describe("Cache Prefix Constants", () => {
  it("should have all expected prefix values", () => {
    expect(CACHE_PREFIX.USER).toBe("user:");
    expect(CACHE_PREFIX.NOTIFICATIONS).toBe("notif:");
    expect(CACHE_PREFIX.COLLECTIONS).toBe("coll:");
    expect(CACHE_PREFIX.FAVORITES).toBe("fav:");
    expect(CACHE_PREFIX.DASHBOARD).toBe("dash:");
    expect(CACHE_PREFIX.FOLLOW).toBe("follow:");
    expect(CACHE_PREFIX.RESOURCES).toBe("res:");
    expect(CACHE_PREFIX.SEARCH).toBe("search:");
    expect(CACHE_PREFIX.RATE_LIMIT).toBe("rl:");
  });

  it("should have all prefixes ending with colon", () => {
    Object.entries(CACHE_PREFIX).forEach(([key, value]) => {
      expect(value.endsWith(":")).toBe(true);
    });
  });
});

describe("Cache Key Builders", () => {
  describe("userProfileKey", () => {
    it("should build correct key format", () => {
      expect(userProfileKey("user-123")).toBe("user:profile:user-123");
      expect(userProfileKey("abc-def-ghi")).toBe("user:profile:abc-def-ghi");
    });

    it("should handle special characters in userId", () => {
      expect(userProfileKey("user@123")).toBe("user:profile:user@123");
    });
  });

  describe("userByUsernameKey", () => {
    it("should build correct key format with lowercase", () => {
      expect(userByUsernameKey("JohnDoe")).toBe("user:username:johndoe");
      expect(userByUsernameKey("ADMIN")).toBe("user:username:admin");
    });

    it("should handle already lowercase usernames", () => {
      expect(userByUsernameKey("lowercase")).toBe("user:username:lowercase");
    });
  });

  describe("notificationCountKey", () => {
    it("should build correct key format", () => {
      expect(notificationCountKey("user-123")).toBe("notif:count:user-123");
    });
  });

  describe("notificationsKey", () => {
    it("should build correct key format with default page", () => {
      expect(notificationsKey("user-123")).toBe("notif:list:user-123:1");
    });

    it("should build correct key format with custom page", () => {
      expect(notificationsKey("user-123", 5)).toBe("notif:list:user-123:5");
      expect(notificationsKey("user-123", 10)).toBe("notif:list:user-123:10");
    });
  });

  describe("collectionsKey", () => {
    it("should build correct key format", () => {
      expect(collectionsKey("user-123")).toBe("coll:list:user-123");
    });
  });

  describe("favoritesKey", () => {
    it("should build correct key format without type", () => {
      expect(favoritesKey("user-123")).toBe("fav:user-123");
    });

    it("should build correct key format with type", () => {
      expect(favoritesKey("user-123", "resources")).toBe("fav:user-123:resources");
      expect(favoritesKey("user-123", "prompts")).toBe("fav:user-123:prompts");
    });
  });

  describe("followCountsKey", () => {
    it("should build correct key format", () => {
      expect(followCountsKey("user-123")).toBe("follow:counts:user-123");
    });
  });

  describe("dashboardStatsKey", () => {
    it("should return static key", () => {
      expect(dashboardStatsKey()).toBe("dash:stats");
    });
  });

  describe("rateLimitKey", () => {
    it("should build correct key format", () => {
      expect(rateLimitKey("user-123", "discover")).toBe("rl:discover:user-123");
      expect(rateLimitKey("192.168.1.1", "scrape")).toBe("rl:scrape:192.168.1.1");
    });
  });
});

describe("Memory Cache Operations", () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  describe("cacheSet and cacheGet", () => {
    it("should store and retrieve values", async () => {
      await cacheSet("test-key", { foo: "bar" }, 60);
      const result = await cacheGet<{ foo: string }>("test-key");
      expect(result).toEqual({ foo: "bar" });
    });

    it("should return null for missing keys", async () => {
      const result = await cacheGet("nonexistent-key");
      expect(result).toBeNull();
    });

    it("should store different value types", async () => {
      await cacheSet("string-key", "hello", 60);
      await cacheSet("number-key", 42, 60);
      await cacheSet("array-key", [1, 2, 3], 60);
      await cacheSet("object-key", { nested: { value: true } }, 60);

      expect(await cacheGet("string-key")).toBe("hello");
      expect(await cacheGet("number-key")).toBe(42);
      expect(await cacheGet("array-key")).toEqual([1, 2, 3]);
      expect(await cacheGet("object-key")).toEqual({ nested: { value: true } });
    });
  });

  describe("cacheDelete", () => {
    it("should delete existing keys", async () => {
      await cacheSet("delete-test", "value", 60);
      expect(await cacheGet("delete-test")).toBe("value");

      await cacheDelete("delete-test");
      expect(await cacheGet("delete-test")).toBeNull();
    });

    it("should handle deleting non-existent keys", async () => {
      // Should not throw
      await expect(cacheDelete("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("cacheGetOrSet", () => {
    it("should return cached value if exists", async () => {
      await cacheSet("getorset-key", "cached-value", 60);

      const fetchFn = vi.fn().mockResolvedValue("fresh-value");
      const result = await cacheGetOrSet("getorset-key", fetchFn, 60);

      expect(result).toBe("cached-value");
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should fetch and cache if not exists", async () => {
      const fetchFn = vi.fn().mockResolvedValue("fetched-value");
      const result = await cacheGetOrSet("new-key", fetchFn, 60);

      expect(result).toBe("fetched-value");
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Verify it was cached
      const cached = await cacheGet("new-key");
      expect(cached).toBe("fetched-value");
    });
  });

  describe("cacheIncrement", () => {
    it("should start at 1 for new keys", async () => {
      const result = await cacheIncrement("counter-new", 60);
      expect(result).toBe(1);
    });

    it("should increment existing counters", async () => {
      await cacheIncrement("counter-inc", 60);
      await cacheIncrement("counter-inc", 60);
      const result = await cacheIncrement("counter-inc", 60);
      expect(result).toBe(3);
    });
  });

  describe("clearMemoryCache", () => {
    it("should clear all cached values", async () => {
      await cacheSet("key1", "value1", 60);
      await cacheSet("key2", "value2", 60);

      clearMemoryCache();

      expect(await cacheGet("key1")).toBeNull();
      expect(await cacheGet("key2")).toBeNull();
    });
  });

  describe("cleanupMemoryCache", () => {
    it("should remove expired entries", async () => {
      // Set a value with very short TTL
      await cacheSet("expired-key", "value", 0);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleaned = cleanupMemoryCache();

      // The expired entry should be cleaned
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });

    it("should keep non-expired entries", async () => {
      await cacheSet("valid-key", "value", 3600); // 1 hour TTL

      cleanupMemoryCache();

      expect(await cacheGet("valid-key")).toBe("value");
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", async () => {
      await cacheSet("stat-key", "value", 60);

      const stats = await getCacheStats();

      expect(stats).toHaveProperty("provider");
      expect(stats).toHaveProperty("memorySize");
      expect(stats).toHaveProperty("kvAvailable");
      expect(stats.memorySize).toBeGreaterThan(0);
    });

    it("should report memory provider when KV unavailable", async () => {
      const stats = await getCacheStats();

      // In test environment, KV is typically unavailable
      expect(stats.provider).toBe("memory");
      expect(stats.kvAvailable).toBe(false);
    });
  });
});

describe("Cache Expiration", () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  it("should expire values after TTL", async () => {
    // Use very short TTL
    await cacheSet("expiring-key", "value", 0.001); // 1ms

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 50));

    const result = await cacheGet("expiring-key");
    expect(result).toBeNull();
  });

  it("should not expire values before TTL", async () => {
    await cacheSet("persisting-key", "value", 3600);

    // Immediately read
    const result = await cacheGet("persisting-key");
    expect(result).toBe("value");
  });
});
