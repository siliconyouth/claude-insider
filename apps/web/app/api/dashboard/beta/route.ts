/**
 * Dashboard Beta Applications API
 *
 * List and manage beta applications.
 * Requires moderator or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { AdminBetaApplication, PaginatedResponse } from "@/types/admin";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

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
    const experienceLevel = searchParams.get("experienceLevel") || "all";
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
      whereClause += ` AND ba.status = $${params.length}`;
    }

    if (experienceLevel !== "all") {
      params.push(experienceLevel);
      whereClause += ` AND ba.experience_level = $${params.length}`;
    }

    const sortField = sortBy === "updatedAt" ? "updated_at" : "created_at";
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM beta_applications ba ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get applications with user info
    params.push(limit, offset);
    const result = await pool.query(
      `
      SELECT
        ba.id,
        ba.user_id,
        ba.motivation,
        ba.experience_level,
        ba.use_case,
        ba.status,
        ba.reviewed_by,
        ba.reviewed_at,
        ba.review_notes,
        ba.created_at,
        ba.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image,
        r.name as reviewer_name
      FROM beta_applications ba
      JOIN "user" u ON ba.user_id = u.id
      LEFT JOIN "user" r ON ba.reviewed_by = r.id
      ${whereClause}
      ORDER BY ba.${sortField} ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
      params
    );

    const items: AdminBetaApplication[] = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      userImage: row.user_image,
      motivation: row.motivation,
      experienceLevel: row.experience_level,
      useCase: row.use_case,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedByName: row.reviewer_name,
      reviewedAt: row.reviewed_at?.toISOString(),
      reviewNotes: row.review_notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    const response: PaginatedResponse<AdminBetaApplication> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Dashboard Beta List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get applications" },
      { status: 500 }
    );
  }
}
