/**
 * Scheduled Discovery Orchestrator
 *
 * Manages automatic resource discovery from configured sources.
 * Runs on a schedule via Vercel Cron.
 */

import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { adapterRegistry, discoverResources } from "./adapters";
import { createAuditLog } from "./audit";

export interface DiscoveryRunResult {
  sourceId: number;
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

/**
 * Get all active sources that are due for a scheduled run
 */
async function getActiveSources() {
  const payload = await getPayload({ config });

  const now = new Date();

  const result = await payload.find({
    collection: "resource-sources",
    where: {
      and: [
        { isActive: { equals: true } },
        {
          or: [
            // Never run before
            { "scheduling.lastRunAt": { exists: false } },
            // Due for next run (lastRun + interval <= now)
            // For now, we just get all active sources and filter by interval
          ],
        },
      ],
    },
    limit: 100,
  });

  // Filter sources that are due based on their scanFrequency
  const dueSources = result.docs.filter((source) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = source as any;

    // Skip manual-only sources
    if (src.scanFrequency === "manual") return false;

    const lastScannedAt = src.lastScannedAt;
    if (!lastScannedAt) return true; // Never scanned before

    const intervalHours = getIntervalHours(src.scanFrequency || "weekly");
    const nextRunTime = new Date(lastScannedAt);
    nextRunTime.setHours(nextRunTime.getHours() + intervalHours);

    return now >= nextRunTime;
  });

  return dueSources;
}

/**
 * Convert scanFrequency setting to hours
 */
function getIntervalHours(frequency: string): number {
  switch (frequency) {
    case "daily":
      return 24;
    case "weekly":
      return 168; // 7 * 24
    case "monthly":
      return 720; // 30 * 24
    case "manual":
      return Infinity;
    default:
      return 168; // Default to weekly
  }
}

/**
 * Process a single source for discovery
 */
async function processSource(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any
): Promise<DiscoveryRunResult> {
  const startTime = Date.now();
  const payload = await getPayload({ config });

  try {
    // Get the appropriate adapter
    const adapter = adapterRegistry.getByType(source.type);
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
    const existingResources = await payload.find({
      collection: "resources",
      where: {
        url: { exists: true },
      },
      limit: 10000,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingUrls = new Set(existingResources.docs.map((r: any) => r.url));
    const existingUrlsArray = Array.from(existingUrls) as string[];

    // Run discovery
    const discoveryResult = await discoverResources(adapterConfig, {
      limit: source.settings?.maxResourcesPerRun || 50,
      skipExisting: existingUrlsArray,
    });

    // Filter out duplicates from successful results
    const discoveredResources = discoveryResult.resources || [];
    const newResources = discoveredResources.filter((r) => !existingUrls.has(r.url));
    const duplicateCount = discoveredResources.length - newResources.length;

    // Add new resources to queue
    let queuedCount = 0;
    for (const resource of newResources) {
      try {
        await payload.create({
          collection: "resource-discovery-queue",
          data: {
            url: resource.url,
            title: resource.title,
            description: resource.description,
            // Note: suggestedCategory and suggestedTags are relationship fields
            // that need IDs - they'll be set during manual review
            source: source.id,
            status: "pending",
            priority: "normal",
            // Store GitHub metadata if available
            github: resource.metadata?.github
              ? {
                  owner: resource.metadata.github.owner,
                  repo: resource.metadata.github.repo,
                  stars: resource.metadata.github.stars,
                  forks: resource.metadata.github.forks,
                  language: resource.metadata.github.language,
                  license: resource.metadata.github.license,
                }
              : undefined,
            // Store npm metadata in rawData
            rawData: {
              npm: resource.metadata?.npm,
              topics: resource.metadata?.github?.topics,
              keywords: resource.metadata?.npm?.keywords,
            },
          },
        });
        queuedCount++;
      } catch (err) {
        console.error(`[ScheduledDiscovery] Failed to queue resource: ${resource.url}`, err);
      }
    }

    // Update source last scan time
    await payload.update({
      collection: "resource-sources",
      id: source.id,
      data: {
        lastScannedAt: new Date().toISOString(),
        lastScanStatus: "success",
        resourceCount: (source.resourceCount || 0) + queuedCount,
      },
    });

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
      await payload.update({
        collection: "resource-sources",
        id: source.id,
        data: {
          lastScannedAt: new Date().toISOString(),
          lastScanStatus: "failed",
          lastScanError: error instanceof Error ? error.message : "Unknown error",
        },
      });
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
 * Build adapter config from source settings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAdapterConfig(source: any): Parameters<typeof discoverResources>[0] {
  switch (source.type) {
    case "github_repo":
    case "github_org":
    case "github_search":
      return {
        github: {
          owner: source.settings?.owner,
          repo: source.settings?.repo,
          searchQuery: source.settings?.searchQuery,
          topics: source.settings?.topics,
        },
      };

    case "npm_package":
    case "npm_search":
      return {
        npm: {
          packageName: source.settings?.packageName,
          searchQuery: source.settings?.searchQuery,
          scope: source.settings?.scope,
        },
      };

    case "awesome_list":
      return {
        awesomeList: {
          url: source.url,
          sections: source.settings?.sections,
        },
      };

    case "website":
      return {
        website: {
          url: source.url,
          selectors: source.settings?.selectors,
        },
      };

    default:
      // Return empty config for unknown types
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log(`[ScheduledDiscovery] Processing: ${(source as any).name}`);
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
export async function runSourceDiscovery(
  sourceId: number
): Promise<DiscoveryRunResult> {
  const payload = await getPayload({ config });

  const source = await payload.findByID({
    collection: "resource-sources",
    id: sourceId,
  });

  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  return processSource(source);
}
