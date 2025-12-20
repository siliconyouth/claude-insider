/**
 * Resource Sources Sync
 *
 * Bidirectional sync between Payload CMS ResourceSources collection
 * and Supabase resource_sources table.
 *
 * Supabase is the source of truth for discovery operations.
 * Payload provides the admin UI for management.
 */

import "server-only";
import { pool } from "@/lib/db";

interface SupabaseSource {
  id: string;
  name: string;
  description: string | null;
  type: string;
  url: string;
  github_config: Record<string, unknown>;
  registry_config: Record<string, unknown>;
  awesome_config: Record<string, unknown>;
  default_category: string | null;
  default_tags: string[];
  auto_approve: boolean;
  min_stars: number;
  min_downloads: number;
  scan_frequency: string;
  is_active: boolean;
  last_scan_at: string | null;
  last_scan_status: string | null;
  last_scan_count: number;
  last_scan_error: string | null;
  next_scan_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PayloadSource {
  id?: string;
  name: string;
  description?: string;
  type: string;
  url: string;
  github?: {
    owner?: string;
    repo?: string;
    branch?: string;
    path?: string;
    searchQuery?: string;
    topics?: string;
  };
  registry?: {
    searchQuery?: string;
    scope?: string;
    keywords?: string;
  };
  discoverySettings?: {
    defaultCategory?: string;
    defaultSubcategory?: string;
    defaultTags?: string[];
    autoApprove?: boolean;
    minStars?: number;
    minDownloads?: number;
    includePatterns?: string;
    excludePatterns?: string;
  };
  isActive?: boolean;
  scanFrequency?: string;
  lastScannedAt?: string;
  lastScanStatus?: string;
  lastScanError?: string;
  resourceCount?: number;
  pendingCount?: number;
  notes?: string;
}

/**
 * Convert Supabase source to Payload format
 */
export function supabaseToPayload(source: SupabaseSource): PayloadSource {
  const githubConfig = source.github_config as {
    owner?: string;
    repo?: string;
    branch?: string;
    path?: string;
    searchQuery?: string;
    topics?: string[];
  };

  const registryConfig = source.registry_config as {
    searchQuery?: string;
    scope?: string;
    keywords?: string[];
  };

  return {
    id: source.id,
    name: source.name,
    description: source.description || undefined,
    type: source.type,
    url: source.url,
    github: {
      owner: githubConfig?.owner,
      repo: githubConfig?.repo,
      branch: githubConfig?.branch || "main",
      path: githubConfig?.path,
      searchQuery: githubConfig?.searchQuery,
      topics: githubConfig?.topics?.join(", "),
    },
    registry: {
      searchQuery: registryConfig?.searchQuery,
      scope: registryConfig?.scope,
      keywords: registryConfig?.keywords?.join(", "),
    },
    discoverySettings: {
      defaultCategory: source.default_category || undefined,
      autoApprove: source.auto_approve,
      minStars: source.min_stars,
      minDownloads: source.min_downloads,
    },
    isActive: source.is_active,
    scanFrequency: source.scan_frequency,
    lastScannedAt: source.last_scan_at || undefined,
    lastScanStatus: source.last_scan_status || "never",
    lastScanError: source.last_scan_error || undefined,
    resourceCount: source.last_scan_count,
  };
}

/**
 * Convert Payload source to Supabase format
 */
export function payloadToSupabase(source: PayloadSource): Partial<SupabaseSource> {
  const githubConfig: Record<string, unknown> = {};
  if (source.github) {
    if (source.github.owner) githubConfig.owner = source.github.owner;
    if (source.github.repo) githubConfig.repo = source.github.repo;
    if (source.github.branch) githubConfig.branch = source.github.branch;
    if (source.github.path) githubConfig.path = source.github.path;
    if (source.github.searchQuery) githubConfig.searchQuery = source.github.searchQuery;
    if (source.github.topics) {
      githubConfig.topics = source.github.topics.split(",").map((t) => t.trim());
    }
  }

  const registryConfig: Record<string, unknown> = {};
  if (source.registry) {
    if (source.registry.searchQuery) registryConfig.searchQuery = source.registry.searchQuery;
    if (source.registry.scope) registryConfig.scope = source.registry.scope;
    if (source.registry.keywords) {
      registryConfig.keywords = source.registry.keywords.split(",").map((k) => k.trim());
    }
  }

  return {
    id: source.id,
    name: source.name,
    description: source.description || null,
    type: source.type,
    url: source.url,
    github_config: githubConfig,
    registry_config: registryConfig,
    default_category: source.discoverySettings?.defaultCategory || null,
    auto_approve: source.discoverySettings?.autoApprove || false,
    min_stars: source.discoverySettings?.minStars || 0,
    min_downloads: source.discoverySettings?.minDownloads || 0,
    scan_frequency: source.scanFrequency || "weekly",
    is_active: source.isActive !== false,
  };
}

/**
 * Get all sources from Supabase
 */
export async function getSupabaseSources(): Promise<SupabaseSource[]> {
  const result = await pool.query<SupabaseSource>(`
    SELECT * FROM resource_sources ORDER BY type, name
  `);
  return result.rows;
}

/**
 * Upsert a source to Supabase (create or update)
 */
export async function upsertSupabaseSource(source: PayloadSource): Promise<string> {
  const data = payloadToSupabase(source);

  if (source.id) {
    // Update existing
    await pool.query(
      `UPDATE resource_sources SET
        name = $1, description = $2, type = $3, url = $4,
        github_config = $5, registry_config = $6,
        default_category = $7, auto_approve = $8,
        min_stars = $9, min_downloads = $10,
        scan_frequency = $11, is_active = $12,
        updated_at = NOW()
      WHERE id = $13`,
      [
        data.name,
        data.description,
        data.type,
        data.url,
        JSON.stringify(data.github_config || {}),
        JSON.stringify(data.registry_config || {}),
        data.default_category,
        data.auto_approve,
        data.min_stars,
        data.min_downloads,
        data.scan_frequency,
        data.is_active,
        source.id,
      ]
    );
    return source.id;
  } else {
    // Insert new
    const result = await pool.query<{ id: string }>(
      `INSERT INTO resource_sources (
        name, description, type, url,
        github_config, registry_config,
        default_category, auto_approve,
        min_stars, min_downloads,
        scan_frequency, is_active, next_scan_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id`,
      [
        data.name,
        data.description,
        data.type,
        data.url,
        JSON.stringify(data.github_config || {}),
        JSON.stringify(data.registry_config || {}),
        data.default_category,
        data.auto_approve,
        data.min_stars,
        data.min_downloads,
        data.scan_frequency,
        data.is_active,
      ]
    );
    return result.rows[0]!.id;
  }
}

/**
 * Delete a source from Supabase
 */
export async function deleteSupabaseSource(id: string): Promise<void> {
  // First delete any queue items from this source
  await pool.query(`DELETE FROM resource_discovery_queue WHERE source_id = $1`, [id]);
  // Then delete the source
  await pool.query(`DELETE FROM resource_sources WHERE id = $1`, [id]);
}

/**
 * Sync all Supabase sources to Payload CMS
 * This is a one-way sync: Supabase → Payload
 */
export async function syncToPayload(payload: {
  find: (args: { collection: string }) => Promise<{ docs: PayloadSource[] }>;
  create: (args: { collection: string; data: PayloadSource }) => Promise<PayloadSource>;
  update: (args: { collection: string; id: string; data: Partial<PayloadSource> }) => Promise<PayloadSource>;
}): Promise<{ created: number; updated: number }> {
  const supabaseSources = await getSupabaseSources();
  const { docs: payloadSources } = await payload.find({ collection: "resource-sources" });

  // Map payload sources by their Supabase ID (stored in notes or matched by URL)
  const payloadByUrl = new Map(payloadSources.map((s) => [s.url, s]));

  let created = 0;
  let updated = 0;

  for (const source of supabaseSources) {
    const payloadData = supabaseToPayload(source);
    const existing = payloadByUrl.get(source.url);

    if (existing?.id) {
      await payload.update({
        collection: "resource-sources",
        id: existing.id,
        data: payloadData,
      });
      updated++;
    } else {
      await payload.create({
        collection: "resource-sources",
        data: payloadData,
      });
      created++;
    }
  }

  return { created, updated };
}

/**
 * Get queue counts for a source
 */
export async function getSourceQueueCounts(sourceId: string): Promise<{
  pending: number;
  approved: number;
  rejected: number;
}> {
  const result = await pool.query<{ status: string; count: string }>(
    `SELECT status, COUNT(*) as count
     FROM resource_discovery_queue
     WHERE source_id = $1
     GROUP BY status`,
    [sourceId]
  );

  return {
    pending: parseInt(result.rows.find((r) => r.status === "pending")?.count || "0", 10),
    approved: parseInt(result.rows.find((r) => r.status === "approved")?.count || "0", 10),
    rejected: parseInt(result.rows.find((r) => r.status === "rejected")?.count || "0", 10),
  };
}
