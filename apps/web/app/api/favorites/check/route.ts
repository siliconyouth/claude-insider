/**
 * Favorites Check API
 *
 * Check if a resource is favorited by the current user.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { FavoriteStatus } from "@/types/favorites";

/**
 * Check favorite status for a resource
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get("resourceType");
    const resourceId = searchParams.get("resourceId");

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType and resourceId are required" },
        { status: 400 }
      );
    }

    // Get total favorite count for this resource
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM favorites WHERE resource_type = $1 AND resource_id = $2`,
      [resourceType, resourceId]
    );
    const count = parseInt(countResult.rows[0].count);

    // Check if current user has favorited
    const session = await getSession();
    let isFavorited = false;
    let favoriteId: string | undefined;

    if (session?.user) {
      const userResult = await pool.query(
        `SELECT id FROM favorites WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3`,
        [session.user.id, resourceType, resourceId]
      );

      if (userResult.rows.length > 0) {
        isFavorited = true;
        favoriteId = userResult.rows[0].id;
      }
    }

    const response: FavoriteStatus = {
      isFavorited,
      favoriteId,
      count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Favorites Check Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check favorite" },
      { status: 500 }
    );
  }
}
