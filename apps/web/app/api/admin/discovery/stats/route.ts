/**
 * Discovery Stats API
 *
 * Returns statistics for the discovery dashboard overview.
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

    // Check role
    const roleResult = await pool.query<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get queue counts by status
    const queueStats = await pool.query<{ status: string; count: string }>(`
      SELECT status, COUNT(*) as count
      FROM resource_discovery_queue
      GROUP BY status
    `);

    // Get source counts
    const sourceStats = await pool.query<{ is_active: boolean; count: string }>(`
      SELECT is_active, COUNT(*) as count
      FROM resource_sources
      GROUP BY is_active
    `);

    // Get sources by type
    const sourcesByType = await pool.query<{ type: string; count: string }>(`
      SELECT type, COUNT(*) as count
      FROM resource_sources
      GROUP BY type
      ORDER BY count DESC
    `);

    // Get recent scan activity
    const recentScans = await pool.query<{
      id: string;
      name: string;
      last_scan_at: string | null;
      last_scan_status: string | null;
      last_scan_count: number;
    }>(`
      SELECT id, name, last_scan_at, last_scan_status, last_scan_count
      FROM resource_sources
      WHERE last_scan_at IS NOT NULL
      ORDER BY last_scan_at DESC
      LIMIT 5
    `);

    // Get sources due for scan
    const dueForScan = await pool.query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM resource_sources
      WHERE is_active = TRUE
        AND scan_frequency != 'manual'
        AND (next_scan_at IS NULL OR next_scan_at <= NOW())
    `);

    // Aggregate stats
    const queueCounts = {
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };
    for (const row of queueStats.rows) {
      const count = parseInt(row.count, 10);
      queueCounts.total += count;
      if (row.status in queueCounts) {
        queueCounts[row.status as keyof typeof queueCounts] = count;
      }
    }

    const activeSources = parseInt(
      sourceStats.rows.find((s) => s.is_active)?.count || "0",
      10
    );
    const inactiveSources = parseInt(
      sourceStats.rows.find((s) => !s.is_active)?.count || "0",
      10
    );

    return NextResponse.json({
      queue: queueCounts,
      sources: {
        active: activeSources,
        inactive: inactiveSources,
        total: activeSources + inactiveSources,
        dueForScan: parseInt(dueForScan.rows[0]?.count || "0", 10),
        byType: sourcesByType.rows.reduce(
          (acc, row) => {
            acc[row.type] = parseInt(row.count, 10);
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      recentScans: recentScans.rows,
    });
  } catch (error) {
    console.error("[Discovery Stats API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovery stats" },
      { status: 500 }
    );
  }
}
