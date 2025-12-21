/**
 * Dashboard Prompt Admin API - Individual Operations
 *
 * GET: Get prompt details
 * PATCH: Update prompt
 * DELETE: Delete prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `
      SELECT
        p.*,
        c.slug as category_slug,
        c.name as category_name,
        c.icon as category_icon,
        u.name as author_name,
        u.email as author_email
      FROM prompts p
      LEFT JOIN prompt_categories c ON c.id = p.category_id
      LEFT JOIN "user" u ON u.id = p.author_id
      WHERE p.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const p = result.rows[0];
    return NextResponse.json({
      prompt: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        content: p.content,
        category: p.category_id
          ? {
              id: p.category_id,
              slug: p.category_slug,
              name: p.category_name,
              icon: p.category_icon,
            }
          : null,
        tags: p.tags || [],
        variables: p.variables || [],
        author: p.author_id
          ? {
              id: p.author_id,
              name: p.author_name,
              email: p.author_email,
            }
          : null,
        visibility: p.visibility,
        status: p.status,
        isFeatured: p.is_featured,
        isSystem: p.is_system,
        useCount: p.use_count,
        saveCount: p.save_count,
        avgRating: parseFloat(p.avg_rating) || 0,
        ratingCount: p.rating_count,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (error) {
    console.error("Get prompt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: (string | boolean | string[] | number)[] = [];
    let paramIndex = 1;

    const allowedFields = [
      "title",
      "description",
      "content",
      "visibility",
      "status",
      "tags",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    // Handle special fields
    if (body.categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex}`);
      values.push(body.categoryId || null);
      paramIndex++;
    }

    if (body.isFeatured !== undefined) {
      updates.push(`is_featured = $${paramIndex}`);
      values.push(body.isFeatured);
      paramIndex++;
    }

    if (body.isSystem !== undefined) {
      updates.push(`is_system = $${paramIndex}`);
      values.push(body.isSystem);
      paramIndex++;
    }

    if (body.variables !== undefined) {
      updates.push(`variables = $${paramIndex}`);
      values.push(JSON.stringify(body.variables));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);

    const result = await pool.query(
      `
      UPDATE prompts
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, prompt: result.rows[0] });
  } catch (error) {
    console.error("Update prompt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by setting status to 'deleted'
    const result = await pool.query(
      `
      UPDATE prompts
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete prompt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
