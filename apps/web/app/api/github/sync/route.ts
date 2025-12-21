import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

interface SyncRequest {
  owner: string;
  repo: string;
  content: string;
  branch?: string;
  commitMessage?: string;
}

interface GitHubFileResponse {
  sha: string;
  content?: string;
}

/**
 * POST /api/github/sync
 * Sync CLAUDE.md content to a GitHub repository
 *
 * Creates or updates the CLAUDE.md file in the specified repo.
 * Uses the user's stored OAuth token for authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SyncRequest = await request.json();
    const { owner, repo, content, branch = "main", commitMessage } = body;

    if (!owner || !repo || !content) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, content" },
        { status: 400 }
      );
    }

    // Get user's GitHub access token
    const accountResult = await pool.query(
      `SELECT "accessToken" FROM account
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

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${account.accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Claude-Insider",
    };

    // Check if CLAUDE.md already exists to get its SHA (required for updates)
    let existingSha: string | null = null;
    try {
      const existingResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/CLAUDE.md?ref=${branch}`,
        { headers }
      );

      if (existingResponse.ok) {
        const existingFile: GitHubFileResponse = await existingResponse.json();
        existingSha = existingFile.sha;
      } else if (existingResponse.status !== 404) {
        // 404 is expected for new files, other errors should be handled
        if (existingResponse.status === 401) {
          return NextResponse.json(
            { error: "GitHub token expired. Please reconnect your account.", needsReconnect: true },
            { status: 401 }
          );
        }
        throw new Error(`GitHub API error: ${existingResponse.status}`);
      }
    } catch (error) {
      // If it's a network error or unexpected error, throw it
      if (error instanceof Error && error.message.includes("GitHub API error")) {
        throw error;
      }
      // Otherwise, assume file doesn't exist and proceed with creation
    }

    // Create or update CLAUDE.md
    const message =
      commitMessage ||
      (existingSha
        ? "Update CLAUDE.md via Claude Insider"
        : "Add CLAUDE.md via Claude Insider");

    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/CLAUDE.md`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          branch,
          ...(existingSha && { sha: existingSha }),
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();

      if (updateResponse.status === 401) {
        return NextResponse.json(
          { error: "GitHub token expired. Please reconnect your account.", needsReconnect: true },
          { status: 401 }
        );
      }

      if (updateResponse.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or insufficient permissions" },
          { status: 404 }
        );
      }

      if (updateResponse.status === 409) {
        return NextResponse.json(
          { error: "Conflict: file was modified. Please try again." },
          { status: 409 }
        );
      }

      throw new Error(errorData.message || `GitHub API error: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();

    return NextResponse.json({
      success: true,
      message: existingSha ? "CLAUDE.md updated" : "CLAUDE.md created",
      commit: {
        sha: result.commit?.sha,
        url: result.commit?.html_url,
      },
      file: {
        path: result.content?.path,
        url: result.content?.html_url,
      },
    });
  } catch (error) {
    console.error("GitHub sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync CLAUDE.md" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/github/sync
 * Check if CLAUDE.md exists in a repository
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing required query params: owner, repo" },
        { status: 400 }
      );
    }

    // Get user's GitHub access token
    const accountResult = await pool.query(
      `SELECT "accessToken" FROM account
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

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${account.accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Claude-Insider",
    };

    // Check if CLAUDE.md exists
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/CLAUDE.md?ref=${branch}`,
      { headers }
    );

    if (response.status === 404) {
      return NextResponse.json({
        exists: false,
        repo: `${owner}/${repo}`,
        branch,
      });
    }

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "GitHub token expired. Please reconnect your account.", needsReconnect: true },
          { status: 401 }
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const file: GitHubFileResponse = await response.json();

    // Decode content from base64
    const content = file.content
      ? Buffer.from(file.content, "base64").toString("utf-8")
      : null;

    return NextResponse.json({
      exists: true,
      repo: `${owner}/${repo}`,
      branch,
      sha: file.sha,
      content,
    });
  } catch (error) {
    console.error("GitHub sync check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check CLAUDE.md" },
      { status: 500 }
    );
  }
}
