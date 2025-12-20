/**
 * Resource Alternatives API Endpoint
 *
 * GET /api/resources/[slug]/alternatives - Get alternatives for a resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface AlternativeResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon_url: string | null;
  github_stars: number;
  average_rating: number;
  favorites_count: number;
  relationship: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<AlternativeResource[] | { error: string }>> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Get the resource ID from slug
    const resourceResult = await pool.query<{ id: string }>(
      'SELECT id FROM resources WHERE slug = $1 AND is_published = TRUE',
      [slug]
    );

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    const resourceId = resourceResult.rows[0]!.id;

    // Get alternatives with their details
    const alternativesResult = await pool.query<AlternativeResource>(
      `SELECT
        r.id,
        r.slug,
        r.title,
        r.description,
        r.category,
        r.icon_url,
        r.github_stars,
        r.average_rating,
        r.favorites_count,
        ra.relationship
      FROM resource_alternatives ra
      JOIN resources r ON r.id = ra.alternative_resource_id
      WHERE ra.resource_id = $1 AND r.is_published = TRUE
      ORDER BY
        CASE ra.relationship
          WHEN 'alternative' THEN 1
          WHEN 'similar' THEN 2
          WHEN 'complement' THEN 3
          WHEN 'successor' THEN 4
          ELSE 5
        END,
        r.github_stars DESC
      LIMIT 12`,
      [resourceId]
    );

    // Add cache headers for CDN caching
    return NextResponse.json(alternativesResult.rows, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching alternatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
