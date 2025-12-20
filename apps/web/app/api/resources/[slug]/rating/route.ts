/**
 * Resource Rating API
 *
 * GET /api/resources/[slug]/rating - Get user's rating
 * POST /api/resources/[slug]/rating - Set or update rating
 * DELETE /api/resources/[slug]/rating - Remove rating
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET - Get user's rating for the resource
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ userRating: null });
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

    // Get user's rating
    const ratingResult = await pool.query<{ rating: number }>(
      `SELECT rating FROM resource_ratings WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, session.user.id]
    );

    return NextResponse.json({
      userRating: ratingResult.rows[0]?.rating || null,
    });
  } catch (error) {
    console.error("[API] Error getting rating:", error);
    return NextResponse.json(
      { error: "Failed to get rating" },
      { status: 500 }
    );
  }
}

/**
 * POST - Set or update rating (1-5)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rating = Number(body.rating);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
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

    // Upsert rating
    await pool.query(
      `INSERT INTO resource_ratings (resource_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (resource_id, user_id)
       DO UPDATE SET rating = $3, updated_at = NOW()`,
      [resourceId, session.user.id, rating]
    );

    // Get updated stats
    const statsResult = await pool.query<{
      average_rating: number;
      ratings_count: number;
    }>(
      `SELECT average_rating, ratings_count FROM resources WHERE id = $1`,
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      userRating: rating,
      averageRating: statsResult.rows[0]?.average_rating || 0,
      ratingsCount: statsResult.rows[0]?.ratings_count || 0,
    });
  } catch (error) {
    console.error("[API] Error setting rating:", error);
    return NextResponse.json(
      { error: "Failed to set rating" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove user's rating
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete rating
    await pool.query(
      `DELETE FROM resource_ratings WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, session.user.id]
    );

    // Get updated stats
    const statsResult = await pool.query<{
      average_rating: number;
      ratings_count: number;
    }>(
      `SELECT average_rating, ratings_count FROM resources WHERE id = $1`,
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      userRating: null,
      averageRating: statsResult.rows[0]?.average_rating || 0,
      ratingsCount: statsResult.rows[0]?.ratings_count || 0,
    });
  } catch (error) {
    console.error("[API] Error removing rating:", error);
    return NextResponse.json(
      { error: "Failed to remove rating" },
      { status: 500 }
    );
  }
}
