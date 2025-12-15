/**
 * Security Stats API
 *
 * Returns aggregated security statistics for the dashboard.
 * Admin only endpoint.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { getSecurityStats, getVisitorStats } from "@/lib/security-logger";
import { getHoneypotStats } from "@/lib/honeypot";

export async function GET() {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Get all stats in parallel
    const [securityStats, visitorStats, honeypotStats] = await Promise.all([
      getSecurityStats(),
      getVisitorStats(),
      getHoneypotStats(),
    ]);

    return NextResponse.json({
      success: true,
      security: securityStats,
      visitors: visitorStats,
      honeypots: honeypotStats,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Security Stats Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get security stats" },
      { status: 500 }
    );
  }
}
