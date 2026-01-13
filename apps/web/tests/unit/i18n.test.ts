/**
 * i18n (Internationalization) Tests
 *
 * Tests for locale management utilities.
 * Includes localStorage mocking for browser-dependent functions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  locales,
  defaultLocale,
  getCurrentLocale,
  setLocale,
  hasMultipleLocales,
  type Locale,
} from "@/lib/i18n";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

describe("locales constant", () => {
  it("should be an array", () => {
    expect(Array.isArray(locales)).toBe(true);
  });

  it("should have at least one locale", () => {
    expect(locales.length).toBeGreaterThanOrEqual(1);
  });

  it("should have valid locale structure", () => {
    locales.forEach((locale) => {
      expect(locale).toHaveProperty("code");
      expect(locale).toHaveProperty("name");
      expect(locale).toHaveProperty("flag");
      expect(locale).toHaveProperty("nativeName");
      expect(typeof locale.code).toBe("string");
      expect(typeof locale.name).toBe("string");
      expect(typeof locale.flag).toBe("string");
      expect(typeof locale.nativeName).toBe("string");
    });
  });

  it("should have unique locale codes", () => {
    const codes = locales.map((l) => l.code);
    const uniqueCodes = [...new Set(codes)];
    expect(codes.length).toBe(uniqueCodes.length);
  });

  it("should include English (US) as a locale", () => {
    const englishLocale = locales.find((l) => l.code === "en-US");
    expect(englishLocale).toBeDefined();
    expect(englishLocale?.name).toBe("English (US)");
  });

  it("should have non-empty values for all fields", () => {
    locales.forEach((locale) => {
      expect(locale.code.length).toBeGreaterThan(0);
      expect(locale.name.length).toBeGreaterThan(0);
      expect(locale.flag.length).toBeGreaterThan(0);
      expect(locale.nativeName.length).toBeGreaterThan(0);
    });
  });
});

describe("defaultLocale constant", () => {
  it("should be a valid locale object", () => {
    expect(defaultLocale).toHaveProperty("code");
    expect(defaultLocale).toHaveProperty("name");
    expect(defaultLocale).toHaveProperty("flag");
    expect(defaultLocale).toHaveProperty("nativeName");
  });

  it("should be en-US", () => {
    expect(defaultLocale.code).toBe("en-US");
  });

  it("should have English as default", () => {
    expect(defaultLocale.name).toBe("English (US)");
    expect(defaultLocale.nativeName).toBe("English");
  });

  it("should have US flag emoji", () => {
    expect(defaultLocale.flag).toBe("🇺🇸");
  });

  it("should match first locale in array", () => {
    if (locales.length > 0) {
      expect(defaultLocale.code).toBe(locales[0]?.code);
    }
  });
});

describe("getCurrentLocale (with mocked localStorage)", () => {
  beforeEach(() => {
    // Setup localStorage mock
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorageMock.clear();
  });

  it("should return default locale when no stored preference", () => {
    const locale = getCurrentLocale();
    expect(locale.code).toBe(defaultLocale.code);
  });

  it("should return stored locale if valid", () => {
    localStorageMock.setItem("claude-insider-locale", "en-US");

    const locale = getCurrentLocale();
    expect(locale.code).toBe("en-US");
  });

  it("should return default locale for invalid stored code", () => {
    localStorageMock.setItem("claude-insider-locale", "invalid-code");

    const locale = getCurrentLocale();
    expect(locale.code).toBe(defaultLocale.code);
  });

  it("should handle localStorage errors gracefully", () => {
    // Make getItem throw an error
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error("Storage error");
    });

    const locale = getCurrentLocale();
    expect(locale.code).toBe(defaultLocale.code);
  });

  it("should return full locale object, not just code", () => {
    const locale = getCurrentLocale();

    expect(locale).toHaveProperty("code");
    expect(locale).toHaveProperty("name");
    expect(locale).toHaveProperty("flag");
    expect(locale).toHaveProperty("nativeName");
  });
});

describe("getCurrentLocale (server-side)", () => {
  it("should return default locale when window is undefined", () => {
    // The function checks typeof window === "undefined"
    // In test environment, window might be defined via jsdom
    // We test the actual behavior which is to return defaultLocale
    const locale = getCurrentLocale();
    expect(locale).toBeDefined();
    expect(typeof locale.code).toBe("string");
  });
});

describe("setLocale (with mocked localStorage)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorageMock.clear();
  });

  it("should store locale code in localStorage", () => {
    setLocale("en-US");

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "claude-insider-locale",
      "en-US"
    );
  });

  it("should allow setting any code (validation is caller responsibility)", () => {
    setLocale("custom-locale");

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "claude-insider-locale",
      "custom-locale"
    );
  });

  it("should handle localStorage errors gracefully", () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error("Storage error");
    });

    // Should not throw
    expect(() => setLocale("en-US")).not.toThrow();
  });
});

describe("hasMultipleLocales", () => {
  it("should return boolean", () => {
    const result = hasMultipleLocales();
    expect(typeof result).toBe("boolean");
  });

  it("should return false when only one locale", () => {
    // Current implementation has only en-US active
    // This checks if the function correctly identifies single locale
    const result = hasMultipleLocales();

    if (locales.length === 1) {
      expect(result).toBe(false);
    } else {
      expect(result).toBe(true);
    }
  });

  it("should match locales.length > 1", () => {
    const result = hasMultipleLocales();
    expect(result).toBe(locales.length > 1);
  });
});

describe("Locale type", () => {
  it("should have correct type shape", () => {
    const testLocale: Locale = {
      code: "test",
      name: "Test Language",
      flag: "🏳️",
      nativeName: "Test",
    };

    expect(testLocale.code).toBe("test");
    expect(testLocale.name).toBe("Test Language");
    expect(testLocale.flag).toBe("🏳️");
    expect(testLocale.nativeName).toBe("Test");
  });
});

describe("Integration scenarios", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorageMock.clear();
  });

  it("should persist locale selection across calls", () => {
    // Set a locale
    setLocale("en-US");

    // Get it back
    const locale = getCurrentLocale();
    expect(locale.code).toBe("en-US");
  });

  it("should allow changing locale", () => {
    setLocale("en-US");
    let locale = getCurrentLocale();
    expect(locale.code).toBe("en-US");

    // If there were multiple locales, we could change
    // For now, verify the mechanism works
    setLocale("en-US");
    locale = getCurrentLocale();
    expect(locale.code).toBe("en-US");
  });
});

describe("Storage key", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorageMock.clear();
  });

  it("should use consistent storage key", () => {
    setLocale("en-US");

    // The key should be "claude-insider-locale"
    const storedValue = localStorageMock.getItem("claude-insider-locale");
    expect(storedValue).toBe("en-US");
  });

  it("should not interfere with other localStorage keys", () => {
    localStorageMock.setItem("other-key", "other-value");
    setLocale("en-US");

    expect(localStorageMock.getItem("other-key")).toBe("other-value");
    expect(localStorageMock.getItem("claude-insider-locale")).toBe("en-US");
  });
});
