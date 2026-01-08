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

    // Get alternatives with their details from AI-analyzed relationships table
    // Uses resource_relationships (1,800+ AI-analyzed relationships from migration 087)
    // instead of resource_alternatives (legacy, empty)
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
        rr.relationship_type as relationship
      FROM resource_relationships rr
      JOIN resources r ON r.id = rr.target_resource_id
      WHERE rr.source_resource_id = $1
        AND rr.is_active = TRUE
        AND r.is_published = TRUE
      ORDER BY
        CASE rr.relationship_type
          WHEN 'alternative' THEN 1
          WHEN 'similar' THEN 2
          WHEN 'complement' THEN 3
          WHEN 'successor' THEN 4
          WHEN 'uses' THEN 5
          WHEN 'integrates' THEN 6
          ELSE 7
        END,
        rr.confidence_score DESC,
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
