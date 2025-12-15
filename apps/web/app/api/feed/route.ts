/**
 * Activity Feed API
 *
 * Get activity from users the current user follows.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Get activity feed for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get activity from followed users
    // This combines comments, suggestions, and public collections
    const activitiesResult = await pool.query(
      `
      WITH followed_users AS (
        SELECT following_id FROM user_follows WHERE follower_id = $1
      ),
      comment_activity AS (
        SELECT
          c.id,
          'comment' as type,
          c.content,
          c.resource_type as "resourceType",
          c.resource_id as "resourceId",
          NULL as "resourceTitle",
          c.created_at as "createdAt",
          u.id as user_id,
          u.name as user_name,
          u.username as user_username,
          COALESCE(u."avatarUrl", u.image) as user_image
        FROM comments c
        JOIN "user" u ON u.id = c.user_id
        WHERE c.user_id IN (SELECT following_id FROM followed_users)
        AND c.status = 'approved'
      ),
      suggestion_activity AS (
        SELECT
          s.id,
          'suggestion' as type,
          s.description as content,
          s.resource_type as "resourceType",
          s.resource_id as "resourceId",
          s.title as "resourceTitle",
          s.created_at as "createdAt",
          u.id as user_id,
          u.name as user_name,
          u.username as user_username,
          COALESCE(u."avatarUrl", u.image) as user_image
        FROM edit_suggestions s
        JOIN "user" u ON u.id = s.user_id
        WHERE s.user_id IN (SELECT following_id FROM followed_users)
        AND s.status IN ('approved', 'merged')
      ),
      collection_activity AS (
        SELECT
          col.id,
          'collection' as type,
          col.description as content,
          'collection' as "resourceType",
          col.slug as "resourceId",
          col.name as "resourceTitle",
          col.created_at as "createdAt",
          u.id as user_id,
          u.name as user_name,
          u.username as user_username,
          COALESCE(u."avatarUrl", u.image) as user_image
        FROM collections col
        JOIN "user" u ON u.id = col.user_id
        WHERE col.user_id IN (SELECT following_id FROM followed_users)
        AND col.is_public = true
      )
      SELECT * FROM (
        SELECT * FROM comment_activity
        UNION ALL
        SELECT * FROM suggestion_activity
        UNION ALL
        SELECT * FROM collection_activity
      ) combined
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3
      `,
      [session.user.id, limit, offset]
    );

    const activities = activitiesResult.rows.map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content?.substring(0, 200) || null,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      resourceTitle: row.resourceTitle,
      createdAt: row.createdAt?.toISOString(),
      user: {
        id: row.user_id,
        name: row.user_name,
        username: row.user_username,
        image: row.user_image,
      },
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[Feed API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get feed" },
      { status: 500 }
    );
  }
}
