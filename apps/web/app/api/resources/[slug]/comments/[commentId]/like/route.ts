/**
 * Comment Like API
 *
 * POST /api/resources/[slug]/comments/[commentId]/like - Toggle like
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string; commentId: string }>;
}

/**
 * POST - Toggle like on a comment
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, commentId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the comment exists and belongs to this resource
    const commentResult = await pool.query<{ id: string; user_id: string }>(
      `SELECT c.id, c.user_id
       FROM resource_comments c
       JOIN resources r ON c.resource_id = r.id
       WHERE c.id = $1 AND r.slug = $2 AND c.status = 'approved'`,
      [commentId, slug]
    );

    const comment = commentResult.rows[0];
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if already liked
    const existingResult = await pool.query<{ id: string }>(
      `SELECT id FROM resource_comment_likes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, session.user.id]
    );

    let isLiked: boolean;

    if (existingResult.rows.length > 0) {
      // Unlike
      await pool.query(
        `DELETE FROM resource_comment_likes WHERE comment_id = $1 AND user_id = $2`,
        [commentId, session.user.id]
      );
      isLiked = false;
    } else {
      // Like
      await pool.query(
        `INSERT INTO resource_comment_likes (comment_id, user_id) VALUES ($1, $2)`,
        [commentId, session.user.id]
      );
      isLiked = true;
    }

    // Get updated count
    const countResult = await pool.query<{ likes_count: number }>(
      `SELECT likes_count FROM resource_comments WHERE id = $1`,
      [commentId]
    );

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: countResult.rows[0]?.likes_count || 0,
    });
  } catch (error) {
    console.error("[API] Error toggling comment like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
