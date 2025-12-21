/**
 * Dashboard Resources Admin API
 *
 * Lists resources with AI enhancement and relationship stats for admin dashboard.
 * Supports filtering, pagination, and search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface ResourceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  is_published: boolean;
  is_featured: boolean;
  github_stars: number | null;
  github_language: string | null;
  npm_downloads_weekly: number | null;
  pypi_downloads_monthly: number | null;
  views_count: number;
  favorites_count: number;
  average_rating: string | null;
  ai_summary: string | null;
  ai_analyzed_at: string | null;
  key_features: string[] | null;
  related_docs_count: number;
  related_resources_count: number;
  doc_relationship_count: string;
  resource_relationship_count: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  // Authentication & authorization
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roleResult = await pool.query(
    `SELECT role FROM "user" WHERE id = $1`,
    [session.user.id]
  );
  const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';

  if (!hasMinRole(userRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // 'published', 'unpublished', 'all'
    const enhancement = searchParams.get('enhancement'); // 'enhanced', 'pending', 'all'
    const hasRelationships = searchParams.get('hasRelationships'); // 'true', 'false', 'all'
    const sortBy = searchParams.get('sortBy') || 'updated_at'; // 'stars', 'views', 'updated_at', 'title'
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query with relationship counts
    let query = `
      SELECT
        r.id,
        r.slug,
        r.title,
        r.description,
        r.category,
        r.status,
        r.is_published,
        r.is_featured,
        r.github_stars,
        r.github_language,
        r.npm_downloads_weekly,
        r.pypi_downloads_monthly,
        r.views_count,
        r.favorites_count,
        r.average_rating,
        r.ai_summary,
        r.ai_analyzed_at,
        r.key_features,
        r.related_docs_count,
        r.related_resources_count,
        COALESCE(doc_rel.doc_count, 0) as doc_relationship_count,
        COALESCE(res_rel.res_count, 0) as resource_relationship_count,
        r.created_at,
        r.updated_at
      FROM resources r
      LEFT JOIN (
        SELECT resource_id, COUNT(*) as doc_count
        FROM doc_resource_relationships
        WHERE is_active = TRUE
        GROUP BY resource_id
      ) doc_rel ON doc_rel.resource_id = r.id
      LEFT JOIN (
        SELECT source_resource_id, COUNT(*) as res_count
        FROM resource_resource_relationships
        WHERE is_active = TRUE
        GROUP BY source_resource_id
      ) res_rel ON res_rel.source_resource_id = r.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Category filter
    if (category) {
      query += ` AND r.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Publication status filter
    if (status === 'published') {
      query += ` AND r.is_published = TRUE`;
    } else if (status === 'unpublished') {
      query += ` AND r.is_published = FALSE`;
    }

    // Enhancement status filter
    if (enhancement === 'enhanced') {
      query += ` AND r.ai_analyzed_at IS NOT NULL`;
    } else if (enhancement === 'pending') {
      query += ` AND r.ai_analyzed_at IS NULL`;
    }

    // Search filter
    if (search) {
      query += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex} OR r.slug ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Has relationships filter
    if (hasRelationships === 'true') {
      query += ` AND (
        EXISTS (SELECT 1 FROM doc_resource_relationships dr WHERE dr.resource_id = r.id AND dr.is_active = TRUE)
        OR EXISTS (SELECT 1 FROM resource_resource_relationships rr WHERE rr.source_resource_id = r.id AND rr.is_active = TRUE)
      )`;
    } else if (hasRelationships === 'false') {
      query += ` AND NOT EXISTS (SELECT 1 FROM doc_resource_relationships dr WHERE dr.resource_id = r.id AND dr.is_active = TRUE)
        AND NOT EXISTS (SELECT 1 FROM resource_resource_relationships rr WHERE rr.source_resource_id = r.id AND rr.is_active = TRUE)`;
    }

    // Count query (without pagination)
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM resources/,
      'SELECT COUNT(*) as count FROM resources'
    ).replace(/LEFT JOIN[\s\S]*?res_rel\.source_resource_id = r\.id/, '');

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Add ordering
    const validSortColumns: Record<string, string> = {
      stars: 'r.github_stars',
      views: 'r.views_count',
      updated_at: 'r.updated_at',
      title: 'r.title',
      rating: 'r.average_rating',
    };
    const sortColumn = validSortColumns[sortBy] || 'r.updated_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${order} NULLS LAST`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get category stats
    const categoryStats = await pool.query(`
      SELECT
        category,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_published = TRUE) as published,
        COUNT(*) FILTER (WHERE is_featured = TRUE) as featured,
        COUNT(*) FILTER (WHERE ai_analyzed_at IS NOT NULL) as enhanced
      FROM resources
      GROUP BY category
      ORDER BY total DESC
    `);

    // Get overall enhancement stats
    const enhancementStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ai_analyzed_at IS NOT NULL) as enhanced,
        COUNT(*) FILTER (WHERE ai_summary IS NOT NULL) as with_summary,
        COUNT(*) FILTER (WHERE array_length(key_features, 1) > 0) as with_features,
        COUNT(*) FILTER (WHERE related_docs_count > 0 OR related_resources_count > 0) as with_relationships
      FROM resources
    `);

    // Transform response
    const resources = (rows as ResourceRow[]).map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      isPublished: r.is_published,
      isFeatured: r.is_featured,
      githubStars: r.github_stars,
      githubLanguage: r.github_language,
      npmDownloads: r.npm_downloads_weekly,
      pypiDownloads: r.pypi_downloads_monthly,
      viewsCount: r.views_count,
      favoritesCount: r.favorites_count,
      averageRating: r.average_rating ? parseFloat(r.average_rating) : null,
      aiSummary: r.ai_summary,
      aiAnalyzedAt: r.ai_analyzed_at,
      keyFeatures: r.key_features || [],
      relatedDocsCount: r.related_docs_count,
      relatedResourcesCount: r.related_resources_count,
      docRelationshipCount: parseInt(r.doc_relationship_count, 10),
      resourceRelationshipCount: parseInt(r.resource_relationship_count, 10),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const stats = enhancementStats.rows[0];

    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      categories: categoryStats.rows.reduce((acc, row) => {
        acc[row.category] = {
          total: parseInt(row.total, 10),
          published: parseInt(row.published, 10),
          featured: parseInt(row.featured, 10),
          enhanced: parseInt(row.enhanced, 10),
        };
        return acc;
      }, {} as Record<string, { total: number; published: number; featured: number; enhanced: number }>),
      stats: {
        total: parseInt(stats.total, 10),
        enhanced: parseInt(stats.enhanced, 10),
        withSummary: parseInt(stats.with_summary, 10),
        withFeatures: parseInt(stats.with_features, 10),
        withRelationships: parseInt(stats.with_relationships, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
