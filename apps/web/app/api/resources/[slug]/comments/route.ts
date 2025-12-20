/**
 * Resource Comments API
 *
 * GET /api/resources/[slug]/comments - List approved comments
 * POST /api/resources/[slug]/comments - Add a new comment
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface CommentRow {
  id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_username: string | null;
  user_image: string | null;
}

interface UserLikeRow {
  comment_id: string;
}

/**
 * GET - List comments for a resource
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const sort = searchParams.get("sort") || "recent"; // 'recent', 'popular'
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
    const orderBy = sort === "popular"
      ? "c.likes_count DESC, c.created_at DESC"
      : "c.created_at DESC";

    // Get top-level comments (parent_id IS NULL)
    const commentsResult = await pool.query<CommentRow>(
      `SELECT
        c.id,
        c.content,
        c.parent_id,
        c.likes_count,
        c.created_at,
        c.updated_at,
        c.user_id,
        u.name as user_name,
        u.username as user_username,
        u.image as user_image
      FROM resource_comments c
      JOIN "user" u ON c.user_id = u.id
      WHERE c.resource_id = $1 AND c.status = 'approved' AND c.parent_id IS NULL
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3`,
      [resource.id, limit, offset]
    );

    // Get all replies for these comments
    const topLevelIds = commentsResult.rows.map((c) => c.id);
    let repliesMap: Record<string, CommentRow[]> = {};

    if (topLevelIds.length > 0) {
      const repliesResult = await pool.query<CommentRow>(
        `SELECT
          c.id,
          c.content,
          c.parent_id,
          c.likes_count,
          c.created_at,
          c.updated_at,
          c.user_id,
          u.name as user_name,
          u.username as user_username,
          u.image as user_image
        FROM resource_comments c
        JOIN "user" u ON c.user_id = u.id
        WHERE c.parent_id = ANY($1) AND c.status = 'approved'
        ORDER BY c.created_at ASC`,
        [topLevelIds]
      );

      // Group replies by parent_id
      repliesMap = repliesResult.rows.reduce((acc, reply) => {
        const parentId = reply.parent_id!;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(reply);
        return acc;
      }, {} as Record<string, CommentRow[]>);
    }

    // Get total count of top-level comments
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM resource_comments
       WHERE resource_id = $1 AND status = 'approved' AND parent_id IS NULL`,
      [resource.id]
    );

    // Get user's likes if authenticated
    let userLikes: Set<string> = new Set();
    if (session?.user?.id) {
      const allCommentIds = [
        ...topLevelIds,
        ...Object.values(repliesMap).flat().map((r) => r.id),
      ];

      if (allCommentIds.length > 0) {
        const likesResult = await pool.query<UserLikeRow>(
          `SELECT comment_id FROM resource_comment_likes
           WHERE user_id = $1 AND comment_id = ANY($2)`,
          [session.user.id, allCommentIds]
        );
        userLikes = new Set(likesResult.rows.map((l) => l.comment_id));
      }
    }

    const totalCount = parseInt(countResult.rows[0]?.count || "0");

    return NextResponse.json({
      comments: commentsResult.rows.map((c) => ({
        ...formatComment(c),
        isLiked: userLikes.has(c.id),
        replies: (repliesMap[c.id] || []).map((r) => ({
          ...formatComment(r),
          isLiked: userLikes.has(r.id),
        })),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + commentsResult.rows.length < totalCount,
      },
    });
  } catch (error) {
    console.error("[API] Error getting comments:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new comment
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, parentId } = body;

    // Validation
    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Comment is too long (max 5000 characters)" },
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

    // If replying, verify parent exists and belongs to this resource
    if (parentId) {
      const parentResult = await pool.query<{ id: string }>(
        `SELECT id FROM resource_comments
         WHERE id = $1 AND resource_id = $2 AND status = 'approved'`,
        [parentId, resource.id]
      );

      if (!parentResult.rows[0]) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Insert comment (status = 'approved' for comments, unlike reviews)
    const insertResult = await pool.query<{
      id: string;
      content: string;
      parent_id: string | null;
      likes_count: number;
      created_at: string;
    }>(
      `INSERT INTO resource_comments (resource_id, user_id, content, parent_id, status)
       VALUES ($1, $2, $3, $4, 'approved')
       RETURNING id, content, parent_id, likes_count, created_at`,
      [resource.id, session.user.id, content.trim(), parentId || null]
    );

    // Get user info
    const userResult = await pool.query<{
      name: string;
      username: string | null;
      image: string | null;
    }>(
      `SELECT name, username, image FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const user = userResult.rows[0];
    const newComment = insertResult.rows[0];

    if (!newComment) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        content: newComment.content,
        parentId: newComment.parent_id,
        likesCount: newComment.likes_count,
        createdAt: newComment.created_at,
        isLiked: false,
        user: {
          id: session.user.id,
          name: user?.name || "Unknown",
          username: user?.username,
          image: user?.image,
        },
        replies: [],
      },
    });
  } catch (error) {
    console.error("[API] Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

/**
 * Format a comment row for the response
 */
function formatComment(row: CommentRow) {
  return {
    id: row.id,
    content: row.content,
    parentId: row.parent_id,
    likesCount: row.likes_count,
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
