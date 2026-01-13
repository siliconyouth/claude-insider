/**
 * Content Utilities Tests
 *
 * Tests for content analysis, reading time, word count, and table of contents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateReadingTime,
  extractTOCFromMarkdown,
  getWordCount,
  getCharacterCount,
  formatDate,
  type TOCItem,
  type ReadingTimeResult,
} from "@/lib/content-utils";

describe("calculateReadingTime", () => {
  it("should calculate reading time for simple text", () => {
    // 200 words = 1 minute at 200 WPM
    const text = "word ".repeat(200);
    const result = calculateReadingTime(text);

    expect(result.minutes).toBe(1);
    expect(result.words).toBe(200);
    expect(result.text).toBe("1 min read");
  });

  it("should return 1 min for very short content (ceil rounds up)", () => {
    const result = calculateReadingTime("Hello world");

    // Math.ceil rounds up, so even 2 words becomes 1 min
    expect(result.minutes).toBe(1);
    expect(result.text).toBe("1 min read");
  });

  it("should handle empty string", () => {
    const result = calculateReadingTime("");

    expect(result.words).toBe(0);
    expect(result.minutes).toBe(0);
  });

  it("should add time for code blocks", () => {
    const textOnly = "word ".repeat(100); // 0.5 min
    const withCode = textOnly + "```javascript\nconst x = 1;\nconst y = 2;\n```";

    const textResult = calculateReadingTime(textOnly);
    const codeResult = calculateReadingTime(withCode);

    // Code should add extra time
    expect(codeResult.minutes).toBeGreaterThanOrEqual(textResult.minutes);
  });

  it("should handle inline code", () => {
    const text = "Use the `console.log` function for debugging";
    const result = calculateReadingTime(text);

    expect(result).toHaveProperty("minutes");
    expect(result).toHaveProperty("words");
    expect(result).toHaveProperty("text");
  });

  it("should remove markdown syntax from word count", () => {
    const markdown = "# Heading\n\n**Bold** and *italic* text with [links](url)";
    const result = calculateReadingTime(markdown);

    // Word count should not include markdown characters
    expect(result.words).toBeGreaterThan(0);
  });

  it("should pluralize minutes correctly", () => {
    const shortText = "word ".repeat(50);
    const longText = "word ".repeat(600);

    const shortResult = calculateReadingTime(shortText);
    const longResult = calculateReadingTime(longText);

    expect(shortResult.text).toMatch(/min read$/);
    expect(longResult.text).toMatch(/^\d+ min read$/);
  });

  it("should return correct structure", () => {
    const result = calculateReadingTime("Test content here");

    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("minutes");
    expect(result).toHaveProperty("words");
    expect(typeof result.text).toBe("string");
    expect(typeof result.minutes).toBe("number");
    expect(typeof result.words).toBe("number");
  });
});

describe("extractTOCFromMarkdown", () => {
  it("should extract h2 headings", () => {
    const markdown = `
# Main Title
## First Section
Some content
## Second Section
More content
`;
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc).toHaveLength(2);
    expect(toc[0]?.text).toBe("First Section");
    expect(toc[1]?.text).toBe("Second Section");
  });

  it("should extract nested headings (h3 under h2)", () => {
    const markdown = `
## Parent Section
### Child Section
### Another Child
## Another Parent
`;
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc).toHaveLength(2);
    expect(toc[0]?.text).toBe("Parent Section");
    expect(toc[0]?.children).toHaveLength(2);
    expect(toc[0]?.children?.[0]?.text).toBe("Child Section");
  });

  it("should generate IDs from heading text", () => {
    const markdown = "## Hello World";
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc[0]?.id).toBe("hello-world");
  });

  it("should handle special characters in IDs", () => {
    const markdown = "## What's New in 2024?";
    const toc = extractTOCFromMarkdown(markdown);

    // ID should be slugified
    expect(toc[0]?.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("should set correct level numbers", () => {
    const markdown = `
## Level 2
### Level 3
#### Level 4
`;
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc[0]?.level).toBe(2);
    expect(toc[0]?.children?.[0]?.level).toBe(3);
    expect(toc[0]?.children?.[0]?.children?.[0]?.level).toBe(4);
  });

  it("should ignore h1 headings", () => {
    const markdown = `
# Title (h1)
## Section (h2)
`;
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc).toHaveLength(1);
    expect(toc[0]?.level).toBe(2);
  });

  it("should return empty array for no headings", () => {
    const markdown = "Just some text without headings";
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc).toEqual([]);
  });

  it("should handle empty string", () => {
    const toc = extractTOCFromMarkdown("");
    expect(toc).toEqual([]);
  });

  it("should handle multiple nested levels", () => {
    const markdown = `
## Section A
### Subsection A.1
#### Detail A.1.1
### Subsection A.2
## Section B
### Subsection B.1
`;
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc).toHaveLength(2);
    expect(toc[0]?.children).toHaveLength(2);
    expect(toc[0]?.children?.[0]?.children).toHaveLength(1);
    expect(toc[1]?.children).toHaveLength(1);
  });
});

describe("getWordCount", () => {
  it("should count words in simple text", () => {
    expect(getWordCount("Hello world")).toBe(2);
    expect(getWordCount("One two three four five")).toBe(5);
  });

  it("should handle empty string", () => {
    expect(getWordCount("")).toBe(0);
  });

  it("should handle multiple spaces", () => {
    expect(getWordCount("Hello    world")).toBe(2);
  });

  it("should handle newlines and tabs", () => {
    expect(getWordCount("Hello\nworld\there")).toBe(3);
  });

  it("should exclude code blocks from count", () => {
    const content = "Hello world ```code here``` more text";
    const count = getWordCount(content);

    // Should count "Hello world more text" but not "code here"
    expect(count).toBe(4);
  });

  it("should remove markdown syntax", () => {
    const content = "**Bold** and *italic* text";
    const count = getWordCount(content);

    // Should count "Bold and italic text"
    expect(count).toBe(4);
  });

  it("should handle markdown links", () => {
    const content = "Check [this link](https://example.com) out";
    const count = getWordCount(content);

    // Words without markdown syntax
    expect(count).toBeGreaterThan(0);
  });
});

describe("getCharacterCount", () => {
  it("should count characters including spaces", () => {
    expect(getCharacterCount("Hello world")).toBe(11);
  });

  it("should count characters excluding spaces", () => {
    expect(getCharacterCount("Hello world", false)).toBe(10);
  });

  it("should default to including spaces", () => {
    expect(getCharacterCount("a b c")).toBe(5);
  });

  it("should handle empty string", () => {
    expect(getCharacterCount("")).toBe(0);
    expect(getCharacterCount("", false)).toBe(0);
  });

  it("should handle newlines and tabs", () => {
    const content = "Hello\nWorld\tTab";
    const withSpaces = getCharacterCount(content);
    const withoutSpaces = getCharacterCount(content, false);

    expect(withSpaces).toBeGreaterThan(withoutSpaces);
  });

  it("should count unicode characters", () => {
    expect(getCharacterCount("Hello 👋")).toBe(8); // emoji is 2 code points
  });
});

describe("formatDate", () => {
  // Mock Date for consistent tests
  const realDate = Date;
  const mockNow = new Date("2024-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("short format", () => {
    it("should format date in short format", () => {
      const result = formatDate("2024-01-15", "short");

      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it("should use short as default format", () => {
      const result = formatDate("2024-01-15");

      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it("should accept Date object", () => {
      const result = formatDate(new Date("2024-01-15"), "short");

      expect(result).toMatch(/Jan.*15.*2024/);
    });
  });

  describe("long format", () => {
    it("should format date in long format", () => {
      const result = formatDate("2024-01-15", "long");

      expect(result).toMatch(/January.*15.*2024/);
    });
  });

  describe("relative format", () => {
    it("should return 'just now' for very recent dates", () => {
      const result = formatDate(mockNow, "relative");

      expect(result).toBe("just now");
    });

    it("should return minutes ago", () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60 * 1000);
      const result = formatDate(fiveMinutesAgo, "relative");

      expect(result).toBe("5m ago");
    });

    it("should return hours ago", () => {
      const threeHoursAgo = new Date(mockNow.getTime() - 3 * 60 * 60 * 1000);
      const result = formatDate(threeHoursAgo, "relative");

      expect(result).toBe("3h ago");
    });

    it("should return days ago", () => {
      const twoDaysAgo = new Date(mockNow.getTime() - 2 * 24 * 60 * 60 * 1000);
      const result = formatDate(twoDaysAgo, "relative");

      expect(result).toBe("2d ago");
    });

    it("should return months ago", () => {
      const twoMonthsAgo = new Date(mockNow.getTime() - 60 * 24 * 60 * 60 * 1000);
      const result = formatDate(twoMonthsAgo, "relative");

      expect(result).toBe("2mo ago");
    });

    it("should return years ago", () => {
      const twoYearsAgo = new Date(mockNow.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      const result = formatDate(twoYearsAgo, "relative");

      expect(result).toBe("2y ago");
    });
  });
});

describe("Type exports", () => {
  it("should export TOCItem type with correct shape", () => {
    const item: TOCItem = {
      id: "test-id",
      text: "Test Heading",
      level: 2,
      children: [],
    };

    expect(item.id).toBe("test-id");
    expect(item.text).toBe("Test Heading");
    expect(item.level).toBe(2);
  });

  it("should allow TOCItem without children", () => {
    const item: TOCItem = {
      id: "test-id",
      text: "Test Heading",
      level: 2,
    };

    expect(item.children).toBeUndefined();
  });

  it("should export ReadingTimeResult type with correct shape", () => {
    const result: ReadingTimeResult = {
      text: "5 min read",
      minutes: 5,
      words: 1000,
    };

    expect(result.text).toBe("5 min read");
    expect(result.minutes).toBe(5);
    expect(result.words).toBe(1000);
  });
});

describe("Edge cases", () => {
  it("should handle very long content", () => {
    const longContent = "word ".repeat(10000);
    const result = calculateReadingTime(longContent);

    expect(result.words).toBe(10000);
    expect(result.minutes).toBe(50); // 10000 / 200
  });

  it("should handle content with only code blocks", () => {
    const codeOnly = "```javascript\nconst x = 1;\nconst y = 2;\n```";
    const result = calculateReadingTime(codeOnly);

    expect(result.words).toBe(0);
    expect(result.minutes).toBeGreaterThanOrEqual(0);
  });

  it("should handle deeply nested TOC", () => {
    const markdown = `
## Level 2
### Level 3
#### Level 4
#### Another Level 4
### Another Level 3
`;
    const toc = extractTOCFromMarkdown(markdown);

    expect(toc[0]?.children?.[0]?.children?.length).toBe(2);
  });

  it("should handle unicode content", () => {
    const content = "こんにちは世界 Hello 世界";
    const wordCount = getWordCount(content);
    const charCount = getCharacterCount(content);

    expect(wordCount).toBeGreaterThan(0);
    expect(charCount).toBeGreaterThan(0);
  });
});
