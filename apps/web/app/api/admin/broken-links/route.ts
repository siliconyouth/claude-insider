/**
 * Broken Links API
 *
 * GET - List resources with broken links
 *
 * Shows resources from resource_link_validations where is_valid = false,
 * combined with queue status from broken_link_queue when available.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Status filtering logic:
    // - "all": Show all invalid links
    // - "pending": Invalid links not in queue OR in queue with pending status
    // - "fixed"/"hidden"/"dismissed": Only from queue with that status
    let whereClause = "";
    let params: (string | number)[] = [];

    if (status === "all") {
      // All invalid links
      whereClause = "WHERE v.is_valid = false";
      params = [limit, offset];
    } else if (status === "pending") {
      // Invalid links that are either not in queue or pending in queue
      whereClause = "WHERE v.is_valid = false AND (q.id IS NULL OR q.status = 'pending')";
      params = [limit, offset];
    } else {
      // Specific queue status (fixed, hidden, dismissed)
      whereClause = "WHERE q.status = $1";
      params = [status, limit, offset];
    }

    const { rows: items } = await pool.query(
      `
      SELECT
        COALESCE(q.id, v.id::text) as id,
        v.resource_id as "resourceId",
        r.title as "resourceTitle",
        r.slug as "resourceSlug",
        v.url as "originalUrl",
        v.status_code as "statusCode",
        v.error_message as "errorMessage",
        q.suggested_url as "suggestedUrl",
        COALESCE(q.status, 'pending') as status,
        COALESCE(q.created_at, v.last_checked_at) as "createdAt"
      FROM resource_link_validations v
      JOIN resources r ON r.id = v.resource_id
      LEFT JOIN broken_link_queue q ON q.resource_id = v.resource_id
      ${whereClause}
      ORDER BY v.last_checked_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
      params
    );

    // Get total count with same logic
    let countQuery = "";
    let countParams: string[] = [];

    if (status === "all") {
      countQuery = `
        SELECT COUNT(*) FROM resource_link_validations v
        WHERE v.is_valid = false
      `;
    } else if (status === "pending") {
      countQuery = `
        SELECT COUNT(*) FROM resource_link_validations v
        LEFT JOIN broken_link_queue q ON q.resource_id = v.resource_id
        WHERE v.is_valid = false AND (q.id IS NULL OR q.status = 'pending')
      `;
    } else {
      countQuery = `
        SELECT COUNT(*) FROM broken_link_queue q
        WHERE q.status = $1
      `;
      countParams = [status];
    }

    const {
      rows: [{ count }],
    } = await pool.query(countQuery, countParams);

    return NextResponse.json({
      items,
      total: parseInt(count, 10),
      page,
      limit,
    });
  } catch (error) {
    console.error("[BrokenLinks] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broken links" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
