/**
 * Admin Suggestions API
 *
 * List all edit suggestions for review.
 * Requires moderator or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Get all suggestions with optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const userRole = (session.user as { role?: UserRole }).role;
    if (!hasMinRole(userRole, ROLES.EDITOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = `
      SELECT
        es.id,
        es.user_id,
        u.name as user_name,
        u.email as user_email,
        u.username as user_username,
        es.resource_type,
        es.resource_id,
        es.suggestion_type,
        es.title,
        es.description,
        es.suggested_changes,
        es.status,
        es.reviewer_id,
        es.reviewer_notes,
        es.created_at,
        es.updated_at
      FROM edit_suggestions es
      LEFT JOIN "user" u ON es.user_id = u.id
    `;

    const params: string[] = [];

    if (status && ["pending", "approved", "rejected", "merged"].includes(status)) {
      query += ` WHERE es.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY es.created_at DESC`;

    const result = await pool.query(query, params);

    const suggestions = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      user_username: row.user_username,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      suggestion_type: row.suggestion_type,
      title: row.title,
      description: row.description,
      suggested_changes: row.suggested_changes,
      status: row.status,
      reviewer_id: row.reviewer_id,
      reviewer_notes: row.reviewer_notes,
      created_at: row.created_at?.toISOString(),
      updated_at: row.updated_at?.toISOString(),
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[Admin Suggestions List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
