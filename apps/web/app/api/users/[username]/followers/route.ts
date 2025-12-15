/**
 * User Followers API
 *
 * Get list of users following a profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Get followers for a user
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

    // Get followers with their follow status relative to current user
    const followersResult = await pool.query(
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
      JOIN "user" u ON u.id = uf.follower_id
      WHERE uf.following_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $4
      `,
      [targetUser.id, limit, currentUserId, offset]
    );

    const followers = followersResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      image: row.avatarUrl || row.image,
      bio: row.bio,
      isFollowing: row.isFollowing,
    }));

    return NextResponse.json({
      followers,
      userName,
    });
  } catch (error) {
    console.error("[Followers API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get followers" },
      { status: 500 }
    );
  }
}
