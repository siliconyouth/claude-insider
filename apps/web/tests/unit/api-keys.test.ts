/**
 * API Keys Unit Tests
 *
 * Tests for API key management utilities:
 * - encryptApiKey/decryptApiKey: AES-256-GCM encryption
 * - getApiKeyHint: Display last 8 characters
 * - getBestAvailableModel: Select optimal model
 * - CLAUDE_MODELS: Model definitions
 * - ANTHROPIC_URLS: Console URLs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  getApiKeyHint,
  getBestAvailableModel,
  CLAUDE_MODELS,
  ANTHROPIC_URLS,
  type ClaudeModel,
} from "@/lib/api-keys";

// ============================================
// ENCRYPTION/DECRYPTION TESTS
// ============================================

describe("API Key Encryption", () => {
  const testApiKey = "sk-ant-api03-test-key-for-encryption-testing-12345678901234567890";

  beforeEach(() => {
    // Set up test environment variable
    vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "test-secret-key-for-unit-testing");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("encryptApiKey", () => {
    it("should encrypt an API key", () => {
      const encrypted = encryptApiKey(testApiKey);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testApiKey);
    });

    it("should return format with iv:authTag:encrypted", () => {
      const encrypted = encryptApiKey(testApiKey);
      const parts = encrypted.split(":");
      expect(parts).toHaveLength(3);

      // IV should be 32 hex chars (16 bytes)
      expect(parts[0]).toHaveLength(32);
      // Auth tag should be 32 hex chars (16 bytes)
      expect(parts[1]).toHaveLength(32);
      // Encrypted data should exist
      expect(parts[2]?.length).toBeGreaterThan(0);
    });

    it("should produce different output each time (random IV)", () => {
      const encrypted1 = encryptApiKey(testApiKey);
      const encrypted2 = encryptApiKey(testApiKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty string", () => {
      const encrypted = encryptApiKey("");
      expect(encrypted).toBeDefined();
      expect(encrypted.split(":")).toHaveLength(3);
    });

    it("should handle special characters in API key", () => {
      const specialKey = "sk-ant-api03-with-special-chars-!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = encryptApiKey(specialKey);
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(specialKey);
    });
  });

  describe("decryptApiKey", () => {
    it("should decrypt an encrypted API key", () => {
      const encrypted = encryptApiKey(testApiKey);
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(testApiKey);
    });

    it("should handle multiple encrypt/decrypt cycles", () => {
      for (let i = 0; i < 5; i++) {
        const encrypted = encryptApiKey(testApiKey);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(testApiKey);
      }
    });

    it("should throw for invalid format", () => {
      expect(() => decryptApiKey("invalid-format")).toThrow("Invalid encrypted data format");
      expect(() => decryptApiKey("only:two")).toThrow("Invalid encrypted data format");
      expect(() => decryptApiKey("")).toThrow("Invalid encrypted data format");
    });

    it("should throw for tampered data", () => {
      const encrypted = encryptApiKey(testApiKey);
      const parts = encrypted.split(":");
      // Tamper with the encrypted data
      const tampered = `${parts[0]}:${parts[1]}:tampered${parts[2]?.slice(8)}`;
      expect(() => decryptApiKey(tampered)).toThrow();
    });

    it("should throw for wrong IV", () => {
      const encrypted = encryptApiKey(testApiKey);
      const parts = encrypted.split(":");
      const wrongIv = "0".repeat(32);
      const tampered = `${wrongIv}:${parts[1]}:${parts[2]}`;
      expect(() => decryptApiKey(tampered)).toThrow();
    });
  });

  describe("Encryption with different secrets", () => {
    it("should fail decryption with different secret", () => {
      vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "secret-one");
      const encrypted = encryptApiKey(testApiKey);

      vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "secret-two");
      expect(() => decryptApiKey(encrypted)).toThrow();
    });
  });
});

describe("API Key Encryption without secret", () => {
  beforeEach(() => {
    vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should throw when no encryption secret is set", () => {
    expect(() => encryptApiKey("test-key")).toThrow(
      "API_KEY_ENCRYPTION_SECRET or BETTER_AUTH_SECRET must be set"
    );
  });
});

describe("API Key Encryption with BETTER_AUTH_SECRET fallback", () => {
  beforeEach(() => {
    vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "fallback-secret-for-testing");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should use BETTER_AUTH_SECRET as fallback", () => {
    const testKey = "sk-ant-test-key";
    const encrypted = encryptApiKey(testKey);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(testKey);
  });
});

// ============================================
// getApiKeyHint TESTS
// ============================================

describe("getApiKeyHint", () => {
  it("should return last 8 characters with prefix", () => {
    const hint = getApiKeyHint("sk-ant-api03-1234567890abcdefghijklmnop");
    expect(hint).toBe("...ijklmnop"); // Last 8 characters
  });

  it("should return full masked for short keys", () => {
    expect(getApiKeyHint("short")).toBe("****");
    expect(getApiKeyHint("1234567")).toBe("****");
  });

  it("should handle exactly 8 characters", () => {
    const hint = getApiKeyHint("12345678");
    expect(hint).toBe("...12345678");
  });

  it("should handle long API keys", () => {
    const longKey = "sk-ant-api03-" + "a".repeat(100);
    const hint = getApiKeyHint(longKey);
    expect(hint).toBe("...aaaaaaaa");
    expect(hint.length).toBe(11); // "..." + 8 chars
  });
});

// ============================================
// CLAUDE_MODELS TESTS
// ============================================

describe("CLAUDE_MODELS", () => {
  it("should have multiple models defined", () => {
    expect(CLAUDE_MODELS.length).toBeGreaterThanOrEqual(4);
  });

  it("should have required properties for each model", () => {
    CLAUDE_MODELS.forEach((model) => {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.description).toBeDefined();
      expect(model.contextWindow).toBeGreaterThan(0);
      expect(model.maxOutput).toBeGreaterThan(0);
      expect(["opus", "sonnet", "haiku"]).toContain(model.tier);
      expect(model.inputPrice).toBeGreaterThanOrEqual(0);
      expect(model.outputPrice).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have exactly one default model", () => {
    const defaults = CLAUDE_MODELS.filter((m) => m.isDefault);
    expect(defaults).toHaveLength(1);
  });

  it("should have Opus 4.5 as the default", () => {
    const defaultModel = CLAUDE_MODELS.find((m) => m.isDefault);
    expect(defaultModel?.id).toBe("claude-opus-4-5-20251101");
  });

  it("should have correct pricing tiers", () => {
    const opus = CLAUDE_MODELS.find((m) => m.tier === "opus");
    const sonnet = CLAUDE_MODELS.find((m) => m.tier === "sonnet");
    const haiku = CLAUDE_MODELS.find((m) => m.tier === "haiku");

    // Opus should be most expensive
    expect(opus?.inputPrice).toBeGreaterThan(sonnet?.inputPrice || 0);
    expect(sonnet?.inputPrice).toBeGreaterThan(haiku?.inputPrice || 0);
  });

  it("should have unique model IDs", () => {
    const ids = CLAUDE_MODELS.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ============================================
// getBestAvailableModel TESTS
// ============================================

describe("getBestAvailableModel", () => {
  it("should return Opus 4.5 when available", () => {
    const models: ClaudeModel[] = [
      CLAUDE_MODELS.find((m) => m.id === "claude-opus-4-5-20251101")!,
      CLAUDE_MODELS.find((m) => m.id === "claude-sonnet-4-20250514")!,
      CLAUDE_MODELS.find((m) => m.id === "claude-3-5-haiku-20241022")!,
    ];
    const best = getBestAvailableModel(models);
    expect(best?.id).toBe("claude-opus-4-5-20251101");
  });

  it("should return Sonnet 4 when Opus not available", () => {
    const models: ClaudeModel[] = [
      CLAUDE_MODELS.find((m) => m.id === "claude-sonnet-4-20250514")!,
      CLAUDE_MODELS.find((m) => m.id === "claude-3-5-haiku-20241022")!,
    ];
    const best = getBestAvailableModel(models);
    expect(best?.id).toBe("claude-sonnet-4-20250514");
  });

  it("should return Sonnet 3.5 when newer versions not available", () => {
    const models: ClaudeModel[] = [
      CLAUDE_MODELS.find((m) => m.id === "claude-3-5-sonnet-20241022")!,
      CLAUDE_MODELS.find((m) => m.id === "claude-3-5-haiku-20241022")!,
    ];
    const best = getBestAvailableModel(models);
    expect(best?.id).toBe("claude-3-5-sonnet-20241022");
  });

  it("should return first available when no priority models", () => {
    const haiku = CLAUDE_MODELS.find((m) => m.id === "claude-3-5-haiku-20241022")!;
    const models = [haiku];
    const best = getBestAvailableModel(models);
    expect(best?.id).toBe("claude-3-5-haiku-20241022");
  });

  it("should return null for empty array", () => {
    const best = getBestAvailableModel([]);
    expect(best).toBeNull();
  });
});

// ============================================
// ANTHROPIC_URLS TESTS
// ============================================

describe("ANTHROPIC_URLS", () => {
  it("should have all required URLs", () => {
    expect(ANTHROPIC_URLS.console).toBeDefined();
    expect(ANTHROPIC_URLS.apiKeys).toBeDefined();
    expect(ANTHROPIC_URLS.plans).toBeDefined();
    expect(ANTHROPIC_URLS.usage).toBeDefined();
    expect(ANTHROPIC_URLS.docs).toBeDefined();
  });

  it("should have valid Anthropic console URLs", () => {
    expect(ANTHROPIC_URLS.console).toBe("https://console.anthropic.com");
    expect(ANTHROPIC_URLS.apiKeys).toContain("console.anthropic.com");
    expect(ANTHROPIC_URLS.plans).toContain("console.anthropic.com");
    expect(ANTHROPIC_URLS.usage).toContain("console.anthropic.com");
  });

  it("should have valid docs URL", () => {
    expect(ANTHROPIC_URLS.docs).toBe("https://docs.anthropic.com");
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe("API Key workflow integration", () => {
  beforeEach(() => {
    vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "integration-test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should encrypt, store, and decrypt a real-format API key", () => {
    // Simulate a realistic API key format
    const realFormatKey = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Get hint before encryption (last 8 characters)
    const hint = getApiKeyHint(realFormatKey);
    expect(hint).toBe("...STUVWXYZ");

    // Encrypt for storage
    const encrypted = encryptApiKey(realFormatKey);
    expect(encrypted).not.toContain("sk-ant");

    // Decrypt when needed
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(realFormatKey);

    // Verify hint still works
    expect(getApiKeyHint(decrypted)).toBe(hint);
  });
});
