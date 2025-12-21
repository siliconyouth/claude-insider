/**
 * Prompt Rating API
 *
 * POST: Rate a prompt (1-5 stars)
 * DELETE: Remove rating
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/prompts/[id]/rate
 * Rate a prompt
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { rating, review } = body;

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if prompt exists and is accessible
    const promptCheck = await pool.query(`
      SELECT id, visibility, author_id, is_system
      FROM prompts
      WHERE id = $1
    `, [id]);

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const prompt = promptCheck.rows[0];

    // Check visibility
    const canAccess =
      prompt.visibility === 'public' ||
      prompt.is_system;

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Can only rate public prompts' },
        { status: 400 }
      );
    }

    // Can't rate own prompts
    if (prompt.author_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot rate your own prompt' },
        { status: 400 }
      );
    }

    // Upsert rating
    await pool.query(`
      INSERT INTO prompt_ratings (user_id, prompt_id, rating, review)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, prompt_id)
      DO UPDATE SET rating = $3, review = $4, updated_at = NOW()
    `, [session.user.id, id, Math.round(rating), review || null]);

    // Get updated stats
    const statsResult = await pool.query(
      'SELECT avg_rating, rating_count FROM prompts WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      rating: Math.round(rating),
      avgRating: parseFloat(statsResult.rows[0]?.avg_rating) || 0,
      ratingCount: statsResult.rows[0]?.rating_count || 0,
    });
  } catch (error) {
    console.error('Error rating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to rate prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/[id]/rate
 * Remove rating
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    await pool.query(`
      DELETE FROM prompt_ratings
      WHERE user_id = $1 AND prompt_id = $2
    `, [session.user.id, id]);

    // Get updated stats
    const statsResult = await pool.query(
      'SELECT avg_rating, rating_count FROM prompts WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      avgRating: parseFloat(statsResult.rows[0]?.avg_rating) || 0,
      ratingCount: statsResult.rows[0]?.rating_count || 0,
    });
  } catch (error) {
    console.error('Error removing rating:', error);
    return NextResponse.json(
      { error: 'Failed to remove rating' },
      { status: 500 }
    );
  }
}
