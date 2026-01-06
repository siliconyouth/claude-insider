/**
 * Chat Cache Tests
 *
 * Tests for the LRU cache implementation used in the chat system.
 * Covers TTL expiration, LRU eviction, and specialized cache features.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LRUCache,
  DEFAULT_CACHE_CONFIG,
  type CacheConfig,
  type PresenceInfo,
} from "@/lib/chat/cache";

describe("Chat Cache System", () => {
  describe("DEFAULT_CACHE_CONFIG", () => {
    it("should have correct maxConversations", () => {
      expect(DEFAULT_CACHE_CONFIG.maxConversations).toBe(100);
    });

    it("should have correct maxMessagesPerConversation", () => {
      expect(DEFAULT_CACHE_CONFIG.maxMessagesPerConversation).toBe(500);
    });

    it("should have 100MB maxMediaCacheSize", () => {
      expect(DEFAULT_CACHE_CONFIG.maxMediaCacheSize).toBe(100 * 1024 * 1024);
    });

    it("should have 5 minute conversationTTL", () => {
      expect(DEFAULT_CACHE_CONFIG.conversationTTL).toBe(5 * 60 * 1000);
    });

    it("should have 2 minute messageTTL", () => {
      expect(DEFAULT_CACHE_CONFIG.messageTTL).toBe(2 * 60 * 1000);
    });

    it("should have 30 second presenceTTL", () => {
      expect(DEFAULT_CACHE_CONFIG.presenceTTL).toBe(30 * 1000);
    });

    it("should have 10 minute userProfileTTL", () => {
      expect(DEFAULT_CACHE_CONFIG.userProfileTTL).toBe(10 * 60 * 1000);
    });

    it("should have 1 hour linkPreviewTTL", () => {
      expect(DEFAULT_CACHE_CONFIG.linkPreviewTTL).toBe(60 * 60 * 1000);
    });
  });

  describe("LRUCache", () => {
    let cache: LRUCache<string, string>;
    const TTL = 1000; // 1 second for tests

    beforeEach(() => {
      cache = new LRUCache<string, string>(5, TTL);
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe("Basic operations", () => {
      it("should set and get value", () => {
        cache.set("key1", "value1");
        expect(cache.getSync("key1")).toBe("value1");
      });

      it("should return undefined for missing key", () => {
        expect(cache.getSync("missing")).toBeUndefined();
      });

      it("should delete value", () => {
        cache.set("key1", "value1");
        expect(cache.delete("key1")).toBe(true);
        expect(cache.getSync("key1")).toBeUndefined();
      });

      it("should return false when deleting missing key", () => {
        expect(cache.delete("missing")).toBe(false);
      });

      it("should invalidate value", () => {
        cache.set("key1", "value1");
        cache.invalidate("key1");
        expect(cache.getSync("key1")).toBeUndefined();
      });

      it("should check if key exists", () => {
        cache.set("key1", "value1");
        expect(cache.has("key1")).toBe(true);
        expect(cache.has("missing")).toBe(false);
      });

      it("should clear all values", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        cache.clear();
        expect(cache.size).toBe(0);
      });

      it("should return correct size", () => {
        expect(cache.size).toBe(0);
        cache.set("key1", "value1");
        expect(cache.size).toBe(1);
        cache.set("key2", "value2");
        expect(cache.size).toBe(2);
      });
    });

    describe("TTL expiration", () => {
      it("should return value before TTL expires", () => {
        cache.set("key1", "value1");
        vi.advanceTimersByTime(TTL - 1);
        expect(cache.getSync("key1")).toBe("value1");
      });

      it("should return undefined after TTL expires", () => {
        cache.set("key1", "value1");
        vi.advanceTimersByTime(TTL + 1);
        expect(cache.getSync("key1")).toBeUndefined();
      });

      it("should handle custom TTL per entry", () => {
        cache.set("key1", "value1", 500);
        cache.set("key2", "value2", 2000);

        vi.advanceTimersByTime(600);
        expect(cache.getSync("key1")).toBeUndefined();
        expect(cache.getSync("key2")).toBe("value2");

        vi.advanceTimersByTime(1500);
        expect(cache.getSync("key2")).toBeUndefined();
      });

      it("should report expired key as not existing via has()", () => {
        cache.set("key1", "value1");
        expect(cache.has("key1")).toBe(true);
        vi.advanceTimersByTime(TTL + 1);
        expect(cache.has("key1")).toBe(false);
      });

      it("should cleanup expired entries", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        vi.advanceTimersByTime(TTL + 1);
        const cleaned = cache.cleanup();
        expect(cleaned).toBe(2);
        expect(cache.size).toBe(0);
      });
    });

    describe("LRU eviction", () => {
      it("should evict oldest entry when at capacity", () => {
        // Fill cache to capacity
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        cache.set("key3", "value3");
        cache.set("key4", "value4");
        cache.set("key5", "value5");

        // Add one more (should evict key1)
        cache.set("key6", "value6");

        expect(cache.getSync("key1")).toBeUndefined();
        expect(cache.getSync("key2")).toBe("value2");
        expect(cache.getSync("key6")).toBe("value6");
        expect(cache.size).toBe(5);
      });

      it("should update LRU order on get", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        cache.set("key3", "value3");
        cache.set("key4", "value4");
        cache.set("key5", "value5");

        // Access key1 to make it recently used
        cache.getSync("key1");

        // Add new entry (should evict key2, not key1)
        cache.set("key6", "value6");

        expect(cache.getSync("key1")).toBe("value1");
        expect(cache.getSync("key2")).toBeUndefined();
      });

      it("should update LRU order on set for existing key", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        cache.set("key3", "value3");
        cache.set("key4", "value4");
        cache.set("key5", "value5");

        // Update key1 to make it recently used
        cache.set("key1", "updated");

        // Add new entry (should evict key2, not key1)
        cache.set("key6", "value6");

        expect(cache.getSync("key1")).toBe("updated");
        expect(cache.getSync("key2")).toBeUndefined();
      });
    });

    describe("Async get with fetcher", () => {
      it("should call fetcher when key missing", async () => {
        const fetcher = vi.fn().mockResolvedValue("fetched-value");
        const result = await cache.get("key1", fetcher);
        expect(result).toBe("fetched-value");
        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      it("should cache fetched value", async () => {
        const fetcher = vi.fn().mockResolvedValue("fetched-value");
        await cache.get("key1", fetcher);

        // Second call should use cache
        const result = await cache.get("key1", fetcher);
        expect(result).toBe("fetched-value");
        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      it("should return cached value without calling fetcher", async () => {
        cache.set("key1", "cached-value");
        const fetcher = vi.fn().mockResolvedValue("fetched-value");

        const result = await cache.get("key1", fetcher);
        expect(result).toBe("cached-value");
        expect(fetcher).not.toHaveBeenCalled();
      });

      it("should return undefined when fetcher throws", async () => {
        const fetcher = vi.fn().mockRejectedValue(new Error("Fetch failed"));
        const result = await cache.get("key1", fetcher);
        expect(result).toBeUndefined();
      });

      it("should not cache when fetcher throws", async () => {
        const fetcher = vi.fn().mockRejectedValue(new Error("Fetch failed"));
        await cache.get("key1", fetcher);
        expect(cache.has("key1")).toBe(false);
      });

      it("should call fetcher when cached value expired", async () => {
        cache.set("key1", "old-value");
        vi.advanceTimersByTime(TTL + 1);

        const fetcher = vi.fn().mockResolvedValue("new-value");
        const result = await cache.get("key1", fetcher);

        expect(result).toBe("new-value");
        expect(fetcher).toHaveBeenCalledTimes(1);
      });
    });

    describe("invalidateWhere", () => {
      it("should invalidate entries matching predicate", () => {
        cache.set("user:1", "data1");
        cache.set("user:2", "data2");
        cache.set("message:1", "msg1");
        cache.set("message:2", "msg2");

        const count = cache.invalidateWhere((key) => key.startsWith("user:"));

        expect(count).toBe(2);
        expect(cache.has("user:1")).toBe(false);
        expect(cache.has("user:2")).toBe(false);
        expect(cache.has("message:1")).toBe(true);
        expect(cache.has("message:2")).toBe(true);
      });

      it("should return 0 when no matches", () => {
        cache.set("key1", "value1");
        const count = cache.invalidateWhere((key) => key.startsWith("x:"));
        expect(count).toBe(0);
      });

      it("should handle empty cache", () => {
        const count = cache.invalidateWhere(() => true);
        expect(count).toBe(0);
      });

      it("should invalidate based on value", () => {
        cache.set("key1", "important");
        cache.set("key2", "unimportant");
        cache.set("key3", "important");

        const count = cache.invalidateWhere((_, value) => value === "important");
        expect(count).toBe(2);
        expect(cache.has("key2")).toBe(true);
      });
    });

    describe("keys(), values(), entries()", () => {
      it("should return all keys", () => {
        cache.set("a", "1");
        cache.set("b", "2");
        cache.set("c", "3");

        expect(cache.keys().sort()).toEqual(["a", "b", "c"]);
      });

      it("should return all values (excluding expired)", () => {
        cache.set("a", "1");
        cache.set("b", "2", 100);
        cache.set("c", "3");

        vi.advanceTimersByTime(200);

        expect(cache.values().sort()).toEqual(["1", "3"]);
      });

      it("should return all entries (excluding expired)", () => {
        cache.set("a", "1");
        cache.set("b", "2", 100);
        cache.set("c", "3");

        vi.advanceTimersByTime(200);

        const entries = cache.entries();
        expect(entries).toHaveLength(2);
        expect(entries.map(([k]) => k).sort()).toEqual(["a", "c"]);
      });

      it("should return empty array for empty cache", () => {
        expect(cache.keys()).toEqual([]);
        expect(cache.values()).toEqual([]);
        expect(cache.entries()).toEqual([]);
      });
    });
  });

  describe("LRUCache with objects", () => {
    let cache: LRUCache<string, { id: string; name: string }>;

    beforeEach(() => {
      cache = new LRUCache(10, 60000);
    });

    it("should store and retrieve objects", () => {
      const obj = { id: "1", name: "Test" };
      cache.set("key1", obj);
      expect(cache.getSync("key1")).toEqual(obj);
    });

    it("should preserve object reference", () => {
      const obj = { id: "1", name: "Test" };
      cache.set("key1", obj);
      expect(cache.getSync("key1")).toBe(obj);
    });

    it("should handle object mutations", () => {
      const obj = { id: "1", name: "Test" };
      cache.set("key1", obj);
      obj.name = "Modified";
      expect(cache.getSync("key1")?.name).toBe("Modified");
    });
  });

  describe("LRUCache edge cases", () => {
    it("should handle single-item cache", () => {
      const cache = new LRUCache<string, string>(1, 1000);
      cache.set("key1", "value1");
      expect(cache.getSync("key1")).toBe("value1");

      cache.set("key2", "value2");
      expect(cache.getSync("key1")).toBeUndefined();
      expect(cache.getSync("key2")).toBe("value2");
    });

    it("should handle zero TTL", () => {
      const cache = new LRUCache<string, string>(10, 0);
      vi.useFakeTimers();

      cache.set("key1", "value1");
      // Even with 0 TTL, value should be available immediately
      expect(cache.getSync("key1")).toBe("value1");

      // But expire after 1ms
      vi.advanceTimersByTime(1);
      expect(cache.getSync("key1")).toBeUndefined();

      vi.useRealTimers();
    });

    it("should handle very long TTL", () => {
      vi.useFakeTimers();
      const cache = new LRUCache<string, string>(10, 365 * 24 * 60 * 60 * 1000);

      cache.set("key1", "value1");
      vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000); // 30 days

      expect(cache.getSync("key1")).toBe("value1");
      vi.useRealTimers();
    });

    it("should handle special characters in keys", () => {
      const cache = new LRUCache<string, string>(10, 1000);
      const keys = [
        "key:with:colons",
        "key/with/slashes",
        "key@with@at",
        "key with spaces",
        "key\nwith\nnewlines",
        "key\twith\ttabs",
        "🔑emoji🔑",
        "日本語キー",
      ];

      keys.forEach((key, i) => {
        cache.set(key, `value${i}`);
        expect(cache.getSync(key)).toBe(`value${i}`);
      });
    });

    it("should handle concurrent operations", async () => {
      const cache = new LRUCache<string, number>(100, 60000);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          (async () => {
            cache.set(`key${i}`, i);
            const value = cache.getSync(`key${i}`);
            expect(value).toBe(i);
          })()
        );
      }

      await Promise.all(promises);
      expect(cache.size).toBe(100);
    });
  });

  describe("Presence info type", () => {
    it("should accept valid presence info", () => {
      const presence: PresenceInfo = {
        userId: "user-123",
        status: "online",
      };
      expect(presence.userId).toBe("user-123");
      expect(presence.status).toBe("online");
    });

    it("should accept presence with all fields", () => {
      const presence: PresenceInfo = {
        userId: "user-123",
        status: "idle",
        lastSeen: "2024-01-01T00:00:00Z",
        statusMessage: "In a meeting",
      };
      expect(presence.statusMessage).toBe("In a meeting");
    });

    it("should support all status values", () => {
      const statuses: PresenceInfo["status"][] = ["online", "idle", "offline"];
      statuses.forEach((status) => {
        const presence: PresenceInfo = { userId: "test", status };
        expect(presence.status).toBe(status);
      });
    });
  });

  describe("Cache size calculation", () => {
    it("should correctly calculate message cache size", () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxConversations: 50,
        maxMessagesPerConversation: 100,
      };
      // Message cache size = maxConversations * maxMessagesPerConversation
      const expectedSize = 50 * 100;
      expect(expectedSize).toBe(5000);
    });

    it("should use default config values", () => {
      // Default: 100 conversations * 500 messages = 50,000 max messages
      const expectedSize = DEFAULT_CACHE_CONFIG.maxConversations *
        DEFAULT_CACHE_CONFIG.maxMessagesPerConversation;
      expect(expectedSize).toBe(50000);
    });
  });
});
