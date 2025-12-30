/**
 * Fix Broken Link API
 *
 * POST - Update a resource with a new URL
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

    // Update the resource URL
    await pool.query(
      `UPDATE resources SET url = $1, updated_at = NOW() WHERE id = $2`,
      [newUrl, entry.resource_id]
    );

    // Update the queue entry status
    await pool.query(
      `
      UPDATE broken_link_queue
      SET status = 'fixed', suggested_url = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $3
    `,
      [newUrl, session.user.id, entryId]
    );

    // Re-validate the new URL
    await validateResource(pool, entry.resource_id, newUrl);

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
