/**
 * User Beta Status API
 *
 * Simple endpoint to check if a user is a beta tester.
 * Used by client components when session may not include this field.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Users can only check their own beta status
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT "isBetaTester" FROM "user" WHERE id = $1`,
      [id]
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
