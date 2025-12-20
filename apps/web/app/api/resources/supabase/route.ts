/**
 * Supabase Resources API
 *
 * Serves resources directly from the Supabase resources table.
 * This includes all discovered resources from the discovery pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ResourceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory: string | null;
  status: string;
  is_featured: boolean;
  github_owner: string | null;
  github_repo: string | null;
  github_stars: number | null;
  github_forks: number | null;
  github_language: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    let query = `
      SELECT id, slug, title, description, url, category, subcategory, status,
             is_featured, github_owner, github_repo, github_stars, github_forks,
             github_language, created_at
      FROM resources
      WHERE is_published = true
    `;
    const params: (string | number | boolean)[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      query += ` AND is_featured = true`;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY github_stars DESC NULLS LAST, created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM resources WHERE is_published = true`;
    const countParams: string[] = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (featured === 'true') {
      countQuery += ` AND is_featured = true`;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Transform to API format
    const resources = (rows as ResourceRow[]).map(r => ({
      id: r.slug || r.id,
      title: r.title,
      description: r.description,
      url: r.url,
      category: r.category,
      subcategory: r.subcategory,
      status: r.status,
      featured: r.is_featured,
      github: r.github_owner && r.github_repo ? {
        owner: r.github_owner,
        repo: r.github_repo,
        stars: r.github_stars || 0,
        forks: r.github_forks || 0,
        language: r.github_language || '',
      } : undefined,
      addedDate: r.created_at,
    }));

    // Get category counts
    const categoryCountsResult = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM resources
      WHERE is_published = true
      GROUP BY category
      ORDER BY count DESC
    `);

    const categories = categoryCountsResult.rows.reduce((acc, row) => {
      acc[row.category] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      resources,
      total,
      limit,
      offset,
      categories,
    });
  } catch (error) {
    console.error('Error fetching resources from Supabase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
