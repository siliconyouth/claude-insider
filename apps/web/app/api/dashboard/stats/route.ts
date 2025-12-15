/**
 * Dashboard Stats API
 *
 * Returns statistics for the admin dashboard.
 * Requires moderator or admin role.
 */

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { AdminStats } from "@/types/admin";

export async function GET() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database (session cookie cache may be stale)
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user stats
    // Note: Better Auth uses camelCase column names ("createdAt" not created_at)
    const usersResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE role = 'user') as role_user,
        COUNT(*) FILTER (WHERE role = 'editor') as role_editor,
        COUNT(*) FILTER (WHERE role = 'moderator') as role_moderator,
        COUNT(*) FILTER (WHERE role = 'admin') as role_admin,
        COUNT(*) FILTER (WHERE role = 'superadmin') as role_superadmin,
        COUNT(*) FILTER (WHERE role = 'ai_assistant') as role_ai_assistant
      FROM "user"
    `);

    // Get beta application stats
    const betaResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM beta_applications
    `);

    // Get feedback stats
    const feedbackResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM feedback
    `);

    const userStats = usersResult.rows[0];
    const betaStats = betaResult.rows[0];
    const feedbackStats = feedbackResult.rows[0];

    const stats: AdminStats = {
      users: {
        total: parseInt(userStats.total) || 0,
        newThisWeek: parseInt(userStats.new_this_week) || 0,
        newThisMonth: parseInt(userStats.new_this_month) || 0,
        byRole: {
          user: parseInt(userStats.role_user) || 0,
          editor: parseInt(userStats.role_editor) || 0,
          moderator: parseInt(userStats.role_moderator) || 0,
          admin: parseInt(userStats.role_admin) || 0,
          superadmin: parseInt(userStats.role_superadmin) || 0,
          ai_assistant: parseInt(userStats.role_ai_assistant) || 0,
        },
      },
      beta: {
        total: parseInt(betaStats.total) || 0,
        pending: parseInt(betaStats.pending) || 0,
        approved: parseInt(betaStats.approved) || 0,
        rejected: parseInt(betaStats.rejected) || 0,
      },
      feedback: {
        total: parseInt(feedbackStats.total) || 0,
        open: parseInt(feedbackStats.open) || 0,
        inProgress: parseInt(feedbackStats.in_progress) || 0,
        resolved: parseInt(feedbackStats.resolved) || 0,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Dashboard Stats Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get stats" },
      { status: 500 }
    );
  }
}
