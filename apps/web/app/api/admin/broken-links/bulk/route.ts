/**
 * Bulk Broken Links Actions API
 *
 * POST - Perform bulk actions on broken links
 * Actions: hide-all, dismiss-all
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const body = await request.json();
    const { action } = body;

    if (!["hide-all", "dismiss-all"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'hide-all' or 'dismiss-all'" },
        { status: 400 }
      );
    }

    // Get all pending invalid links
    const { rows: pendingLinks } = await pool.query(`
      SELECT v.resource_id, v.url
      FROM resource_link_validations v
      INNER JOIN resources r ON r.id = v.resource_id
      LEFT JOIN broken_link_queue q ON q.resource_id = v.resource_id
      WHERE v.is_valid = false
        AND (q.id IS NULL OR q.status = 'pending')
    `);

    if (pendingLinks.length === 0) {
      return NextResponse.json({ success: true, affected: 0 });
    }

    let affected = 0;

    if (action === "hide-all") {
      // Unpublish all resources with broken links
      const resourceIds = pendingLinks.map((r) => r.resource_id);

      await pool.query(
        `UPDATE resources SET is_published = false, updated_at = NOW()
         WHERE id = ANY($1)`,
        [resourceIds]
      );

      // Create or update queue entries
      for (const link of pendingLinks) {
        await pool.query(
          `INSERT INTO broken_link_queue (resource_id, original_url, status, reviewed_by, reviewed_at)
           VALUES ($1, $2, 'hidden', $3, NOW())
           ON CONFLICT (resource_id)
           DO UPDATE SET status = 'hidden', reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()`,
          [link.resource_id, link.url, session.user.id]
        );
        affected++;
      }
    } else if (action === "dismiss-all") {
      // Mark all as false positives
      for (const link of pendingLinks) {
        // Reset validation status
        await pool.query(
          `UPDATE resource_link_validations
           SET is_valid = true, consecutive_failures = 0, updated_at = NOW()
           WHERE resource_id = $1`,
          [link.resource_id]
        );

        // Create or update queue entry as dismissed
        await pool.query(
          `INSERT INTO broken_link_queue (resource_id, original_url, status, reviewed_by, reviewed_at)
           VALUES ($1, $2, 'dismissed', $3, NOW())
           ON CONFLICT (resource_id)
           DO UPDATE SET status = 'dismissed', reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()`,
          [link.resource_id, link.url, session.user.id]
        );
        affected++;
      }
    }

    return NextResponse.json({ success: true, affected });
  } catch (error) {
    console.error("[BrokenLinks] Bulk action error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
