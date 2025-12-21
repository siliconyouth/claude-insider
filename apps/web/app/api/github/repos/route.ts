import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  pushed_at: string;
  language: string | null;
}

/**
 * GET /api/github/repos
 * List user's GitHub repositories for CLAUDE.md sync
 */
export async function GET() {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's GitHub access token
    const accountResult = await pool.query(
      `SELECT "accessToken", "accountId" FROM account
       WHERE "userId" = $1 AND "providerId" = 'github'`,
      [session.user.id]
    );

    const account = accountResult.rows[0];
    if (!account?.accessToken) {
      return NextResponse.json(
        { error: "GitHub account not connected", needsReconnect: true },
        { status: 400 }
      );
    }

    // Fetch user's repositories from GitHub API
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore && page <= 5) {
      // Max 500 repos
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=pushed&affiliation=owner`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${account.accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Claude-Insider",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          return NextResponse.json(
            { error: "GitHub token expired. Please reconnect your account.", needsReconnect: true },
            { status: 401 }
          );
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const pageRepos = await response.json();
      repos.push(...pageRepos);

      hasMore = pageRepos.length === perPage;
      page++;
    }

    // Return simplified repo list
    const simplifiedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      lastPush: repo.pushed_at,
      language: repo.language,
    }));

    return NextResponse.json({
      repos: simplifiedRepos,
      githubUsername: account.accountId,
    });
  } catch (error) {
    console.error("GitHub repos fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
