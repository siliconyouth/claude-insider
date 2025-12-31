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

    let items: object[] = [];
    let total = 0;

    if (status === "all" || status === "pending") {
      // For "all" and "pending", query from validations table
      // Use separate queries for clarity and debugging
      const listQuery = `
        SELECT
          v.id::text as id,
          v.resource_id as "resourceId",
          r.title as "resourceTitle",
          r.slug as "resourceSlug",
          v.url as "originalUrl",
          v.status_code as "statusCode",
          v.error_message as "errorMessage",
          COALESCE(q.suggested_url, NULL) as "suggestedUrl",
          COALESCE(q.status, 'pending') as status,
          v.last_checked_at as "createdAt"
        FROM resource_link_validations v
        INNER JOIN resources r ON r.id = v.resource_id
        LEFT JOIN broken_link_queue q ON q.resource_id = v.resource_id
        WHERE v.is_valid = false
        ${status === "pending" ? "AND (q.id IS NULL OR q.status = 'pending')" : ""}
        ORDER BY v.last_checked_at DESC
        LIMIT $1 OFFSET $2
      `;

      const listResult = await pool.query(listQuery, [limit, offset]);
      items = listResult.rows;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as count
        FROM resource_link_validations v
        INNER JOIN resources r ON r.id = v.resource_id
        LEFT JOIN broken_link_queue q ON q.resource_id = v.resource_id
        WHERE v.is_valid = false
        ${status === "pending" ? "AND (q.id IS NULL OR q.status = 'pending')" : ""}
      `;
      const countResult = await pool.query(countQuery);
      total = parseInt(countResult.rows[0].count, 10);

    } else {
      // For specific queue statuses (fixed, hidden, dismissed)
      const listQuery = `
        SELECT
          q.id::text as id,
          q.resource_id as "resourceId",
          r.title as "resourceTitle",
          r.slug as "resourceSlug",
          q.original_url as "originalUrl",
          v.status_code as "statusCode",
          v.error_message as "errorMessage",
          q.suggested_url as "suggestedUrl",
          q.status,
          q.created_at as "createdAt"
        FROM broken_link_queue q
        INNER JOIN resources r ON r.id = q.resource_id
        LEFT JOIN resource_link_validations v ON v.resource_id = q.resource_id
        WHERE q.status = $1
        ORDER BY q.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const listResult = await pool.query(listQuery, [status, limit, offset]);
      items = listResult.rows;

      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM broken_link_queue WHERE status = $1`,
        [status]
      );
      total = parseInt(countResult.rows[0].count, 10);
    }

    return NextResponse.json({
      items,
      total,
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
