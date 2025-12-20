/**
 * Discovery Queue API
 *
 * Endpoints for managing the resource discovery queue.
 * Allows admins to list, approve, and reject discovered resources.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface QueueItem {
  id: string;
  source_id: string;
  source_name?: string;
  source_type?: string;
  discovered_url: string;
  discovered_title: string | null;
  discovered_description: string | null;
  discovered_data: Record<string, unknown>;
  status: "pending" | "reviewing" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewer_name?: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const roleResult = await pool.query<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = "";
    const queryParams: unknown[] = [];

    if (status !== "all") {
      queryParams.push(status);
      whereClause = `WHERE q.status = $${queryParams.length}`;
    }

    // Get total count
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM resource_discovery_queue q ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    // Get items with source info
    queryParams.push(limit);
    queryParams.push(offset);
    const result = await pool.query<QueueItem>(
      `SELECT
        q.id, q.source_id, q.discovered_url, q.discovered_title,
        q.discovered_description, q.discovered_data, q.status,
        q.reviewed_by, q.reviewed_at, q.review_notes, q.created_at,
        s.name as source_name, s.type as source_type,
        u.name as reviewer_name
      FROM resource_discovery_queue q
      LEFT JOIN resource_sources s ON q.source_id = s.id
      LEFT JOIN "user" u ON q.reviewed_by = u.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return NextResponse.json({
      items: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Discovery Queue API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovery queue" },
      { status: 500 }
    );
  }
}

/**
 * Approve or reject a discovered resource
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const roleResult = await pool.query<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, notes } = body as {
      id: string;
      action: "approve" | "reject";
      notes?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing id or action" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await pool.query(
      `UPDATE resource_discovery_queue
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
       WHERE id = $4`,
      [newStatus, session.user.id, notes || null, id]
    );

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("[Discovery Queue API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update queue item" },
      { status: 500 }
    );
  }
}
