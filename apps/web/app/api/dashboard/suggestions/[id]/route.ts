/**
 * Admin Suggestion Detail API
 *
 * Update suggestion status (approve/reject/merge).
 * Requires editor, moderator, or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { createNotification } from "@/app/actions/notifications";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

interface UpdateSuggestionRequest {
  status: "approved" | "rejected" | "merged";
  reviewerNotes?: string;
}

/**
 * Update suggestion status
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

    // Check role - editors and above can review suggestions
    const userRole = (session.user as { role?: UserRole }).role;
    if (!hasMinRole(userRole, ROLES.EDITOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateSuggestionRequest = await request.json();

    // Validate status
    if (!body.status || !["approved", "rejected", "merged"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be approved, rejected, or merged" },
        { status: 400 }
      );
    }

    // Get suggestion details before update (for notification)
    const existingResult = await pool.query(
      `SELECT user_id, title FROM edit_suggestions WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const existingSuggestion = existingResult.rows[0];

    // Update suggestion
    const result = await pool.query(
      `
      UPDATE edit_suggestions
      SET
        status = $1,
        reviewer_id = $2,
        reviewer_notes = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, status, updated_at
    `,
      [
        body.status,
        session.user.id,
        body.reviewerNotes?.trim() || null,
        id,
      ]
    );

    // Create notification for suggestion author
    if (existingSuggestion.user_id !== session.user.id) {
      try {
        const statusTitles = {
          approved: "Your suggestion was approved",
          rejected: "Your suggestion was not accepted",
          merged: "Your suggestion was merged",
        };

        const statusMessages = {
          approved: `Your suggestion "${existingSuggestion.title}" has been approved by a reviewer.`,
          rejected: body.reviewerNotes
            ? `Your suggestion "${existingSuggestion.title}" was not accepted. Reason: ${body.reviewerNotes}`
            : `Your suggestion "${existingSuggestion.title}" was not accepted.`,
          merged: `Your suggestion "${existingSuggestion.title}" has been merged! Thank you for contributing.`,
        };

        await createNotification({
          userId: existingSuggestion.user_id,
          type: `suggestion_${body.status}` as "suggestion_approved" | "suggestion_rejected" | "suggestion_merged",
          title: statusTitles[body.status],
          message: statusMessages[body.status],
          actorId: session.user.id,
          resourceType: "suggestion",
          resourceId: id,
          data: {
            suggestionTitle: existingSuggestion.title,
            reviewerNotes: body.reviewerNotes || null,
          },
        });
      } catch (notifError) {
        console.error("[Suggestions] Notification error:", notifError);
        // Don't fail the update if notification fails
      }
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
          `suggestion_${body.status}`,
          "edit_suggestion",
          id,
          JSON.stringify({ reviewer_notes: body.reviewerNotes }),
        ]
      );
    } catch {
      // Don't fail if logging fails
    }

    return NextResponse.json({
      success: true,
      suggestion: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Suggestion Update Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update suggestion" },
      { status: 500 }
    );
  }
}

/**
 * Get a single suggestion
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
        es.*,
        u.name as user_name,
        u.email as user_email,
        r.name as reviewer_name
      FROM edit_suggestions es
      LEFT JOIN "user" u ON es.user_id = u.id
      LEFT JOIN "user" r ON es.reviewer_id = r.id
      WHERE es.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    return NextResponse.json({
      suggestion: {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        suggestionType: row.suggestion_type,
        title: row.title,
        description: row.description,
        suggestedChanges: row.suggested_changes,
        status: row.status,
        reviewerId: row.reviewer_id,
        reviewerName: row.reviewer_name,
        reviewerNotes: row.reviewer_notes,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Suggestion Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get suggestion" },
      { status: 500 }
    );
  }
}
