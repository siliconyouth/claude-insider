/**
 * Favorites API
 *
 * List and create favorites.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import type { CreateFavoriteRequest, FavoriteWithDetails, PaginatedFavorites } from "@/types/favorites";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Get user's favorites
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get("resourceType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = "WHERE user_id = $1";
    const params: (string | number)[] = [session.user.id];

    if (resourceType && ["resource", "doc"].includes(resourceType)) {
      params.push(resourceType);
      whereClause += ` AND resource_type = $${params.length}`;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM favorites ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get favorites
    params.push(limit, offset);
    const result = await pool.query(
      `
      SELECT id, user_id, resource_type, resource_id, notes, created_at
      FROM favorites
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
      params
    );

    // Map to response format (details will be populated client-side or via separate lookup)
    const items: FavoriteWithDetails[] = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      title: row.resource_id, // Placeholder - client fetches actual details
    }));

    const response: PaginatedFavorites = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Favorites List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get favorites" },
      { status: 500 }
    );
  }
}

/**
 * Add a favorite
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateFavoriteRequest = await request.json();

    // Validate
    if (!body.resourceType || !["resource", "doc"].includes(body.resourceType)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    if (!body.resourceId?.trim()) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await pool.query(
      `SELECT id FROM favorites WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3`,
      [session.user.id, body.resourceType, body.resourceId.trim()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: true,
        favoriteId: existing.rows[0].id,
        message: "Already favorited",
      });
    }

    // Create favorite
    const result = await pool.query(
      `
      INSERT INTO favorites (user_id, resource_type, resource_id, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `,
      [session.user.id, body.resourceType, body.resourceId.trim(), body.notes || null]
    );

    return NextResponse.json({
      success: true,
      favoriteId: result.rows[0].id,
      createdAt: result.rows[0].created_at.toISOString(),
    });
  } catch (error) {
    console.error("[Favorites Create Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add favorite" },
      { status: 500 }
    );
  }
}
