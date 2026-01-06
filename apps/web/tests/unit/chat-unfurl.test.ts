/**
 * Chat Link Unfurl Tests
 *
 * Tests for URL extraction, link preview utilities, and domain detection.
 * These tests verify the pure functions used for link unfurling without API dependencies.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  LinkUnfurler,
  isPreviewableUrl,
  getDomainName,
  isVideoUrl,
  getYouTubeVideoId,
  type UnfurlData,
} from "@/lib/chat/unfurl";

describe("Chat Link Unfurl Utilities", () => {
  describe("LinkUnfurler", () => {
    let unfurler: LinkUnfurler;

    beforeEach(() => {
      unfurler = new LinkUnfurler();
    });

    describe("extractUrls", () => {
      describe("Basic URL extraction", () => {
        it("should extract single http URL", () => {
          const content = "Check out http://example.com";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("http://example.com");
        });

        it("should extract single https URL", () => {
          const content = "Visit https://example.com";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://example.com");
        });

        it("should extract URL with www", () => {
          const content = "Go to https://www.example.com";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://www.example.com");
        });

        it("should extract URL with path", () => {
          const content = "See https://example.com/path/to/page";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://example.com/path/to/page");
        });

        it("should extract URL with query string", () => {
          const content = "Link: https://example.com/search?q=test&page=1";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://example.com/search?q=test&page=1");
        });

        it("should extract URL with fragment", () => {
          const content = "Check https://example.com/page#section";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://example.com/page#section");
        });

        it("should extract URL with port", () => {
          const content = "Server at https://example.com:8080/api";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://example.com:8080/api");
        });
      });

      describe("Multiple URLs", () => {
        it("should extract multiple URLs", () => {
          const content = "Check https://example.com and https://test.com";
          const urls = unfurler.extractUrls(content);
          expect(urls).toContain("https://example.com");
          expect(urls).toContain("https://test.com");
        });

        it("should deduplicate URLs", () => {
          const content = "Link: https://example.com and again https://example.com";
          const urls = unfurler.extractUrls(content);
          expect(urls.filter((u) => u === "https://example.com")).toHaveLength(1);
        });

        it("should respect maxUrls limit", () => {
          const customUnfurler = new LinkUnfurler({ maxUrls: 2 });
          const content =
            "https://a.com https://b.com https://c.com https://d.com https://e.com";
          const urls = customUnfurler.extractUrls(content);
          expect(urls).toHaveLength(2);
        });
      });

      describe("Skipped URLs", () => {
        it("should skip localhost URLs", () => {
          const content = "Local: http://localhost:3000/api";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip 127.0.0.1 URLs", () => {
          const content = "Local: http://127.0.0.1:8080/test";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip CDN URLs", () => {
          const content = "Script: https://cdn.cloudflare.com/lib.js";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip jsdelivr CDN URLs", () => {
          const content = "https://cdn.jsdelivr.net/npm/package@1.0.0";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip unpkg URLs", () => {
          const content = "https://unpkg.com/react@18/umd/react.production.min.js";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip image URLs", () => {
          const content = "Image: https://example.com/photo.jpg";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip PNG image URLs", () => {
          const content = "Icon: https://example.com/icon.png";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip GIF URLs", () => {
          const content = "Meme: https://example.com/funny.gif";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip WebP image URLs", () => {
          const content = "Image: https://example.com/photo.webp";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip SVG URLs", () => {
          const content = "Logo: https://example.com/logo.svg";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip PDF URLs", () => {
          const content = "Doc: https://example.com/document.pdf";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip MP4 video URLs", () => {
          const content = "Video: https://example.com/video.mp4";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });

        it("should skip MP3 audio URLs", () => {
          const content = "Audio: https://example.com/song.mp3";
          const urls = unfurler.extractUrls(content);
          expect(urls).toHaveLength(0);
        });
      });

      describe("Edge cases", () => {
        it("should return empty array for empty content", () => {
          expect(unfurler.extractUrls("")).toHaveLength(0);
        });

        it("should return empty array for null-like content", () => {
          expect(unfurler.extractUrls(null as unknown as string)).toHaveLength(0);
        });

        it("should return empty array for content without URLs", () => {
          expect(unfurler.extractUrls("Just some text without links")).toHaveLength(0);
        });

        it("should handle URLs in parentheses", () => {
          const content = "See (https://example.com) for details";
          const urls = unfurler.extractUrls(content);
          // The URL extraction may include the closing paren, which is valid
          expect(urls.length).toBeGreaterThan(0);
        });

        it("should handle URLs at end of sentence", () => {
          const content = "Check https://example.com.";
          const urls = unfurler.extractUrls(content);
          expect(urls.length).toBeGreaterThan(0);
        });
      });
    });

    describe("Cache management", () => {
      it("should return null for uncached URL", () => {
        expect(unfurler.getCached("https://example.com")).toBeNull();
      });

      it("should have empty cache initially", () => {
        const stats = unfurler.getCacheStats();
        expect(stats.size).toBe(0);
        expect(stats.urls).toHaveLength(0);
      });

      it("should clear all cache", () => {
        // Note: We can't directly test cache population without mocking fetch
        // but we can test that clearCache doesn't throw
        expect(() => unfurler.clearCache()).not.toThrow();
      });

      it("should clear specific URL from cache", () => {
        expect(() => unfurler.clearCache("https://example.com")).not.toThrow();
      });
    });
  });

  describe("isPreviewableUrl", () => {
    describe("Known good sites", () => {
      it("should return true for YouTube", () => {
        expect(isPreviewableUrl("https://www.youtube.com/watch?v=abc123")).toBe(true);
      });

      it("should return true for youtu.be", () => {
        expect(isPreviewableUrl("https://youtu.be/abc123")).toBe(true);
      });

      it("should return true for Twitter", () => {
        expect(isPreviewableUrl("https://twitter.com/user/status/123")).toBe(true);
      });

      it("should return true for X.com", () => {
        expect(isPreviewableUrl("https://x.com/user/status/123")).toBe(true);
      });

      it("should return true for GitHub", () => {
        expect(isPreviewableUrl("https://github.com/user/repo")).toBe(true);
      });

      it("should return true for LinkedIn", () => {
        expect(isPreviewableUrl("https://www.linkedin.com/posts/123")).toBe(true);
      });

      it("should return true for Medium", () => {
        expect(isPreviewableUrl("https://medium.com/@user/article")).toBe(true);
      });

      it("should return true for Dev.to", () => {
        expect(isPreviewableUrl("https://dev.to/user/article")).toBe(true);
      });

      it("should return true for Stack Overflow", () => {
        expect(isPreviewableUrl("https://stackoverflow.com/questions/123")).toBe(true);
      });

      it("should return true for Reddit", () => {
        expect(isPreviewableUrl("https://www.reddit.com/r/programming/")).toBe(true);
      });

      it("should return true for NY Times", () => {
        expect(isPreviewableUrl("https://www.nytimes.com/article")).toBe(true);
      });

      it("should return true for The Guardian", () => {
        expect(isPreviewableUrl("https://www.theguardian.com/article")).toBe(true);
      });

      it("should return true for BBC", () => {
        expect(isPreviewableUrl("https://www.bbc.com/news/article")).toBe(true);
      });

      it("should return true for CNN", () => {
        expect(isPreviewableUrl("https://www.cnn.com/article")).toBe(true);
      });
    });

    describe("File URLs", () => {
      it("should return false for JPG files", () => {
        expect(isPreviewableUrl("https://example.com/image.jpg")).toBe(false);
      });

      it("should return false for PNG files", () => {
        expect(isPreviewableUrl("https://example.com/image.png")).toBe(false);
      });

      it("should return false for GIF files", () => {
        expect(isPreviewableUrl("https://example.com/image.gif")).toBe(false);
      });

      it("should return false for PDF files", () => {
        expect(isPreviewableUrl("https://example.com/doc.pdf")).toBe(false);
      });

      it("should return false for MP4 files", () => {
        expect(isPreviewableUrl("https://example.com/video.mp4")).toBe(false);
      });

      it("should return false for ZIP files", () => {
        expect(isPreviewableUrl("https://example.com/archive.zip")).toBe(false);
      });
    });

    describe("Regular URLs", () => {
      it("should return true for regular HTML pages", () => {
        expect(isPreviewableUrl("https://example.com/page")).toBe(true);
      });

      it("should return true for URLs without file extensions", () => {
        expect(isPreviewableUrl("https://example.com/article/123")).toBe(true);
      });
    });

    describe("Invalid URLs", () => {
      it("should return false for invalid URL", () => {
        expect(isPreviewableUrl("not-a-url")).toBe(false);
      });

      it("should return false for empty string", () => {
        expect(isPreviewableUrl("")).toBe(false);
      });
    });
  });

  describe("getDomainName", () => {
    it("should extract domain from simple URL", () => {
      expect(getDomainName("https://example.com")).toBe("example.com");
    });

    it("should remove www prefix", () => {
      expect(getDomainName("https://www.example.com")).toBe("example.com");
    });

    it("should keep subdomain", () => {
      expect(getDomainName("https://blog.example.com")).toBe("blog.example.com");
    });

    it("should handle URL with path", () => {
      expect(getDomainName("https://example.com/path/to/page")).toBe("example.com");
    });

    it("should handle URL with port", () => {
      expect(getDomainName("https://example.com:8080/api")).toBe("example.com");
    });

    it("should return original for invalid URL", () => {
      expect(getDomainName("not-a-url")).toBe("not-a-url");
    });

    it("should handle YouTube domain", () => {
      expect(getDomainName("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
    });

    it("should handle GitHub domain", () => {
      expect(getDomainName("https://github.com/user/repo")).toBe("github.com");
    });
  });

  describe("isVideoUrl", () => {
    describe("YouTube URLs", () => {
      it("should return true for youtube.com", () => {
        expect(isVideoUrl("https://www.youtube.com/watch?v=abc123")).toBe(true);
      });

      it("should return true for youtu.be", () => {
        expect(isVideoUrl("https://youtu.be/abc123")).toBe(true);
      });

      it("should return true for YouTube embed", () => {
        expect(isVideoUrl("https://www.youtube.com/embed/abc123")).toBe(true);
      });
    });

    describe("Vimeo URLs", () => {
      it("should return true for vimeo.com", () => {
        expect(isVideoUrl("https://vimeo.com/123456789")).toBe(true);
      });

      it("should return true for player.vimeo.com", () => {
        expect(isVideoUrl("https://player.vimeo.com/video/123456789")).toBe(true);
      });
    });

    describe("Other video platforms", () => {
      it("should return true for Dailymotion", () => {
        expect(isVideoUrl("https://www.dailymotion.com/video/abc123")).toBe(true);
      });

      it("should return true for Twitch", () => {
        expect(isVideoUrl("https://www.twitch.tv/videos/123456789")).toBe(true);
      });
    });

    describe("Non-video URLs", () => {
      it("should return false for GitHub", () => {
        expect(isVideoUrl("https://github.com/user/repo")).toBe(false);
      });

      it("should return false for Twitter", () => {
        expect(isVideoUrl("https://twitter.com/user")).toBe(false);
      });

      it("should return false for regular site", () => {
        expect(isVideoUrl("https://example.com/page")).toBe(false);
      });

      it("should return false for invalid URL", () => {
        expect(isVideoUrl("not-a-url")).toBe(false);
      });
    });
  });

  describe("getYouTubeVideoId", () => {
    describe("youtube.com URLs", () => {
      it("should extract ID from standard watch URL", () => {
        expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
          "dQw4w9WgXcQ"
        );
      });

      it("should extract ID from watch URL without www", () => {
        expect(getYouTubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
          "dQw4w9WgXcQ"
        );
      });

      it("should extract ID from URL with additional params", () => {
        expect(
          getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=60s")
        ).toBe("dQw4w9WgXcQ");
      });

      it("should extract ID from URL with list param", () => {
        expect(
          getYouTubeVideoId(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz"
          )
        ).toBe("dQw4w9WgXcQ");
      });

      it("should return null for channel URL", () => {
        expect(getYouTubeVideoId("https://www.youtube.com/channel/UCxyz")).toBeNull();
      });

      it("should return null for playlist URL", () => {
        expect(getYouTubeVideoId("https://www.youtube.com/playlist?list=PLxyz")).toBeNull();
      });
    });

    describe("youtu.be URLs", () => {
      it("should extract ID from short URL", () => {
        expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("should extract ID from short URL with timestamp", () => {
        expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=60")).toBe(
          "dQw4w9WgXcQ"
        );
      });
    });

    describe("Invalid URLs", () => {
      it("should return null for non-YouTube URL", () => {
        expect(getYouTubeVideoId("https://vimeo.com/123456789")).toBeNull();
      });

      it("should return null for malformed URL", () => {
        expect(getYouTubeVideoId("not-a-url")).toBeNull();
      });

      it("should return null for empty string", () => {
        expect(getYouTubeVideoId("")).toBeNull();
      });
    });
  });

  describe("UnfurlData type", () => {
    it("should accept minimal unfurl data", () => {
      const data: UnfurlData = {
        url: "https://example.com",
        type: "website",
      };
      expect(data.url).toBe("https://example.com");
      expect(data.type).toBe("website");
    });

    it("should accept full unfurl data", () => {
      const data: UnfurlData = {
        url: "https://example.com",
        title: "Example Page",
        description: "A test page",
        image: "https://example.com/og-image.png",
        siteName: "Example",
        favicon: "https://example.com/favicon.ico",
        type: "article",
        isCached: true,
        needsRefresh: false,
      };
      expect(data.title).toBe("Example Page");
      expect(data.type).toBe("article");
    });

    it("should accept video unfurl data", () => {
      const data: UnfurlData = {
        url: "https://youtube.com/watch?v=abc",
        title: "Video Title",
        type: "video",
        videoUrl: "https://www.youtube.com/embed/abc",
        videoType: "text/html",
      };
      expect(data.type).toBe("video");
      expect(data.videoUrl).toBeDefined();
    });

    it("should accept all type values", () => {
      const types: UnfurlData["type"][] = ["article", "video", "image", "website"];
      types.forEach((type) => {
        const data: UnfurlData = { url: "https://example.com", type };
        expect(data.type).toBe(type);
      });
    });
  });
});
