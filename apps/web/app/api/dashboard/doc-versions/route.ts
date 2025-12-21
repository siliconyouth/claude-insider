/**
 * Dashboard Doc Versions Admin API
 *
 * GET: List all documents with version counts and history info
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface DocRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  version: number;
  updated_at: string;
  created_at: string;
  last_changed_by_name: string | null;
  version_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    // Build query
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(d.title ILIKE $${paramIndex} OR d.slug ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`d.category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM documentation d ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    // Get docs with version info
    const result = await pool.query(
      `
      SELECT
        d.id,
        d.slug,
        d.title,
        d.description,
        d.category,
        d.version,
        d.updated_at,
        d.created_at,
        u.name as last_changed_by_name,
        (
          SELECT COUNT(*)::int
          FROM documentation_history h
          WHERE h.doc_slug = d.slug
        ) as version_count
      FROM documentation d
      LEFT JOIN "user" u ON u.id = d.updated_by
      ${whereClause}
      ORDER BY d.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...values, limit, offset]
    );

    // Get categories for filter
    const categoriesResult = await pool.query(`
      SELECT DISTINCT category
      FROM documentation
      WHERE category IS NOT NULL
      ORDER BY category
    `);

    // Stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(DISTINCT d.slug) as total_docs,
        SUM(d.version) as total_versions,
        MAX(d.updated_at) as last_update,
        (
          SELECT COUNT(*)
          FROM documentation_history
        ) as total_history_entries
      FROM documentation d
    `);

    const docs = (result.rows as DocRow[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      description: d.description,
      category: d.category,
      currentVersion: d.version,
      versionCount: d.version_count,
      lastChangedBy: d.last_changed_by_name,
      updatedAt: d.updated_at,
      createdAt: d.created_at,
    }));

    const stats = statsResult.rows[0];

    return NextResponse.json({
      docs,
      categories: categoriesResult.rows.map((r) => r.category),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalDocs: parseInt(stats.total_docs, 10),
        totalVersions: parseInt(stats.total_versions || "0", 10),
        totalHistoryEntries: parseInt(stats.total_history_entries, 10),
        lastUpdate: stats.last_update,
      },
    });
  } catch (error) {
    console.error("Doc versions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
