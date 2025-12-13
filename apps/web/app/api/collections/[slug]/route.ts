/**
 * Collection Detail API
 *
 * Get, update, or delete a collection by slug.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import type { UpdateCollectionRequest, CollectionWithCount } from "@/types/favorites";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Generate URL-friendly slug
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "collection";
}

/**
 * Get a collection by slug
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

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.user_id,
        c.name,
        c.description,
        c.slug,
        c.color,
        c.icon,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(ci.id)::integer as item_count
      FROM collections c
      LEFT JOIN collection_items ci ON c.id = ci.collection_id
      WHERE c.user_id = $1 AND c.slug = $2
      GROUP BY c.id
    `,
      [session.user.id, slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const collection: CollectionWithCount = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      color: row.color,
      icon: row.icon,
      isPublic: row.is_public,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      itemCount: row.item_count,
    };

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("[Collection Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get collection" },
      { status: 500 }
    );
  }
}

/**
 * Update a collection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateCollectionRequest = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Collection name cannot be empty" },
          { status: 400 }
        );
      }
      if (body.name.trim().length > 100) {
        return NextResponse.json(
          { error: "Collection name must be 100 characters or less" },
          { status: 400 }
        );
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name.trim());

      // Generate new slug if name changed
      let newSlug = generateSlug(body.name.trim());
      let counter = 0;

      while (true) {
        const existing = await pool.query(
          `SELECT id FROM collections WHERE user_id = $1 AND slug = $2 AND slug != $3`,
          [session.user.id, newSlug, slug]
        );

        if (existing.rows.length === 0) break;

        counter++;
        newSlug = `${generateSlug(body.name.trim())}-${counter}`;
      }

      updates.push(`slug = $${paramIndex++}`);
      values.push(newSlug);
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description?.trim() || "");
    }

    if (body.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(body.color);
    }

    if (body.icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(body.icon);
    }

    if (body.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(body.isPublic);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);

    // Add user_id and slug to values
    values.push(session.user.id);
    values.push(slug);

    const result = await pool.query(
      `
      UPDATE collections
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex++} AND slug = $${paramIndex}
      RETURNING id, slug
    `,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collectionId: result.rows[0].id,
      slug: result.rows[0].slug,
    });
  } catch (error) {
    console.error("[Collection Update Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update collection" },
      { status: 500 }
    );
  }
}

/**
 * Delete a collection
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

    const result = await pool.query(
      `DELETE FROM collections WHERE user_id = $1 AND slug = $2 RETURNING id`,
      [session.user.id, slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Collection Delete Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete collection" },
      { status: 500 }
    );
  }
}
