/**
 * Resource Favorite API
 *
 * POST /api/resources/[slug]/favorite - Toggle favorite status
 * GET /api/resources/[slug]/favorite - Check favorite status
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET - Check if user has favorited the resource
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ isFavorited: false });
    }

    // Get resource ID from slug
    const resourceResult = await pool.query<{ id: string }>(
      `SELECT id FROM resources WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );

    const resource = resourceResult.rows[0];
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resourceId = resource.id;

    // Check favorite status
    const favoriteResult = await pool.query(
      `SELECT 1 FROM resource_favorites WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, session.user.id]
    );

    return NextResponse.json({
      isFavorited: favoriteResult.rows.length > 0,
    });
  } catch (error) {
    console.error("[API] Error checking favorite:", error);
    return NextResponse.json(
      { error: "Failed to check favorite status" },
      { status: 500 }
    );
  }
}

/**
 * POST - Toggle favorite status
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get resource ID from slug
    const resourceResult = await pool.query<{ id: string }>(
      `SELECT id FROM resources WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );

    const resource = resourceResult.rows[0];
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resourceId = resource.id;

    // Check if already favorited
    const existingResult = await pool.query(
      `SELECT id FROM resource_favorites WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, session.user.id]
    );

    let isFavorited: boolean;

    if (existingResult.rows.length > 0) {
      // Remove favorite
      await pool.query(
        `DELETE FROM resource_favorites WHERE resource_id = $1 AND user_id = $2`,
        [resourceId, session.user.id]
      );
      isFavorited = false;
    } else {
      // Add favorite
      await pool.query(
        `INSERT INTO resource_favorites (resource_id, user_id) VALUES ($1, $2)`,
        [resourceId, session.user.id]
      );
      isFavorited = true;
    }

    // Get updated count
    const countResult = await pool.query<{ favorites_count: number }>(
      `SELECT favorites_count FROM resources WHERE id = $1`,
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      isFavorited,
      favoritesCount: countResult.rows[0]?.favorites_count || 0,
    });
  } catch (error) {
    console.error("[API] Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
