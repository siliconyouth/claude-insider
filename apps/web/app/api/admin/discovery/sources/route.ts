/**
 * Discovery Sources API
 *
 * Endpoints for managing resource discovery sources.
 * Allows admins to view, create, update, and trigger scans.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface SourceRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  url: string;
  github_config: Record<string, unknown>;
  registry_config: Record<string, unknown>;
  awesome_config: Record<string, unknown>;
  default_category: string | null;
  default_tags: string[];
  auto_approve: boolean;
  min_stars: number;
  min_downloads: number;
  scan_frequency: string;
  is_active: boolean;
  last_scan_at: string | null;
  last_scan_status: string | null;
  last_scan_count: number;
  next_scan_at: string | null;
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
    const type = searchParams.get("type");
    const isActive = searchParams.get("active");

    // Build query
    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (type) {
      queryParams.push(type);
      conditions.push(`type = $${queryParams.length}`);
    }

    if (isActive !== null && isActive !== undefined) {
      queryParams.push(isActive === "true");
      conditions.push(`is_active = $${queryParams.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query<SourceRow>(
      `SELECT * FROM resource_sources ${whereClause} ORDER BY type, name`,
      queryParams
    );

    // Get queue counts per source
    const queueCounts = await pool.query<{ source_id: string; status: string; count: string }>(
      `SELECT source_id, status, COUNT(*) as count
       FROM resource_discovery_queue
       GROUP BY source_id, status`
    );

    // Map queue counts to sources
    const sourcesWithCounts = result.rows.map((source) => {
      const counts = queueCounts.rows.filter((q) => q.source_id === source.id);
      return {
        ...source,
        queue_counts: {
          pending: parseInt(counts.find((c) => c.status === "pending")?.count || "0", 10),
          approved: parseInt(counts.find((c) => c.status === "approved")?.count || "0", 10),
          rejected: parseInt(counts.find((c) => c.status === "rejected")?.count || "0", 10),
        },
      };
    });

    return NextResponse.json({ sources: sourcesWithCounts });
  } catch (error) {
    console.error("[Discovery Sources API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovery sources" },
      { status: 500 }
    );
  }
}

/**
 * Toggle source active status or trigger manual scan
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - admin only for source management
    const roleResult = await pool.query<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, isActive } = body as {
      id: string;
      action?: "toggle" | "scan";
      isActive?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "Missing source id" }, { status: 400 });
    }

    if (action === "toggle" && isActive !== undefined) {
      await pool.query(
        `UPDATE resource_sources SET is_active = $1 WHERE id = $2`,
        [isActive, id]
      );
      return NextResponse.json({ success: true, isActive });
    }

    if (action === "scan") {
      // Set next_scan_at to now to trigger on next cron run
      await pool.query(
        `UPDATE resource_sources SET next_scan_at = NOW() WHERE id = $1`,
        [id]
      );
      return NextResponse.json({ success: true, message: "Scan queued" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Discovery Sources API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}
