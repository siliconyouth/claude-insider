/**
 * Get User API Key Helper
 *
 * Server-side helper to retrieve a user's Anthropic API key
 * for use in AI features. Falls back to site's API key if not available.
 */

import { Pool } from "pg";
import { decryptApiKey } from "./api-keys";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export interface UserApiKeyResult {
  apiKey: string;
  isUserKey: boolean;
  userId: string | null;
  apiKeyId: string | null;
  preferredModel: string | null;
}

/**
 * Get the API key to use for a user
 * Returns user's key if available and valid, otherwise site's key
 */
export async function getUserApiKey(userId: string | null): Promise<UserApiKeyResult> {
  const siteApiKey = process.env.ANTHROPIC_API_KEY;

  if (!siteApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // If no user ID, use site's key
  if (!userId) {
    return {
      apiKey: siteApiKey,
      isUserKey: false,
      userId: null,
      apiKeyId: null,
      preferredModel: null,
    };
  }

  try {
    // Check if user has their own API key
    const result = await pool.query(
      `SELECT
        uak.id,
        uak.api_key_encrypted,
        uak.is_valid,
        uak.preferred_model,
        u.ai_preferences
       FROM user_api_keys uak
       JOIN "user" u ON u.id = uak.user_id
       WHERE uak.user_id = $1
         AND uak.provider = 'anthropic'
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // User doesn't have an API key
      return {
        apiKey: siteApiKey,
        isUserKey: false,
        userId,
        apiKeyId: null,
        preferredModel: null,
      };
    }

    const row = result.rows[0];
    const aiPreferences = row.ai_preferences || {};

    // Check if user wants to use their own key
    if (!aiPreferences.useOwnApiKey) {
      return {
        apiKey: siteApiKey,
        isUserKey: false,
        userId,
        apiKeyId: null,
        preferredModel: aiPreferences.preferredModel || null,
      };
    }

    // Check if key is valid
    if (row.is_valid === false) {
      // Key is invalid, use site's key
      return {
        apiKey: siteApiKey,
        isUserKey: false,
        userId,
        apiKeyId: null,
        preferredModel: row.preferred_model,
      };
    }

    // Decrypt and return user's key
    try {
      const decryptedKey = decryptApiKey(row.api_key_encrypted);
      return {
        apiKey: decryptedKey,
        isUserKey: true,
        userId,
        apiKeyId: row.id,
        preferredModel: row.preferred_model,
      };
    } catch (decryptError) {
      console.error("[getUserApiKey] Decryption failed:", decryptError);
      // Fall back to site's key
      return {
        apiKey: siteApiKey,
        isUserKey: false,
        userId,
        apiKeyId: null,
        preferredModel: row.preferred_model,
      };
    }
  } catch (error) {
    console.error("[getUserApiKey] Error:", error);
    // Fall back to site's key on any error
    return {
      apiKey: siteApiKey,
      isUserKey: false,
      userId,
      apiKeyId: null,
      preferredModel: null,
    };
  }
}

/**
 * Log API usage for a user's key
 */
export async function logApiUsage(
  userId: string,
  apiKeyId: string,
  feature: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Insert usage log
    await pool.query(
      `INSERT INTO api_key_usage_logs (user_id, api_key_id, feature, model, input_tokens, output_tokens)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, apiKeyId, feature, model, inputTokens, outputTokens]
    );

    // Update monthly totals
    await pool.query(
      `UPDATE user_api_keys
       SET usage_this_month = jsonb_set(
         COALESCE(usage_this_month, '{}'::jsonb),
         ARRAY[$1],
         (COALESCE(usage_this_month->$1, '{"input_tokens": 0, "output_tokens": 0, "requests": 0}'::jsonb)::jsonb ||
          jsonb_build_object(
            'input_tokens', COALESCE((usage_this_month->$1->>'input_tokens')::int, 0) + $2,
            'output_tokens', COALESCE((usage_this_month->$1->>'output_tokens')::int, 0) + $3,
            'requests', COALESCE((usage_this_month->$1->>'requests')::int, 0) + 1
          ))::jsonb
       )
       WHERE id = $4`,
      [currentMonth, inputTokens, outputTokens, apiKeyId]
    );
  } catch (error) {
    // Log but don't throw - usage logging shouldn't break the main flow
    console.error("[logApiUsage] Error:", error);
  }
}
