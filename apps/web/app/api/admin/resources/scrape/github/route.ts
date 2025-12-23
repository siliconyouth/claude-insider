/**
 * GitHub Repository Scraping API
 *
 * POST /api/admin/resources/scrape/github
 *
 * Fetches repository data from GitHub API.
 * Requires admin or moderator authentication.
 *
 * Request body:
 * - owner: string (required) - Repository owner
 * - repo: string (required) - Repository name
 * - includeReadme: boolean (optional) - Fetch README content
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  license: { name: string; spdx_id: string } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  default_branch: string;
  archived: boolean;
  disabled: boolean;
}

interface GitHubReadme {
  content: string;
  encoding: string;
  name: string;
  path: string;
}

async function fetchGitHubRepo(
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function fetchGitHubReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          ...(process.env.GITHUB_TOKEN && {
            // eslint-disable-next-line turbo/no-undeclared-env-vars
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: GitHubReadme = await response.json();
    if (data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return data.content;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Extract the payload-token from cookies
    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user using Payload's auth
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

    // Parse request body
    const body = await request.json();
    const { owner, repo, includeReadme = false, url } = body;

    // Parse owner/repo from URL if provided
    let parsedOwner = owner;
    let parsedRepo = repo;

    if (url && typeof url === "string") {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match && match[1] && match[2]) {
        parsedOwner = match[1];
        parsedRepo = match[2].replace(/\.git$/, "");
      }
    }

    if (!parsedOwner || !parsedRepo) {
      return NextResponse.json(
        { error: "Owner and repo are required (or provide a GitHub URL)" },
        { status: 400 }
      );
    }

    // Fetch repository data
    const repoData = await fetchGitHubRepo(parsedOwner, parsedRepo);

    // Optionally fetch README
    let readme: string | null = null;
    if (includeReadme) {
      readme = await fetchGitHubReadme(parsedOwner, parsedRepo);
    }

    // Determine status based on repo state
    let status: "official" | "community" | "beta" | "deprecated" = "community";
    if (repoData.archived) {
      status = "deprecated";
    } else if (repoData.owner.login === "anthropics") {
      status = "official";
    } else if (
      repoData.topics.includes("beta") ||
      repoData.topics.includes("experimental")
    ) {
      status = "beta";
    }

    // Map to resource-friendly format
    const result = {
      success: true,
      github: {
        owner: repoData.owner.login,
        repo: repoData.name,
        fullName: repoData.full_name,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        watchers: repoData.watchers_count,
        language: repoData.language,
        topics: repoData.topics,
        license: repoData.license?.spdx_id || repoData.license?.name || null,
        lastCommit: repoData.pushed_at,
        createdAt: repoData.created_at,
        defaultBranch: repoData.default_branch,
        archived: repoData.archived,
        ownerType: repoData.owner.type,
        ownerAvatar: repoData.owner.avatar_url,
      },
      suggested: {
        title: repoData.name,
        description: repoData.description || "",
        url: repoData.html_url,
        homepage: repoData.homepage || null,
        tags: repoData.topics.slice(0, 10),
        status,
      },
      readme: readme
        ? readme.length > 10000
          ? readme.slice(0, 10000) + "\n\n[Truncated...]"
          : readme
        : null,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GitHub scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GitHub fetch failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to fetch GitHub repository data",
    examples: {
      byOwnerRepo: { owner: "anthropics", repo: "claude-code" },
      byUrl: { url: "https://github.com/anthropics/claude-code" },
      withReadme: {
        owner: "anthropics",
        repo: "claude-code",
        includeReadme: true,
      },
    },
  });
}
