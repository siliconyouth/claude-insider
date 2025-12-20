/**
 * Resource Update Jobs API
 *
 * GET /api/admin/resources/updates - List update jobs
 * POST /api/admin/resources/updates - Trigger new update job
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  createUpdateJob,
  processUpdateJob,
} from "@/lib/resources/update-orchestrator";

/**
 * GET - List update jobs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");
    const resourceId = searchParams.get("resourceId");

    // Build query
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      conditions.push(`j.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (resourceId) {
      conditions.push(`j.resource_id = $${paramIndex}`);
      values.push(resourceId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM resource_update_jobs j ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get jobs with resource info
    values.push(limit, offset);
    const result = await pool.query(
      `SELECT
        j.*,
        r.name as resource_name,
        r.slug as resource_slug,
        r.screenshots as old_screenshots
      FROM resource_update_jobs j
      JOIN resources r ON j.resource_id = r.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    return NextResponse.json({
      jobs: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to list update jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger a new update job for a resource
 */
export async function POST(request: NextRequest) {
  try {
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
    const { resourceId, triggerType = "manual" } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    // Verify resource exists
    const resourceResult = await pool.query(
      `SELECT id, name, slug FROM resources WHERE id = $1`,
      [resourceId]
    );

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Create the job
    const jobId = await createUpdateJob({
      resourceId,
      triggerType,
      triggeredBy: session.user.id,
    });

    // Start processing in the background
    // Note: In production, this should be a background job queue
    processUpdateJob(jobId).catch((error) => {
      console.error(`Failed to process job ${jobId}:`, error);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Update job created and processing started",
    });
  } catch (error) {
    console.error("Failed to create update job:", error);

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
