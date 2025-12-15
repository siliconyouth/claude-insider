/**
 * Notification Preferences API
 *
 * Get the current user's notification preferences.
 * Used by the notification bell to check if browser notifications are enabled.
 */

import { NextResponse } from "next/server";
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
 * Get notification preferences for the current user
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT browser_notifications FROM notification_preferences WHERE user_id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      // Return default if no preferences set
      return NextResponse.json({ browser_notifications: false });
    }

    return NextResponse.json({
      browser_notifications: result.rows[0].browser_notifications ?? false,
    });
  } catch (error) {
    console.error("[NotificationPreferences API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
