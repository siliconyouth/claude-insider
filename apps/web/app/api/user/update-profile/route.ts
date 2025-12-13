/**
 * User Profile Update API
 *
 * Updates user profile with additional fields like displayName, bio, and hasCompletedOnboarding.
 * These fields are defined in the Better Auth server config but not typed in the client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";

// Create pool for direct database access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

interface UpdateProfileRequest {
  name?: string;
  displayName?: string;
  bio?: string;
  hasCompletedOnboarding?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateProfileRequest = await request.json();

    // Build update fields
    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }

    if (body.displayName !== undefined) {
      updates.push(`"displayName" = $${paramIndex++}`);
      values.push(body.displayName);
    }

    if (body.bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(body.bio);
    }

    if (body.hasCompletedOnboarding !== undefined) {
      updates.push(`"hasCompletedOnboarding" = $${paramIndex++}`);
      values.push(body.hasCompletedOnboarding);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Add updated_at
    updates.push(`"updatedAt" = NOW()`);

    // Add user ID as last parameter
    values.push(session.user.id);

    // Execute update
    const query = `UPDATE "user" SET ${updates.join(", ")} WHERE id = $${paramIndex}`;
    await pool.query(query, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Update Profile Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
