/**
 * Dashboard Resource Admin Detail API
 *
 * GET: Get full resource with relationships and AI enhancement data
 * PATCH: Update resource metadata, relationships, and enhancement status
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DocRelationshipRow {
  id: string;
  doc_slug: string;
  doc_title: string;
  doc_category: string;
  relationship_type: string;
  confidence_score: string;
  ai_reasoning: string | null;
  is_manual: boolean;
  display_priority: number;
  created_at: string;
}

interface ResourceRelationshipRow {
  id: string;
  target_resource_id: string;
  target_slug: string;
  target_title: string;
  target_category: string;
  relationship_type: string;
  confidence_score: string;
  ai_reasoning: string | null;
  is_manual: boolean;
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
    const { id } = await context.params;

    // Get resource with full details
    const resourceResult = await pool.query(`
      SELECT
        id,
        slug,
        title,
        description,
        long_description,
        url,
        category,
        subcategory,
        status,
        is_featured,
        featured_reason,
        is_published,
        difficulty,
        version,
        namespace,
        pricing,
        price_details,
        platforms,
        license,
        website_url,
        docs_url,
        changelog_url,
        discord_url,
        twitter_url,
        github_owner,
        github_repo,
        github_stars,
        github_forks,
        github_issues,
        github_language,
        github_last_commit,
        github_contributors,
        npm_package,
        npm_downloads_weekly,
        pypi_package,
        pypi_downloads_monthly,
        icon_url,
        banner_url,
        screenshots,
        video_url,
        meta_title,
        meta_description,
        og_image_url,
        views_count,
        favorites_count,
        ratings_count,
        average_rating,
        reviews_count,
        comments_count,
        ai_overview,
        ai_summary,
        ai_analyzed_at,
        ai_confidence,
        key_features,
        use_cases,
        pros,
        cons,
        target_audience,
        prerequisites,
        related_docs_count,
        related_resources_count,
        related_doc_slugs,
        related_resource_slugs,
        primary_screenshot_url,
        thumbnail_url,
        views_this_week,
        trending_score,
        added_at,
        last_verified_at,
        last_synced_at,
        created_at,
        updated_at
      FROM resources
      WHERE id = $1
    `, [id]);

    if (resourceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const resource = resourceResult.rows[0];

    // Get doc relationships
    const docRelResult = await pool.query(`
      SELECT
        rel.id,
        rel.doc_slug,
        d.title as doc_title,
        d.category as doc_category,
        rel.relationship_type,
        rel.confidence_score,
        rel.ai_reasoning,
        rel.is_manual,
        rel.display_priority,
        rel.created_at
      FROM doc_resource_relationships rel
      JOIN documentation d ON d.slug = rel.doc_slug
      WHERE rel.resource_id = $1
        AND rel.is_active = TRUE
      ORDER BY rel.display_priority DESC, rel.confidence_score DESC
    `, [id]);

    // Get resource-to-resource relationships
    const resRelResult = await pool.query(`
      SELECT
        rel.id,
        rel.target_resource_id,
        r.slug as target_slug,
        r.title as target_title,
        r.category as target_category,
        rel.relationship_type,
        rel.confidence_score,
        rel.ai_reasoning,
        rel.is_manual,
        rel.created_at
      FROM resource_resource_relationships rel
      JOIN resources r ON r.id = rel.target_resource_id
      WHERE rel.source_resource_id = $1
        AND rel.is_active = TRUE
      ORDER BY rel.confidence_score DESC
    `, [id]);

    // Get tags
    const tagsResult = await pool.query(`
      SELECT tag FROM resource_tags WHERE resource_id = $1 ORDER BY tag
    `, [id]);

    // Get authors
    const authorsResult = await pool.query(`
      SELECT
        id, user_id, name, role, github_username, twitter_username,
        website_url, avatar_url, is_primary
      FROM resource_authors
      WHERE resource_id = $1
      ORDER BY is_primary DESC, name
    `, [id]);

    // Transform doc relationships
    const docRelationships = (docRelResult.rows as DocRelationshipRow[]).map(rel => ({
      id: rel.id,
      docSlug: rel.doc_slug,
      docTitle: rel.doc_title,
      docCategory: rel.doc_category,
      relationshipType: rel.relationship_type,
      confidenceScore: parseFloat(rel.confidence_score),
      aiReasoning: rel.ai_reasoning,
      isManual: rel.is_manual,
      displayPriority: rel.display_priority,
      createdAt: rel.created_at,
    }));

    // Transform resource relationships
    const resourceRelationships = (resRelResult.rows as ResourceRelationshipRow[]).map(rel => ({
      id: rel.id,
      targetResourceId: rel.target_resource_id,
      targetSlug: rel.target_slug,
      targetTitle: rel.target_title,
      targetCategory: rel.target_category,
      relationshipType: rel.relationship_type,
      confidenceScore: parseFloat(rel.confidence_score),
      aiReasoning: rel.ai_reasoning,
      isManual: rel.is_manual,
      createdAt: rel.created_at,
    }));

    return NextResponse.json({
      resource: {
        id: resource.id,
        slug: resource.slug,
        title: resource.title,
        description: resource.description,
        longDescription: resource.long_description,
        url: resource.url,
        category: resource.category,
        subcategory: resource.subcategory,
        status: resource.status,
        isFeatured: resource.is_featured,
        featuredReason: resource.featured_reason,
        isPublished: resource.is_published,
        difficulty: resource.difficulty,
        version: resource.version,
        namespace: resource.namespace,
        pricing: resource.pricing,
        priceDetails: resource.price_details,
        platforms: resource.platforms || [],
        license: resource.license,
        websiteUrl: resource.website_url,
        docsUrl: resource.docs_url,
        changelogUrl: resource.changelog_url,
        discordUrl: resource.discord_url,
        twitterUrl: resource.twitter_url,
        github: {
          owner: resource.github_owner,
          repo: resource.github_repo,
          stars: resource.github_stars,
          forks: resource.github_forks,
          issues: resource.github_issues,
          language: resource.github_language,
          lastCommit: resource.github_last_commit,
          contributors: resource.github_contributors,
        },
        npm: {
          package: resource.npm_package,
          downloadsWeekly: resource.npm_downloads_weekly,
        },
        pypi: {
          package: resource.pypi_package,
          downloadsMonthly: resource.pypi_downloads_monthly,
        },
        media: {
          iconUrl: resource.icon_url,
          bannerUrl: resource.banner_url,
          screenshots: resource.screenshots || [],
          videoUrl: resource.video_url,
          primaryScreenshotUrl: resource.primary_screenshot_url,
          thumbnailUrl: resource.thumbnail_url,
        },
        seo: {
          metaTitle: resource.meta_title,
          metaDescription: resource.meta_description,
          ogImageUrl: resource.og_image_url,
        },
        stats: {
          viewsCount: resource.views_count,
          favoritesCount: resource.favorites_count,
          ratingsCount: resource.ratings_count,
          averageRating: resource.average_rating ? parseFloat(resource.average_rating) : null,
          reviewsCount: resource.reviews_count,
          commentsCount: resource.comments_count,
          viewsThisWeek: resource.views_this_week,
          trendingScore: resource.trending_score ? parseFloat(resource.trending_score) : null,
        },
        aiEnhancement: {
          overview: resource.ai_overview,
          summary: resource.ai_summary,
          analyzedAt: resource.ai_analyzed_at,
          confidence: resource.ai_confidence ? parseFloat(resource.ai_confidence) : null,
          keyFeatures: resource.key_features || [],
          useCases: resource.use_cases || [],
          pros: resource.pros || [],
          cons: resource.cons || [],
          targetAudience: resource.target_audience || [],
          prerequisites: resource.prerequisites || [],
        },
        relationships: {
          docsCount: resource.related_docs_count,
          resourcesCount: resource.related_resources_count,
          docSlugs: resource.related_doc_slugs || [],
          resourceSlugs: resource.related_resource_slugs || [],
        },
        timestamps: {
          addedAt: resource.added_at,
          lastVerifiedAt: resource.last_verified_at,
          lastSyncedAt: resource.last_synced_at,
          createdAt: resource.created_at,
          updatedAt: resource.updated_at,
        },
      },
      docRelationships,
      resourceRelationships,
      tags: tagsResult.rows.map(r => r.tag),
      authors: authorsResult.rows.map(a => ({
        id: a.id,
        userId: a.user_id,
        name: a.name,
        role: a.role,
        githubUsername: a.github_username,
        twitterUsername: a.twitter_username,
        websiteUrl: a.website_url,
        avatarUrl: a.avatar_url,
        isPrimary: a.is_primary,
      })),
    });
  } catch (error) {
    console.error('Error fetching resource detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
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
    const { id } = await context.params;
    const body = await request.json();

    // Verify resource exists
    const resourceCheck = await pool.query(
      'SELECT id FROM resources WHERE id = $1',
      [id]
    );
    if (resourceCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Handle different update types
    const { action, data } = body;

    switch (action) {
      case 'addDocRelationship': {
        const { docSlug, relationshipType, displayPriority } = data;

        // Check if doc exists
        const docCheck = await pool.query(
          'SELECT slug FROM documentation WHERE slug = $1',
          [docSlug]
        );
        if (docCheck.rows.length === 0) {
          return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
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
        `, [docSlug, id, relationshipType || 'related', displayPriority || 0]);

        // Update denormalized count
        await pool.query(`
          UPDATE resources SET related_docs_count = (
            SELECT COUNT(*) FROM doc_resource_relationships
            WHERE resource_id = $1 AND is_active = TRUE
          ) WHERE id = $1
        `, [id]);

        return NextResponse.json({ success: true, message: 'Doc relationship added' });
      }

      case 'addResourceRelationship': {
        const { targetResourceId, relationshipType } = data;

        // Check if target resource exists
        const targetCheck = await pool.query(
          'SELECT id FROM resources WHERE id = $1',
          [targetResourceId]
        );
        if (targetCheck.rows.length === 0) {
          return NextResponse.json({ error: 'Target resource not found' }, { status: 404 });
        }

        if (targetResourceId === id) {
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
        `, [id, targetResourceId, relationshipType || 'related']);

        // Update denormalized count
        await pool.query(`
          UPDATE resources SET related_resources_count = (
            SELECT COUNT(*) FROM resource_resource_relationships
            WHERE source_resource_id = $1 AND is_active = TRUE
          ) WHERE id = $1
        `, [id]);

        return NextResponse.json({ success: true, message: 'Resource relationship added' });
      }

      case 'removeDocRelationship': {
        const { relationshipId } = data;

        // Soft delete
        await pool.query(`
          UPDATE doc_resource_relationships
          SET is_active = FALSE, updated_at = NOW()
          WHERE id = $1 AND resource_id = $2
        `, [relationshipId, id]);

        // Update denormalized count
        await pool.query(`
          UPDATE resources SET related_docs_count = (
            SELECT COUNT(*) FROM doc_resource_relationships
            WHERE resource_id = $1 AND is_active = TRUE
          ) WHERE id = $1
        `, [id]);

        return NextResponse.json({ success: true, message: 'Doc relationship removed' });
      }

      case 'removeResourceRelationship': {
        const { relationshipId } = data;

        // Soft delete
        await pool.query(`
          UPDATE resource_resource_relationships
          SET is_active = FALSE, updated_at = NOW()
          WHERE id = $1 AND source_resource_id = $2
        `, [relationshipId, id]);

        // Update denormalized count
        await pool.query(`
          UPDATE resources SET related_resources_count = (
            SELECT COUNT(*) FROM resource_resource_relationships
            WHERE source_resource_id = $1 AND is_active = TRUE
          ) WHERE id = $1
        `, [id]);

        return NextResponse.json({ success: true, message: 'Resource relationship removed' });
      }

      case 'updateMetadata': {
        const { isPublished, isFeatured, featuredReason, status: newStatus } = data;

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
        if (featuredReason !== undefined) {
          updates.push(`featured_reason = $${idx++}`);
          values.push(featuredReason);
        }
        if (newStatus) {
          updates.push(`status = $${idx++}`);
          values.push(newStatus);
        }

        if (updates.length > 0) {
          await pool.query(`
            UPDATE resources
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $1
          `, [id, ...values]);
        }

        return NextResponse.json({ success: true, message: 'Metadata updated' });
      }

      case 'markForEnhancement': {
        // Create an enhancement job
        await pool.query(`
          INSERT INTO relationship_analysis_jobs (
            job_type, target_type, target_id, status, triggered_by
          ) VALUES ('resource_enhancement', 'resource', $1, 'pending', $2)
        `, [id, session.user.id]);

        return NextResponse.json({
          success: true,
          message: 'Marked for AI enhancement. Run enhance-resources.mjs in Claude Code.',
        });
      }

      case 'markForRelationshipAnalysis': {
        // Create a relationship analysis job
        await pool.query(`
          INSERT INTO relationship_analysis_jobs (
            job_type, target_type, target_id, status, triggered_by
          ) VALUES ('resource_to_docs', 'resource', $1, 'pending', $2)
        `, [id, session.user.id]);

        return NextResponse.json({
          success: true,
          message: 'Marked for relationship analysis. Run analyze-relationships.mjs in Claude Code.',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}
