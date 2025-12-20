/**
 * Trigger Resource Update API
 *
 * POST /api/admin/resources/[slug]/update - Trigger manual update for a resource
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  createUpdateJob,
  processUpdateJob,
} from "@/lib/resources/update-orchestrator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    // Find resource by slug
    const resourceResult = await pool.query(
      `SELECT id, name, slug FROM resources WHERE slug = $1`,
      [slug]
    );

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const resource = resourceResult.rows[0];

    // Create the job
    const jobId = await createUpdateJob({
      resourceId: resource.id,
      triggerType: "manual",
      triggeredBy: session.user.id,
    });

    // Start processing in the background
    processUpdateJob(jobId).catch((error) => {
      console.error(`Failed to process job ${jobId}:`, error);
    });

    return NextResponse.json({
      success: true,
      jobId,
      resourceId: resource.id,
      resourceName: resource.name,
      message: "Update job created and processing started",
    });
  } catch (error) {
    console.error("Failed to trigger update:", error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes("already in progress")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
