/**
 * Dashboard Prompts Admin API
 *
 * GET: List all prompts for admin management
 * POST: Create a new system prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

interface PromptRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  category_icon: string | null;
  tags: string[];
  variables: unknown;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  visibility: string;
  status: string;
  is_featured: boolean;
  is_system: boolean;
  use_count: number;
  save_count: number;
  avg_rating: string;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role (admin or above)
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const visibility = searchParams.get("visibility");
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type"); // system, user, all

    // Build query
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    // Status filter
    if (status !== "all") {
      conditions.push(`p.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // Type filter
    if (type === "system") {
      conditions.push(`p.is_system = TRUE`);
    } else if (type === "user") {
      conditions.push(`p.is_system = FALSE`);
    }

    // Category filter
    if (category) {
      conditions.push(`c.slug = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    // Visibility filter
    if (visibility) {
      conditions.push(`p.visibility = $${paramIndex}`);
      values.push(visibility);
      paramIndex++;
    }

    // Search filter
    if (search) {
      conditions.push(`(
        p.title ILIKE $${paramIndex}
        OR p.description ILIKE $${paramIndex}
        OR u.name ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM prompts p
      LEFT JOIN prompt_categories c ON c.id = p.category_id
      LEFT JOIN "user" u ON u.id = p.author_id
      ${whereClause}
    `,
      values
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    // Main query with admin info
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.slug,
        p.title,
        p.description,
        p.content,
        p.category_id,
        c.slug as category_slug,
        c.name as category_name,
        c.icon as category_icon,
        p.tags,
        p.variables,
        p.author_id,
        u.name as author_name,
        u.email as author_email,
        p.visibility,
        p.status,
        p.is_featured,
        p.is_system,
        p.use_count,
        p.save_count,
        p.avg_rating,
        p.rating_count,
        p.created_at,
        p.updated_at
      FROM prompts p
      LEFT JOIN prompt_categories c ON c.id = p.category_id
      LEFT JOIN "user" u ON u.id = p.author_id
      ${whereClause}
      ORDER BY p.is_featured DESC, p.is_system DESC, p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...values, limit, offset]
    );

    // Get categories
    const categoriesResult = await pool.query(`
      SELECT id, slug, name, icon
      FROM prompt_categories
      WHERE is_active = TRUE
      ORDER BY display_order
    `);

    // Stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE is_system = TRUE) as system_count,
        COUNT(*) FILTER (WHERE is_featured = TRUE) as featured_count,
        COUNT(*) FILTER (WHERE visibility = 'public') as public_count,
        COUNT(*) FILTER (WHERE visibility = 'private') as private_count,
        SUM(use_count) as total_uses
      FROM prompts
    `);

    const prompts = (result.rows as PromptRow[]).map((p) => ({
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
    }));

    const stats = statsResult.rows[0];

    return NextResponse.json({
      prompts,
      categories: categoriesResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        activeCount: parseInt(stats.active_count, 10),
        systemCount: parseInt(stats.system_count, 10),
        featuredCount: parseInt(stats.featured_count, 10),
        publicCount: parseInt(stats.public_count, 10),
        privateCount: parseInt(stats.private_count, 10),
        totalUses: parseInt(stats.total_uses || "0", 10),
      },
    });
  } catch (error) {
    console.error("Dashboard prompts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role (admin or above)
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      categoryId,
      tags,
      variables,
      visibility = "public",
      isSystem = false,
      isFeatured = false,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
    const slug = `${baseSlug}-${nanoid(6)}`;

    const result = await pool.query(
      `
      INSERT INTO prompts (
        slug, title, description, content, category_id,
        tags, variables, author_id, visibility, is_system, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
      [
        slug,
        title,
        description || null,
        content,
        categoryId || null,
        tags || [],
        JSON.stringify(variables || []),
        session.user.id,
        visibility,
        isSystem,
        isFeatured,
      ]
    );

    return NextResponse.json({ success: true, prompt: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Create prompt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
