/**
 * Dashboard Feedback Detail API
 *
 * Get and update individual feedback.
 * Requires moderator or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { UpdateFeedbackRequest } from "@/types/admin";

/**
 * Get a single feedback item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `
      SELECT
        f.id,
        f.user_id,
        f.feedback_type,
        f.title,
        f.description,
        f.severity,
        f.page_url,
        f.user_agent,
        f.screenshot_url,
        f.status,
        f.created_at,
        f.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image
      FROM feedback f
      JOIN "user" u ON f.user_id = u.id
      WHERE f.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      userImage: row.user_image,
      feedbackType: row.feedback_type,
      title: row.title,
      description: row.description,
      severity: row.severity,
      pageUrl: row.page_url,
      userAgent: row.user_agent,
      screenshotUrl: row.screenshot_url,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("[Dashboard Feedback Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get feedback" },
      { status: 500 }
    );
  }
}

/**
 * Update feedback status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateFeedbackRequest = await request.json();

    // Validate status
    const validStatuses = ["open", "in_progress", "resolved", "closed", "wont_fix"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get current status for logging
    const currentResult = await pool.query(
      "SELECT status FROM feedback WHERE id = $1",
      [id]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    const previousStatus = currentResult.rows[0].status;

    // Update feedback
    await pool.query(
      `UPDATE feedback SET status = $1, updated_at = NOW() WHERE id = $2`,
      [body.status, id]
    );

    // Log the action
    await pool.query(
      `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, $2, 'feedback', $3, $4)
    `,
      [
        session.user.id,
        "update_feedback_status",
        id,
        JSON.stringify({
          previousStatus,
          newStatus: body.status,
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      status: body.status,
    });
  } catch (error) {
    console.error("[Dashboard Feedback Update Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update feedback" },
      { status: 500 }
    );
  }
}
