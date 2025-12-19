/**
 * Seed Gamification Data API
 *
 * Seeds initial achievement tiers and categories to Payload CMS.
 * Only accessible by superadmins.
 *
 * POST /api/admin/gamification/seed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { getSession } from '@/lib/auth';
import { pool } from '@/lib/db';
import { isSuperAdmin, type UserRole } from '@/lib/roles';

// Default achievement tiers
const DEFAULT_TIERS = [
  {
    slug: 'common',
    name: 'Common',
    description: 'Standard achievements for basic activities',
    pointMultiplier: 1,
    colorGradient: { from: 'gray-400', via: '', to: 'gray-500' },
    glowColor: 'gray-500/20',
    textColor: 'gray-600',
    animation: 'none' as const,
    sortOrder: 1,
  },
  {
    slug: 'rare',
    name: 'Rare',
    description: 'Achievements requiring moderate effort',
    pointMultiplier: 2,
    colorGradient: { from: 'blue-400', via: 'blue-500', to: 'cyan-500' },
    glowColor: 'blue-500/25',
    textColor: 'blue-500',
    animation: 'pulse' as const,
    sortOrder: 2,
  },
  {
    slug: 'epic',
    name: 'Epic',
    description: 'Challenging achievements for dedicated users',
    pointMultiplier: 3,
    colorGradient: { from: 'violet-500', via: 'purple-500', to: 'fuchsia-500' },
    glowColor: 'violet-500/30',
    textColor: 'violet-500',
    animation: 'glow' as const,
    sortOrder: 3,
  },
  {
    slug: 'legendary',
    name: 'Legendary',
    description: 'The rarest achievements for exceptional accomplishments',
    pointMultiplier: 5,
    colorGradient: { from: 'amber-400', via: 'orange-500', to: 'rose-500' },
    glowColor: 'amber-500/40',
    textColor: 'amber-500',
    animation: 'rainbow' as const,
    sortOrder: 4,
  },
];

// Default achievement categories
const DEFAULT_CATEGORIES = [
  {
    slug: 'milestone',
    name: 'Milestones',
    description: 'Key user milestones and account achievements',
    icon: 'trophy',
    color: 'amber',
    sortOrder: 1,
  },
  {
    slug: 'social',
    name: 'Social',
    description: 'Social interactions and community engagement',
    icon: 'users',
    color: 'blue',
    sortOrder: 2,
  },
  {
    slug: 'content',
    name: 'Content',
    description: 'Content creation and engagement',
    icon: 'file-text',
    color: 'green',
    sortOrder: 3,
  },
  {
    slug: 'streak',
    name: 'Streaks',
    description: 'Consistency and daily activity achievements',
    icon: 'flame',
    color: 'orange',
    sortOrder: 4,
  },
  {
    slug: 'exploration',
    name: 'Exploration',
    description: 'Feature discovery and site exploration',
    icon: 'compass',
    color: 'cyan',
    sortOrder: 5,
  },
  {
    slug: 'contribution',
    name: 'Contributions',
    description: 'Community contributions and helpful actions',
    icon: 'heart',
    color: 'rose',
    sortOrder: 6,
  },
  {
    slug: 'security',
    name: 'Security',
    description: 'Account security achievements',
    icon: 'shield',
    color: 'violet',
    sortOrder: 7,
  },
  {
    slug: 'special',
    name: 'Special',
    description: 'Manually awarded special achievements',
    icon: 'star',
    color: 'yellow',
    sortOrder: 8,
  },
  {
    slug: 'seasonal',
    name: 'Seasonal',
    description: 'Time-limited event achievements',
    icon: 'calendar',
    color: 'pink',
    sortOrder: 9,
  },
  {
    slug: 'veteran',
    name: 'Veteran',
    description: 'Long-term membership achievements',
    icon: 'award',
    color: 'indigo',
    sortOrder: 10,
  },
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || 'user';

    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden - superadmin required' }, { status: 403 });
    }

    // Get Payload instance
    const payload = await getPayload({ config });

    const results = {
      tiers: { created: 0, skipped: 0 },
      categories: { created: 0, skipped: 0 },
    };

    // Seed tiers
    for (const tier of DEFAULT_TIERS) {
      const existing = await payload.find({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: 'achievement-tiers' as any,
        where: { slug: { equals: tier.slug } },
        limit: 1,
      });

      if (existing.docs.length === 0) {
        await payload.create({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collection: 'achievement-tiers' as any,
          data: tier,
        });
        results.tiers.created++;
      } else {
        results.tiers.skipped++;
      }
    }

    // Seed categories
    for (const category of DEFAULT_CATEGORIES) {
      const existing = await payload.find({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: 'achievement-categories' as any,
        where: { slug: { equals: category.slug } },
        limit: 1,
      });

      if (existing.docs.length === 0) {
        await payload.create({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collection: 'achievement-categories' as any,
          data: category,
        });
        results.categories.created++;
      } else {
        results.categories.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Gamification data seeded successfully',
      results,
    });
  } catch (error) {
    console.error('[Seed Gamification] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed data' },
      { status: 500 }
    );
  }
}
