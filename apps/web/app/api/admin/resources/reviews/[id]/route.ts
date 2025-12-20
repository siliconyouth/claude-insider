/**
 * Admin Resource Reviews API
 *
 * GET /api/admin/resources/reviews/[id] - Get review details
 * PUT /api/admin/resources/reviews/[id] - Update review (approve/reject/flag)
 * DELETE /api/admin/resources/reviews/[id] - Delete review
 *
 * Requires moderator or admin authentication.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { hasRole } from "@/collections/Users";
import { pool } from "@/lib/db";

type Params = Promise<{ id: string }>;

interface UpdateReviewInput {
  status?: "pending" | "approved" | "rejected" | "flagged";
  moderation_notes?: string;
  rejection_reason?: string;
}

/**
 * Get review by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT rr.*, r.title as resource_title, r.slug as resource_slug,
              u.name as user_name, u.email as user_email
       FROM resource_reviews rr
       JOIN resources r ON r.id = rr.resource_id
       JOIN "user" u ON u.id = rr.user_id
       WHERE rr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Get review error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fetch failed" },
      { status: 500 }
    );
  }
}

/**
 * Update review status (approve/reject/flag)
 */
export async function PUT(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as UpdateReviewInput;
    const validStatuses = ["pending", "approved", "rejected", "flagged"];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Build update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }

    if (body.moderation_notes !== undefined) {
      updates.push(`moderation_notes = $${paramIndex++}`);
      values.push(body.moderation_notes);
    }

    if (body.rejection_reason !== undefined) {
      updates.push(`rejection_reason = $${paramIndex++}`);
      values.push(body.rejection_reason);
    }

    // Add moderator info
    updates.push(`moderated_by = $${paramIndex++}`);
    values.push(user.id);

    updates.push(`moderated_at = NOW()`);
    updates.push(`updated_at = NOW()`);

    values.push(id);

    const result = await pool.query(
      `UPDATE resource_reviews SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // If approved, update denormalized count on resource
    if (body.status === "approved") {
      const review = result.rows[0];
      await pool.query(
        `UPDATE resources
         SET reviews_count = (
           SELECT COUNT(*) FROM resource_reviews
           WHERE resource_id = $1 AND status = 'approved'
         ),
         average_rating = (
           SELECT AVG(rating) FROM resource_reviews
           WHERE resource_id = $1 AND status = 'approved'
         )
         WHERE id = $1`,
        [review.resource_id]
      );
    }

    return NextResponse.json({
      success: true,
      review: result.rows[0],
      message: `Review ${body.status || "updated"} successfully`,
    });
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

/**
 * Delete review
 */
export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only admins can delete reviews
    if (!user || !hasRole(user, ["admin"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get review to update resource counts after deletion
    const reviewResult = await pool.query(
      `SELECT resource_id FROM resource_reviews WHERE id = $1`,
      [id]
    );

    if (reviewResult.rows.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const resourceId = reviewResult.rows[0].resource_id;

    // Delete the review
    await pool.query(`DELETE FROM resource_reviews WHERE id = $1`, [id]);

    // Update denormalized counts on resource
    await pool.query(
      `UPDATE resources
       SET reviews_count = (
         SELECT COUNT(*) FROM resource_reviews
         WHERE resource_id = $1 AND status = 'approved'
       ),
       average_rating = COALESCE((
         SELECT AVG(rating) FROM resource_reviews
         WHERE resource_id = $1 AND status = 'approved'
       ), 0)
       WHERE id = $1`,
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
