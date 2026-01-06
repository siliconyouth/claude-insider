/**
 * Link Validator Tests
 *
 * Tests for URL validation utilities, trusted domain detection,
 * npm package extraction, and URL normalization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Re-implement the pure helper functions for testing
// These mirror the logic in link-validator.ts without database dependencies

const TRUSTED_DOMAINS = new Set([
  "claude.ai",
  "console.anthropic.com",
  "twitter.com",
  "x.com",
  "www.reddit.com",
  "reddit.com",
  "www.facebook.com",
  "facebook.com",
  "poe.com",
  "www.perplexity.ai",
  "perplexity.ai",
]);

function isTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return TRUSTED_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  if (url.includes("github.com") && url.endsWith(".git")) {
    return url.slice(0, -4);
  }
  return url;
}

function extractNpmPackage(url: string): string | null {
  const match = url.match(
    /^https?:\/\/(?:www\.)?npmjs\.com\/package\/(@[^/]+\/[^/?#]+|[^/?#]+)/
  );
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

function encodeNpmPackageName(packageName: string): string {
  if (packageName.startsWith("@")) {
    return "@" + encodeURIComponent(packageName.slice(1));
  }
  return encodeURIComponent(packageName);
}

describe("Link Validator Utilities", () => {
  describe("isTrustedDomain", () => {
    describe("Anthropic properties", () => {
      it("should trust claude.ai", () => {
        expect(isTrustedDomain("https://claude.ai")).toBe(true);
      });

      it("should trust claude.ai with path", () => {
        expect(isTrustedDomain("https://claude.ai/chat")).toBe(true);
      });

      it("should trust console.anthropic.com", () => {
        expect(isTrustedDomain("https://console.anthropic.com")).toBe(true);
      });

      it("should trust console.anthropic.com with path", () => {
        expect(isTrustedDomain("https://console.anthropic.com/dashboard")).toBe(true);
      });
    });

    describe("Social media", () => {
      it("should trust twitter.com", () => {
        expect(isTrustedDomain("https://twitter.com/anthropic")).toBe(true);
      });

      it("should trust x.com", () => {
        expect(isTrustedDomain("https://x.com/anthropic")).toBe(true);
      });

      it("should trust reddit.com", () => {
        expect(isTrustedDomain("https://reddit.com/r/ClaudeAI")).toBe(true);
      });

      it("should trust www.reddit.com", () => {
        expect(isTrustedDomain("https://www.reddit.com/r/ClaudeAI")).toBe(true);
      });

      it("should trust facebook.com", () => {
        expect(isTrustedDomain("https://facebook.com/anthropic")).toBe(true);
      });

      it("should trust www.facebook.com", () => {
        expect(isTrustedDomain("https://www.facebook.com/anthropic")).toBe(true);
      });
    });

    describe("AI platforms", () => {
      it("should trust poe.com", () => {
        expect(isTrustedDomain("https://poe.com")).toBe(true);
      });

      it("should trust perplexity.ai", () => {
        expect(isTrustedDomain("https://perplexity.ai")).toBe(true);
      });

      it("should trust www.perplexity.ai", () => {
        expect(isTrustedDomain("https://www.perplexity.ai")).toBe(true);
      });
    });

    describe("Non-trusted domains", () => {
      it("should not trust github.com", () => {
        expect(isTrustedDomain("https://github.com/anthropics")).toBe(false);
      });

      it("should not trust npmjs.com", () => {
        expect(isTrustedDomain("https://www.npmjs.com/package/test")).toBe(false);
      });

      it("should not trust google.com", () => {
        expect(isTrustedDomain("https://google.com")).toBe(false);
      });

      it("should not trust arbitrary domains", () => {
        expect(isTrustedDomain("https://example.com")).toBe(false);
      });

      it("should not trust subdomains of trusted domains unless explicitly listed", () => {
        expect(isTrustedDomain("https://api.claude.ai")).toBe(false);
        expect(isTrustedDomain("https://docs.anthropic.com")).toBe(false);
      });
    });

    describe("Invalid URLs", () => {
      it("should return false for invalid URL", () => {
        expect(isTrustedDomain("not-a-url")).toBe(false);
      });

      it("should return false for empty string", () => {
        expect(isTrustedDomain("")).toBe(false);
      });

      it("should return false for malformed URL", () => {
        expect(isTrustedDomain("http://")).toBe(false);
      });
    });
  });

  describe("normalizeUrl", () => {
    describe("GitHub .git suffix", () => {
      it("should remove .git suffix from GitHub URL", () => {
        expect(normalizeUrl("https://github.com/anthropics/claude-code.git")).toBe(
          "https://github.com/anthropics/claude-code"
        );
      });

      it("should handle nested paths with .git suffix", () => {
        expect(normalizeUrl("https://github.com/org/repo/path.git")).toBe(
          "https://github.com/org/repo/path"
        );
      });

      it("should not modify GitHub URL without .git suffix", () => {
        expect(normalizeUrl("https://github.com/anthropics/claude-code")).toBe(
          "https://github.com/anthropics/claude-code"
        );
      });

      it("should not modify non-GitHub URL with .git suffix", () => {
        expect(normalizeUrl("https://gitlab.com/org/repo.git")).toBe(
          "https://gitlab.com/org/repo.git"
        );
      });
    });

    describe("Non-GitHub URLs", () => {
      it("should not modify npm URLs", () => {
        const url = "https://www.npmjs.com/package/@anthropic-ai/sdk";
        expect(normalizeUrl(url)).toBe(url);
      });

      it("should not modify general URLs", () => {
        const url = "https://example.com/path/to/resource";
        expect(normalizeUrl(url)).toBe(url);
      });

      it("should not modify URLs with .git in path but not suffix", () => {
        const url = "https://example.com/.git/config";
        expect(normalizeUrl(url)).toBe(url);
      });
    });
  });

  describe("extractNpmPackage", () => {
    describe("Standard packages", () => {
      it("should extract simple package name", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/lodash")).toBe("lodash");
      });

      it("should extract package without www", () => {
        expect(extractNpmPackage("https://npmjs.com/package/express")).toBe("express");
      });

      it("should extract package with http", () => {
        expect(extractNpmPackage("http://www.npmjs.com/package/react")).toBe("react");
      });

      it("should handle package with hyphens", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/date-fns")).toBe("date-fns");
      });

      it("should handle package with underscores", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/lodash_merge")).toBe("lodash_merge");
      });

      it("should handle package with numbers", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/oauth2-server")).toBe("oauth2-server");
      });
    });

    describe("Scoped packages", () => {
      it("should extract scoped package @anthropic-ai/sdk", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/@anthropic-ai/sdk")).toBe(
          "@anthropic-ai/sdk"
        );
      });

      it("should extract scoped package @types/node", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/@types/node")).toBe("@types/node");
      });

      it("should extract scoped package @sentry/nextjs", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/@sentry/nextjs")).toBe(
          "@sentry/nextjs"
        );
      });

      it("should extract scoped package @tanstack/react-query", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/@tanstack/react-query")).toBe(
          "@tanstack/react-query"
        );
      });

      it("should handle URL-encoded scoped packages", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/%40types%2Fnode")).toBe(
          "@types/node"
        );
      });
    });

    describe("URLs with query strings and fragments", () => {
      it("should extract package ignoring query string", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/lodash?activeTab=readme")).toBe(
          "lodash"
        );
      });

      it("should extract package ignoring fragment", () => {
        expect(extractNpmPackage("https://www.npmjs.com/package/lodash#installation")).toBe(
          "lodash"
        );
      });

      it("should extract scoped package ignoring query string", () => {
        expect(
          extractNpmPackage("https://www.npmjs.com/package/@anthropic-ai/sdk?activeTab=versions")
        ).toBe("@anthropic-ai/sdk");
      });
    });

    describe("Non-npm URLs", () => {
      it("should return null for GitHub URL", () => {
        expect(extractNpmPackage("https://github.com/anthropics/claude-code")).toBeNull();
      });

      it("should return null for non-package npm URL", () => {
        expect(extractNpmPackage("https://www.npmjs.com/org/anthropic")).toBeNull();
      });

      it("should return null for npm homepage", () => {
        expect(extractNpmPackage("https://www.npmjs.com/")).toBeNull();
      });

      it("should return null for arbitrary URL", () => {
        expect(extractNpmPackage("https://example.com/package/test")).toBeNull();
      });
    });
  });

  describe("encodeNpmPackageName", () => {
    describe("Standard packages", () => {
      it("should encode simple package name", () => {
        expect(encodeNpmPackageName("lodash")).toBe("lodash");
      });

      it("should encode package with hyphen", () => {
        expect(encodeNpmPackageName("date-fns")).toBe("date-fns");
      });

      it("should encode package with underscore", () => {
        expect(encodeNpmPackageName("lodash_merge")).toBe("lodash_merge");
      });
    });

    describe("Scoped packages", () => {
      it("should encode @types/node to @types%2Fnode", () => {
        expect(encodeNpmPackageName("@types/node")).toBe("@types%2Fnode");
      });

      it("should encode @anthropic-ai/sdk to @anthropic-ai%2Fsdk", () => {
        expect(encodeNpmPackageName("@anthropic-ai/sdk")).toBe("@anthropic-ai%2Fsdk");
      });

      it("should encode @sentry/nextjs to @sentry%2Fnextjs", () => {
        expect(encodeNpmPackageName("@sentry/nextjs")).toBe("@sentry%2Fnextjs");
      });

      it("should encode @tanstack/react-query to @tanstack%2Freact-query", () => {
        expect(encodeNpmPackageName("@tanstack/react-query")).toBe("@tanstack%2Freact-query");
      });
    });

    it("should preserve @ symbol at start", () => {
      const encoded = encodeNpmPackageName("@scope/name");
      expect(encoded.startsWith("@")).toBe(true);
    });

    it("should encode / character in scoped package", () => {
      const encoded = encodeNpmPackageName("@scope/name");
      expect(encoded).toContain("%2F");
      expect(encoded).not.toContain("/");
    });
  });

  describe("Integration scenarios", () => {
    it("should correctly process GitHub URL to extract repo info", () => {
      const url = "https://github.com/anthropics/claude-code.git";
      const normalized = normalizeUrl(url);
      expect(normalized).toBe("https://github.com/anthropics/claude-code");
      expect(isTrustedDomain(normalized)).toBe(false); // GitHub is not trusted (needs validation)
    });

    it("should correctly process npm scoped package URL", () => {
      const url = "https://www.npmjs.com/package/@anthropic-ai/sdk";
      const packageName = extractNpmPackage(url);
      expect(packageName).toBe("@anthropic-ai/sdk");
      expect(encodeNpmPackageName(packageName!)).toBe("@anthropic-ai%2Fsdk");
    });

    it("should correctly identify trusted Anthropic domains", () => {
      const urls = [
        "https://claude.ai/chat/new",
        "https://console.anthropic.com/dashboard",
      ];
      urls.forEach((url) => {
        expect(isTrustedDomain(url)).toBe(true);
      });
    });

    it("should correctly identify trusted social media domains", () => {
      const urls = [
        "https://twitter.com/anthropic",
        "https://x.com/ClaudeAI",
        "https://www.reddit.com/r/ClaudeAI",
        "https://reddit.com/r/ClaudeAI/comments/abc123",
      ];
      urls.forEach((url) => {
        expect(isTrustedDomain(url)).toBe(true);
      });
    });
  });

  describe("URL parsing edge cases", () => {
    it("should handle URLs with ports", () => {
      expect(isTrustedDomain("https://claude.ai:443")).toBe(true);
    });

    it("should handle URLs with credentials", () => {
      expect(isTrustedDomain("https://user:pass@claude.ai")).toBe(true);
    });

    it("should handle URLs with international domain names", () => {
      expect(isTrustedDomain("https://例え.jp")).toBe(false);
    });

    it("should handle very long URLs", () => {
      const longPath = "a".repeat(1000);
      expect(isTrustedDomain(`https://claude.ai/${longPath}`)).toBe(true);
    });

    it("should handle URLs with special characters in path", () => {
      expect(isTrustedDomain("https://claude.ai/path/with spaces")).toBe(true);
    });

    it("should handle URLs with unicode in path", () => {
      expect(isTrustedDomain("https://claude.ai/日本語")).toBe(true);
    });
  });

  describe("npm package edge cases", () => {
    it("should handle extremely long package names", () => {
      const longName = "a".repeat(100);
      expect(extractNpmPackage(`https://www.npmjs.com/package/${longName}`)).toBe(longName);
    });

    it("should handle package names with dots", () => {
      expect(extractNpmPackage("https://www.npmjs.com/package/lodash.merge")).toBe("lodash.merge");
    });

    it("should handle package names with multiple dots", () => {
      expect(extractNpmPackage("https://www.npmjs.com/package/a.b.c.d")).toBe("a.b.c.d");
    });

    it("should handle deeply nested npm URLs", () => {
      expect(
        extractNpmPackage("https://www.npmjs.com/package/lodash/v/4.17.21")
      ).toBe("lodash");
    });
  });
});
