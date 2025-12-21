/**
 * Dashboard Chart Stats API
 *
 * Returns time-series and categorical data for dashboard charts.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user growth data (last 30 days)
    const userGrowthResult = await pool.query(`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "user"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `);

    // Generate all dates for the last 30 days (fill in gaps)
    const userGrowth: { name: string; value: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const found = userGrowthResult.rows.find(
        (r) => r.date?.toISOString().split("T")[0] === dateStr
      );
      userGrowth.push({
        name: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: found ? parseInt(found.count, 10) : 0,
      });
    }

    // Get content distribution
    const [docsResult, resourcesResult, promptsResult, usersResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM documentation`),
      pool.query(`SELECT COUNT(*) FROM resources`),
      pool.query(`SELECT COUNT(*) FROM prompts`),
      pool.query(`SELECT COUNT(*) FROM "user"`),
    ]);

    const contentDistribution = [
      { name: "Docs", value: parseInt(docsResult.rows[0]?.count || "0", 10) },
      { name: "Resources", value: parseInt(resourcesResult.rows[0]?.count || "0", 10) },
      { name: "Prompts", value: parseInt(promptsResult.rows[0]?.count || "0", 10) },
      { name: "Users", value: parseInt(usersResult.rows[0]?.count || "0", 10) },
    ];

    // Get activity by type (last 7 days)
    const activityResult = await pool.query(`
      SELECT
        activity_type as type,
        COUNT(*) as count
      FROM user_activity
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY activity_type
      ORDER BY count DESC
      LIMIT 8
    `);

    const activityByType = activityResult.rows.map((row) => ({
      name: formatActivityType(row.type),
      value: parseInt(row.count, 10),
    }));

    // Get user roles distribution
    const rolesResult = await pool.query(`
      SELECT
        role,
        COUNT(*) as count
      FROM "user"
      GROUP BY role
      ORDER BY count DESC
    `);

    const roleDistribution = rolesResult.rows.map((row) => ({
      name: row.role || "user",
      value: parseInt(row.count, 10),
    }));

    // Get weekly signups for sparkline (last 12 weeks)
    const weeklySignupsResult = await pool.query(`
      SELECT
        DATE_TRUNC('week', "createdAt") as week,
        COUNT(*) as count
      FROM "user"
      WHERE "createdAt" >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', "createdAt")
      ORDER BY week ASC
    `);

    const weeklySignups = weeklySignupsResult.rows.map((row) => ({
      value: parseInt(row.count, 10),
    }));

    // Calculate trends
    const thisWeek = userGrowth.slice(-7).reduce((sum, d) => sum + d.value, 0);
    const lastWeek = userGrowth.slice(-14, -7).reduce((sum, d) => sum + d.value, 0);
    const userGrowthTrend = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100 * 10) / 10
      : thisWeek > 0 ? 100 : 0;

    return NextResponse.json({
      userGrowth,
      contentDistribution,
      activityByType,
      roleDistribution,
      weeklySignups,
      trends: {
        userGrowth: {
          value: Math.abs(userGrowthTrend),
          isPositive: userGrowthTrend >= 0,
        },
      },
    });
  } catch (error) {
    console.error("Chart stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatActivityType(type: string): string {
  const labels: Record<string, string> = {
    page_view: "Page Views",
    doc_view: "Doc Views",
    resource_view: "Resources",
    search: "Searches",
    login: "Logins",
    signup: "Signups",
    chat: "Chat Messages",
    favorite: "Favorites",
    rating: "Ratings",
    comment: "Comments",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
