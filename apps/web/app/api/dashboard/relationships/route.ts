/**
 * Dashboard Relationships API
 *
 * Lists and manages all relationships between documentation and resources.
 * Supports filtering, pagination, and bulk operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface DocResourceRelRow {
  id: string;
  doc_slug: string;
  doc_title: string;
  doc_category: string;
  resource_id: string;
  resource_slug: string;
  resource_title: string;
  resource_category: string;
  relationship_type: string;
  confidence_score: string;
  ai_reasoning: string | null;
  is_manual: boolean;
  display_priority: number;
  created_at: string;
  updated_at: string;
}

interface ResourceResourceRelRow {
  id: string;
  source_resource_id: string;
  source_slug: string;
  source_title: string;
  source_category: string;
  target_resource_id: string;
  target_slug: string;
  target_title: string;
  target_category: string;
  relationship_type: string;
  confidence_score: string;
  ai_reasoning: string | null;
  is_manual: boolean;
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
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '30', 10));
    const offset = (page - 1) * limit;
    const type = searchParams.get('type') || 'doc_resource'; // 'doc_resource' | 'resource_resource'
    const relationshipType = searchParams.get('relationshipType');
    const isManual = searchParams.get('isManual');
    const minConfidence = searchParams.get('minConfidence');
    const search = searchParams.get('search');

    if (type === 'doc_resource') {
      // Doc-to-Resource relationships
      let query = `
        SELECT
          rel.id,
          rel.doc_slug,
          d.title as doc_title,
          d.category as doc_category,
          rel.resource_id,
          r.slug as resource_slug,
          r.title as resource_title,
          r.category as resource_category,
          rel.relationship_type,
          rel.confidence_score,
          rel.ai_reasoning,
          rel.is_manual,
          rel.display_priority,
          rel.created_at,
          rel.updated_at
        FROM doc_resource_relationships rel
        JOIN documentation d ON d.slug = rel.doc_slug
        JOIN resources r ON r.id = rel.resource_id
        WHERE rel.is_active = TRUE
      `;
      const params: (string | number)[] = [];
      let paramIndex = 1;

      // Relationship type filter
      if (relationshipType) {
        query += ` AND rel.relationship_type = $${paramIndex}`;
        params.push(relationshipType);
        paramIndex++;
      }

      // Manual filter
      if (isManual === 'true') {
        query += ` AND rel.is_manual = TRUE`;
      } else if (isManual === 'false') {
        query += ` AND rel.is_manual = FALSE`;
      }

      // Confidence filter
      if (minConfidence) {
        query += ` AND rel.confidence_score >= $${paramIndex}`;
        params.push(parseFloat(minConfidence));
        paramIndex++;
      }

      // Search filter
      if (search) {
        query += ` AND (d.title ILIKE $${paramIndex} OR r.title ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Count query
      const countQuery = query.replace(
        /SELECT[\s\S]*?FROM doc_resource_relationships/,
        'SELECT COUNT(*) as count FROM doc_resource_relationships'
      );
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      // Add ordering and pagination
      query += ` ORDER BY rel.confidence_score DESC, rel.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);

      // Get stats
      const statsResult = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_manual = TRUE) as manual,
          COUNT(*) FILTER (WHERE is_manual = FALSE) as ai_generated,
          ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence,
          COUNT(DISTINCT doc_slug) as unique_docs,
          COUNT(DISTINCT resource_id) as unique_resources
        FROM doc_resource_relationships
        WHERE is_active = TRUE
      `);

      // Get relationship type counts
      const typeCountsResult = await pool.query(`
        SELECT relationship_type, COUNT(*) as count
        FROM doc_resource_relationships
        WHERE is_active = TRUE
        GROUP BY relationship_type
        ORDER BY count DESC
      `);

      const relationships = (rows as DocResourceRelRow[]).map(rel => ({
        id: rel.id,
        docSlug: rel.doc_slug,
        docTitle: rel.doc_title,
        docCategory: rel.doc_category,
        resourceId: rel.resource_id,
        resourceSlug: rel.resource_slug,
        resourceTitle: rel.resource_title,
        resourceCategory: rel.resource_category,
        relationshipType: rel.relationship_type,
        confidenceScore: parseFloat(rel.confidence_score),
        aiReasoning: rel.ai_reasoning,
        isManual: rel.is_manual,
        displayPriority: rel.display_priority,
        createdAt: rel.created_at,
        updatedAt: rel.updated_at,
      }));

      const stats = statsResult.rows[0];

      return NextResponse.json({
        type: 'doc_resource',
        relationships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: parseInt(stats.total, 10),
          manual: parseInt(stats.manual, 10),
          aiGenerated: parseInt(stats.ai_generated, 10),
          avgConfidence: parseFloat(stats.avg_confidence || '0'),
          uniqueDocs: parseInt(stats.unique_docs, 10),
          uniqueResources: parseInt(stats.unique_resources, 10),
        },
        typeCounts: typeCountsResult.rows.reduce((acc, row) => {
          acc[row.relationship_type] = parseInt(row.count, 10);
          return acc;
        }, {} as Record<string, number>),
      });
    } else {
      // Resource-to-Resource relationships
      let query = `
        SELECT
          rel.id,
          rel.source_resource_id,
          src.slug as source_slug,
          src.title as source_title,
          src.category as source_category,
          rel.target_resource_id,
          tgt.slug as target_slug,
          tgt.title as target_title,
          tgt.category as target_category,
          rel.relationship_type,
          rel.confidence_score,
          rel.ai_reasoning,
          rel.is_manual,
          rel.created_at,
          rel.updated_at
        FROM resource_resource_relationships rel
        JOIN resources src ON src.id = rel.source_resource_id
        JOIN resources tgt ON tgt.id = rel.target_resource_id
        WHERE rel.is_active = TRUE
      `;
      const params: (string | number)[] = [];
      let paramIndex = 1;

      // Relationship type filter
      if (relationshipType) {
        query += ` AND rel.relationship_type = $${paramIndex}`;
        params.push(relationshipType);
        paramIndex++;
      }

      // Manual filter
      if (isManual === 'true') {
        query += ` AND rel.is_manual = TRUE`;
      } else if (isManual === 'false') {
        query += ` AND rel.is_manual = FALSE`;
      }

      // Confidence filter
      if (minConfidence) {
        query += ` AND rel.confidence_score >= $${paramIndex}`;
        params.push(parseFloat(minConfidence));
        paramIndex++;
      }

      // Search filter
      if (search) {
        query += ` AND (src.title ILIKE $${paramIndex} OR tgt.title ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Count query
      const countQuery = query.replace(
        /SELECT[\s\S]*?FROM resource_resource_relationships/,
        'SELECT COUNT(*) as count FROM resource_resource_relationships'
      );
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      // Add ordering and pagination
      query += ` ORDER BY rel.confidence_score DESC, rel.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);

      // Get stats
      const statsResult = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_manual = TRUE) as manual,
          COUNT(*) FILTER (WHERE is_manual = FALSE) as ai_generated,
          ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence
        FROM resource_resource_relationships
        WHERE is_active = TRUE
      `);

      // Get relationship type counts
      const typeCountsResult = await pool.query(`
        SELECT relationship_type, COUNT(*) as count
        FROM resource_resource_relationships
        WHERE is_active = TRUE
        GROUP BY relationship_type
        ORDER BY count DESC
      `);

      const relationships = (rows as ResourceResourceRelRow[]).map(rel => ({
        id: rel.id,
        sourceResourceId: rel.source_resource_id,
        sourceSlug: rel.source_slug,
        sourceTitle: rel.source_title,
        sourceCategory: rel.source_category,
        targetResourceId: rel.target_resource_id,
        targetSlug: rel.target_slug,
        targetTitle: rel.target_title,
        targetCategory: rel.target_category,
        relationshipType: rel.relationship_type,
        confidenceScore: parseFloat(rel.confidence_score),
        aiReasoning: rel.ai_reasoning,
        isManual: rel.is_manual,
        createdAt: rel.created_at,
        updatedAt: rel.updated_at,
      }));

      const stats = statsResult.rows[0];

      return NextResponse.json({
        type: 'resource_resource',
        relationships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: parseInt(stats.total, 10),
          manual: parseInt(stats.manual, 10),
          aiGenerated: parseInt(stats.ai_generated, 10),
          avgConfidence: parseFloat(stats.avg_confidence || '0'),
        },
        typeCounts: typeCountsResult.rows.reduce((acc, row) => {
          acc[row.relationship_type] = parseInt(row.count, 10);
          return acc;
        }, {} as Record<string, number>),
      });
    }
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

  if (!hasMinRole(userRole, ROLES.ADMIN)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, docSlug, resourceId, sourceResourceId, targetResourceId, relationshipType, displayPriority } = body;

    if (type === 'doc_resource') {
      // Validate entities exist
      const docCheck = await pool.query('SELECT slug FROM documentation WHERE slug = $1', [docSlug]);
      if (docCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
      }

      const resourceCheck = await pool.query('SELECT id FROM resources WHERE id = $1', [resourceId]);
      if (resourceCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      // Insert relationship
      await pool.query(`
        INSERT INTO doc_resource_relationships (
          doc_slug, resource_id, relationship_type, confidence_score,
          is_manual, display_priority
        ) VALUES ($1, $2, $3, 1.0, TRUE, $4)
        ON CONFLICT (doc_slug, resource_id)
        DO UPDATE SET
          relationship_type = EXCLUDED.relationship_type,
          display_priority = EXCLUDED.display_priority,
          is_manual = TRUE,
          is_active = TRUE,
          updated_at = NOW()
      `, [docSlug, resourceId, relationshipType || 'related', displayPriority || 0]);

      return NextResponse.json({ success: true, message: 'Doc-Resource relationship created' });
    } else if (type === 'resource_resource') {
      // Validate entities exist
      const sourceCheck = await pool.query('SELECT id FROM resources WHERE id = $1', [sourceResourceId]);
      if (sourceCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Source resource not found' }, { status: 404 });
      }

      const targetCheck = await pool.query('SELECT id FROM resources WHERE id = $1', [targetResourceId]);
      if (targetCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Target resource not found' }, { status: 404 });
      }

      if (sourceResourceId === targetResourceId) {
        return NextResponse.json({ error: 'Cannot relate resource to itself' }, { status: 400 });
      }

      // Insert relationship
      await pool.query(`
        INSERT INTO resource_resource_relationships (
          source_resource_id, target_resource_id, relationship_type,
          confidence_score, is_manual
        ) VALUES ($1, $2, $3, 1.0, TRUE)
        ON CONFLICT (source_resource_id, target_resource_id)
        DO UPDATE SET
          relationship_type = EXCLUDED.relationship_type,
          is_manual = TRUE,
          is_active = TRUE,
          updated_at = NOW()
      `, [sourceResourceId, targetResourceId, relationshipType || 'related']);

      return NextResponse.json({ success: true, message: 'Resource-Resource relationship created' });
    } else {
      return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating relationship:', error);
    return NextResponse.json(
      { error: 'Failed to create relationship' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

  if (!hasMinRole(userRole, ROLES.ADMIN)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, id } = body;

    if (type === 'doc_resource') {
      await pool.query(`
        UPDATE doc_resource_relationships
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
      `, [id]);
    } else if (type === 'resource_resource') {
      await pool.query(`
        UPDATE resource_resource_relationships
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
      `, [id]);
    } else {
      return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Relationship removed' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    return NextResponse.json(
      { error: 'Failed to delete relationship' },
      { status: 500 }
    );
  }
}
