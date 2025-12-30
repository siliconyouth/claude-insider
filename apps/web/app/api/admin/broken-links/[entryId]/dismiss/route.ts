/**
 * Dismiss Broken Link Entry API
 *
 * POST - Mark a broken link entry as dismissed (false positive)
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Verify entry exists
    const {
      rows: [entry],
    } = await pool.query(
      `SELECT id FROM broken_link_queue WHERE id = $1`,
      [entryId]
    );

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    // Update queue status to dismissed
    await pool.query(
      `
      UPDATE broken_link_queue
      SET status = 'dismissed', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `,
      [session.user.id, entryId]
    );

    // Reset validation consecutive failures
    await pool.query(
      `
      UPDATE resource_link_validations
      SET consecutive_failures = 0, is_valid = true
      WHERE resource_id = (SELECT resource_id FROM broken_link_queue WHERE id = $1)
    `,
      [entryId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BrokenLinks] Dismiss error:", error);
    return NextResponse.json(
      { error: "Failed to dismiss entry" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
