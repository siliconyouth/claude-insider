/**
 * Beta Testers API
 *
 * Get list of all approved beta testers with their stats.
 * Admin/moderator access required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin/moderator access
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const role = roleResult.rows[0]?.role;
    if (!role || !["admin", "moderator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition = "";
    const params: (string | number | boolean)[] = [true]; // isBetaTester = true
    let paramIndex = 2;

    if (search) {
      searchCondition = `AND (LOWER(u.name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Get beta testers with stats
    const testersResult = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.image as "avatarUrl",
        u."isBetaTester",
        u."createdAt",
        ba.created_at as "betaApprovedAt",
        ba.id as "applicationId",
        ba.experience_level as "experienceLevel",
        ba.motivation,
        COALESCE(f.feedback_count, 0)::int as "feedbackCount",
        f.last_feedback_at as "lastFeedbackAt"
      FROM "user" u
      LEFT JOIN beta_applications ba ON ba.user_id = u.id AND ba.status = 'approved'
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as feedback_count, MAX(created_at) as last_feedback_at
        FROM feedback
        GROUP BY user_id
      ) f ON f.user_id = u.id
      WHERE u."isBetaTester" = $1 ${searchCondition}
      ORDER BY ba.created_at DESC NULLS LAST, u."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM "user" u
       WHERE u."isBetaTester" = $1 ${searchCondition}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total || "0");

    // Get stats
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM "user" WHERE "isBetaTester" = true)::int as total_testers,
        (SELECT COUNT(DISTINCT user_id) FROM feedback WHERE created_at > NOW() - INTERVAL '30 days')::int as active_this_month,
        (SELECT COUNT(*) FROM feedback)::int as total_feedback
    `);
    const stats = statsResult.rows[0];

    return NextResponse.json({
      items: testersResult.rows.map((row) => ({
        id: row.id,
        name: row.name || "Unknown",
        email: row.email,
        avatarUrl: row.avatarUrl,
        isBetaTester: row.isBetaTester,
        betaApprovedAt: row.betaApprovedAt?.toISOString() || null,
        createdAt: row.createdAt?.toISOString(),
        applicationId: row.applicationId,
        experienceLevel: row.experienceLevel,
        motivation: row.motivation,
        feedbackCount: row.feedbackCount,
        lastFeedbackAt: row.lastFeedbackAt?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalTesters: stats.total_testers || 0,
        activeThisMonth: stats.active_this_month || 0,
        totalFeedback: stats.total_feedback || 0,
      },
    });
  } catch (error) {
    console.error("[Beta Testers API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch beta testers" },
      { status: 500 }
    );
  }
}
