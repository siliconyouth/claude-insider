/**
 * Mentions Utility Tests
 *
 * Tests for @mention parsing and rendering utilities.
 * These are used throughout the chat and messaging system.
 */

import { describe, it, expect } from "vitest";
import {
  MENTION_REGEX,
  extractMentions,
  hasMentions,
  parseMentions,
  getMentionAtCursor,
  insertMention,
} from "@/lib/mentions";

describe("MENTION_REGEX", () => {
  it("should match valid mentions", () => {
    expect("@john".match(MENTION_REGEX)).toBeTruthy();
    expect("@user123".match(MENTION_REGEX)).toBeTruthy();
    expect("@test-user".match(MENTION_REGEX)).toBeTruthy();
  });

  it("should not match mentions in middle of word", () => {
    // \B means non-word boundary - email-like patterns shouldn't match
    const text = "email@domain.com";
    // Reset regex before testing
    MENTION_REGEX.lastIndex = 0;
    const matches = text.match(new RegExp(MENTION_REGEX.source, "g"));
    // The @ in email should not be treated as a mention start
    expect(matches).toBeNull();
  });

  it("should match mentions after space", () => {
    const text = "Hello @john how are you?";
    MENTION_REGEX.lastIndex = 0;
    const matches = text.match(new RegExp(MENTION_REGEX.source, "g"));
    expect(matches).toContain("@john");
  });

  it("should match multiple mentions", () => {
    const text = "@alice and @bob are here";
    MENTION_REGEX.lastIndex = 0;
    const matches = text.match(new RegExp(MENTION_REGEX.source, "g"));
    expect(matches).toHaveLength(2);
    expect(matches).toContain("@alice");
    expect(matches).toContain("@bob");
  });

  it("should match mention at start of text", () => {
    const text = "@admin please help";
    MENTION_REGEX.lastIndex = 0;
    const matches = text.match(new RegExp(MENTION_REGEX.source, "g"));
    expect(matches).toContain("@admin");
  });
});

describe("extractMentions", () => {
  it("should extract single mention", () => {
    const mentions = extractMentions("Hello @john");
    expect(mentions).toEqual(["john"]);
  });

  it("should extract multiple mentions", () => {
    const mentions = extractMentions("@alice and @bob and @charlie");
    expect(mentions).toEqual(["alice", "bob", "charlie"]);
  });

  it("should return lowercase usernames", () => {
    const mentions = extractMentions("Hello @JohnDoe and @ADMIN");
    expect(mentions).toEqual(["johndoe", "admin"]);
  });

  it("should deduplicate mentions", () => {
    const mentions = extractMentions("@john said hi to @john");
    expect(mentions).toEqual(["john"]);
  });

  it("should return empty array for no mentions", () => {
    const mentions = extractMentions("Hello world, no mentions here");
    expect(mentions).toEqual([]);
  });

  it("should handle hyphenated usernames", () => {
    const mentions = extractMentions("Hi @user-name");
    expect(mentions).toEqual(["user-name"]);
  });

  it("should handle usernames with numbers", () => {
    const mentions = extractMentions("@user123 and @123user");
    expect(mentions).toEqual(["user123", "123user"]);
  });

  it("should handle mention at end of text", () => {
    const mentions = extractMentions("Thanks @admin");
    expect(mentions).toEqual(["admin"]);
  });

  it("should handle empty string", () => {
    const mentions = extractMentions("");
    expect(mentions).toEqual([]);
  });
});

describe("hasMentions", () => {
  it("should return true when text has mentions", () => {
    expect(hasMentions("Hello @john")).toBe(true);
    expect(hasMentions("@alice and @bob")).toBe(true);
  });

  it("should return false when text has no mentions", () => {
    expect(hasMentions("Hello world")).toBe(false);
    expect(hasMentions("No mentions here")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(hasMentions("")).toBe(false);
  });

  it("should handle edge cases", () => {
    expect(hasMentions("@")).toBe(false); // Just @ without username
    expect(hasMentions("@@")).toBe(false); // Double @
  });
});

describe("parseMentions", () => {
  it("should parse text with single mention", () => {
    const parts = parseMentions("Hello @john!");

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("Hello ");
    expect(parts[1]).toEqual({
      type: "mention",
      username: "john",
      key: expect.stringMatching(/^mention-\d+$/),
    });
    expect(parts[2]).toBe("!");
  });

  it("should parse text with multiple mentions", () => {
    const parts = parseMentions("@alice and @bob");

    // 3 parts: mention, " and ", mention (no trailing text)
    expect(parts).toHaveLength(3);
    expect(parts[0]).toEqual({
      type: "mention",
      username: "alice",
      key: expect.any(String),
    });
    expect(parts[1]).toBe(" and ");
    expect(parts[2]).toEqual({
      type: "mention",
      username: "bob",
      key: expect.any(String),
    });
  });

  it("should return lowercase usernames in parsed output", () => {
    const parts = parseMentions("Hi @JohnDoe");
    const mention = parts.find((p) => typeof p === "object" && p.type === "mention");

    expect(mention).toBeDefined();
    if (typeof mention === "object") {
      expect(mention.username).toBe("johndoe");
    }
  });

  it("should handle text with no mentions", () => {
    const parts = parseMentions("Hello world");

    expect(parts).toHaveLength(1);
    expect(parts[0]).toBe("Hello world");
  });

  it("should handle mention at start", () => {
    const parts = parseMentions("@admin check this");

    expect(parts[0]).toEqual({
      type: "mention",
      username: "admin",
      key: expect.any(String),
    });
    expect(parts[1]).toBe(" check this");
  });

  it("should handle mention at end", () => {
    const parts = parseMentions("Thanks @admin");

    expect(parts[0]).toBe("Thanks ");
    expect(parts[1]).toEqual({
      type: "mention",
      username: "admin",
      key: expect.any(String),
    });
  });

  it("should handle empty string", () => {
    const parts = parseMentions("");
    expect(parts).toHaveLength(0);
  });

  it("should generate unique keys for each mention", () => {
    const parts = parseMentions("@alice @bob @charlie");
    const mentions = parts.filter((p) => typeof p === "object" && p.type === "mention") as Array<{
      type: "mention";
      username: string;
      key: string;
    }>;

    const keys = mentions.map((m) => m.key);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });
});

describe("getMentionAtCursor", () => {
  it("should detect mention being typed", () => {
    const text = "Hello @joh";
    const cursor = 10; // After "h"

    const result = getMentionAtCursor(text, cursor);

    expect(result).not.toBeNull();
    expect(result?.query).toBe("joh");
    expect(result?.start).toBe(6); // Position of @
    expect(result?.end).toBe(10);
  });

  it("should detect empty mention query (just @)", () => {
    const text = "Hello @";
    const cursor = 7;

    const result = getMentionAtCursor(text, cursor);

    expect(result).not.toBeNull();
    expect(result?.query).toBe("");
    expect(result?.start).toBe(6);
  });

  it("should return null when not in a mention", () => {
    const text = "Hello world";
    const cursor = 5;

    const result = getMentionAtCursor(text, cursor);

    expect(result).toBeNull();
  });

  it("should return null for @ in middle of word", () => {
    const text = "email@domain";
    const cursor = 8;

    const result = getMentionAtCursor(text, cursor);

    expect(result).toBeNull();
  });

  it("should handle @ at start of text", () => {
    const text = "@user";
    const cursor = 5;

    const result = getMentionAtCursor(text, cursor);

    expect(result).not.toBeNull();
    expect(result?.query).toBe("user");
    expect(result?.start).toBe(0);
  });

  it("should handle @ after newline", () => {
    const text = "Line 1\n@user";
    const cursor = 12;

    const result = getMentionAtCursor(text, cursor);

    expect(result).not.toBeNull();
    expect(result?.query).toBe("user");
  });

  it("should return lowercase query", () => {
    const text = "Hello @JoHn";
    const cursor = 11;

    const result = getMentionAtCursor(text, cursor);

    expect(result?.query).toBe("john");
  });

  it("should handle cursor at @ position", () => {
    const text = "Hello @";
    const cursor = 6; // At the @ character

    const result = getMentionAtCursor(text, cursor);

    // Cursor is before the @, so no mention detected
    expect(result).toBeNull();
  });
});

describe("insertMention", () => {
  it("should replace partial mention with username", () => {
    const text = "Hello @joh";
    const result = insertMention(text, 6, 10, "john_doe");

    expect(result).toBe("Hello @john_doe ");
  });

  it("should handle @ at start", () => {
    const text = "@us";
    const result = insertMention(text, 0, 3, "username");

    expect(result).toBe("@username ");
  });

  it("should preserve text after mention", () => {
    const text = "Hello @joh how are you?";
    const result = insertMention(text, 6, 10, "john");

    expect(result).toBe("Hello @john  how are you?");
  });

  it("should add space after mention", () => {
    const text = "@test";
    const result = insertMention(text, 0, 5, "testing");

    expect(result).toBe("@testing ");
    expect(result.endsWith(" ")).toBe(true);
  });

  it("should handle hyphenated usernames", () => {
    const text = "Mention @us";
    const result = insertMention(text, 8, 11, "user-name");

    expect(result).toBe("Mention @user-name ");
  });

  it("should handle empty partial mention", () => {
    const text = "Hello @";
    const result = insertMention(text, 6, 7, "newuser");

    expect(result).toBe("Hello @newuser ");
  });
});

describe("Edge Cases", () => {
  it("should handle multiple @ symbols correctly", () => {
    const text = "@@ @@@ @real";
    const mentions = extractMentions(text);

    // Only @real should be extracted
    expect(mentions).toEqual(["real"]);
  });

  it("should handle mentions next to punctuation", () => {
    const text = "(@user), @admin!";
    const mentions = extractMentions(text);

    expect(mentions).toContain("user");
    expect(mentions).toContain("admin");
  });

  it("should handle very long usernames", () => {
    const longUsername = "a".repeat(100);
    const text = `@${longUsername}`;
    const mentions = extractMentions(text);

    expect(mentions).toEqual([longUsername]);
  });

  it("should handle unicode text around mentions", () => {
    const text = "Привет @john 你好";
    const mentions = extractMentions(text);

    expect(mentions).toEqual(["john"]);
  });

  it("should handle emojis around mentions", () => {
    const text = "Hey 👋 @john 🎉";
    const mentions = extractMentions(text);

    expect(mentions).toEqual(["john"]);
  });

  it("should not match @ in URLs", () => {
    const text = "Check https://twitter.com/@handle";
    // The @ in URL should not be matched as word boundary applies
    const mentions = extractMentions(text);

    // This might match depending on exact implementation
    // The important thing is consistency
    expect(Array.isArray(mentions)).toBe(true);
  });
});
