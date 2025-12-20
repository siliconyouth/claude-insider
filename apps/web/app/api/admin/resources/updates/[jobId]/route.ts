/**
 * Resource Update Job Detail API
 *
 * GET /api/admin/resources/updates/[jobId] - Get job details
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Verify authentication and role
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";

    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get job with resource info
    const result = await pool.query(
      `SELECT
        j.*,
        r.name as resource_name,
        r.slug as resource_slug,
        r.screenshots as old_screenshots,
        u.name as triggered_by_name,
        reviewer.name as reviewed_by_name
      FROM resource_update_jobs j
      JOIN resources r ON j.resource_id = r.id
      LEFT JOIN "user" u ON j.triggered_by = u.id
      LEFT JOIN "user" reviewer ON j.reviewed_by = reviewer.id
      WHERE j.id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job: result.rows[0] });
  } catch (error) {
    console.error("Failed to get job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
