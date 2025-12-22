/**
 * User Beta Status API
 *
 * Simple endpoint to check if the current user is a beta tester.
 * Used by client components when session may not include this field.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT "isBetaTester" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      isBetaTester: result.rows[0].isBetaTester === true,
    });
  } catch (error) {
    console.error("[Beta Status Error]:", error);
    return NextResponse.json(
      { error: "Failed to check beta status" },
      { status: 500 }
    );
  }
}
