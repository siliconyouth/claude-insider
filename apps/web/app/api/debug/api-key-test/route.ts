/**
 * API Key Testing Endpoint
 *
 * Tests Anthropic API keys and returns usage/subscription information.
 * Supports testing both the site's configured key and user-provided keys.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { pool } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

interface ApiKeyTestResult {
  valid: boolean;
  keyType: "site" | "user";
  keyPrefix: string;
  // API Info
  model?: string;
  modelsAvailable?: string[];
  // Rate Limits (from headers)
  rateLimits?: {
    requestsLimit?: number;
    requestsRemaining?: number;
    requestsReset?: string;
    tokensLimit?: number;
    tokensRemaining?: number;
    tokensReset?: string;
  };
  // Usage Info
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  // Subscription/Organization Info
  organization?: {
    id?: string;
    name?: string;
  };
  // Error
  error?: string;
  errorType?: string;
  // Timing
  responseTime: number;
  testedAt: string;
}

// Available Claude models for testing (ordered by priority - best first)
const CLAUDE_MODELS = [
  { id: "claude-opus-4-20250514", name: "Opus 4.5", tier: "opus" },
  { id: "claude-sonnet-4-20250514", name: "Sonnet 4", tier: "sonnet" },
  { id: "claude-3-5-sonnet-20241022", name: "Sonnet 3.5", tier: "sonnet" },
  { id: "claude-3-opus-20240229", name: "Opus 3", tier: "opus" },
  { id: "claude-3-5-haiku-20241022", name: "Haiku 3.5", tier: "haiku" },
  { id: "claude-3-haiku-20240307", name: "Haiku 3", tier: "haiku" },
] as const;

// Legacy string array for backwards compatibility
const CLAUDE_MODEL_IDS = CLAUDE_MODELS.map(m => m.id);

/**
 * Test which models are available to an API key
 * Tests all models in parallel for efficiency
 */
async function checkModelAvailability(apiKey: string): Promise<string[]> {
  const available: string[] = [];

  // Test models in parallel using Promise.allSettled
  const results = await Promise.allSettled(
    CLAUDE_MODELS.map(async (model) => {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: model.id,
        max_tokens: 5,
        messages: [{ role: "user", content: "Hi" }],
      });
      return model.id;
    })
  );

  // Collect successful models (in priority order since CLAUDE_MODELS is ordered)
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      available.push(result.value);
    }
  }

  return available;
}

async function testApiKey(
  apiKey: string,
  keyType: "site" | "user"
): Promise<ApiKeyTestResult> {
  const startTime = Date.now();
  const keyPrefix = apiKey.substring(0, 12) + "..." + apiKey.substring(apiKey.length - 4);

  try {
    // First, check which models are available to this key
    const modelsAvailable = await checkModelAvailability(apiKey);

    // Use the best available model for the main test (first in list = highest priority)
    const testModel = modelsAvailable[0] || "claude-3-haiku-20240307";

    // Create Anthropic client with the provided key
    const anthropic = new Anthropic({
      apiKey,
    });

    // Make a test request with the best available model
    const response = await anthropic.messages.create({
      model: testModel,
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: "Say 'OK' only.",
        },
      ],
    });

    const responseTime = Date.now() - startTime;

    // Extract usage info from response
    const usage = response.usage
      ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined;

    return {
      valid: true,
      keyType,
      keyPrefix,
      model: response.model,
      modelsAvailable,
      usage,
      responseTime,
      testedAt: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Parse error type
    let errorType = "unknown";
    let errorMessage = "Unknown error";

    if (error instanceof Anthropic.APIError) {
      errorType = error.status === 401 ? "invalid_key" :
                  error.status === 403 ? "forbidden" :
                  error.status === 429 ? "rate_limited" :
                  error.status === 500 ? "server_error" : "api_error";
      errorMessage = error.message;

      // Extract rate limit info from headers if available
      const rateLimits = error.headers ? {
        requestsLimit: error.headers["anthropic-ratelimit-requests-limit"]
          ? parseInt(error.headers["anthropic-ratelimit-requests-limit"] as string)
          : undefined,
        requestsRemaining: error.headers["anthropic-ratelimit-requests-remaining"]
          ? parseInt(error.headers["anthropic-ratelimit-requests-remaining"] as string)
          : undefined,
        requestsReset: error.headers["anthropic-ratelimit-requests-reset"] as string | undefined,
        tokensLimit: error.headers["anthropic-ratelimit-tokens-limit"]
          ? parseInt(error.headers["anthropic-ratelimit-tokens-limit"] as string)
          : undefined,
        tokensRemaining: error.headers["anthropic-ratelimit-tokens-remaining"]
          ? parseInt(error.headers["anthropic-ratelimit-tokens-remaining"] as string)
          : undefined,
        tokensReset: error.headers["anthropic-ratelimit-tokens-reset"] as string | undefined,
      } : undefined;

      return {
        valid: false,
        keyType,
        keyPrefix,
        error: errorMessage,
        errorType,
        rateLimits,
        responseTime,
        testedAt: new Date().toISOString(),
      };
    }

    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.name;
    }

    return {
      valid: false,
      keyType,
      keyPrefix,
      error: errorMessage,
      errorType,
      responseTime,
      testedAt: new Date().toISOString(),
    };
  }
}

export async function GET() {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Test site's API key
    const siteApiKey = process.env.ANTHROPIC_API_KEY;

    if (!siteApiKey) {
      return NextResponse.json({
        success: false,
        siteKey: {
          valid: false,
          keyType: "site",
          keyPrefix: "not configured",
          error: "ANTHROPIC_API_KEY not set in environment",
          errorType: "missing_key",
          responseTime: 0,
          testedAt: new Date().toISOString(),
        },
      });
    }

    const siteKeyResult = await testApiKey(siteApiKey, "site");

    return NextResponse.json({
      success: true,
      siteKey: siteKeyResult,
      allModels: CLAUDE_MODELS.map(m => ({ id: m.id, name: m.name, tier: m.tier })),
      availableModels: siteKeyResult.modelsAvailable || [],
      bestModel: siteKeyResult.modelsAvailable?.[0] || null,
      environment: {
        hasApiKey: !!siteApiKey,
        keyLength: siteApiKey.length,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("[API Key Test Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "API key test failed" },
      { status: 500 }
    );
  }
}

// POST endpoint for testing user-provided keys
export async function POST(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate key format (should start with sk-ant-)
    if (!apiKey.startsWith("sk-ant-")) {
      return NextResponse.json({
        success: false,
        userKey: {
          valid: false,
          keyType: "user",
          keyPrefix: apiKey.substring(0, 12) + "...",
          error: "Invalid key format. Anthropic API keys start with 'sk-ant-'",
          errorType: "invalid_format",
          responseTime: 0,
          testedAt: new Date().toISOString(),
        },
      });
    }

    const userKeyResult = await testApiKey(apiKey, "user");

    return NextResponse.json({
      success: userKeyResult.valid,
      userKey: userKeyResult,
    });
  } catch (error) {
    console.error("[User API Key Test Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "API key test failed" },
      { status: 500 }
    );
  }
}
