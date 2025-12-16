/**
 * Design System Tests
 *
 * Tests for design compliance, themes, and accessibility.
 */

import type { TestSuite } from "../diagnostics.types";
import { createTest } from "./test-utils";

export const designTests: TestSuite[] = [
  createTest("Design System Colors", "design", async () => {
    if (typeof window === "undefined") {
      return {
        status: "warning",
        message: "Server-side - cannot check design system",
      };
    }

    const allElements = document.querySelectorAll("*:not(pre):not(code)");
    const bannedPatterns = ["orange", "amber", "yellow"];
    const violations: string[] = [];

    allElements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el);
      const bgColor = computedStyle.backgroundColor;

      const checkColor = (color: string, type: string) => {
        if (color.includes("rgb")) {
          const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
          if (match && match[1] && match[2] && match[3]) {
            const r = Number(match[1]);
            const g = Number(match[2]);
            const b = Number(match[3]);
            if (r > 200 && g > 100 && g < 200 && b < 100) {
              const tagName = (el as HTMLElement).tagName?.toLowerCase();
              if (!["code", "pre", "span"].includes(tagName)) {
                violations.push(`${type} orange on <${tagName}>`);
              }
            }
          }
        }
      };

      checkColor(bgColor, "bg");
    });

    if (violations.length > 0) {
      return {
        status: "warning",
        message: `${violations.length} potential color violations`,
        details: {
          violations: violations.slice(0, 10),
          bannedColors: bannedPatterns,
        },
      };
    }

    return {
      status: "success",
      message: "Design system colors compliant",
      details: {
        bannedColors: bannedPatterns,
        scannedElements: allElements.length,
      },
    };
  }),

  createTest("Dark Mode Theme", "design", async () => {
    if (typeof window === "undefined") {
      return {
        status: "warning",
        message: "Server-side - cannot check theme",
      };
    }

    const isDarkMode = document.documentElement.classList.contains("dark");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const storedTheme = localStorage.getItem("theme");

    return {
      status: "success",
      message: isDarkMode ? "Dark mode active" : "Light mode active",
      details: {
        currentMode: isDarkMode ? "dark" : "light",
        systemPreference: systemPrefersDark ? "dark" : "light",
        storedPreference: storedTheme || "system",
      },
    };
  }),

  createTest("Accessibility Contrast", "design", async () => {
    if (typeof window === "undefined") {
      return {
        status: "warning",
        message: "Server-side - cannot check contrast",
      };
    }

    const textElements = document.querySelectorAll(
      "p, span, h1, h2, h3, h4, h5, h6, a, button, label"
    );
    let lowContrastCount = 0;

    textElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;

      const parseRGB = (rgb: string) => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          return {
            r: Number(match[1]),
            g: Number(match[2]),
            b: Number(match[3]),
          };
        }
        return null;
      };

      const textRGB = parseRGB(color);
      const bgRGB = parseRGB(bgColor);

      if (textRGB && bgRGB) {
        const srgbToLinear = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };

        const luminance = (c: { r: number; g: number; b: number }) => {
          return (
            0.2126 * srgbToLinear(c.r) +
            0.7152 * srgbToLinear(c.g) +
            0.0722 * srgbToLinear(c.b)
          );
        };

        const l1 = luminance(textRGB);
        const l2 = luminance(bgRGB);
        const ratio =
          (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        if (ratio < 4.5 && bgRGB.r !== 0 && bgRGB.g !== 0 && bgRGB.b !== 0) {
          lowContrastCount++;
        }
      }
    });

    if (lowContrastCount > 10) {
      return {
        status: "warning",
        message: `${lowContrastCount} elements may have low contrast`,
        details: { wcaaRequirement: "4.5:1", lowContrastCount },
      };
    }

    return {
      status: "success",
      message: "Text contrast appears acceptable",
      details: { checkedElements: textElements.length, lowContrastCount },
    };
  }),

  createTest("Page Images Check", "integrity", async () => {
    if (typeof window === "undefined") {
      return {
        status: "warning",
        message: "Server-side - cannot check images",
      };
    }

    const images = document.querySelectorAll("img");
    const brokenImages: string[] = [];
    const checkedImages: string[] = [];

    images.forEach((img) => {
      const src = img.src || img.getAttribute("data-src") || "";
      if (src) {
        checkedImages.push(src);
        if (!img.complete || img.naturalWidth === 0) {
          brokenImages.push(src);
        }
      }
    });

    if (brokenImages.length > 0) {
      return {
        status: "error",
        message: `${brokenImages.length} broken image(s) found`,
        details: {
          totalImages: checkedImages.length,
          brokenCount: brokenImages.length,
          brokenUrls: brokenImages.slice(0, 5),
        },
      };
    }

    return {
      status: "success",
      message: `All ${checkedImages.length} images loaded successfully`,
      details: { totalImages: checkedImages.length, brokenCount: 0 },
    };
  }),

  createTest("Critical Assets Check", "integrity", async () => {
    const criticalAssets = [
      "/icons/icon-192x192.png",
      "/icons/icon-512x512.png",
      "/favicon.ico",
    ];

    const results = await Promise.all(
      criticalAssets.map(async (url) => {
        try {
          const response = await fetch(url, { method: "HEAD" });
          return { url, ok: response.ok, status: response.status };
        } catch {
          return { url, ok: false, status: 0 };
        }
      })
    );

    const failed = results.filter((r) => !r.ok);

    if (failed.length > 0) {
      return {
        status: "error",
        message: `${failed.length} critical asset(s) missing`,
        details: { total: criticalAssets.length, failed: failed.map((f) => f.url) },
      };
    }

    return {
      status: "success",
      message: `All ${criticalAssets.length} critical assets available`,
      details: { assets: criticalAssets },
    };
  }),
];
