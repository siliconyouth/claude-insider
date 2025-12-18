/**
 * User Profile Update API
 *
 * Updates user profile with additional fields like displayName, username, bio, and hasCompletedOnboarding.
 * These fields are defined in the Better Auth server config but not typed in the client.
 *
 * IMPORTANT: This endpoint clears Better Auth's cookie cache after updates to ensure
 * the client gets fresh data. Without this, cookie caching (30 min) would return stale values.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";
import { awardSpecialAchievement } from "@/app/actions/achievements";

interface UpdateProfileRequest {
  name?: string;
  displayName?: string;
  username?: string;
  bio?: string;
  hasCompletedOnboarding?: boolean;
}

/**
 * Validate username format
 */
function validateUsername(username: string): string | null {
  if (!username) {
    return "Username is required";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }
  if (username.length > 30) {
    return "Username must be less than 30 characters";
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only contain lowercase letters, numbers, and underscores";
  }
  if (/^\d/.test(username)) {
    return "Username cannot start with a number";
  }

  // Reserved usernames
  const reserved = [
    "admin", "administrator", "root", "system", "support",
    "help", "contact", "info", "api", "www", "mail", "email",
    "claudeinsider", "claude", "anthropic", "ai", "assistant",
    "bot", "moderator", "mod", "staff", "team", "official",
  ];

  if (reserved.includes(username)) {
    return "This username is reserved";
  }

  return null;
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

    // Handle username update with validation
    if (body.username !== undefined) {
      const cleanUsername = body.username.toLowerCase().trim();
      const validationError = validateUsername(cleanUsername);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // Check uniqueness (exclude current user)
      const existingUser = await pool.query(
        `SELECT id FROM "user" WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1`,
        [cleanUsername, session.user.id]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }

      updates.push(`username = $${paramIndex++}`);
      values.push(cleanUsername);
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

    // Award "Welcome Aboard" achievement when onboarding is completed
    if (body.hasCompletedOnboarding === true) {
      try {
        await awardSpecialAchievement(session.user.id, "welcome_aboard");
      } catch (err) {
        // Log but don't fail the request - achievement is non-critical
        console.error("[Update Profile] Failed to award welcome achievement:", err);
      }
    }

    // Clear Better Auth's session cookie cache to force fresh data fetch
    // This is crucial for hasCompletedOnboarding to reflect immediately
    const cookieStore = await cookies();
    const sessionCacheCookie = cookieStore.get("ci_auth.session_data");
    if (sessionCacheCookie) {
      cookieStore.delete("ci_auth.session_data");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Update Profile Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
