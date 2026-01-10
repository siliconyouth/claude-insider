/**
 * Individual Fill API
 *
 * GET: Get fill details (by ID or share token)
 * PATCH: Update fill
 * DELETE: Delete fill
 *
 * @see components/prompts/builder/
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Generate a short, URL-friendly share token
function generateShareToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * GET /api/prompts/builder/fills/[id]
 * Get fill details - works with UUID or share token
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    // Try UUID first, then share token
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const query = isUUID
      ? `
        SELECT
          pf.id,
          pf.user_id,
          pf.prompt_id,
          pf.title,
          pf.variable_values,
          pf.final_content,
          pf.builder_mode,
          pf.is_favorite,
          pf.share_token,
          pf.is_public,
          pf.star_count,
          pf.created_at,
          pf.updated_at,
          p.title as prompt_title,
          p.slug as prompt_slug,
          p.content as prompt_content,
          pc.name as category_name,
          pc.slug as category_slug,
          u.name as author_name,
          u.image as author_image
        FROM prompt_fills pf
        JOIN prompts p ON p.id = pf.prompt_id
        LEFT JOIN prompt_categories pc ON pc.id = p.category_id
        LEFT JOIN "user" u ON u.id = pf.user_id
        WHERE pf.id = $1
      `
      : `
        SELECT
          pf.id,
          pf.user_id,
          pf.prompt_id,
          pf.title,
          pf.variable_values,
          pf.final_content,
          pf.builder_mode,
          pf.is_favorite,
          pf.share_token,
          pf.is_public,
          pf.star_count,
          pf.created_at,
          pf.updated_at,
          p.title as prompt_title,
          p.slug as prompt_slug,
          p.content as prompt_content,
          pc.name as category_name,
          pc.slug as category_slug,
          u.name as author_name,
          u.image as author_image
        FROM prompt_fills pf
        JOIN prompts p ON p.id = pf.prompt_id
        LEFT JOIN prompt_categories pc ON pc.id = p.category_id
        LEFT JOIN "user" u ON u.id = pf.user_id
        WHERE pf.share_token = $1 AND pf.is_public = true
      `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Fill not found" }, { status: 404 });
    }

    const fill = result.rows[0];

    // Check access for private fills
    if (!fill.is_public) {
      const session = await getSession();
      if (!session?.user?.id || session.user.id !== fill.user_id) {
        return NextResponse.json({ error: "Fill not found" }, { status: 404 });
      }
    }

    // Parse variable values
    fill.variable_values = typeof fill.variable_values === 'string'
      ? JSON.parse(fill.variable_values)
      : fill.variable_values;

    return NextResponse.json({
      success: true,
      fill,
    });
  } catch (error) {
    console.error("Error fetching fill:", error);
    return NextResponse.json(
      { error: "Failed to fetch fill" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prompts/builder/fills/[id]
 * Update fill - toggle favorite, update title, toggle public/share
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      "SELECT id, is_public, share_token FROM prompt_fills WHERE id = $1 AND user_id = $2",
      [id, session.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: "Fill not found" }, { status: 404 });
    }

    const currentFill = ownerCheck.rows[0];
    const body = await request.json();
    const updates: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    // Handle title update
    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(body.title);
      paramIndex++;
    }

    // Handle favorite toggle
    if (body.isFavorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex}`);
      values.push(body.isFavorite);
      paramIndex++;
    }

    // Handle public toggle (generates share token if needed)
    if (body.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex}`);
      values.push(body.isPublic);
      paramIndex++;

      // Generate share token if making public and doesn't have one
      if (body.isPublic && !currentFill.share_token) {
        updates.push(`share_token = $${paramIndex}`);
        values.push(generateShareToken());
        paramIndex++;
      }
    }

    // Handle variable values update
    if (body.variableValues !== undefined) {
      updates.push(`variable_values = $${paramIndex}`);
      values.push(JSON.stringify(body.variableValues));
      paramIndex++;
    }

    // Handle final content update
    if (body.finalContent !== undefined) {
      updates.push(`final_content = $${paramIndex}`);
      values.push(body.finalContent);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    // Add WHERE clause params
    values.push(id);
    values.push(session.user.id);

    const result = await pool.query(
      `UPDATE prompt_fills
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING id, title, is_favorite, is_public, share_token, updated_at`,
      values
    );

    const updatedFill = result.rows[0];

    return NextResponse.json({
      success: true,
      fill: {
        ...updatedFill,
        shareUrl: updatedFill.share_token
          ? `${process.env.NEXT_PUBLIC_APP_URL}/prompts/shared/${updatedFill.share_token}`
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating fill:", error);
    return NextResponse.json(
      { error: "Failed to update fill" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/builder/fills/[id]
 * Delete fill
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await pool.query(
      "DELETE FROM prompt_fills WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Fill not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error("Error deleting fill:", error);
    return NextResponse.json(
      { error: "Failed to delete fill" },
      { status: 500 }
    );
  }
}
