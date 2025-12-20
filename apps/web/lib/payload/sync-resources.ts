/**
 * Payload CMS Sync Hooks for Resources
 *
 * Syncs resources from Payload CMS to Supabase.
 * This enables the frontend to read from Supabase while admins manage content through Payload CMS.
 */

import { pool } from '@/lib/db';

interface PayloadResource {
  id: string | number;
  title: string;
  description: string;
  url: string;
  publishStatus: 'published' | 'hidden' | 'pending_review' | 'rejected' | 'draft';
  status: 'official' | 'community' | 'beta' | 'deprecated' | 'archived';
  featured: boolean;
  featuredReason?: string;
  addedDate: string;
  lastVerified: string;
  version?: string;
  namespace?: string;
  category?: {
    id: string | number;
    slug?: string;
  } | string | number;
  subcategory?: {
    id: string | number;
    slug?: string;
  } | string | number;
  tags?: Array<{
    id: string | number;
    slug?: string;
  } | string | number>;
  difficulty?: {
    id: string | number;
    slug?: string;
  } | string | number;
  github?: {
    owner?: string;
    repo?: string;
    stars?: number;
    forks?: number;
    lastUpdated?: string;
    language?: {
      id: string | number;
      slug?: string;
    } | string | number;
  };
}

/**
 * Resolve a relationship to get the slug
 */
function resolveRelationshipSlug(
  relationship: { slug?: string } | string | number | undefined
): string | null {
  if (!relationship) return null;
  if (typeof relationship === 'object' && 'slug' in relationship && relationship.slug) {
    return relationship.slug;
  }
  return null;
}

/**
 * Generate a slug from the resource title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sync a Payload resource to Supabase
 */
export async function syncResourceToSupabase(
  doc: PayloadResource,
  operation: 'create' | 'update'
): Promise<void> {
  try {
    // Only sync published resources
    const isPublished = doc.publishStatus === 'published';

    // Get category slug
    const categorySlug = resolveRelationshipSlug(doc.category) || 'tools';

    // Get difficulty slug
    const difficultySlug = resolveRelationshipSlug(doc.difficulty);

    // Get GitHub language
    const githubLanguage = doc.github?.language
      ? resolveRelationshipSlug(doc.github.language)
      : null;

    // Generate slug from title
    const slug = generateSlug(doc.title);

    await pool.query(
      `INSERT INTO resources (
        slug, title, description, url, category, status, is_featured, featured_reason,
        difficulty, version, namespace,
        github_owner, github_repo, github_stars, github_forks, github_last_commit, github_language,
        added_at, last_verified_at, is_published, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        is_featured = EXCLUDED.is_featured,
        featured_reason = EXCLUDED.featured_reason,
        difficulty = EXCLUDED.difficulty,
        version = EXCLUDED.version,
        namespace = EXCLUDED.namespace,
        github_owner = EXCLUDED.github_owner,
        github_repo = EXCLUDED.github_repo,
        github_stars = EXCLUDED.github_stars,
        github_forks = EXCLUDED.github_forks,
        github_last_commit = EXCLUDED.github_last_commit,
        github_language = EXCLUDED.github_language,
        last_verified_at = EXCLUDED.last_verified_at,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()`,
      [
        slug,
        doc.title,
        doc.description,
        doc.url,
        categorySlug,
        doc.status || 'community',
        doc.featured || false,
        doc.featuredReason || null,
        difficultySlug,
        doc.version || null,
        doc.namespace || null,
        doc.github?.owner || null,
        doc.github?.repo || null,
        doc.github?.stars || 0,
        doc.github?.forks || 0,
        doc.github?.lastUpdated || null,
        githubLanguage,
        doc.addedDate || new Date().toISOString(),
        doc.lastVerified || new Date().toISOString(),
        isPublished,
      ]
    );

    // Sync tags if present
    if (doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0) {
      // Get resource ID
      const resourceResult = await pool.query<{ id: string }>(
        `SELECT id FROM resources WHERE slug = $1`,
        [slug]
      );
      const resourceId = resourceResult.rows[0]?.id;

      if (resourceId) {
        // Delete existing tags
        await pool.query(`DELETE FROM resource_tags WHERE resource_id = $1`, [resourceId]);

        // Insert new tags
        const tagSlugs = doc.tags
          .map((t) => resolveRelationshipSlug(t))
          .filter((t): t is string => t !== null);

        for (const tagSlug of tagSlugs) {
          await pool.query(
            `INSERT INTO resource_tags (resource_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [resourceId, tagSlug]
          );
        }
      }
    }

    console.log(`[Sync] Resource ${operation}d in Supabase: ${slug}`);
  } catch (error) {
    console.error(`[Sync] Failed to sync resource ${doc.title}:`, error);
    throw error;
  }
}

/**
 * Delete a resource from Supabase
 */
export async function deleteResourceFromSupabase(title: string): Promise<void> {
  try {
    const slug = generateSlug(title);
    await pool.query('DELETE FROM resources WHERE slug = $1', [slug]);
    console.log(`[Sync] Resource deleted from Supabase: ${slug}`);
  } catch (error) {
    console.error(`[Sync] Failed to delete resource ${title}:`, error);
    throw error;
  }
}

/**
 * Create afterChange hook for Resources collection
 */
export function createResourceSyncHook() {
  return async ({
    doc,
    operation,
  }: {
    doc: PayloadResource;
    operation: 'create' | 'update';
  }) => {
    // Fire and forget - don't block the CMS response
    syncResourceToSupabase(doc, operation).catch((error) => {
      console.error('[Sync Hook] Resource sync failed:', error);
    });

    return doc;
  };
}

/**
 * Create afterDelete hook for Resources collection
 */
export function createResourceDeleteHook() {
  return async ({ doc }: { doc: PayloadResource }) => {
    deleteResourceFromSupabase(doc.title).catch((error) => {
      console.error('[Sync Hook] Resource delete sync failed:', error);
    });

    return doc;
  };
}

/**
 * Bulk sync all resources from Payload to Supabase
 * Used for initial migration or re-sync
 */
export async function syncAllResources(
  resources: PayloadResource[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const resource of resources) {
    try {
      await syncResourceToSupabase(resource, 'update');
      success++;
    } catch {
      failed++;
    }
  }

  console.log(`[Sync] Bulk resource sync complete: ${success} succeeded, ${failed} failed`);
  return { success, failed };
}

export type { PayloadResource };
