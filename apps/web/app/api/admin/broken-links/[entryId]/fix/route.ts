/**
 * Fix Broken Link API
 *
 * POST - Update a resource with a new URL
 *
 * Handles both queue entries and validation-only entries.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { validateResource } from "@/lib/resources/link-validator";

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
    const body = await request.json();
    const { newUrl } = body;

    if (!newUrl || typeof newUrl !== "string") {
      return NextResponse.json(
        { error: "New URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(newUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Try to find by queue entry ID first
    let resourceId: string | null = null;
    let queueId: string | null = null;

    const { rows: [queueEntry] } = await pool.query(
      `SELECT id, resource_id FROM broken_link_queue WHERE id = $1`,
      [entryId]
    );

    if (queueEntry) {
      resourceId = queueEntry.resource_id;
      queueId = queueEntry.id;
    } else {
      // Try to find by validation ID (entryId is validation.id as string)
      const { rows: [validationEntry] } = await pool.query(
        `SELECT resource_id, url FROM resource_link_validations WHERE id::text = $1`,
        [entryId]
      );

      if (validationEntry) {
        resourceId = validationEntry.resource_id;

        // Create a queue entry for tracking
        const { rows: [newEntry] } = await pool.query(
          `INSERT INTO broken_link_queue (resource_id, original_url, status)
           VALUES ($1, $2, 'fixed')
           ON CONFLICT (resource_id) DO UPDATE SET status = 'fixed', updated_at = NOW()
           RETURNING id`,
          [resourceId, validationEntry.url]
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

    // Update the resource URL
    await pool.query(
      `UPDATE resources SET url = $1, updated_at = NOW() WHERE id = $2`,
      [newUrl, resourceId]
    );

    // Update the queue entry status
    if (queueId) {
      await pool.query(
        `UPDATE broken_link_queue
         SET status = 'fixed', suggested_url = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [newUrl, session.user.id, queueId]
      );
    }

    // Re-validate the new URL
    await validateResource(pool, resourceId, newUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BrokenLinks] Fix error:", error);
    return NextResponse.json(
      { error: "Failed to fix link" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
