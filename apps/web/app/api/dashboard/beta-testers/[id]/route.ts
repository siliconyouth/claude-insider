/**
 * Beta Tester Management API
 *
 * Revoke beta tester status for individual users.
 * Admin/moderator access required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Revoke beta tester status
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;

    // Verify authentication and admin/moderator access
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - use hasMinRole to include superadmin
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user exists and is a beta tester
    const userResult = await pool.query(
      `SELECT id, name, email, "isBetaTester" FROM "user" WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    if (!user.isBetaTester) {
      return NextResponse.json({ error: "User is not a beta tester" }, { status: 400 });
    }

    // Revoke beta tester status
    await pool.query(
      `UPDATE "user" SET "isBetaTester" = false WHERE id = $1`,
      [userId]
    );

    // Update beta application status to 'revoked' if one exists
    await pool.query(
      `UPDATE beta_applications SET status = 'revoked', reviewed_at = NOW(), reviewed_by = $1
       WHERE user_id = $2 AND status = 'approved'`,
      [session.user.id, userId]
    );

    // Log the action
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        session.user.id,
        "revoke_beta_status",
        "user",
        userId,
        JSON.stringify({ userName: user.name, userEmail: user.email }),
      ]
    );

    // Create notification for the user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'system', 'Beta Access Revoked', 'Your beta tester access has been revoked. Contact support if you have questions.')`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: `Beta tester status revoked for ${user.name || user.email}`,
    });
  } catch (error) {
    console.error("[Beta Tester Revoke API] Error:", error);
    return NextResponse.json(
      { error: "Failed to revoke beta status" },
      { status: 500 }
    );
  }
}
