/**
 * Admin Comment Detail API
 *
 * Update comment status (approve/reject/flag).
 * Requires editor, moderator, or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

interface UpdateCommentRequest {
  status: "approved" | "rejected" | "flagged";
  moderationNotes?: string;
}

/**
 * Update comment status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - editors and above can moderate comments
    const userRole = (session.user as { role?: UserRole }).role;
    if (!hasMinRole(userRole, ROLES.EDITOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateCommentRequest = await request.json();

    // Validate status
    if (!body.status || !["approved", "rejected", "flagged"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be approved, rejected, or flagged" },
        { status: 400 }
      );
    }

    // Update comment
    const result = await pool.query(
      `
      UPDATE comments
      SET
        status = $1,
        moderator_id = $2,
        moderation_notes = $3,
        moderated_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, status, moderated_at
    `,
      [
        body.status,
        session.user.id,
        body.moderationNotes?.trim() || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Log admin action
    try {
      await pool.query(
        `
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          session.user.id,
          `comment_${body.status}`,
          "comment",
          id,
          JSON.stringify({ moderation_notes: body.moderationNotes }),
        ]
      );
    } catch {
      // Don't fail if logging fails
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        moderatedAt: result.rows[0].moderated_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Comment Update Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update comment" },
      { status: 500 }
    );
  }
}

/**
 * Get a single comment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const userRole = (session.user as { role?: UserRole }).role;
    if (!hasMinRole(userRole, ROLES.EDITOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `
      SELECT
        c.*,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image,
        m.name as moderator_name
      FROM comments c
      LEFT JOIN "user" u ON c.user_id = u.id
      LEFT JOIN "user" m ON c.moderator_id = m.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    return NextResponse.json({
      comment: {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        userImage: row.user_image,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        parentId: row.parent_id,
        content: row.content,
        status: row.status,
        isEdited: row.is_edited,
        upvotes: row.upvotes,
        downvotes: row.downvotes,
        moderatorId: row.moderator_id,
        moderatorName: row.moderator_name,
        moderationNotes: row.moderation_notes,
        moderatedAt: row.moderated_at?.toISOString(),
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Comment Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get comment" },
      { status: 500 }
    );
  }
}

/**
 * Delete a comment (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only moderators and admins can delete comments
    const userRole = (session.user as { role?: UserRole }).role;
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get comment info before deleting
    const existing = await pool.query(
      `SELECT content, user_id FROM comments WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Delete comment
    await pool.query(`DELETE FROM comments WHERE id = $1`, [id]);

    // Log admin action
    try {
      await pool.query(
        `
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          session.user.id,
          "comment_deleted",
          "comment",
          id,
          JSON.stringify({
            original_content: existing.rows[0].content?.substring(0, 100),
            original_user_id: existing.rows[0].user_id,
          }),
        ]
      );
    } catch {
      // Don't fail if logging fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Comment Delete Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete comment" },
      { status: 500 }
    );
  }
}
