/**
 * Passkey Login API Route
 *
 * Creates a session for a user after successful passkey authentication.
 * This endpoint is called after the client-side WebAuthn verification.
 *
 * Note: This is a placeholder implementation. Full session creation
 * requires Better Auth plugin integration for WebAuthn which is
 * currently in development. For now, passkey verification is done
 * client-side and this endpoint validates the user exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

// Store one-time tokens for passkey login (in production, use Redis/DB)
const passkeyTokens = new Map<string, { userId: string; email: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing user information" },
        { status: 400 }
      );
    }

    // Verify the user exists and get their info
    const userResult = await pool.query(
      `SELECT id, email, name, image, "emailVerified", "hasPassword", "isBetaTester", "isVerified", "hasCompletedOnboarding", role
       FROM "user"
       WHERE id = $1 AND email = $2`,
      [userId, email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify user has at least one passkey (security check)
    const passkeyResult = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM passkeys WHERE user_id = $1) as has_passkey`,
      [userId]
    );

    if (!passkeyResult.rows[0]?.has_passkey) {
      return NextResponse.json(
        { error: "No passkey registered for this user" },
        { status: 403 }
      );
    }

    // Generate a one-time token for the passkey login
    // This token can be exchanged for a session via the normal auth flow
    const token = crypto.randomBytes(32).toString("hex");
    passkeyTokens.set(token, {
      userId,
      email: email.toLowerCase(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Clean up expired tokens
    for (const [key, value] of passkeyTokens) {
      if (value.expiresAt < Date.now()) {
        passkeyTokens.delete(key);
      }
    }

    // Return success with the token
    // Client should then call /api/auth/passkey-callback with this token
    return NextResponse.json({
      success: true,
      email: email.toLowerCase(),
      token,
    });
  } catch (error) {
    console.error("[Passkey Login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Note: passkeyTokens is kept private to this module
// In production, use Redis or database for token storage
