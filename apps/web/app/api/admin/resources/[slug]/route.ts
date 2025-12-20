/**
 * Admin Single Resource API
 *
 * GET /api/admin/resources/[slug] - Get resource details (including unpublished)
 * PUT /api/admin/resources/[slug] - Update resource
 * DELETE /api/admin/resources/[slug] - Delete resource
 *
 * Requires admin or moderator authentication.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { hasRole } from "@/collections/Users";
import { pool } from "@/lib/db";
import {
  updateResource,
  deleteResource,
  type UpdateResourceInput,
} from "@/lib/resources/mutations";

type Params = Promise<{ slug: string }>;

/**
 * Get resource by slug (including unpublished - admin view)
 */
export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
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

    // Get resource without is_published filter for admin
    const result = await pool.query(
      `SELECT * FROM resources WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Get tags
    const tagsResult = await pool.query(
      `SELECT tag FROM resource_tags WHERE resource_id = $1 ORDER BY tag`,
      [result.rows[0].id]
    );

    // Get authors
    const authorsResult = await pool.query(
      `SELECT * FROM resource_authors WHERE resource_id = $1 ORDER BY is_primary DESC, name`,
      [result.rows[0].id]
    );

    return NextResponse.json({
      ...result.rows[0],
      tags: tagsResult.rows.map(t => t.tag),
      authors: authorsResult.rows,
    });
  } catch (error) {
    console.error("Get resource error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fetch failed" },
      { status: 500 }
    );
  }
}

/**
 * Update resource by slug
 */
export async function PUT(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
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

    const body = (await request.json()) as UpdateResourceInput;

    const result = await updateResource(slug, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update resource" },
        { status: result.error === "Resource not found" ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Resource updated successfully",
    });
  } catch (error) {
    console.error("Update resource error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

/**
 * Delete resource by slug
 */
export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
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

    // Only admins can delete (not moderators)
    if (!user || !hasRole(user, ["admin"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await deleteResource(slug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete resource" },
        { status: result.error === "Resource not found" ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
