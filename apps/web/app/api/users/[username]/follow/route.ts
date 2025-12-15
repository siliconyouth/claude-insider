/**
 * User Follow API
 *
 * Follow/unfollow a user and check follow status.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Check if current user is following
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false });
    }

    // Get user ID from username
    const userResult = await pool.query(
      `SELECT id FROM "user" WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = userResult.rows[0].id;

    // Check if following
    const followResult = await pool.query(
      `SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [session.user.id, targetUserId]
    );

    return NextResponse.json({
      isFollowing: followResult.rows.length > 0,
    });
  } catch (error) {
    console.error("[Follow API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check follow status" },
      { status: 500 }
    );
  }
}

/**
 * Follow a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from username
    const userResult = await pool.query(
      `SELECT id FROM "user" WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = userResult.rows[0].id;

    // Can't follow yourself
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Insert follow (ignore if already exists)
    await pool.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [session.user.id, targetUserId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Follow API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to follow user" },
      { status: 500 }
    );
  }
}

/**
 * Unfollow a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from username
    const userResult = await pool.query(
      `SELECT id FROM "user" WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = userResult.rows[0].id;

    await pool.query(
      `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [session.user.id, targetUserId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Follow API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
