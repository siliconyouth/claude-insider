/**
 * Resource Reviews API
 *
 * GET /api/resources/[slug]/reviews - List approved reviews
 * POST /api/resources/[slug]/reviews - Submit a new review
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface ReviewRow {
  id: string;
  title: string | null;
  content: string;
  pros: string[];
  cons: string[];
  rating: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_username: string | null;
  user_image: string | null;
}

interface UserVoteRow {
  review_id: string;
  is_helpful: boolean;
}

/**
 * GET - List approved reviews for a resource
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const sort = searchParams.get("sort") || "helpful"; // 'helpful', 'recent', 'rating'
    const offset = (page - 1) * limit;

    // Get resource ID from slug
    const resourceResult = await pool.query<{ id: string }>(
      `SELECT id FROM resources WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );

    const resource = resourceResult.rows[0];
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Build sort clause
    let orderBy = "r.helpful_count DESC, r.created_at DESC";
    if (sort === "recent") {
      orderBy = "r.created_at DESC";
    } else if (sort === "rating") {
      orderBy = "r.rating DESC, r.created_at DESC";
    }

    // Get reviews with user info
    const reviewsResult = await pool.query<ReviewRow>(
      `SELECT
        r.id,
        r.title,
        r.content,
        r.pros,
        r.cons,
        r.rating,
        r.helpful_count,
        r.not_helpful_count,
        r.created_at,
        r.updated_at,
        r.user_id,
        u.name as user_name,
        u.username as user_username,
        u.image as user_image
      FROM resource_reviews r
      JOIN "user" u ON r.user_id = u.id
      WHERE r.resource_id = $1 AND r.status = 'approved'
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3`,
      [resource.id, limit, offset]
    );

    // Get total count
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM resource_reviews
       WHERE resource_id = $1 AND status = 'approved'`,
      [resource.id]
    );

    // Get user's votes if authenticated
    let userVotes: Record<string, boolean> = {};
    if (session?.user?.id && reviewsResult.rows.length > 0) {
      const reviewIds = reviewsResult.rows.map((r) => r.id);
      const votesResult = await pool.query<UserVoteRow>(
        `SELECT review_id, is_helpful FROM resource_review_votes
         WHERE user_id = $1 AND review_id = ANY($2)`,
        [session.user.id, reviewIds]
      );
      userVotes = votesResult.rows.reduce(
        (acc, v) => ({ ...acc, [v.review_id]: v.is_helpful }),
        {}
      );
    }

    // Get user's own review (even if pending)
    let userReview = null;
    if (session?.user?.id) {
      const userReviewResult = await pool.query<ReviewRow & { status: string }>(
        `SELECT
          r.id, r.title, r.content, r.pros, r.cons, r.rating,
          r.helpful_count, r.not_helpful_count, r.created_at, r.updated_at,
          r.user_id, r.status,
          u.name as user_name, u.username as user_username, u.image as user_image
        FROM resource_reviews r
        JOIN "user" u ON r.user_id = u.id
        WHERE r.resource_id = $1 AND r.user_id = $2`,
        [resource.id, session.user.id]
      );
      if (userReviewResult.rows[0]) {
        userReview = {
          ...formatReview(userReviewResult.rows[0]),
          status: userReviewResult.rows[0].status,
        };
      }
    }

    const totalCount = parseInt(countResult.rows[0]?.count || "0");

    return NextResponse.json({
      reviews: reviewsResult.rows.map((r) => ({
        ...formatReview(r),
        userVote: userVotes[r.id] ?? null,
      })),
      userReview,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + reviewsResult.rows.length < totalCount,
      },
    });
  } catch (error) {
    console.error("[API] Error getting reviews:", error);
    return NextResponse.json(
      { error: "Failed to get reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST - Submit a new review
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, pros, cons, rating } = body;

    // Validation
    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: "Review content must be at least 10 characters" },
        { status: 400 }
      );
    }

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

    // Check if user already has a review
    const existingResult = await pool.query(
      `SELECT id, status FROM resource_reviews WHERE resource_id = $1 AND user_id = $2`,
      [resource.id, session.user.id]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this resource" },
        { status: 409 }
      );
    }

    // Validate pros/cons arrays
    const validPros = Array.isArray(pros) ? pros.filter((p: string) => p.trim()) : [];
    const validCons = Array.isArray(cons) ? cons.filter((c: string) => c.trim()) : [];

    // Insert review (status = 'pending' for moderation)
    const insertResult = await pool.query<{ id: string; status: string; created_at: string }>(
      `INSERT INTO resource_reviews (resource_id, user_id, title, content, pros, cons, rating, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, status, created_at`,
      [
        resource.id,
        session.user.id,
        title?.trim() || null,
        content.trim(),
        validPros,
        validCons,
        rating,
      ]
    );

    const newReview = insertResult.rows[0];

    if (!newReview) {
      return NextResponse.json(
        { error: "Failed to create review" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: {
        id: newReview.id,
        status: newReview.status,
        createdAt: newReview.created_at,
      },
      message: "Review submitted for moderation",
    });
  } catch (error) {
    console.error("[API] Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

/**
 * Format a review row for the response
 */
function formatReview(row: ReviewRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    pros: row.pros || [],
    cons: row.cons || [],
    rating: row.rating,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      name: row.user_name,
      username: row.user_username,
      image: row.user_image,
    },
  };
}
