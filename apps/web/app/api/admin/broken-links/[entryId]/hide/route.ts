/**
 * Hide Broken Resource API
 *
 * POST - Unpublish a resource with a broken link
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
    // Get the resource ID from the queue entry
    const {
      rows: [entry],
    } = await pool.query(
      `SELECT resource_id FROM broken_link_queue WHERE id = $1`,
      [entryId]
    );

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    // Unpublish the resource
    await pool.query(
      `UPDATE resources SET is_published = false, updated_at = NOW() WHERE id = $1`,
      [entry.resource_id]
    );

    // Update queue status
    await pool.query(
      `
      UPDATE broken_link_queue
      SET status = 'hidden', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `,
      [session.user.id, entryId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BrokenLinks] Hide error:", error);
    return NextResponse.json(
      { error: "Failed to hide resource" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
