/**
 * Social Links API
 *
 * Updates user's social media profile links.
 * Validates and sanitizes each platform's format.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validateAllSocialLinks } from "@/lib/validations/social-links";
import { Pool } from "pg";
import type { SocialLinks } from "@/types/onboarding";

// Create pool for direct database access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Update social links
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: { socialLinks: SocialLinks } = await request.json();

    if (!body.socialLinks || typeof body.socialLinks !== "object") {
      return NextResponse.json({ error: "Invalid social links format" }, { status: 400 });
    }

    // Validate and sanitize all social links
    const { isValid, errors, sanitized } = validateAllSocialLinks(body.socialLinks);

    if (!isValid) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Update socialLinks JSONB column
    await pool.query(
      `UPDATE "user" SET "socialLinks" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2`,
      [JSON.stringify(sanitized), session.user.id]
    );

    return NextResponse.json({
      success: true,
      socialLinks: sanitized,
    });
  } catch (error) {
    console.error("[Social Links Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update social links" },
      { status: 500 }
    );
  }
}

/**
 * Get current social links
 */
export async function GET() {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT "socialLinks" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const socialLinks = result.rows[0]?.socialLinks || {};

    return NextResponse.json({ socialLinks });
  } catch (error) {
    console.error("[Social Links Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get social links" },
      { status: 500 }
    );
  }
}
