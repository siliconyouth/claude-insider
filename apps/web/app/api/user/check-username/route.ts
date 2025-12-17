/**
 * Check Username Availability
 *
 * GET /api/user/check-username?username=xxx
 *
 * Checks if a username is available (case-insensitive).
 * Also validates the username format.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    // Validate format
    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < 3) {
      return NextResponse.json({
        available: false,
        reason: "Username must be at least 3 characters",
      });
    }

    if (trimmed.length > 30) {
      return NextResponse.json({
        available: false,
        reason: "Username must be less than 30 characters",
      });
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return NextResponse.json({
        available: false,
        reason: "Username can only contain lowercase letters, numbers, and underscores",
      });
    }

    if (/^\d/.test(trimmed)) {
      return NextResponse.json({
        available: false,
        reason: "Username cannot start with a number",
      });
    }

    // Reserved usernames
    const reserved = [
      "admin", "administrator", "root", "system", "support",
      "help", "contact", "info", "api", "www", "mail", "email",
      "claudeinsider", "claude", "anthropic", "ai", "assistant",
      "bot", "moderator", "mod", "staff", "team", "official",
    ];

    if (reserved.includes(trimmed)) {
      return NextResponse.json({
        available: false,
        reason: "This username is reserved",
      });
    }

    // Check database (exclude current user's existing username)
    const result = await pool.query(
      `SELECT id FROM "user" WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1`,
      [trimmed, session.user.id]
    );

    const available = result.rows.length === 0;

    return NextResponse.json({
      available,
      reason: available ? null : "Username is already taken",
    });
  } catch (error) {
    console.error("[API] Failed to check username:", error);
    return NextResponse.json(
      { error: "Failed to check username" },
      { status: 500 }
    );
  }
}
