/**
 * User API Keys Management Endpoint
 *
 * POST - Save or update an API key
 * GET - Get user's API key info (masked)
 * DELETE - Remove an API key
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";
import {
  encryptApiKey,
  decryptApiKey,
  getApiKeyHint,
  validateAnthropicApiKey,
  CLAUDE_MODELS,
  type ClaudeModel,
  type ValidationResult,
  type AnthropicAccountInfo,
} from "@/lib/api-keys";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export interface ApiKeyInfo {
  id: string;
  provider: string;
  keyHint: string;
  isValid: boolean | null;
  lastValidatedAt: string | null;
  validationError: string | null;
  availableModels: ClaudeModel[];
  preferredModel: string | null;
  usageThisMonth: {
    inputTokens: number;
    outputTokens: number;
    requests: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/user/api-keys
 * Get user's API key information (not the actual key)
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        id, provider, api_key_hint, is_valid, last_validated_at,
        validation_error, available_models, preferred_model,
        usage_this_month, created_at, updated_at
       FROM user_api_keys
       WHERE user_id = $1`,
      [session.user.id]
    );

    // Get user's AI preferences
    const prefsResult = await pool.query(
      `SELECT ai_preferences FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const aiPreferences = prefsResult.rows[0]?.ai_preferences || {
      useOwnApiKey: false,
      preferredProvider: "anthropic",
      preferredModel: null,
      autoSelectBestModel: true,
    };

    const apiKeys: ApiKeyInfo[] = result.rows.map((row) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyUsage = row.usage_this_month?.[currentMonth];

      return {
        id: row.id,
        provider: row.provider,
        keyHint: row.api_key_hint || "****",
        isValid: row.is_valid,
        lastValidatedAt: row.last_validated_at?.toISOString() || null,
        validationError: row.validation_error,
        availableModels: row.available_models || [],
        preferredModel: row.preferred_model,
        usageThisMonth: monthlyUsage
          ? {
              inputTokens: monthlyUsage.input_tokens || 0,
              outputTokens: monthlyUsage.output_tokens || 0,
              requests: monthlyUsage.requests || 0,
            }
          : null,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      };
    });

    return NextResponse.json({
      apiKeys,
      aiPreferences,
      allModels: CLAUDE_MODELS,
    });
  } catch (error) {
    console.error("[API Keys GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/api-keys
 * Save or update an API key, or just update model preference
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey, provider = "anthropic", preferredModel } = body;

    // If only updating model preference (no new API key)
    if (!apiKey && preferredModel) {
      // Check if user has an existing API key
      const existing = await pool.query(
        `SELECT id, available_models FROM user_api_keys WHERE user_id = $1 AND provider = $2`,
        [session.user.id, provider]
      );

      if (existing.rows.length === 0) {
        return NextResponse.json(
          { error: "No API key found. Please add an API key first." },
          { status: 400 }
        );
      }

      // Validate model is available
      const availableModels = existing.rows[0].available_models || [];
      const modelValid = availableModels.some((m: { id: string }) => m.id === preferredModel);

      if (!modelValid) {
        return NextResponse.json(
          { error: "Selected model is not available for your account" },
          { status: 400 }
        );
      }

      // Update just the preferred model
      await pool.query(
        `UPDATE user_api_keys SET preferred_model = $1, updated_at = NOW() WHERE user_id = $2 AND provider = $3`,
        [preferredModel, session.user.id, provider]
      );

      // Also update user preferences
      await pool.query(
        `UPDATE "user"
         SET ai_preferences = COALESCE(ai_preferences, '{}')::jsonb || $2::jsonb
         WHERE id = $1`,
        [
          session.user.id,
          JSON.stringify({ preferredModel }),
        ]
      );

      return NextResponse.json({
        success: true,
        preferredModel,
        message: "Model preference updated",
      });
    }

    // Otherwise, require API key
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate the API key (includes format validation)
    const validation = await validateAnthropicApiKey(apiKey);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error || "Invalid API key",
          errorCode: validation.errorCode,
          errorDetails: validation.errorDetails,
          keyHint: validation.keyHint,
          validatedAt: validation.validatedAt,
        },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);
    const keyHint = getApiKeyHint(apiKey);

    // Determine preferred model
    let selectedModel = preferredModel;
    if (!selectedModel && validation.availableModels?.length) {
      // Auto-select best model
      const opus = validation.availableModels.find((m) => m.tier === "opus");
      const sonnet = validation.availableModels.find((m) => m.tier === "sonnet");
      selectedModel = opus?.id || sonnet?.id || validation.availableModels[0]?.id;
    }

    // Upsert the API key
    const result = await pool.query(
      `INSERT INTO user_api_keys (
        user_id, provider, api_key_encrypted, api_key_hint,
        is_valid, last_validated_at, available_models, preferred_model
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        api_key_encrypted = $3,
        api_key_hint = $4,
        is_valid = $5,
        last_validated_at = NOW(),
        validation_error = NULL,
        available_models = $6,
        preferred_model = $7,
        updated_at = NOW()
      RETURNING id`,
      [
        session.user.id,
        provider,
        encryptedKey,
        keyHint,
        validation.valid,
        JSON.stringify(validation.availableModels || []),
        selectedModel,
      ]
    );

    // Update user's AI preferences to use their own key
    await pool.query(
      `UPDATE "user"
       SET ai_preferences = COALESCE(ai_preferences, '{}')::jsonb || $2::jsonb
       WHERE id = $1`,
      [
        session.user.id,
        JSON.stringify({
          useOwnApiKey: true,
          preferredProvider: provider,
          preferredModel: selectedModel,
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
      keyHint,
      isValid: validation.valid,
      availableModels: validation.availableModels,
      preferredModel: selectedModel,
      accountInfo: validation.accountInfo,
      validatedAt: validation.validatedAt,
    });
  } catch (error) {
    console.error("[API Keys POST] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to save API key",
        errorCode: "SERVER_ERROR",
        errorDetails: `An unexpected error occurred while saving your API key: ${errorMessage}. Please try again.`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/api-keys
 * Remove an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "anthropic";

    // Delete the API key
    await pool.query(
      `DELETE FROM user_api_keys WHERE user_id = $1 AND provider = $2`,
      [session.user.id, provider]
    );

    // Update user's AI preferences to not use their own key
    await pool.query(
      `UPDATE "user"
       SET ai_preferences = COALESCE(ai_preferences, '{}')::jsonb || '{"useOwnApiKey": false}'::jsonb
       WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Keys DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
