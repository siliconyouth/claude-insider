/**
 * Dashboard Navigation Counts API
 *
 * Returns pending item counts for navigation badges.
 * All queries run in parallel for fast response times.
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - need at least moderator access
    const roleResult = await pool.query<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id],
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run all count queries in parallel for speed
    const [
      betaApplications,
      feedback,
      suggestions,
      comments,
      reports,
      autoUpdates,
      notifications,
    ] = await Promise.all([
      // Beta applications pending
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM beta_applications
        WHERE status = 'pending'
      `),

      // Feedback open
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM feedback
        WHERE status = 'open'
      `),

      // Edit suggestions pending
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM edit_suggestions
        WHERE status = 'pending'
      `),

      // Comments pending moderation
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM comments
        WHERE status = 'pending'
      `),

      // Reports pending
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM reports
        WHERE status = 'pending'
      `),

      // Resource auto-update jobs pending or analyzing
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM resource_update_jobs
        WHERE status IN ('pending', 'analyzing')
      `),

      // Pending notifications (unsent)
      pool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE is_read = false
        AND created_at > NOW() - INTERVAL '7 days'
      `),
    ]);

    return NextResponse.json({
      counts: {
        betaApplications: parseInt(betaApplications.rows[0]?.count || "0", 10),
        feedback: parseInt(feedback.rows[0]?.count || "0", 10),
        suggestions: parseInt(suggestions.rows[0]?.count || "0", 10),
        comments: parseInt(comments.rows[0]?.count || "0", 10),
        reports: parseInt(reports.rows[0]?.count || "0", 10),
        autoUpdates: parseInt(autoUpdates.rows[0]?.count || "0", 10),
        notifications: parseInt(notifications.rows[0]?.count || "0", 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Nav Counts API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch navigation counts" },
      { status: 500 },
    );
  }
}
