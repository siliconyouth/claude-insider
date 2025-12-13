/**
 * Collections API
 *
 * List and create collections.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/auth";
import type { CreateCollectionRequest, CollectionWithCount } from "@/types/favorites";

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
 * Get user's collections
 */
export async function GET() {
  try {
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
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `,
      [session.user.id]
    );

    const collections: CollectionWithCount[] = result.rows.map((row) => ({
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
    }));

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("[Collections List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get collections" },
      { status: 500 }
    );
  }
}

/**
 * Create a collection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateCollectionRequest = await request.json();

    // Validate
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { error: "Collection name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(body.name.trim());
    let counter = 0;

    while (true) {
      const existing = await pool.query(
        `SELECT id FROM collections WHERE user_id = $1 AND slug = $2`,
        [session.user.id, slug]
      );

      if (existing.rows.length === 0) break;

      counter++;
      slug = `${generateSlug(body.name.trim())}-${counter}`;
    }

    // Create collection
    const result = await pool.query(
      `
      INSERT INTO collections (user_id, name, description, slug, color, icon, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, slug, created_at
    `,
      [
        session.user.id,
        body.name.trim(),
        body.description?.trim() || null,
        slug,
        body.color || "blue",
        body.icon || "folder",
        body.isPublic ?? false,
      ]
    );

    return NextResponse.json({
      success: true,
      collectionId: result.rows[0].id,
      slug: result.rows[0].slug,
    });
  } catch (error) {
    console.error("[Collections Create Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create collection" },
      { status: 500 }
    );
  }
}
