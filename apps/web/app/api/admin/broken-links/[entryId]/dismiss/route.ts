/**
 * Dismiss Broken Link Entry API
 *
 * POST - Mark a broken link entry as dismissed (false positive)
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
           VALUES ($1, $2, 'dismissed')
           ON CONFLICT (resource_id) DO UPDATE SET status = 'dismissed', updated_at = NOW()
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

    // Update queue status to dismissed
    if (queueId) {
      await pool.query(
        `UPDATE broken_link_queue
         SET status = 'dismissed', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [session.user.id, queueId]
      );
    }

    // Reset validation consecutive failures and mark as valid (false positive)
    await pool.query(
      `UPDATE resource_link_validations
       SET consecutive_failures = 0, is_valid = true, updated_at = NOW()
       WHERE resource_id = $1`,
      [resourceId]
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
