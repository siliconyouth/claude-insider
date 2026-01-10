/**
 * Prompt Analytics API
 *
 * GET: Retrieve aggregated prompt usage analytics
 * - Total uses, unique users, top prompts
 * - Builder mode distribution
 * - Device analytics
 * - Time-series data
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasMinRole, ROLES, type UserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface AnalyticsParams {
  period: 'day' | 'week' | 'month' | 'all';
  limit: number;
}

function getDateFilter(period: string): string {
  switch (period) {
    case 'day':
      return "AND created_at >= NOW() - INTERVAL '1 day'";
    case 'week':
      return "AND created_at >= NOW() - INTERVAL '7 days'";
    case 'month':
      return "AND created_at >= NOW() - INTERVAL '30 days'";
    default:
      return '';
  }
}

/**
 * GET /api/prompts/analytics
 * Get prompt usage analytics (admin/editor only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Check permissions - require at least editor role
    if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.EDITOR)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as AnalyticsParams['period'];
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const dateFilter = getDateFilter(period);

    // Run all analytics queries in parallel
    const [
      overviewResult,
      topPromptsResult,
      builderModesResult,
      deviceStatsResult,
      categoryStatsResult,
      timeSeriesResult,
    ] = await Promise.all([
      // Overview stats
      pool.query(`
        SELECT
          COUNT(*) as total_uses,
          COUNT(DISTINCT prompt_id) as unique_prompts,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as authenticated_users,
          COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_uses
        FROM prompt_usage
        WHERE 1=1 ${dateFilter}
      `),

      // Top prompts by usage
      pool.query(`
        SELECT
          p.id,
          p.title,
          p.slug,
          pc.name as category_name,
          COUNT(*) as use_count,
          COUNT(DISTINCT pu.user_id) as unique_users
        FROM prompt_usage pu
        JOIN prompts p ON pu.prompt_id = p.id
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        WHERE 1=1 ${dateFilter}
        GROUP BY p.id, p.title, p.slug, pc.name
        ORDER BY use_count DESC
        LIMIT $1
      `, [limit]),

      // Builder mode distribution
      pool.query(`
        SELECT
          COALESCE(variables_used->>'builderMode', 'unknown') as builder_mode,
          COUNT(*) as count
        FROM prompt_usage
        WHERE 1=1 ${dateFilter}
        GROUP BY variables_used->>'builderMode'
        ORDER BY count DESC
      `),

      // Device statistics
      pool.query(`
        SELECT
          COALESCE(
            CASE
              WHEN variables_used->'device'->>'isMobile' = 'true' THEN 'mobile'
              ELSE 'desktop'
            END,
            'unknown'
          ) as device_type,
          COUNT(*) as count
        FROM prompt_usage
        WHERE 1=1 ${dateFilter}
        GROUP BY device_type
        ORDER BY count DESC
      `),

      // Category distribution
      pool.query(`
        SELECT
          COALESCE(pc.name, 'Uncategorized') as category,
          COUNT(*) as use_count
        FROM prompt_usage pu
        JOIN prompts p ON pu.prompt_id = p.id
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        WHERE 1=1 ${dateFilter}
        GROUP BY pc.name
        ORDER BY use_count DESC
      `),

      // Time series (daily for week, hourly for day)
      period === 'day'
        ? pool.query(`
            SELECT
              DATE_TRUNC('hour', created_at) as timestamp,
              COUNT(*) as count
            FROM prompt_usage
            WHERE created_at >= NOW() - INTERVAL '1 day'
            GROUP BY DATE_TRUNC('hour', created_at)
            ORDER BY timestamp
          `)
        : pool.query(`
            SELECT
              DATE_TRUNC('day', created_at) as timestamp,
              COUNT(*) as count
            FROM prompt_usage
            WHERE 1=1 ${dateFilter}
            GROUP BY DATE_TRUNC('day', created_at)
            ORDER BY timestamp
          `),
    ]);

    // Format response
    const analytics = {
      period,
      overview: {
        totalUses: parseInt(overviewResult.rows[0]?.total_uses || '0'),
        uniquePrompts: parseInt(overviewResult.rows[0]?.unique_prompts || '0'),
        authenticatedUsers: parseInt(overviewResult.rows[0]?.authenticated_users || '0'),
        anonymousUses: parseInt(overviewResult.rows[0]?.anonymous_uses || '0'),
      },
      topPrompts: topPromptsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category_name,
        useCount: parseInt(row.use_count),
        uniqueUsers: parseInt(row.unique_users),
      })),
      builderModes: builderModesResult.rows.map((row) => ({
        mode: row.builder_mode || 'unknown',
        count: parseInt(row.count),
      })),
      deviceStats: deviceStatsResult.rows.map((row) => ({
        type: row.device_type,
        count: parseInt(row.count),
      })),
      categoryStats: categoryStatsResult.rows.map((row) => ({
        category: row.category,
        count: parseInt(row.use_count),
      })),
      timeSeries: timeSeriesResult.rows.map((row) => ({
        timestamp: row.timestamp,
        count: parseInt(row.count),
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching prompt analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
