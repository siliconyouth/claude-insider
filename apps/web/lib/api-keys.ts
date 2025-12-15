/**
 * API Key Management Library
 *
 * Handles secure storage, encryption, and validation of user API keys.
 * Supports Anthropic/Claude AI API keys.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Encryption settings
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET or BETTER_AUTH_SECRET must be set");
  }
  // Derive a 32-byte key from the secret
  return scryptSync(secret, "api-key-salt", 32);
}

/**
 * Encrypt an API key for secure storage
 */
export function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted as a single string
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an API key from storage
 */
export function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Get a safe hint for displaying (last 4 characters)
 */
export function getApiKeyHint(apiKey: string): string {
  if (apiKey.length < 8) return "****";
  return `...${apiKey.slice(-8)}`;
}

/**
 * Available Claude models with their capabilities
 */
export interface ClaudeModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutput: number;
  tier: "opus" | "sonnet" | "haiku";
  isDefault?: boolean;
  inputPrice: number; // per 1M tokens
  outputPrice: number; // per 1M tokens
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    description: "Most powerful model with exceptional reasoning and analysis",
    contextWindow: 200000,
    maxOutput: 32000,
    tier: "opus",
    isDefault: true,
    inputPrice: 15,
    outputPrice: 75,
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Balanced performance and speed for most tasks",
    contextWindow: 200000,
    maxOutput: 64000,
    tier: "sonnet",
    inputPrice: 3,
    outputPrice: 15,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    description: "Previous generation Sonnet model",
    contextWindow: 200000,
    maxOutput: 8192,
    tier: "sonnet",
    inputPrice: 3,
    outputPrice: 15,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    description: "Fast and efficient for simple tasks",
    contextWindow: 200000,
    maxOutput: 8192,
    tier: "haiku",
    inputPrice: 0.25,
    outputPrice: 1.25,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Previous generation flagship model",
    contextWindow: 200000,
    maxOutput: 4096,
    tier: "opus",
    inputPrice: 15,
    outputPrice: 75,
  },
];

/**
 * Validate an Anthropic API key and get available models
 */
export async function validateAnthropicApiKey(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
  availableModels?: ClaudeModel[];
  accountInfo?: {
    hasOpus: boolean;
    hasSonnet: boolean;
    hasHaiku: boolean;
  };
}> {
  try {
    // Test the API key with a minimal request
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022", // Use cheapest model for validation
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }

    if (response.status === 403) {
      return { valid: false, error: "API key does not have permission" };
    }

    if (response.status === 429) {
      // Rate limited but key is valid
      return {
        valid: true,
        availableModels: CLAUDE_MODELS,
        accountInfo: { hasOpus: true, hasSonnet: true, hasHaiku: true },
      };
    }

    // Check if we can determine available models
    // For now, assume all models are available if the key works
    // In production, you'd want to check the account's plan/permissions

    // Try to detect if Opus is available by checking for specific error
    const availableModels: ClaudeModel[] = [];
    const accountInfo = { hasOpus: false, hasSonnet: true, hasHaiku: true };

    // Check for Opus availability
    try {
      const opusResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5-20251101",
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (opusResponse.ok || opusResponse.status === 429) {
        accountInfo.hasOpus = true;
      }
    } catch {
      // Opus not available
    }

    // Build available models list
    for (const model of CLAUDE_MODELS) {
      if (model.tier === "opus" && accountInfo.hasOpus) {
        availableModels.push(model);
      } else if (model.tier === "sonnet" && accountInfo.hasSonnet) {
        availableModels.push(model);
      } else if (model.tier === "haiku" && accountInfo.hasHaiku) {
        availableModels.push(model);
      }
    }

    return {
      valid: true,
      availableModels,
      accountInfo,
    };
  } catch (error) {
    console.error("[API Key Validation] Error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Get the best available model for a user
 */
export function getBestAvailableModel(availableModels: ClaudeModel[]): ClaudeModel | null {
  // Priority: Opus 4.5 > Sonnet 4 > Others
  const opus45 = availableModels.find((m) => m.id === "claude-opus-4-5-20251101");
  if (opus45) return opus45;

  const sonnet4 = availableModels.find((m) => m.id === "claude-sonnet-4-20250514");
  if (sonnet4) return sonnet4;

  const sonnet35 = availableModels.find((m) => m.id === "claude-3-5-sonnet-20241022");
  if (sonnet35) return sonnet35;

  // Return first available
  return availableModels[0] || null;
}

/**
 * Anthropic Console URLs
 */
export const ANTHROPIC_URLS = {
  console: "https://console.anthropic.com",
  apiKeys: "https://console.anthropic.com/settings/keys",
  plans: "https://console.anthropic.com/settings/plans",
  usage: "https://console.anthropic.com/settings/usage",
  docs: "https://docs.anthropic.com",
};
