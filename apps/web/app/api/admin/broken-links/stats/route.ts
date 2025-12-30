/**
 * Broken Links Stats API
 *
 * GET - Get link validation statistics
 */

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM resources WHERE is_published = true) as total_resources,
        (SELECT COUNT(*) FROM resource_link_validations) as validated,
        (SELECT COUNT(*) FROM resource_link_validations WHERE is_valid = true) as valid,
        (SELECT COUNT(*) FROM resource_link_validations WHERE is_valid = false) as invalid,
        (SELECT COUNT(*) FROM broken_link_queue WHERE status = 'pending') as pending_review,
        (SELECT MAX(last_checked_at) FROM resource_link_validations) as last_scan
    `);

    const stats = rows[0];
    return NextResponse.json({
      totalResources: parseInt(stats.total_resources, 10),
      validated: parseInt(stats.validated, 10),
      unchecked:
        parseInt(stats.total_resources, 10) - parseInt(stats.validated, 10),
      valid: parseInt(stats.valid, 10),
      invalid: parseInt(stats.invalid, 10),
      pendingReview: parseInt(stats.pending_review, 10),
      lastFullScan: stats.last_scan,
    });
  } catch (error) {
    console.error("[BrokenLinks] Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
