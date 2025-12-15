/**
 * Collection Items API
 *
 * Add or remove favorites from a collection.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { AddToCollectionRequest, FavoriteWithDetails } from "@/types/favorites";

/**
 * Get items in a collection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get collection
    const collectionResult = await pool.query(
      `SELECT id FROM collections WHERE user_id = $1 AND slug = $2`,
      [session.user.id, slug]
    );

    if (collectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const collectionId = collectionResult.rows[0].id;

    // Get items with favorite details
    const result = await pool.query(
      `
      SELECT
        ci.id as item_id,
        ci.position,
        ci.added_at,
        f.id as favorite_id,
        f.resource_type,
        f.resource_id,
        f.notes,
        f.created_at as favorited_at
      FROM collection_items ci
      JOIN favorites f ON ci.favorite_id = f.id
      WHERE ci.collection_id = $1
      ORDER BY ci.position ASC, ci.added_at DESC
    `,
      [collectionId]
    );

    const items: (FavoriteWithDetails & { itemId: string; position: number; addedAt: string })[] =
      result.rows.map((row) => ({
        itemId: row.item_id,
        position: row.position,
        addedAt: row.added_at.toISOString(),
        id: row.favorite_id,
        userId: session.user!.id,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        notes: row.notes,
        createdAt: row.favorited_at.toISOString(),
        title: row.resource_id, // Placeholder - client fetches actual details
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[Collection Items Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get collection items" },
      { status: 500 }
    );
  }
}

/**
 * Add a favorite to a collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AddToCollectionRequest = await request.json();

    if (!body.favoriteId) {
      return NextResponse.json(
        { error: "favoriteId is required" },
        { status: 400 }
      );
    }

    // Get collection
    const collectionResult = await pool.query(
      `SELECT id FROM collections WHERE user_id = $1 AND slug = $2`,
      [session.user.id, slug]
    );

    if (collectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const collectionId = collectionResult.rows[0].id;

    // Verify favorite exists and belongs to user
    const favoriteResult = await pool.query(
      `SELECT id FROM favorites WHERE id = $1 AND user_id = $2`,
      [body.favoriteId, session.user.id]
    );

    if (favoriteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    // Check if already in collection
    const existingResult = await pool.query(
      `SELECT id FROM collection_items WHERE collection_id = $1 AND favorite_id = $2`,
      [collectionId, body.favoriteId]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        itemId: existingResult.rows[0].id,
        message: "Already in collection",
      });
    }

    // Get next position
    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM collection_items WHERE collection_id = $1`,
      [collectionId]
    );
    const position = positionResult.rows[0].next_position;

    // Add to collection
    const result = await pool.query(
      `
      INSERT INTO collection_items (collection_id, favorite_id, position)
      VALUES ($1, $2, $3)
      RETURNING id, added_at
    `,
      [collectionId, body.favoriteId, position]
    );

    // Update collection's updated_at
    await pool.query(
      `UPDATE collections SET updated_at = NOW() WHERE id = $1`,
      [collectionId]
    );

    return NextResponse.json({
      success: true,
      itemId: result.rows[0].id,
      addedAt: result.rows[0].added_at.toISOString(),
    });
  } catch (error) {
    console.error("[Collection Items Add Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add to collection" },
      { status: 500 }
    );
  }
}

/**
 * Remove a favorite from a collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get("favoriteId");

    if (!favoriteId) {
      return NextResponse.json(
        { error: "favoriteId query parameter is required" },
        { status: 400 }
      );
    }

    // Get collection
    const collectionResult = await pool.query(
      `SELECT id FROM collections WHERE user_id = $1 AND slug = $2`,
      [session.user.id, slug]
    );

    if (collectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const collectionId = collectionResult.rows[0].id;

    // Remove from collection
    const result = await pool.query(
      `DELETE FROM collection_items WHERE collection_id = $1 AND favorite_id = $2 RETURNING id`,
      [collectionId, favoriteId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Item not found in collection" },
        { status: 404 }
      );
    }

    // Update collection's updated_at
    await pool.query(
      `UPDATE collections SET updated_at = NOW() WHERE id = $1`,
      [collectionId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Collection Items Remove Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove from collection" },
      { status: 500 }
    );
  }
}
