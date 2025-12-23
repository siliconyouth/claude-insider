/**
 * Admin API: Fix Users Without Usernames
 *
 * GET: List all users without usernames
 * POST: Auto-generate usernames for users missing them
 *
 * Username generation rules:
 * - Use display name or real name
 * - Convert to lowercase
 * - Remove spaces and special characters
 * - Ensure uniqueness by appending numbers if needed
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

/**
 * Generate a valid username from a name
 * - Lowercase
 * - No spaces
 * - Only alphanumeric and underscores
 */
function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // Remove spaces
    .replace(/[^a-z0-9_]/g, "") // Remove special chars except underscore
    .slice(0, 30); // Max 30 chars
}

/**
 * Check if username exists in database
 */
async function isUsernameTaken(username: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM "user" WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username]
  );
  return result.rows.length > 0;
}

/**
 * Find a unique username by appending numbers if needed
 */
async function findUniqueUsername(baseUsername: string): Promise<string> {
  // If base is empty, use a random string
  if (!baseUsername) {
    baseUsername = "user";
  }

  // Try the base username first
  if (!(await isUsernameTaken(baseUsername))) {
    return baseUsername;
  }

  // Try with numbers appended
  for (let i = 1; i <= 9999; i++) {
    const candidate = `${baseUsername}${i}`;
    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }

  // Fallback: use timestamp
  return `${baseUsername}${Date.now()}`;
}

// GET: List users without usernames
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Find users without usernames
    const result = await pool.query(`
      SELECT id, name, email, username, "createdAt"
      FROM "user"
      WHERE username IS NULL OR username = ''
      ORDER BY "createdAt" DESC
    `);

    const users = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      suggestedUsername: generateUsername(row.name || row.email?.split("@")[0] || "user"),
      createdAt: row.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("[Admin] Failed to list users without usernames:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: Fix users without usernames
export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Find users without usernames
    const result = await pool.query(`
      SELECT id, name, email
      FROM "user"
      WHERE username IS NULL OR username = ''
    `);

    const updates: Array<{ id: string; name: string; oldUsername: string | null; newUsername: string }> = [];

    for (const user of result.rows) {
      // Generate username from name or email
      const baseName = user.name || user.email?.split("@")[0] || "user";
      const baseUsername = generateUsername(baseName);
      const newUsername = await findUniqueUsername(baseUsername);

      // Update the user
      await pool.query(
        `UPDATE "user" SET username = $1 WHERE id = $2`,
        [newUsername, user.id]
      );

      updates.push({
        id: user.id,
        name: user.name,
        oldUsername: null,
        newUsername,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} users`,
      updates,
    });
  } catch (error) {
    console.error("[Admin] Failed to fix usernames:", error);
    return NextResponse.json(
      { error: "Failed to fix usernames" },
      { status: 500 }
    );
  }
}
