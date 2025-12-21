/**
 * Prompt Save/Unsave API
 *
 * POST: Toggle save status for a prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/prompts/[id]/save
 * Toggle save status for a prompt
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { notes } = body;

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
      prompt.visibility === 'unlisted' ||
      prompt.is_system ||
      prompt.author_id === session.user.id;

    if (!canAccess) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check if already saved
    const existingSave = await pool.query(`
      SELECT id FROM user_prompt_saves
      WHERE user_id = $1 AND prompt_id = $2
    `, [session.user.id, id]);

    let isSaved: boolean;
    let saveId: string | null = null;

    if (existingSave.rows.length > 0) {
      // Unsave
      await pool.query(`
        DELETE FROM user_prompt_saves
        WHERE user_id = $1 AND prompt_id = $2
      `, [session.user.id, id]);
      isSaved = false;
    } else {
      // Save
      const result = await pool.query(`
        INSERT INTO user_prompt_saves (user_id, prompt_id, notes)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [session.user.id, id, notes || null]);
      isSaved = true;
      saveId = result.rows[0].id;
    }

    // Get updated save count
    const countResult = await pool.query(
      'SELECT save_count FROM prompts WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      isSaved,
      saveId,
      saveCount: countResult.rows[0]?.save_count || 0,
    });
  } catch (error) {
    console.error('Error toggling save:', error);
    return NextResponse.json(
      { error: 'Failed to toggle save' },
      { status: 500 }
    );
  }
}
