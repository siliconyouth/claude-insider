/**
 * Notifications API
 *
 * Get and manage user notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread") === "true";

    let query = `
      SELECT
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.read,
        n.read_at,
        n.created_at,
        n.actor_id,
        n.resource_type,
        n.resource_id,
        a.name as actor_name,
        a.username as actor_username,
        a.image as actor_image
      FROM notifications n
      LEFT JOIN "user" a ON n.actor_id = a.id
      WHERE n.user_id = $1
    `;

    const params: (string | number | boolean)[] = [session.user.id];
    const paramIndex = 2;

    if (unreadOnly) {
      query += ` AND n.read = FALSE`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get counts
    const countsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE read = FALSE) as unread
      FROM notifications
      WHERE user_id = $1
    `,
      [session.user.id]
    );

    const notifications = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      read: row.read,
      read_at: row.read_at?.toISOString(),
      created_at: row.created_at?.toISOString(),
      actor_id: row.actor_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      actor: row.actor_id
        ? {
            name: row.actor_name,
            username: row.actor_username,
            image: row.actor_image,
          }
        : null,
    }));

    return NextResponse.json({
      notifications,
      total: parseInt(countsResult.rows[0]?.total || "0"),
      unreadCount: parseInt(countsResult.rows[0]?.unread || "0"),
    });
  } catch (error) {
    console.error("[Notifications API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get notifications" },
      { status: 500 }
    );
  }
}

/**
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    let query: string;
    let params: (string | string[])[];

    if (markAll) {
      query = `
        UPDATE notifications
        SET read = TRUE, read_at = NOW()
        WHERE user_id = $1 AND read = FALSE
        RETURNING id
      `;
      params = [session.user.id];
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      query = `
        UPDATE notifications
        SET read = TRUE, read_at = NOW()
        WHERE user_id = $1 AND id = ANY($2) AND read = FALSE
        RETURNING id
      `;
      params = [session.user.id, notificationIds];
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      count: result.rowCount,
    });
  } catch (error) {
    console.error("[Notifications API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notifications" },
      { status: 500 }
    );
  }
}

/**
 * Delete read notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get("all") === "true";

    let query: string;

    if (deleteAll) {
      query = `
        DELETE FROM notifications
        WHERE user_id = $1 AND read = TRUE
        RETURNING id
      `;
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await pool.query(query, [session.user.id]);

    return NextResponse.json({
      success: true,
      count: result.rowCount,
    });
  } catch (error) {
    console.error("[Notifications API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
