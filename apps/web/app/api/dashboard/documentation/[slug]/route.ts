/**
 * Dashboard Documentation Detail API
 *
 * GET: Get full documentation with relationships
 * PATCH: Update manual relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

interface RelationshipRow {
  id: string;
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
}

interface HistoryRow {
  id: string;
  version: number;
  title: string;
  change_type: string;
  change_summary: string | null;
  changed_by: string | null;
  ai_model: string | null;
  created_at: string;
}

export async function GET(request: NextRequest, context: RouteContext) {
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
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);

    // Get documentation
    const docResult = await pool.query(`
      SELECT
        slug,
        title,
        description,
        content,
        category,
        subcategory,
        sources,
        source_urls,
        generated_date,
        ai_model,
        ai_summary,
        word_count,
        reading_time_minutes,
        heading_count,
        code_block_count,
        content_hash,
        last_scraped_at,
        scrape_status,
        version,
        is_published,
        is_featured,
        prev_slug,
        next_slug,
        parent_slug,
        created_at,
        updated_at
      FROM documentation
      WHERE slug = $1
    `, [decodedSlug]);

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    const doc = docResult.rows[0];

    // Get relationships with full resource info
    const relResult = await pool.query(`
      SELECT
        rel.id,
        rel.resource_id,
        r.slug as resource_slug,
        r.title as resource_title,
        r.category as resource_category,
        rel.relationship_type,
        rel.confidence_score,
        rel.ai_reasoning,
        rel.is_manual,
        rel.display_priority,
        rel.created_at
      FROM doc_resource_relationships rel
      JOIN resources r ON r.id = rel.resource_id
      WHERE rel.doc_slug = $1
        AND rel.is_active = TRUE
      ORDER BY rel.display_priority DESC, rel.confidence_score DESC
    `, [decodedSlug]);

    // Get version history (last 10)
    const historyResult = await pool.query(`
      SELECT
        id,
        version,
        title,
        change_type,
        change_summary,
        changed_by,
        ai_model,
        created_at
      FROM documentation_history
      WHERE doc_slug = $1
      ORDER BY version DESC
      LIMIT 10
    `, [decodedSlug]);

    // Get sections for ToC
    const sectionsResult = await pool.query(`
      SELECT heading_id, heading_text, heading_level, order_index
      FROM documentation_sections
      WHERE doc_slug = $1
      ORDER BY order_index
    `, [decodedSlug]);

    // Transform response
    const relationships = (relResult.rows as RelationshipRow[]).map(rel => ({
      id: rel.id,
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
    }));

    const history = (historyResult.rows as HistoryRow[]).map(h => ({
      id: h.id,
      version: h.version,
      title: h.title,
      changeType: h.change_type,
      changeSummary: h.change_summary,
      changedBy: h.changed_by,
      aiModel: h.ai_model,
      createdAt: h.created_at,
    }));

    return NextResponse.json({
      documentation: {
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        content: doc.content,
        category: doc.category,
        subcategory: doc.subcategory,
        sources: doc.sources || [],
        sourceUrls: doc.source_urls || [],
        generatedDate: doc.generated_date,
        aiModel: doc.ai_model,
        aiSummary: doc.ai_summary,
        wordCount: doc.word_count,
        readingTimeMinutes: doc.reading_time_minutes,
        headingCount: doc.heading_count,
        codeBlockCount: doc.code_block_count,
        contentHash: doc.content_hash,
        lastScrapedAt: doc.last_scraped_at,
        scrapeStatus: doc.scrape_status,
        version: doc.version,
        isPublished: doc.is_published,
        isFeatured: doc.is_featured,
        prevSlug: doc.prev_slug,
        nextSlug: doc.next_slug,
        parentSlug: doc.parent_slug,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      },
      relationships,
      history,
      sections: sectionsResult.rows.map(s => ({
        id: s.heading_id,
        text: s.heading_text,
        level: s.heading_level,
        order: s.order_index,
      })),
    });
  } catch (error) {
    console.error('Error fetching documentation detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);
    const body = await request.json();

    // Verify doc exists
    const docCheck = await pool.query(
      'SELECT slug FROM documentation WHERE slug = $1',
      [decodedSlug]
    );
    if (docCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    // Handle different update types
    const { action, data } = body;

    switch (action) {
      case 'addRelationship': {
        const { resourceId, relationshipType, displayPriority } = data;

        // Check if resource exists
        const resourceCheck = await pool.query(
          'SELECT id FROM resources WHERE id = $1',
          [resourceId]
        );
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
        `, [decodedSlug, resourceId, relationshipType || 'related', displayPriority || 0]);

        return NextResponse.json({ success: true, message: 'Relationship added' });
      }

      case 'removeRelationship': {
        const { relationshipId } = data;

        // Soft delete
        await pool.query(`
          UPDATE doc_resource_relationships
          SET is_active = FALSE, updated_at = NOW()
          WHERE id = $1 AND doc_slug = $2
        `, [relationshipId, decodedSlug]);

        return NextResponse.json({ success: true, message: 'Relationship removed' });
      }

      case 'updateRelationship': {
        const { relationshipId, relationshipType, displayPriority } = data;

        await pool.query(`
          UPDATE doc_resource_relationships
          SET
            relationship_type = COALESCE($3, relationship_type),
            display_priority = COALESCE($4, display_priority),
            updated_at = NOW()
          WHERE id = $1 AND doc_slug = $2
        `, [relationshipId, decodedSlug, relationshipType, displayPriority]);

        return NextResponse.json({ success: true, message: 'Relationship updated' });
      }

      case 'updateMetadata': {
        const { isPublished, isFeatured, scrapeStatus } = data;

        const updates: string[] = [];
        const values: (string | boolean)[] = [];
        let idx = 2;

        if (typeof isPublished === 'boolean') {
          updates.push(`is_published = $${idx++}`);
          values.push(isPublished);
        }
        if (typeof isFeatured === 'boolean') {
          updates.push(`is_featured = $${idx++}`);
          values.push(isFeatured);
        }
        if (scrapeStatus) {
          updates.push(`scrape_status = $${idx++}`);
          values.push(scrapeStatus);
        }

        if (updates.length > 0) {
          await pool.query(`
            UPDATE documentation
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE slug = $1
          `, [decodedSlug, ...values]);
        }

        return NextResponse.json({ success: true, message: 'Metadata updated' });
      }

      case 'markForReanalysis': {
        // Create an analysis job
        await pool.query(`
          INSERT INTO relationship_analysis_jobs (
            job_type, target_type, target_id, status, triggered_by
          ) VALUES ('doc_to_resources', 'doc', $1, 'pending', $2)
        `, [decodedSlug, session.user.id]);

        return NextResponse.json({
          success: true,
          message: 'Marked for reanalysis. Run analyze-relationships.mjs in Claude Code.',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to update documentation' },
      { status: 500 }
    );
  }
}
