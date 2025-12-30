/**
 * Broken Links API
 *
 * GET - List broken links queue with filtering
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

    // Build WHERE clause
    const whereClause = status !== "all" ? "WHERE q.status = $1" : "";
    const params = status !== "all" ? [status, limit, offset] : [limit, offset];

    const { rows: items } = await pool.query(
      `
      SELECT
        q.id,
        q.resource_id as "resourceId",
        r.title as "resourceTitle",
        r.slug as "resourceSlug",
        q.original_url as "originalUrl",
        q.status_code as "statusCode",
        q.error_message as "errorMessage",
        q.suggested_url as "suggestedUrl",
        q.status,
        q.created_at as "createdAt"
      FROM broken_link_queue q
      JOIN resources r ON r.id = q.resource_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${status !== "all" ? 2 : 1} OFFSET $${status !== "all" ? 3 : 2}
    `,
      params
    );

    // Get total count
    const countParams = status !== "all" ? [status] : [];
    const {
      rows: [{ count }],
    } = await pool.query(
      `SELECT COUNT(*) FROM broken_link_queue q ${whereClause}`,
      countParams
    );

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
