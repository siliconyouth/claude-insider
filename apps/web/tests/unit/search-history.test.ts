/**
 * Search History Tests
 *
 * Tests for localStorage-based search history management.
 * Covers adding, removing, and limiting search history items.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  type SearchHistoryItem,
} from "@/lib/search-history";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Setup window and localStorage mocks
beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal("window", { localStorage: localStorageMock });
  vi.stubGlobal("localStorage", localStorageMock);
});

describe("Search History", () => {
  describe("getSearchHistory", () => {
    it("should return empty array when no history exists", () => {
      const history = getSearchHistory();
      expect(history).toEqual([]);
    });

    it("should return stored history", () => {
      const items: SearchHistoryItem[] = [
        { query: "test query", timestamp: 1704067200000 },
      ];
      localStorage.setItem("claude-insider-search-history", JSON.stringify(items));

      const history = getSearchHistory();
      expect(history).toEqual(items);
    });

    it("should return empty array for invalid JSON", () => {
      localStorage.setItem("claude-insider-search-history", "invalid json");

      const history = getSearchHistory();
      expect(history).toEqual([]);
    });

    it("should return multiple items", () => {
      const items: SearchHistoryItem[] = [
        { query: "first", timestamp: 1704067200000 },
        { query: "second", timestamp: 1704067100000 },
        { query: "third", timestamp: 1704067000000 },
      ];
      localStorage.setItem("claude-insider-search-history", JSON.stringify(items));

      const history = getSearchHistory();
      expect(history).toHaveLength(3);
    });
  });

  describe("addToSearchHistory", () => {
    it("should add new query to history", () => {
      addToSearchHistory("test query");

      const history = getSearchHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.query).toBe("test query");
    });

    it("should add timestamp to history item", () => {
      const before = Date.now();
      addToSearchHistory("test query");
      const after = Date.now();

      const history = getSearchHistory();
      expect(history[0]?.timestamp).toBeGreaterThanOrEqual(before);
      expect(history[0]?.timestamp).toBeLessThanOrEqual(after);
    });

    it("should trim whitespace from query", () => {
      addToSearchHistory("  test query  ");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("test query");
    });

    it("should not add empty query", () => {
      addToSearchHistory("");

      const history = getSearchHistory();
      expect(history).toHaveLength(0);
    });

    it("should not add whitespace-only query", () => {
      addToSearchHistory("   ");

      const history = getSearchHistory();
      expect(history).toHaveLength(0);
    });

    it("should add new query at beginning", () => {
      addToSearchHistory("first");
      addToSearchHistory("second");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("second");
      expect(history[1]?.query).toBe("first");
    });

    it("should remove duplicate query (case-insensitive)", () => {
      addToSearchHistory("Test Query");
      addToSearchHistory("test query");

      const history = getSearchHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.query).toBe("test query");
    });

    it("should preserve capitalization of new query", () => {
      addToSearchHistory("test query");
      addToSearchHistory("TEST QUERY");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("TEST QUERY");
    });

    it("should limit history to 5 items", () => {
      for (let i = 1; i <= 7; i++) {
        addToSearchHistory(`query ${i}`);
      }

      const history = getSearchHistory();
      expect(history).toHaveLength(5);
    });

    it("should keep most recent items when limiting", () => {
      for (let i = 1; i <= 7; i++) {
        addToSearchHistory(`query ${i}`);
      }

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("query 7");
      expect(history[4]?.query).toBe("query 3");
    });

    it("should handle multiple duplicates correctly", () => {
      addToSearchHistory("a");
      addToSearchHistory("b");
      addToSearchHistory("a");
      addToSearchHistory("c");
      addToSearchHistory("a");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("a");
      expect(history.filter((h) => h.query === "a")).toHaveLength(1);
    });
  });

  describe("removeFromSearchHistory", () => {
    it("should remove specific query", () => {
      addToSearchHistory("query1");
      addToSearchHistory("query2");
      addToSearchHistory("query3");

      removeFromSearchHistory("query2");

      const history = getSearchHistory();
      expect(history).toHaveLength(2);
      expect(history.map((h) => h.query)).not.toContain("query2");
    });

    it("should remove query case-insensitively", () => {
      addToSearchHistory("Test Query");

      removeFromSearchHistory("test query");

      const history = getSearchHistory();
      expect(history).toHaveLength(0);
    });

    it("should not affect other queries", () => {
      addToSearchHistory("keep1");
      addToSearchHistory("remove");
      addToSearchHistory("keep2");

      removeFromSearchHistory("remove");

      const history = getSearchHistory();
      expect(history.map((h) => h.query)).toContain("keep1");
      expect(history.map((h) => h.query)).toContain("keep2");
    });

    it("should handle removing non-existent query", () => {
      addToSearchHistory("existing");

      removeFromSearchHistory("non-existent");

      const history = getSearchHistory();
      expect(history).toHaveLength(1);
    });

    it("should handle empty history", () => {
      removeFromSearchHistory("anything");

      const history = getSearchHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe("clearSearchHistory", () => {
    it("should clear all history", () => {
      addToSearchHistory("query1");
      addToSearchHistory("query2");
      addToSearchHistory("query3");

      clearSearchHistory();

      const history = getSearchHistory();
      expect(history).toHaveLength(0);
    });

    it("should handle already empty history", () => {
      clearSearchHistory();

      const history = getSearchHistory();
      expect(history).toHaveLength(0);
    });

    it("should remove the localStorage key", () => {
      addToSearchHistory("test");
      clearSearchHistory();

      expect(localStorage.getItem("claude-insider-search-history")).toBeNull();
    });
  });

  describe("SearchHistoryItem type", () => {
    it("should accept valid SearchHistoryItem", () => {
      const item: SearchHistoryItem = {
        query: "test",
        timestamp: 1704067200000,
      };
      expect(item.query).toBe("test");
      expect(item.timestamp).toBe(1704067200000);
    });

    it("should work with Date.now() timestamp", () => {
      const item: SearchHistoryItem = {
        query: "test",
        timestamp: Date.now(),
      };
      expect(typeof item.timestamp).toBe("number");
    });
  });

  describe("Edge cases", () => {
    it("should handle query with special characters", () => {
      addToSearchHistory("query with @#$%^&*() chars");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("query with @#$%^&*() chars");
    });

    it("should handle query with unicode", () => {
      addToSearchHistory("日本語クエリ");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("日本語クエリ");
    });

    it("should handle query with emojis", () => {
      addToSearchHistory("🔍 search 🎯");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("🔍 search 🎯");
    });

    it("should handle very long query", () => {
      const longQuery = "a".repeat(1000);
      addToSearchHistory(longQuery);

      const history = getSearchHistory();
      expect(history[0]?.query).toBe(longQuery);
    });

    it("should handle query with newlines", () => {
      addToSearchHistory("query\nwith\nnewlines");

      const history = getSearchHistory();
      expect(history[0]?.query).toBe("query\nwith\nnewlines");
    });

    it("should handle rapid consecutive adds", () => {
      for (let i = 0; i < 10; i++) {
        addToSearchHistory(`rapid ${i}`);
      }

      const history = getSearchHistory();
      expect(history).toHaveLength(5);
    });
  });
});
