/**
 * Documentation Single Version API
 *
 * GET: Get a specific version's full content
 * POST: Rollback to this version
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string; version: string }>;
}

/**
 * GET /api/dashboard/documentation/[slug]/versions/[version]
 * Get a specific version's full content
 */
export async function GET(request: NextRequest, context: RouteContext) {
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
    const { slug, version } = await context.params;
    const decodedSlug = decodeURIComponent(slug);
    const versionNum = parseInt(version, 10);

    if (isNaN(versionNum)) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 });
    }

    // First check if this is the current version
    const currentResult = await pool.query(`
      SELECT slug, title, description, content, sources, version, updated_at
      FROM documentation
      WHERE slug = $1
    `, [decodedSlug]);

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    const current = currentResult.rows[0];

    // If requesting current version, return it
    if (current.version === versionNum) {
      return NextResponse.json({
        version: {
          id: null, // Current version has no history ID
          version: current.version,
          title: current.title,
          description: current.description,
          content: current.content,
          sources: current.sources,
          changeType: 'current',
          changeSummary: 'Current version',
          changedBy: null,
          changedByName: null,
          aiModel: null,
          aiConfidence: null,
          createdAt: current.updated_at,
          isCurrent: true,
        },
      });
    }

    // Otherwise, fetch from history
    const historyResult = await pool.query(`
      SELECT
        h.id,
        h.version,
        h.title,
        h.description,
        h.content,
        h.sources,
        h.change_type,
        h.change_summary,
        h.changed_by,
        u.name as changed_by_name,
        h.ai_model,
        h.ai_confidence,
        h.created_at
      FROM documentation_history h
      LEFT JOIN "user" u ON u.id = h.changed_by
      WHERE h.doc_slug = $1 AND h.version = $2
    `, [decodedSlug, versionNum]);

    if (historyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const v = historyResult.rows[0];

    return NextResponse.json({
      version: {
        id: v.id,
        version: v.version,
        title: v.title,
        description: v.description,
        content: v.content,
        sources: v.sources,
        changeType: v.change_type,
        changeSummary: v.change_summary,
        changedBy: v.changed_by,
        changedByName: v.changed_by_name,
        aiModel: v.ai_model,
        aiConfidence: v.ai_confidence ? parseFloat(v.ai_confidence) : null,
        createdAt: v.created_at,
        isCurrent: false,
      },
      currentVersion: current.version,
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/documentation/[slug]/versions/[version]
 * Rollback to this version
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roleResult = await pool.query(
    `SELECT role FROM "user" WHERE id = $1`,
    [session.user.id]
  );
  const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';

  // Rollback requires admin
  if (!hasMinRole(userRole, ROLES.ADMIN)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { slug, version } = await context.params;
    const decodedSlug = decodeURIComponent(slug);
    const versionNum = parseInt(version, 10);
    const body = await request.json();
    const { reason } = body;

    if (isNaN(versionNum)) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 });
    }

    // Get the version to rollback to
    const historyResult = await pool.query(`
      SELECT id, version, title, description, content, sources
      FROM documentation_history
      WHERE doc_slug = $1 AND version = $2
    `, [decodedSlug, versionNum]);

    if (historyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const targetVersion = historyResult.rows[0];

    // Get current doc
    const currentResult = await pool.query(`
      SELECT slug, version FROM documentation WHERE slug = $1
    `, [decodedSlug]);

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    const currentDoc = currentResult.rows[0];

    // Can't rollback to current version
    if (currentDoc.version === versionNum) {
      return NextResponse.json(
        { error: 'Cannot rollback to current version' },
        { status: 400 }
      );
    }

    // Update document with historical content
    // The auto_version_documentation trigger will create a new history entry
    await pool.query(`
      UPDATE documentation
      SET
        title = $2,
        description = $3,
        content = $4,
        sources = $5,
        updated_at = NOW()
      WHERE slug = $1
    `, [
      decodedSlug,
      targetVersion.title,
      targetVersion.description,
      targetVersion.content,
      targetVersion.sources,
    ]);

    // Update the latest history entry to mark it as a rollback
    await pool.query(`
      UPDATE documentation_history
      SET
        change_type = 'rollback',
        change_summary = $2,
        changed_by = $3
      WHERE doc_slug = $1
      ORDER BY version DESC
      LIMIT 1
    `, [
      decodedSlug,
      reason || `Rolled back to version ${versionNum}`,
      session.user.id,
    ]);

    // Get new version number
    const newVersionResult = await pool.query(
      'SELECT version FROM documentation WHERE slug = $1',
      [decodedSlug]
    );

    return NextResponse.json({
      success: true,
      message: `Rolled back to version ${versionNum}`,
      previousVersion: currentDoc.version,
      newVersion: newVersionResult.rows[0]?.version,
      rolledBackTo: versionNum,
    });
  } catch (error) {
    console.error('Error rolling back version:', error);
    return NextResponse.json(
      { error: 'Failed to rollback version' },
      { status: 500 }
    );
  }
}
