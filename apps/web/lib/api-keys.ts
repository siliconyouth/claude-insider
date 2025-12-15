/**
 * API Key Management Library
 *
 * Handles secure storage, encryption, and validation of user API keys.
 * Supports Anthropic/Claude AI API keys.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Encryption settings for AES-256-GCM
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV
// Note: Auth tag (16 bytes) and salt (32 bytes) sizes are standard for this algorithm

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
 * Extended account information from Anthropic API
 */
export interface AnthropicAccountInfo {
  hasOpus: boolean;
  hasSonnet: boolean;
  hasHaiku: boolean;
  // Rate limit info extracted from headers
  rateLimits?: {
    requestsLimit: number;
    requestsRemaining: number;
    requestsReset: string;
    tokensLimit: number;
    tokensRemaining: number;
    tokensReset: string;
  };
  // Subscription tier (inferred from rate limits and model access)
  tier: "free" | "build" | "scale" | "enterprise" | "unknown";
  tierDescription: string;
}

/**
 * Validation result with detailed information
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  availableModels?: ClaudeModel[];
  accountInfo?: AnthropicAccountInfo;
  keyHint?: string;
  validatedAt?: string;
}

/**
 * Extract rate limit info from Anthropic API response headers
 */
function extractRateLimits(headers: Headers): AnthropicAccountInfo["rateLimits"] | undefined {
  const requestsLimit = headers.get("anthropic-ratelimit-requests-limit");
  const requestsRemaining = headers.get("anthropic-ratelimit-requests-remaining");
  const requestsReset = headers.get("anthropic-ratelimit-requests-reset");
  const tokensLimit = headers.get("anthropic-ratelimit-tokens-limit");
  const tokensRemaining = headers.get("anthropic-ratelimit-tokens-remaining");
  const tokensReset = headers.get("anthropic-ratelimit-tokens-reset");

  if (!requestsLimit && !tokensLimit) return undefined;

  return {
    requestsLimit: parseInt(requestsLimit || "0", 10),
    requestsRemaining: parseInt(requestsRemaining || "0", 10),
    requestsReset: requestsReset || "",
    tokensLimit: parseInt(tokensLimit || "0", 10),
    tokensRemaining: parseInt(tokensRemaining || "0", 10),
    tokensReset: tokensReset || "",
  };
}

/**
 * Infer subscription tier from rate limits and model access
 */
function inferTier(rateLimits: AnthropicAccountInfo["rateLimits"], hasOpus: boolean): {
  tier: AnthropicAccountInfo["tier"];
  description: string;
} {
  if (!rateLimits) {
    return { tier: "unknown", description: "Unable to determine subscription tier" };
  }

  // Anthropic rate limits vary by tier:
  // Free: ~1,000 requests/day, limited tokens
  // Build: ~1,000 requests/min, 100K tokens/min
  // Scale: Higher limits, priority access
  // Enterprise: Custom limits

  const tokensPerMin = rateLimits.tokensLimit;
  const requestsPerMin = rateLimits.requestsLimit;

  if (tokensPerMin >= 400000) {
    return { tier: "scale", description: "Scale tier - High rate limits with priority access" };
  } else if (tokensPerMin >= 80000 || requestsPerMin >= 1000) {
    return { tier: "build", description: "Build tier - Standard API access for development" };
  } else if (hasOpus && tokensPerMin >= 40000) {
    return { tier: "build", description: "Build tier with Opus access" };
  } else if (tokensPerMin > 0) {
    return { tier: "free", description: "Free tier - Limited requests and tokens" };
  }

  return { tier: "unknown", description: "Unable to determine subscription tier" };
}

/**
 * Validate an Anthropic API key and get detailed account information
 */
export async function validateAnthropicApiKey(apiKey: string): Promise<ValidationResult> {
  const keyHint = getApiKeyHint(apiKey);
  const validatedAt = new Date().toISOString();

  // Basic format validation
  if (!apiKey.startsWith("sk-ant-")) {
    return {
      valid: false,
      error: "Invalid API key format",
      errorCode: "INVALID_FORMAT",
      errorDetails: "Anthropic API keys must start with 'sk-ant-'. Please check that you copied the full key from the Anthropic Console.",
      keyHint,
      validatedAt,
    };
  }

  if (apiKey.length < 40) {
    return {
      valid: false,
      error: "API key appears incomplete",
      errorCode: "KEY_TOO_SHORT",
      errorDetails: "The API key seems too short. Anthropic API keys are typically 100+ characters. Please verify you copied the complete key.",
      keyHint,
      validatedAt,
    };
  }

  try {
    // Test the API key with a minimal request using the cheapest model
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }],
      }),
    });

    // Extract rate limits from headers (available even on error responses)
    const rateLimits = extractRateLimits(response.headers);

    // Handle different error responses
    if (response.status === 401) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: "Invalid API key",
        errorCode: "AUTHENTICATION_ERROR",
        errorDetails: errorBody.error?.message ||
          "This API key is not recognized by Anthropic. It may have been revoked, expired, or incorrectly copied. Please generate a new key from the Anthropic Console.",
        keyHint,
        validatedAt,
      };
    }

    if (response.status === 403) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: "Permission denied",
        errorCode: "PERMISSION_DENIED",
        errorDetails: errorBody.error?.message ||
          "This API key does not have permission to access the Claude API. Check your Anthropic account permissions or organization settings.",
        keyHint,
        validatedAt,
      };
    }

    if (response.status === 400) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: "Invalid request",
        errorCode: "INVALID_REQUEST",
        errorDetails: errorBody.error?.message ||
          "The API returned an invalid request error. This may indicate an issue with your account setup.",
        keyHint,
        validatedAt,
      };
    }

    if (response.status === 402) {
      return {
        valid: false,
        error: "Payment required",
        errorCode: "PAYMENT_REQUIRED",
        errorDetails: "Your Anthropic account requires payment or has exceeded its credit limit. Please add credits or update your billing information in the Anthropic Console.",
        keyHint,
        validatedAt,
      };
    }

    if (response.status === 529) {
      return {
        valid: false,
        error: "API overloaded",
        errorCode: "OVERLOADED",
        errorDetails: "The Anthropic API is currently overloaded. Your key appears valid, but validation couldn't complete. Please try again in a few minutes.",
        keyHint,
        validatedAt,
      };
    }

    // For rate limited (429) or success (200), the key is valid
    const isValid = response.ok || response.status === 429;

    if (!isValid) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: `Unexpected error (${response.status})`,
        errorCode: "UNKNOWN_ERROR",
        errorDetails: errorBody.error?.message ||
          `The API returned status ${response.status}. Please try again or contact support if the issue persists.`,
        keyHint,
        validatedAt,
      };
    }

    // Key is valid - now check which models are available
    const accountInfo: AnthropicAccountInfo = {
      hasOpus: false,
      hasSonnet: true,
      hasHaiku: true,
      rateLimits,
      tier: "unknown",
      tierDescription: "Checking model access...",
    };

    // Check for Opus availability (premium models)
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
          messages: [{ role: "user", content: "test" }],
        }),
      });

      // Opus is available if we get success, rate limited, or any non-permission error
      if (opusResponse.ok || opusResponse.status === 429) {
        accountInfo.hasOpus = true;
      } else if (opusResponse.status === 400) {
        // Model not found error means they don't have access
        const errorBody = await opusResponse.json().catch(() => ({}));
        if (!errorBody.error?.message?.includes("model")) {
          accountInfo.hasOpus = true;
        }
      }

      // Update rate limits from Opus response if available
      const opusRateLimits = extractRateLimits(opusResponse.headers);
      if (opusRateLimits && opusRateLimits.tokensLimit > (rateLimits?.tokensLimit || 0)) {
        accountInfo.rateLimits = opusRateLimits;
      }
    } catch {
      // Opus check failed, assume not available
    }

    // Infer subscription tier
    const tierInfo = inferTier(accountInfo.rateLimits, accountInfo.hasOpus);
    accountInfo.tier = tierInfo.tier;
    accountInfo.tierDescription = tierInfo.description;

    // Build available models list
    const availableModels: ClaudeModel[] = [];
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
      keyHint,
      validatedAt,
    };
  } catch (error) {
    console.error("[API Key Validation] Error:", error);

    // Network or other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return {
        valid: false,
        error: "Network error",
        errorCode: "NETWORK_ERROR",
        errorDetails: "Could not connect to Anthropic API. Please check your internet connection and try again.",
        keyHint,
        validatedAt,
      };
    }

    return {
      valid: false,
      error: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errorDetails: `An unexpected error occurred during validation: ${errorMessage}. Please try again.`,
      keyHint,
      validatedAt,
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
