import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-Demand Revalidation API Route
 *
 * Called by Payload CMS afterChange hooks to invalidate cached pages.
 * This enables instant updates without full rebuilds.
 *
 * Security: Protected by REVALIDATION_SECRET token
 *
 * Usage:
 * POST /api/revalidate
 * Body: { collection: 'resources', operation: 'update', id?: number }
 */

// Mapping of collections to paths that need revalidation
const COLLECTION_PATHS: Record<string, string[]> = {
  resources: [
    '/',                    // Homepage (featured resources)
    '/resources',           // Resources index
  ],
  categories: [
    '/',                    // Homepage (category cards)
    '/resources',           // Resources index
    '/docs',                // Docs index (uses categories)
  ],
  subcategories: [
    '/resources',           // Resources filtering by subcategory
  ],
  tags: [
    '/resources',           // Resources filtering
  ],
  'difficulty-levels': [
    '/resources',           // Resources filtering by difficulty
  ],
  'programming-languages': [
    '/resources',           // Resources display language badges
  ],
  'site-settings': [
    '/',                    // Homepage (site name, tagline)
    '/docs',                // All docs pages use site settings
  ],
};

// Cache tags for fine-grained invalidation
const COLLECTION_TAGS: Record<string, string[]> = {
  resources: ['resources', 'featured-resources'],
  categories: ['categories'],
  subcategories: ['subcategories', 'categories'], // Subcategories affect category displays
  tags: ['tags'],
  'difficulty-levels': ['difficulty-levels', 'resources'],
  'programming-languages': ['programming-languages', 'resources'],
  'site-settings': ['site-settings', 'layout'],
};

export async function POST(request: Request) {
  try {
    // Verify secret token
    const secret = request.headers.get('x-revalidation-secret');
    const expectedSecret = process.env.REVALIDATION_SECRET;

    if (!expectedSecret) {
      console.warn('REVALIDATION_SECRET not set - revalidation disabled');
      return NextResponse.json(
        { error: 'Revalidation not configured' },
        { status: 503 }
      );
    }

    if (secret !== expectedSecret) {
      console.warn('Invalid revalidation secret attempted');
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { collection, operation, id, slug } = body;

    console.log(`[Revalidate] ${operation} on ${collection}${id ? ` (id: ${id})` : ''}`);

    const revalidated: string[] = [];

    // Revalidate paths for this collection
    const paths = COLLECTION_PATHS[collection] || [];
    for (const path of paths) {
      revalidatePath(path);
      revalidated.push(`path:${path}`);
    }

    // Revalidate specific resource page if slug provided
    if (collection === 'resources' && slug) {
      // Individual resource pages are at /resources/r/[slug]
      const resourcePath = `/resources/r/${slug}`;
      revalidatePath(resourcePath);
      revalidated.push(`path:${resourcePath}`);
    }

    // Revalidate specific category page if slug provided
    if (collection === 'categories' && slug) {
      const categoryPath = `/resources/${slug}`;
      revalidatePath(categoryPath);
      revalidated.push(`path:${categoryPath}`);
    }

    // Revalidate cache tags
    // Using 'max' as second argument (Next.js 16+ deprecation fix)
    const tags = COLLECTION_TAGS[collection] || [];
    for (const tag of tags) {
      revalidateTag(tag, 'max');
      revalidated.push(`tag:${tag}`);
    }

    return NextResponse.json({
      success: true,
      message: `Revalidated ${revalidated.length} items`,
      revalidated,
      collection,
      operation,
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Revalidation failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Revalidation endpoint ready',
    configured: !!process.env.REVALIDATION_SECRET,
  });
}
