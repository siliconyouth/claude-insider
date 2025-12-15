/**
 * Favorite Detail API
 *
 * Delete a favorite by ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Delete a favorite
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete only if owned by user
    const result = await pool.query(
      `DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Favorite not found or not owned by you" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Favorite Delete Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete favorite" },
      { status: 500 }
    );
  }
}
