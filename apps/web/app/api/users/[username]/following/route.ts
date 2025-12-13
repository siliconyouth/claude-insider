/**
 * User Following API
 *
 * Get list of users that a profile is following.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Get users that this profile is following
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get current user (if logged in)
    const session = await getSession();
    const currentUserId = session?.user?.id;

    // Get target user ID and name
    const userResult = await pool.query(
      `SELECT id, name, "displayName" FROM "user" WHERE username = $1`,
      [username.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = userResult.rows[0];
    const userName = targetUser.displayName || targetUser.name;

    // Get following users with their follow status relative to current user
    const followingResult = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.username,
        u.image,
        u."avatarUrl",
        u.bio,
        CASE
          WHEN $3::text IS NOT NULL THEN EXISTS (
            SELECT 1 FROM user_follows
            WHERE follower_id = $3 AND following_id = u.id
          )
          ELSE false
        END as "isFollowing"
      FROM user_follows uf
      JOIN "user" u ON u.id = uf.following_id
      WHERE uf.follower_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $4
      `,
      [targetUser.id, limit, currentUserId, offset]
    );

    const following = followingResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      image: row.avatarUrl || row.image,
      bio: row.bio,
      isFollowing: row.isFollowing,
    }));

    return NextResponse.json({
      following,
      userName,
    });
  } catch (error) {
    console.error("[Following API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get following" },
      { status: 500 }
    );
  }
}
