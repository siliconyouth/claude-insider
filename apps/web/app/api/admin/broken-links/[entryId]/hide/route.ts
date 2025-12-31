/**
 * Hide Broken Resource API
 *
 * POST - Unpublish a resource with a broken link
 *
 * Handles both queue entries and validation-only entries.
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
    // Try to find by queue entry ID first
    let resourceId: string | null = null;
    let queueId: string | null = null;
    let originalUrl: string | null = null;

    const { rows: [queueEntry] } = await pool.query(
      `SELECT id, resource_id, original_url FROM broken_link_queue WHERE id = $1`,
      [entryId]
    );

    if (queueEntry) {
      resourceId = queueEntry.resource_id;
      queueId = queueEntry.id;
      originalUrl = queueEntry.original_url;
    } else {
      // Try to find by validation ID
      const { rows: [validationEntry] } = await pool.query(
        `SELECT resource_id, url FROM resource_link_validations WHERE id::text = $1`,
        [entryId]
      );

      if (validationEntry) {
        resourceId = validationEntry.resource_id;
        originalUrl = validationEntry.url;

        // Create a queue entry for tracking
        const { rows: [newEntry] } = await pool.query(
          `INSERT INTO broken_link_queue (resource_id, original_url, status)
           VALUES ($1, $2, 'hidden')
           ON CONFLICT (resource_id) DO UPDATE SET status = 'hidden', updated_at = NOW()
           RETURNING id`,
          [resourceId, originalUrl]
        );
        queueId = newEntry?.id;
      }
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    // Unpublish the resource
    await pool.query(
      `UPDATE resources SET is_published = false, updated_at = NOW() WHERE id = $1`,
      [resourceId]
    );

    // Update queue status
    if (queueId) {
      await pool.query(
        `UPDATE broken_link_queue
         SET status = 'hidden', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [session.user.id, queueId]
      );
    }

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
