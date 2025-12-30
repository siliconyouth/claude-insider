/**
 * Discovery Queue Bulk Actions API
 *
 * Endpoints for bulk approve/reject operations on the discovery queue.
 * Processes multiple items in a single transaction for efficiency.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Bulk approve or reject discovered resources
 */
export async function POST(request: NextRequest) {
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
    const { ids, action, notes } = body as {
      ids: string[];
      action: "approve" | "reject";
      notes?: string;
    };

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty ids array" },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Batch size exceeds maximum of 100 items" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update all items in a single query using ANY()
    // Only update items that are currently pending (prevent double processing)
    const result = await pool.query(
      `UPDATE resource_discovery_queue
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
       WHERE id = ANY($4::uuid[])
         AND status = 'pending'
       RETURNING id`,
      [newStatus, session.user.id, notes || null, ids]
    );

    const updatedCount = result.rowCount || 0;

    return NextResponse.json({
      success: true,
      status: newStatus,
      count: updatedCount,
      requested: ids.length,
    });
  } catch (error) {
    console.error("[Discovery Queue Bulk API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk action" },
      { status: 500 }
    );
  }
}
