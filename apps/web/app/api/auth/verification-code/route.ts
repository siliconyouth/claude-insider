/**
 * Email Verification Code API
 *
 * Handles sending and verifying email verification codes.
 * Codes expire in 1 hour and allow 5 attempts.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { sendVerificationEmailWithCode } from "@/lib/email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Generate 6-digit verification code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/verification-code
 * Send a new verification code to an email address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, userName } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate a new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the code in database
    await pool.query(
      `INSERT INTO email_verification_codes (user_id, email, code, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) WHERE verified_at IS NULL
       DO UPDATE SET code = $3, expires_at = $4, attempts = 0, created_at = NOW()`,
      [userId || null, email.toLowerCase(), code, expiresAt]
    );

    // Build verification URL (for the link option)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";
    const verificationUrl = `${baseUrl}/auth/verify-email?email=${encodeURIComponent(email)}`;

    // Send the email
    const result = await sendVerificationEmailWithCode(email, verificationUrl, code, userName);

    if (!result.success) {
      console.error("[Verification Code] Email send failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[Verification Code] Error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/verification-code
 * Verify a code entered by the user
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Find the verification record
    const result = await pool.query(
      `SELECT * FROM email_verification_codes
       WHERE email = $1 AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No pending verification found for this email" },
        { status: 404 }
      );
    }

    const record = result.rows[0];

    // Check if expired
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Check max attempts
    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Verify the code
    if (record.code !== code) {
      // Increment attempt count
      await pool.query(
        `UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = $1`,
        [record.id]
      );

      const remainingAttempts = 5 - (record.attempts + 1);
      return NextResponse.json(
        {
          error: "Invalid verification code",
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Mark as verified
    await pool.query(
      `UPDATE email_verification_codes SET verified_at = NOW() WHERE id = $1`,
      [record.id]
    );

    // Update user's email verification status
    if (record.user_id) {
      await pool.query(
        `UPDATE "user" SET "emailVerified" = TRUE WHERE id = $1`,
        [record.user_id]
      );
    } else {
      // Try to find user by email and update
      await pool.query(
        `UPDATE "user" SET "emailVerified" = TRUE WHERE LOWER(email) = $1`,
        [email.toLowerCase()]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("[Verification Code] Verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
