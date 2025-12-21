/**
 * Dashboard Documentation API
 *
 * Lists documentation pages with relationship stats for admin dashboard.
 * Supports filtering, pagination, and search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface DocumentationRow {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  is_published: boolean;
  is_featured: boolean;
  word_count: number;
  reading_time_minutes: number;
  version: number;
  created_at: string;
  updated_at: string;
  relationship_count: string;
  scrape_status: string | null;
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
    const hasRelationships = searchParams.get('hasRelationships');
    const status = searchParams.get('status'); // 'published', 'unpublished', 'all'

    // Build query with relationship counts
    let query = `
      SELECT
        d.slug,
        d.title,
        d.description,
        d.category,
        d.is_published,
        d.is_featured,
        d.word_count,
        d.reading_time_minutes,
        d.version,
        d.scrape_status,
        d.created_at,
        d.updated_at,
        COALESCE(rel.relationship_count, 0) as relationship_count
      FROM documentation d
      LEFT JOIN (
        SELECT doc_slug, COUNT(*) as relationship_count
        FROM doc_resource_relationships
        WHERE is_active = TRUE
        GROUP BY doc_slug
      ) rel ON rel.doc_slug = d.slug
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Category filter
    if (category) {
      query += ` AND d.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Publication status filter
    if (status === 'published') {
      query += ` AND d.is_published = TRUE`;
    } else if (status === 'unpublished') {
      query += ` AND d.is_published = FALSE`;
    }
    // 'all' or no status shows everything

    // Search filter
    if (search) {
      query += ` AND (d.title ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex} OR d.slug ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Has relationships filter
    if (hasRelationships === 'true') {
      query += ` AND EXISTS (SELECT 1 FROM doc_resource_relationships r WHERE r.doc_slug = d.slug AND r.is_active = TRUE)`;
    } else if (hasRelationships === 'false') {
      query += ` AND NOT EXISTS (SELECT 1 FROM doc_resource_relationships r WHERE r.doc_slug = d.slug AND r.is_active = TRUE)`;
    }

    // Count query (without pagination)
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM documentation/,
      'SELECT COUNT(*) as count FROM documentation'
    ).replace(/LEFT JOIN[\s\S]*?rel\.doc_slug = d\.slug/, '');

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Add ordering and pagination
    query += ` ORDER BY d.category, d.title`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get category stats
    const categoryStats = await pool.query(`
      SELECT
        category,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_published = TRUE) as published,
        COUNT(*) FILTER (WHERE is_featured = TRUE) as featured
      FROM documentation
      GROUP BY category
      ORDER BY total DESC
    `);

    // Get overall relationship stats
    const relStats = await pool.query(`SELECT * FROM get_relationship_stats()`);

    // Transform response
    const documentation = (rows as DocumentationRow[]).map(doc => ({
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      isPublished: doc.is_published,
      isFeatured: doc.is_featured,
      wordCount: doc.word_count,
      readingTimeMinutes: doc.reading_time_minutes,
      version: doc.version,
      scrapeStatus: doc.scrape_status,
      relationshipCount: parseInt(doc.relationship_count, 10),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }));

    return NextResponse.json({
      documentation,
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
        };
        return acc;
      }, {} as Record<string, { total: number; published: number; featured: number }>),
      stats: relStats.rows[0] ? {
        totalDocResourceRelationships: parseInt(relStats.rows[0].total_doc_resource_relationships, 10),
        docsWithRelationships: parseInt(relStats.rows[0].docs_with_relationships, 10),
        avgConfidence: parseFloat(relStats.rows[0].avg_doc_resource_confidence || '0'),
      } : null,
    });
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
      { status: 500 }
    );
  }
}
