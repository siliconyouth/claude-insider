/**
 * Admin Prompt Submissions API
 *
 * GET: List submissions with filtering and pagination
 *
 * Admin/Moderator only endpoint for reviewing community submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/prompts/submissions
 * List submissions with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const roleResult = await pool.query(
      'SELECT role FROM "user" WHERE id = $1',
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";

    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    // Build query
    const whereClause = status === "all" ? "" : "WHERE s.status = $1";
    const queryParams: unknown[] = status === "all" ? [] : [status];

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM prompt_submissions s ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Get submissions
    const paramOffset = status === "all" ? 1 : 2;
    const result = await pool.query(
      `SELECT
        s.id,
        s.title,
        s.description,
        s.content,
        s.category_id,
        c.name as category_name,
        c.slug as category_slug,
        s.tags,
        s.variables,
        s.source_url,
        s.submitter_id,
        u.name as submitter_name,
        u.image as submitter_image,
        s.status,
        s.ai_analysis,
        s.moderator_notes,
        s.created_at,
        s.updated_at
      FROM prompt_submissions s
      LEFT JOIN prompt_categories c ON c.id = s.category_id
      LEFT JOIN "user" u ON u.id = s.submitter_id
      ${whereClause}
      ORDER BY
        CASE s.status
          WHEN 'pending' THEN 1
          WHEN 'reviewing' THEN 2
          WHEN 'needs_adaptation' THEN 3
          ELSE 4
        END,
        s.created_at DESC
      LIMIT $${paramOffset} OFFSET $${paramOffset + 1}`,
      [...queryParams, limit, offset]
    );

    // Format response
    const submissions = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
      tags: row.tags || [],
      variables: row.variables || [],
      sourceUrl: row.source_url,
      submitter: {
        id: row.submitter_id,
        name: row.submitter_name,
        image: row.submitter_image,
      },
      status: row.status,
      aiAnalysis: row.ai_analysis,
      moderatorNotes: row.moderator_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
