/**
 * Admin Resource Sync API
 *
 * POST /api/admin/resources/[slug]/sync - Force sync stats from external sources
 *
 * Syncs GitHub stars, npm downloads, PyPI downloads, etc.
 * Requires admin or moderator authentication.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { hasRole } from "@/collections/Users";
import { pool } from "@/lib/db";
import {
  updateGitHubStats,
  updateNpmStats,
  updatePyPiStats,
} from "@/lib/resources/mutations";

type Params = Promise<{ slug: string }>;

interface GitHubResponse {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  language: string;
}

interface NpmResponse {
  downloads: number;
}

interface PyPiResponse {
  data: { last_month: number };
}

/**
 * Force sync resource stats from external sources
 */
export async function POST(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get resource info
    const resourceResult = await pool.query(
      `SELECT id, github_owner, github_repo, npm_package, pypi_package
       FROM resources WHERE slug = $1`,
      [slug]
    );

    if (resourceResult.rows.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resource = resourceResult.rows[0];
    const syncResults: Record<string, unknown> = {};

    // Sync GitHub stats if available
    if (resource.github_owner && resource.github_repo) {
      try {
        const ghResponse = await fetch(
          `https://api.github.com/repos/${resource.github_owner}/${resource.github_repo}`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              ...(process.env.GITHUB_TOKEN
                ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                : {}),
            },
          }
        );

        if (ghResponse.ok) {
          const ghData: GitHubResponse = await ghResponse.json();
          await updateGitHubStats(slug, {
            stars: ghData.stargazers_count,
            forks: ghData.forks_count,
            issues: ghData.open_issues_count,
            lastCommit: ghData.pushed_at,
            language: ghData.language,
          });
          syncResults.github = {
            success: true,
            stars: ghData.stargazers_count,
            forks: ghData.forks_count,
          };
        } else {
          syncResults.github = {
            success: false,
            error: `GitHub API returned ${ghResponse.status}`,
          };
        }
      } catch (error) {
        syncResults.github = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Sync npm stats if available
    if (resource.npm_package) {
      try {
        const npmResponse = await fetch(
          `https://api.npmjs.org/downloads/point/last-week/${resource.npm_package}`
        );

        if (npmResponse.ok) {
          const npmData: NpmResponse = await npmResponse.json();
          await updateNpmStats(slug, npmData.downloads);
          syncResults.npm = {
            success: true,
            weeklyDownloads: npmData.downloads,
          };
        } else {
          syncResults.npm = {
            success: false,
            error: `npm API returned ${npmResponse.status}`,
          };
        }
      } catch (error) {
        syncResults.npm = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Sync PyPI stats if available
    if (resource.pypi_package) {
      try {
        const pypiResponse = await fetch(
          `https://pypistats.org/api/packages/${resource.pypi_package}/recent`
        );

        if (pypiResponse.ok) {
          const pypiData: PyPiResponse = await pypiResponse.json();
          await updatePyPiStats(slug, pypiData.data.last_month);
          syncResults.pypi = {
            success: true,
            monthlyDownloads: pypiData.data.last_month,
          };
        } else {
          syncResults.pypi = {
            success: false,
            error: `PyPI API returned ${pypiResponse.status}`,
          };
        }
      } catch (error) {
        syncResults.pypi = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      success: true,
      slug,
      syncResults,
      message: "Sync completed",
    });
  } catch (error) {
    console.error("Sync resource error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
