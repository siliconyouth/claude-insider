/**
 * Resource Changelog API
 *
 * GET /api/resources/[slug]/changelog - Get public changelog for a resource
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Find resource by slug
    const resourceResult = await pool.query(
      `SELECT id, name, slug FROM resources WHERE slug = $1`,
      [slug]
    );

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const resource = resourceResult.rows[0];

    // Get changelog entries
    const result = await pool.query(
      `SELECT
        c.id,
        c.version,
        c.changes,
        c.ai_summary,
        c.source_type,
        c.applied_at,
        c.stats_snapshot,
        u.name as applied_by_name
      FROM resource_changelog c
      LEFT JOIN "user" u ON c.applied_by = u.id
      WHERE c.resource_id = $1
      ORDER BY c.applied_at DESC
      LIMIT $2 OFFSET $3`,
      [resource.id, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM resource_changelog WHERE resource_id = $1`,
      [resource.id]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Format the response
    const changelog = result.rows.map((row) => ({
      id: row.id,
      version: row.version,
      changes: row.changes,
      summary: row.ai_summary,
      sourceType: row.source_type,
      appliedAt: row.applied_at,
      appliedBy: row.applied_by_name,
      stats: row.stats_snapshot,
    }));

    return NextResponse.json({
      resource: {
        id: resource.id,
        name: resource.name,
        slug: resource.slug,
      },
      changelog,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to get changelog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
