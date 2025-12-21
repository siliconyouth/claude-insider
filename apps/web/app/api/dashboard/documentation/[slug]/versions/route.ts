/**
 * Documentation Version History API
 *
 * GET: List all versions of a document with pagination
 * POST: Compare two versions (diff)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

interface VersionRow {
  id: string;
  version: number;
  title: string;
  description: string | null;
  content: string;
  sources: string[] | null;
  change_type: string;
  change_summary: string | null;
  changed_by: string | null;
  changed_by_name: string | null;
  ai_model: string | null;
  ai_confidence: string | null;
  word_count: number;
  created_at: string;
}

/**
 * GET /api/dashboard/documentation/[slug]/versions
 * List all versions with pagination
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
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;
    const includeContent = searchParams.get('includeContent') === 'true';

    // Verify doc exists
    const docCheck = await pool.query(
      'SELECT slug, title, version as current_version FROM documentation WHERE slug = $1',
      [decodedSlug]
    );
    if (docCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    const currentDoc = docCheck.rows[0];

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM documentation_history WHERE doc_slug = $1',
      [decodedSlug]
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get versions with optional content
    const contentSelect = includeContent ? ', h.content' : '';
    const versionsResult = await pool.query(`
      SELECT
        h.id,
        h.version,
        h.title,
        h.description,
        h.sources,
        h.change_type,
        h.change_summary,
        h.changed_by,
        u.name as changed_by_name,
        h.ai_model,
        h.ai_confidence,
        LENGTH(h.content) / 5 as word_count,
        h.created_at
        ${contentSelect}
      FROM documentation_history h
      LEFT JOIN "user" u ON u.id = h.changed_by
      WHERE h.doc_slug = $1
      ORDER BY h.version DESC
      LIMIT $2 OFFSET $3
    `, [decodedSlug, limit, offset]);

    const versions = (versionsResult.rows as VersionRow[]).map(v => ({
      id: v.id,
      version: v.version,
      title: v.title,
      description: v.description,
      sources: v.sources,
      changeType: v.change_type,
      changeSummary: v.change_summary,
      changedBy: v.changed_by,
      changedByName: v.changed_by_name,
      aiModel: v.ai_model,
      aiConfidence: v.ai_confidence ? parseFloat(v.ai_confidence) : null,
      wordCount: v.word_count,
      createdAt: v.created_at,
      ...(includeContent && { content: v.content }),
    }));

    return NextResponse.json({
      slug: currentDoc.slug,
      title: currentDoc.title,
      currentVersion: currentDoc.current_version,
      versions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/documentation/[slug]/versions
 * Compare two versions (diff)
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

  if (!hasMinRole(userRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);
    const { fromVersion, toVersion } = await request.json();

    if (!fromVersion || !toVersion) {
      return NextResponse.json(
        { error: 'fromVersion and toVersion are required' },
        { status: 400 }
      );
    }

    // Get both versions
    const versionsResult = await pool.query(`
      SELECT version, title, description, content, sources, change_type, created_at
      FROM documentation_history
      WHERE doc_slug = $1 AND version IN ($2, $3)
      ORDER BY version
    `, [decodedSlug, fromVersion, toVersion]);

    if (versionsResult.rows.length < 2) {
      // One might be the current version
      const currentResult = await pool.query(`
        SELECT version, title, description, content, sources, 'current' as change_type, updated_at as created_at
        FROM documentation
        WHERE slug = $1
      `, [decodedSlug]);

      if (currentResult.rows.length === 0) {
        return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
      }

      // Combine history and current
      const allVersions = [...versionsResult.rows, ...currentResult.rows]
        .filter(v => v.version === fromVersion || v.version === toVersion)
        .sort((a, b) => a.version - b.version);

      if (allVersions.length < 2) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      versionsResult.rows = allVersions;
    }

    const [from, to] = versionsResult.rows;

    // Generate simple line-based diff
    const fromLines = (from.content || '').split('\n');
    const toLines = (to.content || '').split('\n');

    const diff = generateLineDiff(fromLines, toLines);

    return NextResponse.json({
      from: {
        version: from.version,
        title: from.title,
        changeType: from.change_type,
        createdAt: from.created_at,
        lineCount: fromLines.length,
      },
      to: {
        version: to.version,
        title: to.title,
        changeType: to.change_type,
        createdAt: to.created_at,
        lineCount: toLines.length,
      },
      diff,
      stats: {
        additions: diff.filter(d => d.type === 'added').length,
        deletions: diff.filter(d => d.type === 'removed').length,
        unchanged: diff.filter(d => d.type === 'unchanged').length,
      },
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    );
  }
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  fromLine: number | null;
  toLine: number | null;
}

/**
 * Simple LCS-based line diff algorithm
 */
function generateLineDiff(fromLines: string[], toLines: string[]): DiffLine[] {
  const m = fromLines.length;
  const n = toLines.length;

  // Build LCS table - use explicit initialization for TypeScript
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    const row: number[] = [];
    for (let j = 0; j <= n; j++) {
      row[j] = 0;
    }
    dp[i] = row;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const fromLine = fromLines[i - 1];
      const toLine = toLines[j - 1];
      const dpPrev = dp[i - 1];
      const dpCurr = dp[i];

      if (dpPrev && dpCurr && fromLine !== undefined && toLine !== undefined) {
        if (fromLine === toLine) {
          dpCurr[j] = (dpPrev[j - 1] ?? 0) + 1;
        } else {
          dpCurr[j] = Math.max(dpPrev[j] ?? 0, dpCurr[j - 1] ?? 0);
        }
      }
    }
  }

  // Backtrack to find diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const fromLine = i > 0 ? fromLines[i - 1] : undefined;
    const toLine = j > 0 ? toLines[j - 1] : undefined;
    const dpCurr = dp[i];
    const dpPrev = i > 0 ? dp[i - 1] : undefined;

    if (i > 0 && j > 0 && fromLine !== undefined && toLine !== undefined && fromLine === toLine) {
      result.unshift({
        type: 'unchanged',
        content: fromLine,
        fromLine: i,
        toLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || (dpCurr && dpPrev && (dpCurr[j - 1] ?? 0) >= (dpPrev[j] ?? 0)))) {
      result.unshift({
        type: 'added',
        content: toLine ?? '',
        fromLine: null,
        toLine: j,
      });
      j--;
    } else if (i > 0) {
      result.unshift({
        type: 'removed',
        content: fromLine ?? '',
        fromLine: i,
        toLine: null,
      });
      i--;
    } else {
      break; // Should never reach here
    }
  }

  return result;
}
