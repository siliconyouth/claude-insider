/**
 * Resource Search Tests
 *
 * Tests for search result highlighting and grouping utilities.
 * These tests verify the text processing functions used in search UI.
 */

import { describe, it, expect } from "vitest";
import { highlightMatches, groupResultsByCategory } from "@/lib/resources/client-helpers";
import type { ResourceCategorySlug } from "@/data/resources/schema";

// Type for our search result format
interface MockSearchResult {
  item: {
    id: string;
    title: string;
    category: ResourceCategorySlug;
    description: string;
    url: string;
    tags: string[];
    status: "community" | "official";
    addedDate: string;
    lastVerified: string;
  };
  score: number;
}

describe("Resource Search Utilities", () => {
  describe("highlightMatches", () => {
    describe("No matches", () => {
      it("should return single non-highlighted segment for empty indices", () => {
        const result = highlightMatches("Hello World", []);
        expect(result).toEqual([{ text: "Hello World", highlighted: false }]);
      });

      it("should handle undefined indices", () => {
        const result = highlightMatches("Hello World", undefined as unknown as [number, number][]);
        expect(result).toEqual([{ text: "Hello World", highlighted: false }]);
      });

      it("should handle empty text", () => {
        const result = highlightMatches("", []);
        expect(result).toEqual([{ text: "", highlighted: false }]);
      });
    });

    describe("Single match", () => {
      it("should highlight match at start", () => {
        const result = highlightMatches("Hello World", [[0, 4]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: " World", highlighted: false },
        ]);
      });

      it("should highlight match at end", () => {
        const result = highlightMatches("Hello World", [[6, 10]]);
        expect(result).toEqual([
          { text: "Hello ", highlighted: false },
          { text: "World", highlighted: true },
        ]);
      });

      it("should highlight match in middle", () => {
        const result = highlightMatches("Hello World", [[3, 7]]);
        expect(result).toEqual([
          { text: "Hel", highlighted: false },
          { text: "lo Wo", highlighted: true },
          { text: "rld", highlighted: false },
        ]);
      });

      it("should highlight entire text", () => {
        const result = highlightMatches("Hello", [[0, 4]]);
        expect(result).toEqual([{ text: "Hello", highlighted: true }]);
      });

      it("should highlight single character", () => {
        const result = highlightMatches("Hello", [[0, 0]]);
        expect(result).toEqual([
          { text: "H", highlighted: true },
          { text: "ello", highlighted: false },
        ]);
      });
    });

    describe("Multiple matches", () => {
      it("should highlight multiple non-overlapping matches", () => {
        const result = highlightMatches("Hello World Test", [[0, 4], [12, 15]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: " World ", highlighted: false },
          { text: "Test", highlighted: true },
        ]);
      });

      it("should sort and highlight out-of-order indices", () => {
        const result = highlightMatches("Hello World Test", [[12, 15], [0, 4]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: " World ", highlighted: false },
          { text: "Test", highlighted: true },
        ]);
      });

      it("should highlight three matches", () => {
        const result = highlightMatches("abcdefghij", [[0, 1], [4, 5], [8, 9]]);
        expect(result).toEqual([
          { text: "ab", highlighted: true },
          { text: "cd", highlighted: false },
          { text: "ef", highlighted: true },
          { text: "gh", highlighted: false },
          { text: "ij", highlighted: true },
        ]);
      });

      it("should handle adjacent matches", () => {
        const result = highlightMatches("abcdef", [[0, 2], [3, 5]]);
        expect(result).toEqual([
          { text: "abc", highlighted: true },
          { text: "def", highlighted: true },
        ]);
      });
    });

    describe("Edge cases", () => {
      it("should handle text with special characters", () => {
        const result = highlightMatches("Hello, World!", [[0, 4]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: ", World!", highlighted: false },
        ]);
      });

      it("should handle text with unicode", () => {
        const result = highlightMatches("こんにちは World", [[0, 4]]);
        expect(result).toEqual([
          { text: "こんにちは", highlighted: true },
          { text: " World", highlighted: false },
        ]);
      });

      it("should handle text with emojis", () => {
        const result = highlightMatches("Hello 👋 World", [[0, 4]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: " 👋 World", highlighted: false },
        ]);
      });

      it("should handle very long text", () => {
        const longText = "a".repeat(1000);
        const result = highlightMatches(longText, [[0, 99], [500, 599]]);
        expect(result).toHaveLength(4);
        expect(result[0]?.text).toHaveLength(100);
        expect(result[0]?.highlighted).toBe(true);
      });

      it("should handle newlines in text", () => {
        const result = highlightMatches("Hello\nWorld", [[0, 4]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: "\nWorld", highlighted: false },
        ]);
      });

      it("should handle tabs in text", () => {
        const result = highlightMatches("Hello\tWorld", [[0, 4]]);
        expect(result).toEqual([
          { text: "Hello", highlighted: true },
          { text: "\tWorld", highlighted: false },
        ]);
      });
    });

    describe("Boundary conditions", () => {
      it("should handle index at exact end of string", () => {
        const text = "Hello";
        const result = highlightMatches(text, [[0, 4]]);
        expect(result).toEqual([{ text: "Hello", highlighted: true }]);
      });

      it("should handle match spanning whitespace", () => {
        const result = highlightMatches("Hello World", [[4, 6]]);
        expect(result).toEqual([
          { text: "Hell", highlighted: false },
          { text: "o W", highlighted: true },
          { text: "orld", highlighted: false },
        ]);
      });
    });
  });

  describe("groupResultsByCategory", () => {
    const createMockResult = (id: string, category: ResourceCategorySlug): MockSearchResult => ({
      item: {
        id,
        title: `Resource ${id}`,
        category,
        description: `Description for ${id}`,
        url: `https://example.com/${id}`,
        tags: [],
        status: "community",
        addedDate: "2024-01-01",
        lastVerified: "2024-01-01",
      },
      score: 0.5,
    });

    describe("Empty and single results", () => {
      it("should return empty object for empty results", () => {
        const result = groupResultsByCategory([]);
        expect(result).toEqual({});
      });

      it("should group single result", () => {
        const results = [createMockResult("1", "tools")];
        const grouped = groupResultsByCategory(results as unknown as Parameters<typeof groupResultsByCategory>[0]);
        expect(Object.keys(grouped)).toEqual(["tools"]);
        expect(grouped["tools"]).toHaveLength(1);
      });
    });

    describe("Multiple categories", () => {
      it("should group results by category", () => {
        const results = [
          createMockResult("1", "tools"),
          createMockResult("2", "mcp-servers"),
          createMockResult("3", "tools"),
          createMockResult("4", "sdks"),
        ];
        const grouped = groupResultsByCategory(results as unknown as Parameters<typeof groupResultsByCategory>[0]);

        expect(Object.keys(grouped).sort()).toEqual(["mcp-servers", "sdks", "tools"]);
        expect(grouped["tools"]).toHaveLength(2);
        expect(grouped["mcp-servers"]).toHaveLength(1);
        expect(grouped["sdks"]).toHaveLength(1);
      });

      it("should preserve order within categories", () => {
        const results = [
          createMockResult("1", "tools"),
          createMockResult("2", "tools"),
          createMockResult("3", "tools"),
        ];
        const grouped = groupResultsByCategory(results as unknown as Parameters<typeof groupResultsByCategory>[0]);

        expect(grouped["tools"]?.[0]?.item.id).toBe("1");
        expect(grouped["tools"]?.[1]?.item.id).toBe("2");
        expect(grouped["tools"]?.[2]?.item.id).toBe("3");
      });
    });

    describe("All categories", () => {
      it("should handle all 10 category types", () => {
        const categories: ResourceCategorySlug[] = [
          "official",
          "tools",
          "mcp-servers",
          "rules",
          "prompts",
          "agents",
          "tutorials",
          "sdks",
          "showcases",
          "community",
        ];
        const results = categories.map((cat, i) => createMockResult(String(i), cat));
        const grouped = groupResultsByCategory(results as unknown as Parameters<typeof groupResultsByCategory>[0]);

        expect(Object.keys(grouped).sort()).toEqual([...categories].sort());
        categories.forEach((cat) => {
          expect(grouped[cat]).toHaveLength(1);
        });
      });
    });

    describe("Large datasets", () => {
      it("should handle 100 results", () => {
        const categories: ResourceCategorySlug[] = ["tools", "mcp-servers", "sdks"];
        const results = Array.from({ length: 100 }, (_, i) =>
          createMockResult(String(i), categories[i % 3]!)
        );
        const grouped = groupResultsByCategory(results as unknown as Parameters<typeof groupResultsByCategory>[0]);

        expect(grouped["tools"]).toHaveLength(34);
        expect(grouped["mcp-servers"]).toHaveLength(33);
        expect(grouped["sdks"]).toHaveLength(33);
      });
    });
  });

  describe("Search result scoring", () => {
    it("should maintain score in grouped results", () => {
      const results = [
        {
          item: {
            id: "1",
            title: "High Score",
            category: "tools" as ResourceCategorySlug,
            description: "",
            url: "https://example.com/1",
            tags: [],
            status: "community" as const,
            addedDate: "2024-01-01",
            lastVerified: "2024-01-01",
          },
          score: 0.1,
        },
        {
          item: {
            id: "2",
            title: "Low Score",
            category: "tools" as ResourceCategorySlug,
            description: "",
            url: "https://example.com/2",
            tags: [],
            status: "community" as const,
            addedDate: "2024-01-01",
            lastVerified: "2024-01-01",
          },
          score: 0.9,
        },
      ];
      const grouped = groupResultsByCategory(results as unknown as Parameters<typeof groupResultsByCategory>[0]);

      expect(grouped["tools"]?.[0]?.score).toBe(0.1);
      expect(grouped["tools"]?.[1]?.score).toBe(0.9);
    });
  });

  describe("Match indices validation", () => {
    it("should correctly join highlighted segments back to original", () => {
      const original = "Claude AI is amazing";
      const result = highlightMatches(original, [[0, 5], [10, 11]]);
      const reconstructed = result.map((r) => r.text).join("");
      expect(reconstructed).toBe(original);
    });

    it("should correctly join multiple segments back to original", () => {
      const original = "The quick brown fox jumps over the lazy dog";
      const result = highlightMatches(original, [[4, 8], [16, 18], [35, 38]]);
      const reconstructed = result.map((r) => r.text).join("");
      expect(reconstructed).toBe(original);
    });

    it("should preserve exact text length", () => {
      const original = "abcdefghij";
      const result = highlightMatches(original, [[2, 4], [7, 8]]);
      const totalLength = result.reduce((sum, r) => sum + r.text.length, 0);
      expect(totalLength).toBe(original.length);
    });
  });
});
