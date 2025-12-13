/**
 * Dashboard Users API
 *
 * List users (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { AdminUserListItem, PaginatedResponse } from "@/types/admin";

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

    // Check role - admin only for user management
    const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const isBetaTester = searchParams.get("isBetaTester");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = "WHERE 1=1";
    const params: (string | number | boolean)[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    if (role !== "all") {
      params.push(role);
      whereClause += ` AND u.role = $${params.length}`;
    }

    if (isBetaTester === "true") {
      whereClause += ` AND u."isBetaTester" = TRUE`;
    } else if (isBetaTester === "false") {
      whereClause += ` AND (u."isBetaTester" = FALSE OR u."isBetaTester" IS NULL)`;
    }

    const validSortFields: Record<string, string> = {
      name: "name",
      email: "email",
      createdAt: "created_at",
      role: "role",
    };
    const sortField = validSortFields[sortBy] || "created_at";
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM "user" u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    params.push(limit, offset);
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.image,
        u.role,
        u."isBetaTester",
        u."emailVerified",
        u.created_at
      FROM "user" u
      ${whereClause}
      ORDER BY u.${sortField} ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
      params
    );

    const items: AdminUserListItem[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      role: row.role || "user",
      isBetaTester: row.isBetaTester || false,
      emailVerified: row.emailVerified || false,
      createdAt: row.created_at.toISOString(),
    }));

    const response: PaginatedResponse<AdminUserListItem> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Dashboard Users List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get users" },
      { status: 500 }
    );
  }
}
