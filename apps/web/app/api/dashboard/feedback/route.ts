/**
 * Dashboard Feedback API
 *
 * List and manage feedback.
 * Requires moderator or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { AdminFeedback, PaginatedResponse } from "@/types/admin";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const feedbackType = searchParams.get("feedbackType") || "all";
    const severity = searchParams.get("severity") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    if (status !== "all") {
      params.push(status);
      whereClause += ` AND f.status = $${params.length}`;
    }

    if (feedbackType !== "all") {
      params.push(feedbackType);
      whereClause += ` AND f.feedback_type = $${params.length}`;
    }

    if (severity !== "all") {
      params.push(severity);
      whereClause += ` AND f.severity = $${params.length}`;
    }

    const validSortFields: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      severity: "severity",
    };
    const sortField = validSortFields[sortBy] || "created_at";
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM feedback f ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get feedback with user info
    params.push(limit, offset);
    const result = await pool.query(
      `
      SELECT
        f.id,
        f.user_id,
        f.feedback_type,
        f.title,
        f.description,
        f.severity,
        f.page_url,
        f.user_agent,
        f.screenshot_url,
        f.status,
        f.created_at,
        f.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image
      FROM feedback f
      JOIN "user" u ON f.user_id = u.id
      ${whereClause}
      ORDER BY f.${sortField} ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
      params
    );

    const items: AdminFeedback[] = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      userImage: row.user_image,
      feedbackType: row.feedback_type,
      title: row.title,
      description: row.description,
      severity: row.severity,
      pageUrl: row.page_url,
      userAgent: row.user_agent,
      screenshotUrl: row.screenshot_url,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    const response: PaginatedResponse<AdminFeedback> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Dashboard Feedback List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get feedback" },
      { status: 500 }
    );
  }
}
