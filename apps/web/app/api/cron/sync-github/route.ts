/**
 * GitHub Stats Sync Cron Endpoint
 *
 * GET /api/cron/sync-github
 *
 * Triggered by Vercel Cron to sync GitHub stats for all resources.
 * Also syncs npm and PyPI download counts.
 * Protected by CRON_SECRET environment variable.
 *
 * Schedule: Every 6 hours (cron: "0 3,9,15,21 * * *")
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

interface ResourceToSync {
  id: string;
  slug: string;
  github_owner: string | null;
  github_repo: string | null;
  npm_package: string | null;
  pypi_package: string | null;
}

interface SyncResult {
  id: string;
  slug: string;
  success: boolean;
  github?: {
    stars: number;
    forks: number;
    issues: number;
    language: string | null;
    lastCommit: string | null;
    contributors: number;
  };
  npm?: { weeklyDownloads: number };
  pypi?: { monthlyDownloads: number };
  error?: string;
}

/**
 * Fetch GitHub repository stats
 */
async function fetchGitHubStats(owner: string, repo: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ClaudeInsider/1.0",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  // Fetch contributors count separately (not included in repo response)
  let contributorsCount = 0;
  try {
    const contribResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ClaudeInsider/1.0",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 0 },
      }
    );
    // GitHub returns Link header with total count
    const linkHeader = contribResponse.headers.get("Link");
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      contributorsCount = match?.[1] ? parseInt(match[1], 10) : 1;
    } else if (contribResponse.ok) {
      const contribData = await contribResponse.json();
      contributorsCount = contribData.length;
    }
  } catch {
    // Silently fail contributors count
  }

  return {
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    issues: data.open_issues_count || 0,
    language: data.language || null,
    lastCommit: data.pushed_at || null,
    contributors: contributorsCount,
  };
}

/**
 * Fetch npm weekly downloads
 */
async function fetchNpmDownloads(packageName: string): Promise<number> {
  const response = await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`,
    { next: { revalidate: 0 } }
  );

  if (!response.ok) {
    throw new Error(`npm API error: ${response.status}`);
  }

  const data = await response.json();
  return data.downloads || 0;
}

/**
 * Fetch PyPI monthly downloads
 */
async function fetchPyPIDownloads(packageName: string): Promise<number> {
  // PyPI stats API via pypistats.org
  const response = await fetch(
    `https://pypistats.org/api/packages/${encodeURIComponent(packageName)}/recent`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`PyPI stats API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.last_month || 0;
}

/**
 * Sync a single resource
 */
async function syncResource(resource: ResourceToSync): Promise<SyncResult> {
  const result: SyncResult = {
    id: resource.id,
    slug: resource.slug,
    success: true,
  };

  try {
    // Sync GitHub stats if available
    if (resource.github_owner && resource.github_repo) {
      try {
        result.github = await fetchGitHubStats(
          resource.github_owner,
          resource.github_repo
        );
      } catch (error) {
        console.warn(
          `[Sync] GitHub error for ${resource.slug}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    // Sync npm downloads if available
    if (resource.npm_package) {
      try {
        result.npm = {
          weeklyDownloads: await fetchNpmDownloads(resource.npm_package),
        };
      } catch (error) {
        console.warn(
          `[Sync] npm error for ${resource.slug}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    // Sync PyPI downloads if available
    if (resource.pypi_package) {
      try {
        result.pypi = {
          monthlyDownloads: await fetchPyPIDownloads(resource.pypi_package),
        };
      } catch (error) {
        console.warn(
          `[Sync] PyPI error for ${resource.slug}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    // Update database
    await pool.query(
      `UPDATE resources SET
        github_stars = COALESCE($1, github_stars),
        github_forks = COALESCE($2, github_forks),
        github_issues = COALESCE($3, github_issues),
        github_language = COALESCE($4, github_language),
        github_last_commit = COALESCE($5, github_last_commit),
        github_contributors = COALESCE($6, github_contributors),
        npm_downloads_weekly = COALESCE($7, npm_downloads_weekly),
        pypi_downloads_monthly = COALESCE($8, pypi_downloads_monthly),
        last_synced_at = NOW(),
        updated_at = NOW()
      WHERE id = $9`,
      [
        result.github?.stars ?? null,
        result.github?.forks ?? null,
        result.github?.issues ?? null,
        result.github?.language ?? null,
        result.github?.lastCommit ?? null,
        result.github?.contributors ?? null,
        result.npm?.weeklyDownloads ?? null,
        result.pypi?.monthlyDownloads ?? null,
        resource.id,
      ]
    );

    return result;
  } catch (error) {
    return {
      ...result,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Verify the request is from Vercel Cron or has the secret
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      const isVercelCron = request.headers.get("x-vercel-cron") === "true";
      const hasValidSecret =
        cronSecret && authHeader === `Bearer ${cronSecret}`;

      if (!isVercelCron && !hasValidSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Cron] Starting GitHub stats sync...");

    // Get all resources that have GitHub, npm, or PyPI data to sync
    const resourcesResult = await pool.query<ResourceToSync>(
      `SELECT id, slug, github_owner, github_repo, npm_package, pypi_package
       FROM resources
       WHERE is_published = TRUE
         AND (github_owner IS NOT NULL OR npm_package IS NOT NULL OR pypi_package IS NOT NULL)
       ORDER BY
         CASE WHEN last_synced_at IS NULL THEN 0 ELSE 1 END,
         last_synced_at ASC
       LIMIT 50`
    );

    const resources = resourcesResult.rows;
    console.log(`[Cron] Found ${resources.length} resources to sync`);

    // Process resources with rate limiting (avoid hitting API limits)
    const results: SyncResult[] = [];
    for (const resource of resources) {
      const result = await syncResource(resource);
      results.push(result);

      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Sync completed: ${successCount} success, ${failureCount} failed in ${Math.round(duration / 1000)}s`
    );

    return NextResponse.json({
      success: true,
      summary: {
        total: resources.length,
        success: successCount,
        failed: failureCount,
        duration: `${Math.round(duration / 1000)}s`,
      },
      results: results.map((r) => ({
        slug: r.slug,
        success: r.success,
        github: r.github
          ? {
              stars: r.github.stars,
              forks: r.github.forks,
              issues: r.github.issues,
            }
          : undefined,
        npm: r.npm?.weeklyDownloads,
        pypi: r.pypi?.monthlyDownloads,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("[Cron] GitHub sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
