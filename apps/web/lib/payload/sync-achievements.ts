/**
 * Payload CMS Sync Hooks for Gamification
 *
 * Syncs achievements, tiers, and categories from Payload CMS to Supabase.
 * This enables the existing frontend code to continue reading from Supabase
 * while admins manage content through Payload CMS.
 */

import { pool } from '@/lib/db';

/**
 * Map Payload tier slug to Supabase tier value
 * Supabase uses: bronze, silver, gold, platinum
 * Payload uses: common, rare, epic, legendary (or custom tiers)
 */
const TIER_MAPPING: Record<string, string> = {
  common: 'bronze',
  rare: 'silver',
  epic: 'gold',
  legendary: 'platinum',
  // Allow direct mapping for backward compatibility
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'platinum',
};

interface PayloadAchievement {
  id: string | number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  basePoints: number;
  conditionType: string;
  metric?: string;
  threshold?: number;
  isActive: boolean;
  isHidden: boolean;
  isSecret: boolean;
  tier?: {
    id: string | number;
    slug: string;
  } | string | number;
  category?: {
    id: string | number;
    slug: string;
  } | string | number;
}

interface PayloadTier {
  id: string | number;
  slug: string;
  name: string;
  pointMultiplier: number;
  sortOrder: number;
}

interface PayloadCategory {
  id: string | number;
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
}

/**
 * Resolve a relationship to get the slug
 * Handles both populated objects and ID references
 */
async function resolveRelationshipSlug(
  relationship: { slug: string } | string | number | undefined,
  collectionSlug: 'achievement-tiers' | 'achievement-categories'
): Promise<string | null> {
  if (!relationship) return null;

  // If it's already populated with the full object
  if (typeof relationship === 'object' && 'slug' in relationship) {
    return relationship.slug;
  }

  // If it's just an ID, we need to look it up
  // For now, return null - the hook caller should populate relationships
  console.warn(`[Sync] Unpopulated relationship in ${collectionSlug}:`, relationship);
  return null;
}

/**
 * Sync a Payload achievement to Supabase
 */
export async function syncAchievementToSupabase(
  doc: PayloadAchievement,
  operation: 'create' | 'update'
): Promise<void> {
  try {
    // Get tier slug
    let tierSlug = 'bronze'; // default
    if (doc.tier) {
      const resolved = await resolveRelationshipSlug(doc.tier, 'achievement-tiers');
      if (resolved) {
        tierSlug = TIER_MAPPING[resolved] || resolved;
      }
    }

    // Get category slug
    let categorySlug = 'special'; // default
    if (doc.category) {
      const resolved = await resolveRelationshipSlug(doc.category, 'achievement-categories');
      if (resolved) {
        categorySlug = resolved;
      }
    }

    // Map condition type and value
    const requirementType = doc.conditionType || 'special';
    const requirementValue = doc.threshold || 1;

    await pool.query(
      `INSERT INTO public.achievements (slug, name, description, icon, category, points, tier, requirement_type, requirement_value, is_hidden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         icon = EXCLUDED.icon,
         category = EXCLUDED.category,
         points = EXCLUDED.points,
         tier = EXCLUDED.tier,
         requirement_type = EXCLUDED.requirement_type,
         requirement_value = EXCLUDED.requirement_value,
         is_hidden = EXCLUDED.is_hidden`,
      [
        doc.slug,
        doc.name,
        doc.description,
        doc.icon,
        categorySlug,
        doc.basePoints || 10,
        tierSlug,
        requirementType,
        requirementValue,
        doc.isHidden || doc.isSecret || false,
      ]
    );

    console.log(`[Sync] Achievement ${operation}d in Supabase: ${doc.slug}`);
  } catch (error) {
    console.error(`[Sync] Failed to sync achievement ${doc.slug}:`, error);
    throw error;
  }
}

/**
 * Delete an achievement from Supabase
 */
export async function deleteAchievementFromSupabase(slug: string): Promise<void> {
  try {
    await pool.query('DELETE FROM public.achievements WHERE slug = $1', [slug]);
    console.log(`[Sync] Achievement deleted from Supabase: ${slug}`);
  } catch (error) {
    console.error(`[Sync] Failed to delete achievement ${slug}:`, error);
    throw error;
  }
}

/**
 * Create afterChange hook for Achievements collection
 */
export function createAchievementSyncHook() {
  return async ({
    doc,
    operation,
  }: {
    doc: PayloadAchievement;
    operation: 'create' | 'update';
  }) => {
    // Fire and forget - don't block the CMS response
    syncAchievementToSupabase(doc, operation).catch((error) => {
      console.error('[Sync Hook] Achievement sync failed:', error);
    });

    return doc;
  };
}

/**
 * Create afterDelete hook for Achievements collection
 */
export function createAchievementDeleteHook() {
  return async ({ doc }: { doc: PayloadAchievement }) => {
    deleteAchievementFromSupabase(doc.slug).catch((error) => {
      console.error('[Sync Hook] Achievement delete sync failed:', error);
    });

    return doc;
  };
}

/**
 * Bulk sync all achievements from Payload to Supabase
 * Used for initial migration or re-sync
 */
export async function syncAllAchievements(
  achievements: PayloadAchievement[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const achievement of achievements) {
    try {
      await syncAchievementToSupabase(achievement, 'update');
      success++;
    } catch {
      failed++;
    }
  }

  console.log(`[Sync] Bulk sync complete: ${success} succeeded, ${failed} failed`);
  return { success, failed };
}

// Export types for external use
export type { PayloadAchievement, PayloadTier, PayloadCategory };
