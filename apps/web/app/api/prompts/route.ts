/**
 * Prompts API - List and Create
 *
 * GET: List prompts with filtering, search, and pagination
 * POST: Create a new prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

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
  author_image: string | null;
  visibility: string;
  is_featured: boolean;
  is_system: boolean;
  use_count: number;
  save_count: number;
  avg_rating: string;
  rating_count: number;
  is_saved: boolean;
  user_rating: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/prompts
 * List prompts with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const featured = searchParams.get('featured') === 'true';
    const system = searchParams.get('system') === 'true';
    const mine = searchParams.get('mine') === 'true';
    const saved = searchParams.get('saved') === 'true';
    const sort = searchParams.get('sort') || 'popular'; // popular, recent, top-rated

    // Build query
    const conditions: string[] = ['p.status = $1'];
    const values: (string | string[] | number | boolean)[] = ['active'];
    let paramIndex = 2;

    // Visibility filter - show public, system, or user's own prompts
    if (userId) {
      conditions.push(`(p.visibility = 'public' OR p.is_system = TRUE OR p.author_id = $${paramIndex})`);
      values.push(userId);
      paramIndex++;
    } else {
      conditions.push(`(p.visibility = 'public' OR p.is_system = TRUE)`);
    }

    // Category filter
    if (category) {
      conditions.push(`c.slug = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    // Search filter
    if (search) {
      conditions.push(`(
        p.title ILIKE $${paramIndex}
        OR p.description ILIKE $${paramIndex}
        OR p.content ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      conditions.push(`p.tags && $${paramIndex}::text[]`);
      values.push(tags);
      paramIndex++;
    }

    // Featured filter
    if (featured) {
      conditions.push(`p.is_featured = TRUE`);
    }

    // System prompts filter
    if (system) {
      conditions.push(`p.is_system = TRUE`);
    }

    // My prompts filter
    if (mine && userId) {
      conditions.push(`p.author_id = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    // Saved prompts filter
    if (saved && userId) {
      conditions.push(`EXISTS (SELECT 1 FROM user_prompt_saves ups WHERE ups.prompt_id = p.id AND ups.user_id = $${paramIndex})`);
      values.push(userId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort order
    let orderClause: string;
    switch (sort) {
      case 'recent':
        orderClause = 'ORDER BY p.created_at DESC';
        break;
      case 'top-rated':
        orderClause = 'ORDER BY p.avg_rating DESC, p.rating_count DESC';
        break;
      case 'most-used':
        orderClause = 'ORDER BY p.use_count DESC';
        break;
      case 'popular':
      default:
        orderClause = 'ORDER BY p.is_featured DESC, p.use_count DESC, p.save_count DESC';
        break;
    }

    // Count query
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM prompts p
      LEFT JOIN prompt_categories c ON c.id = p.category_id
      ${whereClause}
    `, values);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // User-specific subqueries
    const savedSubquery = userId
      ? `EXISTS (SELECT 1 FROM user_prompt_saves ups WHERE ups.prompt_id = p.id AND ups.user_id = '${userId}')`
      : 'FALSE';
    const ratingSubquery = userId
      ? `(SELECT rating FROM prompt_ratings pr WHERE pr.prompt_id = p.id AND pr.user_id = '${userId}')`
      : 'NULL';

    // Main query
    const result = await pool.query(`
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
        u.image as author_image,
        p.visibility,
        p.is_featured,
        p.is_system,
        p.use_count,
        p.save_count,
        p.avg_rating,
        p.rating_count,
        ${savedSubquery} as is_saved,
        ${ratingSubquery} as user_rating,
        p.created_at,
        p.updated_at
      FROM prompts p
      LEFT JOIN prompt_categories c ON c.id = p.category_id
      LEFT JOIN "user" u ON u.id = p.author_id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...values, limit, offset]);

    // Get categories for filter UI
    const categoriesResult = await pool.query(`
      SELECT
        c.id,
        c.slug,
        c.name,
        c.icon,
        COUNT(p.id)::int as prompt_count
      FROM prompt_categories c
      LEFT JOIN prompts p ON p.category_id = c.id AND p.status = 'active' AND (p.visibility = 'public' OR p.is_system = TRUE)
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.display_order
    `);

    // Transform response
    const prompts = (result.rows as PromptRow[]).map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      content: p.content,
      category: p.category_id ? {
        id: p.category_id,
        slug: p.category_slug,
        name: p.category_name,
        icon: p.category_icon,
      } : null,
      tags: p.tags || [],
      variables: p.variables || [],
      author: p.author_id ? {
        id: p.author_id,
        name: p.author_name,
        image: p.author_image,
      } : null,
      visibility: p.visibility,
      isFeatured: p.is_featured,
      isSystem: p.is_system,
      useCount: p.use_count,
      saveCount: p.save_count,
      avgRating: parseFloat(p.avg_rating) || 0,
      ratingCount: p.rating_count,
      isSaved: p.is_saved,
      userRating: p.user_rating,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({
      prompts,
      categories: categoriesResult.rows.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        promptCount: c.prompt_count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts
 * Create a new prompt
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      content,
      categoryId,
      tags,
      variables,
      visibility = 'private',
    } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (visibility && !['private', 'public', 'unlisted'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Validate category if provided
    if (categoryId) {
      const categoryCheck = await pool.query(
        'SELECT id FROM prompt_categories WHERE id = $1',
        [categoryId]
      );
      if (categoryCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    // Insert prompt
    const result = await pool.query(`
      INSERT INTO prompts (
        slug, title, description, content, category_id,
        tags, variables, author_id, visibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      slug,
      title,
      description || null,
      content,
      categoryId || null,
      tags || [],
      JSON.stringify(variables || []),
      session.user.id,
      visibility,
    ]);

    const prompt = result.rows[0];

    return NextResponse.json({
      success: true,
      prompt: {
        id: prompt.id,
        slug: prompt.slug,
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        categoryId: prompt.category_id,
        tags: prompt.tags,
        variables: prompt.variables,
        visibility: prompt.visibility,
        createdAt: prompt.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
