/**
 * Dashboard Beta Application Detail API
 *
 * Get and update individual beta application.
 * Requires moderator or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { ReviewBetaRequest } from "@/types/admin";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Get a single beta application
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
        ba.id,
        ba.user_id,
        ba.motivation,
        ba.experience_level,
        ba.use_case,
        ba.status,
        ba.reviewed_by,
        ba.reviewed_at,
        ba.review_notes,
        ba.created_at,
        ba.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image,
        r.name as reviewer_name
      FROM beta_applications ba
      JOIN "user" u ON ba.user_id = u.id
      LEFT JOIN "user" r ON ba.reviewed_by = r.id
      WHERE ba.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      userImage: row.user_image,
      motivation: row.motivation,
      experienceLevel: row.experience_level,
      useCase: row.use_case,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedByName: row.reviewer_name,
      reviewedAt: row.reviewed_at?.toISOString(),
      reviewNotes: row.review_notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("[Dashboard Beta Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get application" },
      { status: 500 }
    );
  }
}

/**
 * Review a beta application (approve/reject)
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

    const body: ReviewBetaRequest = await request.json();

    // Validate status
    if (!["approved", "rejected"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get the application
      const appResult = await client.query(
        "SELECT user_id, status FROM beta_applications WHERE id = $1",
        [id]
      );

      if (appResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      const application = appResult.rows[0];

      // Update the application
      await client.query(
        `
        UPDATE beta_applications
        SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3, updated_at = NOW()
        WHERE id = $4
      `,
        [body.status, session.user.id, body.reviewNotes || null, id]
      );

      // If approved, update user's isBetaTester flag
      if (body.status === "approved") {
        await client.query(
          `UPDATE "user" SET "isBetaTester" = TRUE WHERE id = $1`,
          [application.user_id]
        );
      }

      // Log the action
      await client.query(
        `
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES ($1, $2, 'beta_application', $3, $4)
      `,
        [
          session.user.id,
          body.status === "approved" ? "approve_beta" : "reject_beta",
          id,
          JSON.stringify({
            previousStatus: application.status,
            newStatus: body.status,
            reviewNotes: body.reviewNotes,
            userId: application.user_id,
          }),
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        status: body.status,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Dashboard Beta Review Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to review application" },
      { status: 500 }
    );
  }
}
