/**
 * Scheduled Discovery Orchestrator
 *
 * Manages automatic resource discovery from configured sources.
 * Runs on a schedule via Vercel Cron.
 *
 * Uses Supabase resource_sources table for source configuration.
 */

import "server-only";
import { pool } from "@/lib/db";
import { adapterRegistry, discoverResources, type SourceType } from "./adapters";
import { createAuditLog } from "./audit";

export interface DiscoveryRunResult {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  status: "success" | "failed" | "skipped";
  discoveredCount: number;
  queuedCount: number;
  duplicateCount: number;
  duration: number;
  error?: string;
}

export interface ScheduledDiscoveryResult {
  runId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  sourcesProcessed: number;
  totalDiscovered: number;
  totalQueued: number;
  results: DiscoveryRunResult[];
}

interface ResourceSource {
  id: string;
  name: string;
  type: string;
  url: string;
  github_config: Record<string, unknown>;
  registry_config: Record<string, unknown>;
  awesome_config: Record<string, unknown>;
  default_category: string | null;
  default_tags: string[];
  min_stars: number;
  min_downloads: number;
  scan_frequency: string;
  is_active: boolean;
}

/**
 * Get all active sources that are due for a scheduled run
 */
async function getActiveSources(): Promise<ResourceSource[]> {
  const result = await pool.query<ResourceSource>(`
    SELECT
      id, name, type, url,
      github_config, registry_config, awesome_config,
      default_category, default_tags,
      min_stars, min_downloads,
      scan_frequency, is_active
    FROM resource_sources
    WHERE is_active = TRUE
      AND scan_frequency != 'manual'
      AND (next_scan_at IS NULL OR next_scan_at <= NOW())
    ORDER BY next_scan_at NULLS FIRST
    LIMIT 20
  `);

  return result.rows;
}

/**
 * Process a single source for discovery
 */
async function processSource(source: ResourceSource): Promise<DiscoveryRunResult> {
  const startTime = Date.now();

  try {
    // Get the appropriate adapter based on source type
    const adapterType = mapSourceTypeToAdapter(source.type);
    const adapter = adapterRegistry.getByType(adapterType);

    if (!adapter) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        status: "failed",
        discoveredCount: 0,
        queuedCount: 0,
        duplicateCount: 0,
        duration: Date.now() - startTime,
        error: `No adapter found for source type: ${source.type}`,
      };
    }

    // Build adapter config from source settings
    const adapterConfig = buildAdapterConfig(source);

    // Get existing URLs to detect duplicates
    const existingResult = await pool.query<{ url: string }>(
      `SELECT url FROM resources WHERE url IS NOT NULL`
    );
    const existingUrls = new Set(existingResult.rows.map((r) => r.url));
    const existingUrlsArray = Array.from(existingUrls);

    // Run discovery
    const discoveryResult = await discoverResources(adapterConfig, {
      limit: 50,
      skipExisting: existingUrlsArray,
      minStars: source.min_stars,
      minDownloads: source.min_downloads,
    });

    // Filter out duplicates from successful results
    const discoveredResources = discoveryResult.resources || [];
    const newResources = discoveredResources.filter((r) => !existingUrls.has(r.url));
    const duplicateCount = discoveredResources.length - newResources.length;

    // Add new resources to discovery queue
    let queuedCount = 0;
    for (const resource of newResources) {
      try {
        // Check if already in queue
        const existingQueue = await pool.query(
          `SELECT id FROM resource_discovery_queue WHERE discovered_url = $1`,
          [resource.url]
        );

        if (existingQueue.rows.length === 0) {
          await pool.query(
            `INSERT INTO resource_discovery_queue (
              source_id, discovered_url, discovered_title, discovered_description,
              discovered_data, status
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              source.id,
              resource.url,
              resource.title,
              resource.description,
              JSON.stringify({
                github: resource.metadata?.github,
                npm: resource.metadata?.npm,
                sourceType: resource.sourceType,
                discoveredAt: resource.discoveredAt,
                context: resource.context,
              }),
              "pending",
            ]
          );
          queuedCount++;
        }
      } catch (err) {
        console.error(`[ScheduledDiscovery] Failed to queue resource: ${resource.url}`, err);
      }
    }

    // Update source with scan results
    await pool.query(
      `SELECT mark_source_scanned($1, $2, $3, $4)`,
      [source.id, "success", queuedCount, null]
    );

    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      status: "success",
      discoveredCount: discoveredResources.length,
      queuedCount,
      duplicateCount,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    // Update source with failure status
    try {
      await pool.query(
        `SELECT mark_source_scanned($1, $2, $3, $4)`,
        [source.id, "failed", 0, error instanceof Error ? error.message : "Unknown error"]
      );
    } catch {
      console.error(`[ScheduledDiscovery] Failed to update source status`);
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      status: "failed",
      discoveredCount: 0,
      queuedCount: 0,
      duplicateCount: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Map our source types to adapter types
 */
function mapSourceTypeToAdapter(sourceType: string): SourceType {
  const mapping: Record<string, SourceType> = {
    github_repo: "github_repo",
    github_search: "github_search",
    awesome_list: "awesome_list",
    npm: "npm_search",
    pypi: "npm_search", // Use npm adapter structure for PyPI for now
    website: "website",
    rss: "website",
    api: "website",
    manual: "manual",
  };
  return mapping[sourceType] || (sourceType as SourceType);
}

/**
 * Build adapter config from source settings
 */
function buildAdapterConfig(source: ResourceSource): Parameters<typeof discoverResources>[0] {
  const githubConfig = source.github_config as {
    owner?: string;
    repo?: string;
    searchQuery?: string;
    topics?: string[];
    branch?: string;
    path?: string;
  };

  const registryConfig = source.registry_config as {
    searchQuery?: string;
    scope?: string;
    keywords?: string[];
  };

  const awesomeConfig = source.awesome_config as {
    sections?: string[];
  };

  switch (source.type) {
    case "github_repo":
      return {
        github: {
          owner: githubConfig?.owner,
          repo: githubConfig?.repo,
        },
      };

    case "github_search":
      return {
        github: {
          searchQuery: githubConfig?.searchQuery,
          topics: githubConfig?.topics,
        },
      };

    case "awesome_list":
      return {
        awesomeList: {
          url: source.url,
          sections: awesomeConfig?.sections,
        },
      };

    case "npm":
      return {
        npm: {
          searchQuery: registryConfig?.searchQuery,
          scope: registryConfig?.scope,
        },
      };

    case "pypi":
      // PyPI uses similar structure to npm for now
      return {
        npm: {
          searchQuery: registryConfig?.searchQuery,
        },
      };

    case "website":
    case "rss":
    case "api":
      return {
        website: {
          url: source.url,
        },
      };

    default:
      return {};
  }
}

/**
 * Run scheduled discovery for all due sources
 */
export async function runScheduledDiscovery(): Promise<ScheduledDiscoveryResult> {
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = new Date();

  console.log(`[ScheduledDiscovery] Starting run ${runId}`);

  // Get sources due for discovery
  const sources = await getActiveSources();

  if (sources.length === 0) {
    console.log(`[ScheduledDiscovery] No sources due for discovery`);
    return {
      runId,
      startTime,
      endTime: new Date(),
      totalDuration: Date.now() - startTime.getTime(),
      sourcesProcessed: 0,
      totalDiscovered: 0,
      totalQueued: 0,
      results: [],
    };
  }

  console.log(`[ScheduledDiscovery] Processing ${sources.length} sources`);

  // Process sources sequentially to avoid rate limiting issues
  const results: DiscoveryRunResult[] = [];
  for (const source of sources) {
    console.log(`[ScheduledDiscovery] Processing: ${source.name} (${source.type})`);
    const result = await processSource(source);
    results.push(result);

    // Small delay between sources to be nice to external APIs
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const endTime = new Date();
  const totalDiscovered = results.reduce((sum, r) => sum + r.discoveredCount, 0);
  const totalQueued = results.reduce((sum, r) => sum + r.queuedCount, 0);

  // Log audit entry for the scheduled run
  try {
    await createAuditLog({
      action: "discover",
      collection: "resource-sources",
      userId: "system",
      userEmail: "system@claude-insider.com",
      userName: "Scheduled Discovery",
      userRole: "system",
      context: {
        notes: `Scheduled discovery run: ${runId}`,
        affectedCount: totalQueued,
      },
      status: results.every((r) => r.status === "success")
        ? "success"
        : results.some((r) => r.status === "success")
          ? "partial"
          : "failed",
    });
  } catch {
    console.error(`[ScheduledDiscovery] Failed to create audit log`);
  }

  console.log(
    `[ScheduledDiscovery] Completed run ${runId}: ${totalDiscovered} discovered, ${totalQueued} queued`
  );

  return {
    runId,
    startTime,
    endTime,
    totalDuration: endTime.getTime() - startTime.getTime(),
    sourcesProcessed: sources.length,
    totalDiscovered,
    totalQueued,
    results,
  };
}

/**
 * Manually trigger discovery for a specific source
 */
export async function runSourceDiscovery(sourceId: string): Promise<DiscoveryRunResult> {
  const result = await pool.query<ResourceSource>(
    `SELECT
      id, name, type, url,
      github_config, registry_config, awesome_config,
      default_category, default_tags,
      min_stars, min_downloads,
      scan_frequency, is_active
    FROM resource_sources
    WHERE id = $1`,
    [sourceId]
  );

  const source = result.rows[0];
  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  return processSource(source);
}

/**
 * Get discovery queue statistics
 */
export async function getDiscoveryQueueStats(): Promise<{
  pending: number;
  reviewing: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  const result = await pool.query<{ status: string; count: string }>(`
    SELECT status, COUNT(*) as count
    FROM resource_discovery_queue
    GROUP BY status
  `);

  const stats = {
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  };

  for (const row of result.rows) {
    const count = parseInt(row.count, 10);
    stats.total += count;
    switch (row.status) {
      case "pending":
        stats.pending = count;
        break;
      case "reviewing":
        stats.reviewing = count;
        break;
      case "approved":
        stats.approved = count;
        break;
      case "rejected":
        stats.rejected = count;
        break;
    }
  }

  return stats;
}
