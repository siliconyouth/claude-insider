/**
 * Payload CMS Sync Hooks for Resources (Optimized)
 *
 * Syncs resources from Payload CMS to Supabase with minimal database operations.
 * Optimizations:
 * - Change detection via content hashing (skips unchanged resources)
 * - Batched tag operations (single query for all tags)
 * - Combined queries using CTEs (reduces round-trips)
 * - Incremental sync support (only process changed resources)
 */

import { pool } from '@/lib/db';
import { createHash } from 'crypto';

interface PayloadResource {
  id: string | number;
  title: string;
  description: string;
  url: string;
  publishStatus: 'published' | 'hidden' | 'pending_review' | 'rejected' | 'draft';
  resourceType?: 'official' | 'community' | 'beta' | 'deprecated' | 'archived';
  status?: 'official' | 'community' | 'beta' | 'deprecated' | 'archived'; // Legacy field name
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
  updatedAt?: string;
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
 * Generate a content hash for change detection
 * Only includes fields that matter for the frontend
 */
function generateContentHash(doc: PayloadResource): string {
  const relevantData = {
    title: doc.title,
    description: doc.description,
    url: doc.url,
    publishStatus: doc.publishStatus,
    status: doc.resourceType || doc.status,
    featured: doc.featured,
    featuredReason: doc.featuredReason,
    category: resolveRelationshipSlug(doc.category),
    difficulty: resolveRelationshipSlug(doc.difficulty),
    version: doc.version,
    namespace: doc.namespace,
    github: doc.github ? {
      owner: doc.github.owner,
      repo: doc.github.repo,
      stars: doc.github.stars,
      forks: doc.github.forks,
    } : null,
    tags: doc.tags?.map(t => resolveRelationshipSlug(t)).filter(Boolean).sort(),
  };

  return createHash('md5')
    .update(JSON.stringify(relevantData))
    .digest('hex');
}

/**
 * Sync a Payload resource to Supabase (Optimized)
 *
 * Optimizations:
 * - Checks content hash to skip unchanged resources
 * - Uses single query with RETURNING for upsert + ID retrieval
 * - Batches all tag operations into one query
 */
export async function syncResourceToSupabase(
  doc: PayloadResource,
  operation: 'create' | 'update'
): Promise<{ synced: boolean; reason: string }> {
  const startTime = Date.now();

  try {
    const isPublished = doc.publishStatus === 'published';
    const categorySlug = resolveRelationshipSlug(doc.category) || 'tools';
    const difficultySlug = resolveRelationshipSlug(doc.difficulty);
    const githubLanguage = doc.github?.language
      ? resolveRelationshipSlug(doc.github.language)
      : null;
    const contentHash = generateContentHash(doc);
    const slug = generateSlug(doc.title);

    // Single query: Check existing + get slug + compare hash
    const existing = await pool.query<{ slug: string; content_hash: string | null }>(
      `SELECT slug, content_hash FROM resources WHERE title = $1 LIMIT 1`,
      [doc.title]
    );

    const finalSlug = existing.rows[0]?.slug || slug;
    const existingHash = existing.rows[0]?.content_hash;

    // Skip sync if content hasn't changed (for updates only)
    if (operation === 'update' && existingHash === contentHash) {
      console.log(`[Sync] Skipped (unchanged): ${finalSlug}`);
      return { synced: false, reason: 'unchanged' };
    }

    // Get tag slugs for batched insert
    const tagSlugs = doc.tags
      ?.map(t => resolveRelationshipSlug(t))
      .filter((t): t is string => t !== null) || [];

    // Combined upsert + tag sync in a single transaction
    // Uses CTE for efficiency
    const result = await pool.query<{ id: string }>(
      `WITH upserted AS (
        INSERT INTO resources (
          slug, title, description, url, category, status, is_featured, featured_reason,
          difficulty, version, namespace,
          github_owner, github_repo, github_stars, github_forks, github_last_commit, github_language,
          added_at, last_verified_at, is_published, content_hash, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
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
          content_hash = EXCLUDED.content_hash,
          updated_at = NOW()
        RETURNING id
      ),
      deleted_tags AS (
        DELETE FROM resource_tags
        WHERE resource_id = (SELECT id FROM upserted)
        RETURNING 1
      )
      SELECT id FROM upserted`,
      [
        finalSlug,
        doc.title,
        doc.description,
        doc.url,
        categorySlug,
        doc.resourceType || doc.status || 'community',
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
        contentHash,
      ]
    );

    const resourceId = result.rows[0]?.id;

    // Batch insert all tags in a single query (if any)
    if (resourceId && tagSlugs.length > 0) {
      const values = tagSlugs.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO resource_tags (resource_id, tag) VALUES ${values} ON CONFLICT DO NOTHING`,
        [resourceId, ...tagSlugs]
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[Sync] ${operation === 'create' ? 'Created' : 'Updated'}: ${finalSlug} (${duration}ms)`);
    return { synced: true, reason: operation };
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
    // Delete by title (more reliable than generated slug)
    const result = await pool.query(
      'DELETE FROM resources WHERE title = $1 RETURNING slug',
      [title]
    );

    if (result.rows[0]) {
      console.log(`[Sync] Deleted: ${result.rows[0].slug}`);
    } else {
      // Fallback to slug-based delete
      const slug = generateSlug(title);
      await pool.query('DELETE FROM resources WHERE slug = $1', [slug]);
      console.log(`[Sync] Deleted (by slug): ${slug}`);
    }
  } catch (error) {
    console.error(`[Sync] Failed to delete resource ${title}:`, error);
    throw error;
  }
}

/**
 * Create afterChange hook for Resources collection (Optimized)
 *
 * Uses fire-and-forget pattern but with change detection
 * to minimize unnecessary syncs
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
 * Incremental sync - only sync resources modified after a given timestamp
 *
 * Usage:
 *   // Sync only resources changed in the last hour
 *   await syncResourcesIncremental(resources, new Date(Date.now() - 3600000));
 */
export async function syncResourcesIncremental(
  resources: PayloadResource[],
  since?: Date
): Promise<{ synced: number; skipped: number; failed: number }> {
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  const filtered = since
    ? resources.filter(r => r.updatedAt && new Date(r.updatedAt) > since)
    : resources;

  console.log(`[Sync] Incremental sync: ${filtered.length}/${resources.length} resources to process`);

  for (const resource of filtered) {
    try {
      const result = await syncResourceToSupabase(resource, 'update');
      if (result.synced) {
        synced++;
      } else {
        skipped++;
      }
    } catch {
      failed++;
    }
  }

  console.log(`[Sync] Incremental sync complete: ${synced} synced, ${skipped} skipped, ${failed} failed`);
  return { synced, skipped, failed };
}

/**
 * Bulk sync with batching and progress reporting
 *
 * Processes resources in batches with progress callbacks
 */
export async function syncAllResources(
  resources: PayloadResource[],
  options?: {
    batchSize?: number;
    onProgress?: (current: number, total: number, stats: { synced: number; skipped: number; failed: number }) => void;
  }
): Promise<{ synced: number; skipped: number; failed: number }> {
  const batchSize = options?.batchSize || 50;
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);

    // Process batch concurrently (but not all at once to avoid connection pool exhaustion)
    const results = await Promise.allSettled(
      batch.map(resource => syncResourceToSupabase(resource, 'update'))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.synced) {
          synced++;
        } else {
          skipped++;
        }
      } else {
        failed++;
      }
    }

    options?.onProgress?.(Math.min(i + batchSize, resources.length), resources.length, { synced, skipped, failed });
  }

  console.log(`[Sync] Bulk sync complete: ${synced} synced, ${skipped} skipped, ${failed} failed`);
  return { synced, skipped, failed };
}

export type { PayloadResource };
