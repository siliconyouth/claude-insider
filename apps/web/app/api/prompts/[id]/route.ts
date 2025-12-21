/**
 * Single Prompt API
 *
 * GET: Get prompt details
 * PATCH: Update prompt
 * DELETE: Delete prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/prompts/[id]
 * Get a single prompt by ID or slug
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || null;
    const { id } = await context.params;

    // Check if id is UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUuid ? 'p.id = $1' : 'p.slug = $1';

    // User-specific subqueries
    const savedSubquery = userId
      ? `EXISTS (SELECT 1 FROM user_prompt_saves ups WHERE ups.prompt_id = p.id AND ups.user_id = '${userId}')`
      : 'FALSE';
    const ratingSubquery = userId
      ? `(SELECT rating FROM prompt_ratings pr WHERE pr.prompt_id = p.id AND pr.user_id = '${userId}')`
      : 'NULL';

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
        u.username as author_username,
        p.visibility,
        p.is_featured,
        p.is_system,
        p.use_count,
        p.save_count,
        p.avg_rating,
        p.rating_count,
        ${savedSubquery} as is_saved,
        ${ratingSubquery} as user_rating,
        p.status,
        p.created_at,
        p.updated_at
      FROM prompts p
      LEFT JOIN prompt_categories c ON c.id = p.category_id
      LEFT JOIN "user" u ON u.id = p.author_id
      WHERE ${whereClause}
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const p = result.rows[0];

    // Check visibility
    const canView =
      p.visibility === 'public' ||
      p.visibility === 'unlisted' ||
      p.is_system ||
      p.author_id === userId;

    if (!canView) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check if user is author or admin
    const isOwner = p.author_id === userId;
    let canEdit = isOwner;

    if (userId && !canEdit) {
      const roleResult = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [userId]
      );
      const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';
      canEdit = hasMinRole(userRole, ROLES.ADMIN);
    }

    return NextResponse.json({
      prompt: {
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
          username: p.author_username,
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
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
      canEdit,
      isOwner,
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prompts/[id]
 * Update a prompt
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check ownership or admin status
    const promptCheck = await pool.query(
      'SELECT author_id, is_system FROM prompts WHERE id = $1',
      [id]
    );

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const prompt = promptCheck.rows[0];
    const isOwner = prompt.author_id === session.user.id;

    // Check admin role if not owner
    if (!isOwner) {
      const roleResult = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [session.user.id]
      );
      const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';

      if (!hasMinRole(userRole, ROLES.ADMIN)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // System prompts can only be edited by admins
    if (prompt.is_system) {
      const roleResult = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [session.user.id]
      );
      const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';

      if (!hasMinRole(userRole, ROLES.ADMIN)) {
        return NextResponse.json(
          { error: 'System prompts can only be edited by admins' },
          { status: 403 }
        );
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title',
      'description',
      'content',
      'category_id',
      'tags',
      'variables',
      'visibility',
    ];

    // Admin-only fields
    const adminFields = ['is_featured', 'status'];

    for (const [key, value] of Object.entries(body)) {
      const snakeKey = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);

      if (allowedFields.includes(snakeKey)) {
        updates.push(`${snakeKey} = $${paramIndex}`);
        values.push(snakeKey === 'variables' ? JSON.stringify(value) : value);
        paramIndex++;
      } else if (adminFields.includes(snakeKey)) {
        // Check admin for these fields
        const roleResult = await pool.query(
          'SELECT role FROM "user" WHERE id = $1',
          [session.user.id]
        );
        const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';

        if (hasMinRole(userRole, ROLES.ADMIN)) {
          updates.push(`${snakeKey} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE prompts
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    const updated = result.rows[0];

    return NextResponse.json({
      success: true,
      prompt: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        description: updated.description,
        content: updated.content,
        categoryId: updated.category_id,
        tags: updated.tags,
        variables: updated.variables,
        visibility: updated.visibility,
        isFeatured: updated.is_featured,
        status: updated.status,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/[id]
 * Delete a prompt
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    // Check ownership
    const promptCheck = await pool.query(
      'SELECT author_id, is_system FROM prompts WHERE id = $1',
      [id]
    );

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const prompt = promptCheck.rows[0];
    const isOwner = prompt.author_id === session.user.id;

    // Check admin role if not owner
    let canDelete = isOwner;
    if (!canDelete) {
      const roleResult = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [session.user.id]
      );
      const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';
      canDelete = hasMinRole(userRole, ROLES.ADMIN);
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // System prompts cannot be deleted
    if (prompt.is_system) {
      return NextResponse.json(
        { error: 'System prompts cannot be deleted' },
        { status: 403 }
      );
    }

    // Delete prompt (cascades to saves, ratings, usage)
    await pool.query('DELETE FROM prompts WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
