import { NextRequest, NextResponse } from 'next/server';
import { getAllResources } from '@/data/resources';
import { getAllDocsMeta } from '@/lib/mdx';
import {
  getAutoMatchedResources,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORY_MAPPINGS,
} from '@/lib/cross-linking';

/**
 * Cross-Links API
 *
 * GET /api/cross-links?doc=getting-started/installation
 * GET /api/cross-links?resource=anthropic-docs
 * GET /api/cross-links?compute=true (recompute all matches)
 */

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docSlug = searchParams.get('doc');
    const resourceId = searchParams.get('resource');
    const computeAll = searchParams.get('compute') === 'true';

    // Get all resources for matching
    const allResources = getAllResources();

    // Compute all matches
    if (computeAll) {
      const allDocs = await getAllDocsMeta();

      const results = allDocs.map((doc) => {
        // Create a mock document structure for matching
        const slugStr = Array.isArray(doc.slug) ? doc.slug.join('/') : doc.slug;
        const mockDoc = {
          title: doc.title || '',
          docCategory: slugStr.split('/')[0] || 'general',
          tags: [] as string[], // Would be populated from frontmatter
          excludedResources: null,
          relatedResources: null,
        };

        const matches = getAutoMatchedResources(
          mockDoc,
          allResources.map((r, i) => ({
            id: i,
            title: r.title,
            tags: r.tags || [],
            category: r.category,
          })),
          {
            ...DEFAULT_SETTINGS,
            categoryMappings: DEFAULT_CATEGORY_MAPPINGS,
          }
        );

        return {
          docSlug: doc.slug,
          docTitle: doc.title,
          docCategory: mockDoc.docCategory,
          matches: matches.map((m) => ({
            resourceId: allResources[m.resourceId]?.id,
            resourceTitle: allResources[m.resourceId]?.title,
            score: Math.round(m.score * 100) / 100,
            matchedTags: m.matchedTags,
          })),
        };
      });

      return NextResponse.json({
        success: true,
        totalDocs: allDocs.length,
        results,
      });
    }

    // Get cross-links for a specific document
    if (docSlug) {
      const allDocs = await getAllDocsMeta();
      const doc = allDocs.find((d) => {
        const slug = Array.isArray(d.slug) ? d.slug.join('/') : d.slug;
        return slug === docSlug;
      });

      if (!doc) {
        return NextResponse.json(
          { error: 'Document not found', slug: docSlug },
          { status: 404 }
        );
      }

      // Create mock document for matching
      const mockDoc = {
        title: doc.title || '',
        docCategory: docSlug.split('/')[0] || 'general',
        tags: [] as string[],
        excludedResources: null,
        relatedResources: null,
      };

      const matches = getAutoMatchedResources(
        mockDoc,
        allResources.map((r, i) => ({
          id: i,
          title: r.title,
          tags: r.tags || [],
          category: r.category,
        })),
        {
          ...DEFAULT_SETTINGS,
          categoryMappings: DEFAULT_CATEGORY_MAPPINGS,
        }
      );

      // Get full resource data for matches
      const relatedResources = matches.map((m) => allResources[m.resourceId]).filter(Boolean);

      return NextResponse.json({
        docSlug,
        docTitle: doc.title,
        docCategory: mockDoc.docCategory,
        displayMode: 'both',
        relatedResources,
        autoMatchedCount: matches.length,
        scores: matches.map((m) => ({
          resourceId: allResources[m.resourceId]?.id,
          score: Math.round(m.score * 100) / 100,
          matchedTags: m.matchedTags,
        })),
      });
    }

    // Get cross-links for a specific resource
    if (resourceId) {
      const resource = allResources.find((r) => r.id === resourceId);

      if (!resource) {
        return NextResponse.json(
          { error: 'Resource not found', id: resourceId },
          { status: 404 }
        );
      }

      // Find documents that might relate to this resource
      const allDocs = await getAllDocsMeta();
      // Reserved for future tag-based matching enhancement
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _resourceTags = new Set(resource.tags?.map((t) => t.toLowerCase()) || []);
      const categoryMapping = Object.entries(DEFAULT_CATEGORY_MAPPINGS).filter(
        ([, categories]) => categories.includes(resource.category)
      );
      const relatedDocCategories = categoryMapping.map(([docCat]) => docCat);

      // Score documents against this resource
      const relatedDocs = allDocs
        .map((doc) => {
          const slugStr = Array.isArray(doc.slug) ? doc.slug.join('/') : doc.slug;
          const docCategory = slugStr.split('/')[0] || 'general';
          const categoryMatch = relatedDocCategories.includes(docCategory) ? 0.3 : 0;
          const titleWords = new Set(
            doc.title
              ?.toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 2) || []
          );
          const resourceTitleWords = new Set(
            resource.title
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 2)
          );
          const titleOverlap =
            [...titleWords].filter((w) => resourceTitleWords.has(w)).length /
            Math.max(titleWords.size, resourceTitleWords.size, 1);

          const score = categoryMatch + titleOverlap * 0.5;

          return {
            slug: doc.slug,
            title: doc.title,
            docCategory,
            score,
          };
        })
        .filter((d) => d.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return NextResponse.json({
        resourceId,
        resourceTitle: resource.title,
        resourceCategory: resource.category,
        relatedDocs,
        relatedSections: [], // Would be populated from CMS
      });
    }

    // No parameters provided - return API info
    return NextResponse.json({
      message: 'Cross-Links API',
      endpoints: {
        'GET /api/cross-links?doc=<slug>': 'Get related resources for a document',
        'GET /api/cross-links?resource=<id>': 'Get related documents for a resource',
        'GET /api/cross-links?compute=true': 'Compute all auto-matches',
      },
      stats: {
        totalResources: allResources.length,
        totalDocs: (await getAllDocsMeta()).length,
      },
    });
  } catch (error) {
    console.error('[cross-links] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
