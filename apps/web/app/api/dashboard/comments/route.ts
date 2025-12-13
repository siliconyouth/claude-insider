/**
 * Admin Comments API
 *
 * List all comments for moderation.
 * Requires editor, moderator, or admin role.
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
 * Get all comments with optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - editors and above can moderate comments
    const userRole = (session.user as { role?: UserRole }).role;
    if (!hasMinRole(userRole, ROLES.EDITOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const resourceType = searchParams.get("resource_type");

    let query = `
      SELECT
        c.id,
        c.user_id,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image,
        u.username as user_username,
        c.resource_type,
        c.resource_id,
        c.parent_id,
        c.content,
        c.status,
        c.is_edited,
        c.upvotes,
        c.downvotes,
        c.moderator_id,
        m.name as moderator_name,
        c.moderation_notes,
        c.moderated_at,
        c.created_at,
        c.updated_at
      FROM comments c
      LEFT JOIN "user" u ON c.user_id = u.id
      LEFT JOIN "user" m ON c.moderator_id = m.id
    `;

    const conditions: string[] = [];
    const params: (string | null)[] = [];
    let paramIndex = 1;

    if (status && ["pending", "approved", "rejected", "flagged"].includes(status)) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (resourceType && ["resource", "doc"].includes(resourceType)) {
      conditions.push(`c.resource_type = $${paramIndex}`);
      params.push(resourceType);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY c.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);

    const comments = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      user_image: row.user_image,
      user_username: row.user_username,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      parent_id: row.parent_id,
      content: row.content,
      status: row.status,
      is_edited: row.is_edited,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      moderator_id: row.moderator_id,
      moderator_name: row.moderator_name,
      moderation_notes: row.moderation_notes,
      moderated_at: row.moderated_at?.toISOString(),
      created_at: row.created_at?.toISOString(),
      updated_at: row.updated_at?.toISOString(),
    }));

    // Get counts for each status
    const countsResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM comments
      GROUP BY status
    `);

    const counts = countsResult.rows.reduce(
      (acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, flagged: 0 } as Record<string, number>
    );

    return NextResponse.json({ comments, counts });
  } catch (error) {
    console.error("[Admin Comments List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get comments" },
      { status: 500 }
    );
  }
}
