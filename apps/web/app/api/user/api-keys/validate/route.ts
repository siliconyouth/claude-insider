/**
 * API Key Validation Endpoint
 *
 * POST - Revalidate an existing API key and refresh available models
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { decryptApiKey, validateAnthropicApiKey } from "@/lib/api-keys";

/**
 * POST /api/user/api-keys/validate
 * Revalidate an existing API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider = "anthropic" } = body;

    // Get the encrypted API key
    const result = await pool.query(
      `SELECT id, api_key_encrypted FROM user_api_keys
       WHERE user_id = $1 AND provider = $2`,
      [session.user.id, provider]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No API key found for this provider" },
        { status: 404 }
      );
    }

    const { id, api_key_encrypted } = result.rows[0];

    // Decrypt the API key
    let apiKey: string;
    try {
      apiKey = decryptApiKey(api_key_encrypted);
    } catch (error) {
      console.error("[API Key Validate] Decryption error:", error);
      return NextResponse.json(
        { error: "Failed to decrypt API key" },
        { status: 500 }
      );
    }

    // Validate the API key
    const validation = await validateAnthropicApiKey(apiKey);

    // Update the API key record
    await pool.query(
      `UPDATE user_api_keys
       SET is_valid = $1,
           last_validated_at = NOW(),
           validation_error = $2,
           available_models = $3
       WHERE id = $4`,
      [
        validation.valid,
        validation.error || null,
        JSON.stringify(validation.availableModels || []),
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      isValid: validation.valid,
      error: validation.error,
      availableModels: validation.availableModels,
      accountInfo: validation.accountInfo,
    });
  } catch (error) {
    console.error("[API Key Validate] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate API key" },
      { status: 500 }
    );
  }
}
