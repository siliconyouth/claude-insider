/**
 * Prompt Categories API
 *
 * GET: List all prompt categories
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/prompts/categories
 * List all active prompt categories with counts
 */
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.slug,
        c.name,
        c.description,
        c.icon,
        c.display_order,
        COUNT(p.id)::int as prompt_count
      FROM prompt_categories c
      LEFT JOIN prompts p ON p.category_id = c.id
        AND p.status = 'active'
        AND (p.visibility = 'public' OR p.is_system = TRUE)
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.display_order
    `);

    return NextResponse.json({
      categories: result.rows.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        displayOrder: c.display_order,
        promptCount: c.prompt_count,
      })),
    });
  } catch (error) {
    console.error('Error fetching prompt categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
