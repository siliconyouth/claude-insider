/**
 * Reject Update Job API
 *
 * POST /api/admin/resources/updates/[jobId]/reject
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { rejectUpdateJob } from "@/lib/resources/update-orchestrator";

export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { reviewNotes } = body;

    if (!reviewNotes?.trim()) {
      return NextResponse.json(
        { error: "Review notes are required for rejection" },
        { status: 400 }
      );
    }

    // Reject the job
    await rejectUpdateJob(jobId, session.user.id, reviewNotes);

    return NextResponse.json({
      success: true,
      message: "Job rejected successfully",
    });
  } catch (error) {
    console.error("Failed to reject job:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("not ready")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
