/**
 * Single Resource API Endpoint
 *
 * GET /api/resources/[slug] - Get a single resource by slug with all details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getResourceBySlug, type ResourceWithDetails } from '@/lib/resources/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ResourceWithDetails | { error: string }>> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const resource = await getResourceBySlug(slug);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Add cache headers for CDN caching
    return NextResponse.json(resource, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
