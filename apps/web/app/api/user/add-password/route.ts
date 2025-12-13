/**
 * Add Password API
 *
 * Allows OAuth users to add an email/password login option.
 * Creates a credential account linked to their existing OAuth identity.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, auth } from "@/lib/auth";
import { Pool } from "pg";

// Create pool for direct database access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Add password for OAuth user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password, confirmPassword } = await request.json();

    // Validate passwords
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already has a password
    const userResult = await pool.query(
      `SELECT "hasPassword" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    if (userResult.rows[0]?.hasPassword) {
      return NextResponse.json(
        { error: "You already have a password set" },
        { status: 400 }
      );
    }

    // Check if credential account already exists
    const accountResult = await pool.query(
      `SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [session.user.id]
    );

    if (accountResult.rows.length > 0) {
      // Update hasPassword flag if account exists but flag is false
      await pool.query(
        `UPDATE "user" SET "hasPassword" = TRUE, "updatedAt" = NOW() WHERE id = $1`,
        [session.user.id]
      );
      return NextResponse.json({ success: true });
    }

    // Use Better Auth's internal password hashing
    // Import bcrypt for password hashing (same as Better Auth uses)
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create credential account
    const accountId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "account" (id, "userId", "providerId", "accountId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [accountId, session.user.id, session.user.email, hashedPassword]
    );

    // Update hasPassword flag
    await pool.query(
      `UPDATE "user" SET "hasPassword" = TRUE, "updatedAt" = NOW() WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Add Password Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add password" },
      { status: 500 }
    );
  }
}
