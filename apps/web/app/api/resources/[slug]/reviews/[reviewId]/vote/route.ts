/**
 * Review Vote API
 *
 * POST /api/resources/[slug]/reviews/[reviewId]/vote - Vote helpful/not helpful
 * DELETE /api/resources/[slug]/reviews/[reviewId]/vote - Remove vote
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string; reviewId: string }>;
}

/**
 * POST - Vote on a review
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, reviewId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isHelpful } = body;

    if (typeof isHelpful !== "boolean") {
      return NextResponse.json(
        { error: "isHelpful must be a boolean" },
        { status: 400 }
      );
    }

    // Verify the review exists and belongs to this resource
    const reviewResult = await pool.query<{ id: string; user_id: string }>(
      `SELECT rr.id, rr.user_id
       FROM resource_reviews rr
       JOIN resources r ON rr.resource_id = r.id
       WHERE rr.id = $1 AND r.slug = $2 AND rr.status = 'approved'`,
      [reviewId, slug]
    );

    const review = reviewResult.rows[0];
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Can't vote on own review
    if (review.user_id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own review" },
        { status: 400 }
      );
    }

    // Upsert vote
    await pool.query(
      `INSERT INTO resource_review_votes (review_id, user_id, is_helpful)
       VALUES ($1, $2, $3)
       ON CONFLICT (review_id, user_id)
       DO UPDATE SET is_helpful = $3`,
      [reviewId, session.user.id, isHelpful]
    );

    // Get updated counts
    const countsResult = await pool.query<{
      helpful_count: number;
      not_helpful_count: number;
    }>(
      `SELECT helpful_count, not_helpful_count FROM resource_reviews WHERE id = $1`,
      [reviewId]
    );

    const counts = countsResult.rows[0];

    return NextResponse.json({
      success: true,
      userVote: isHelpful,
      helpfulCount: counts?.helpful_count || 0,
      notHelpfulCount: counts?.not_helpful_count || 0,
    });
  } catch (error) {
    console.error("[API] Error voting on review:", error);
    return NextResponse.json(
      { error: "Failed to vote on review" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove vote
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, reviewId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the review exists and belongs to this resource
    const reviewResult = await pool.query<{ id: string }>(
      `SELECT rr.id
       FROM resource_reviews rr
       JOIN resources r ON rr.resource_id = r.id
       WHERE rr.id = $1 AND r.slug = $2`,
      [reviewId, slug]
    );

    if (!reviewResult.rows[0]) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Delete vote
    await pool.query(
      `DELETE FROM resource_review_votes WHERE review_id = $1 AND user_id = $2`,
      [reviewId, session.user.id]
    );

    // Get updated counts
    const countsResult = await pool.query<{
      helpful_count: number;
      not_helpful_count: number;
    }>(
      `SELECT helpful_count, not_helpful_count FROM resource_reviews WHERE id = $1`,
      [reviewId]
    );

    const counts = countsResult.rows[0];

    return NextResponse.json({
      success: true,
      userVote: null,
      helpfulCount: counts?.helpful_count || 0,
      notHelpfulCount: counts?.not_helpful_count || 0,
    });
  } catch (error) {
    console.error("[API] Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
