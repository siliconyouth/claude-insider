/**
 * npm Package Scraping API
 *
 * POST /api/admin/resources/scrape/npm
 *
 * Fetches package data from npm registry.
 * Requires admin or moderator authentication.
 *
 * Request body:
 * - package: string (required) - Package name (e.g., "@anthropic-ai/sdk")
 * - search: string (optional) - Search query for discovering packages
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";

interface NpmPackage {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  license?: string;
  author?:
    | string
    | {
        name: string;
        email?: string;
        url?: string;
      };
  maintainers?: { name: string; email: string }[];
  readme?: string;
  time?: {
    created: string;
    modified: string;
    [version: string]: string;
  };
}

interface NpmDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface NpmSearchResult {
  package: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    links: {
      npm: string;
      homepage?: string;
      repository?: string;
    };
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

async function fetchNpmPackage(packageName: string): Promise<NpmPackage> {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`npm API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Get latest version info
  const latestVersion = data["dist-tags"]?.latest;
  const versionInfo = latestVersion ? data.versions?.[latestVersion] : {};

  return {
    name: data.name,
    version: latestVersion || "unknown",
    description: data.description,
    keywords: data.keywords,
    homepage: versionInfo.homepage || data.homepage,
    repository: versionInfo.repository || data.repository,
    license: versionInfo.license || data.license,
    author: versionInfo.author || data.author,
    maintainers: data.maintainers,
    readme: data.readme,
    time: data.time,
  };
}

async function fetchNpmDownloads(packageName: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`
    );

    if (!response.ok) {
      return 0;
    }

    const data: NpmDownloads = await response.json();
    return data.downloads || 0;
  } catch {
    return 0;
  }
}

async function searchNpmPackages(
  query: string,
  limit = 20
): Promise<NpmSearchResult[]> {
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`
  );

  if (!response.ok) {
    throw new Error(`npm search error: ${response.status}`);
  }

  const data = await response.json();
  return data.objects || [];
}

function parseGitHubFromRepository(
  repo: NpmPackage["repository"]
): { owner: string; repo: string } | null {
  if (!repo?.url) return null;

  // Handle various GitHub URL formats
  const url = repo.url
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/\.git$/, "");

  const match = url.match(/github\.com[/:]([^/]+)\/([^/]+)/);
  if (match && match[1] && match[2]) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
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
    const {
      package: packageName,
      search,
      limit = 20,
      includeReadme = false,
    } = body;

    // Search mode
    if (search) {
      const results = await searchNpmPackages(search, limit);

      return NextResponse.json({
        success: true,
        mode: "search",
        query: search,
        results: results.map((r) => ({
          name: r.package.name,
          version: r.package.version,
          description: r.package.description,
          keywords: r.package.keywords,
          links: r.package.links,
          score: r.score,
        })),
        searchedAt: new Date().toISOString(),
      });
    }

    // Package info mode
    if (!packageName) {
      return NextResponse.json(
        { error: "Package name or search query is required" },
        { status: 400 }
      );
    }

    // Fetch package data
    const pkgData = await fetchNpmPackage(packageName);
    const weeklyDownloads = await fetchNpmDownloads(packageName);
    const github = parseGitHubFromRepository(pkgData.repository);

    // Determine status
    let status: "official" | "community" | "beta" | "deprecated" = "community";
    if (
      packageName.startsWith("@anthropic-ai/") ||
      packageName === "anthropic"
    ) {
      status = "official";
    } else if (
      pkgData.keywords?.includes("beta") ||
      pkgData.keywords?.includes("experimental")
    ) {
      status = "beta";
    }

    // Format author
    let authorName: string | null = null;
    if (typeof pkgData.author === "string") {
      authorName = pkgData.author;
    } else if (pkgData.author?.name) {
      authorName = pkgData.author.name;
    }

    const result = {
      success: true,
      mode: "package",
      package: {
        name: pkgData.name,
        version: pkgData.version,
        description: pkgData.description || "",
        keywords: pkgData.keywords || [],
        weeklyDownloads,
        license: pkgData.license || null,
        author: authorName,
        homepage: pkgData.homepage || null,
        repository: pkgData.repository?.url || null,
        createdAt: pkgData.time?.created || null,
        lastPublished: pkgData.time?.modified || null,
      },
      github,
      suggested: {
        title: pkgData.name,
        description: pkgData.description || "",
        url: `https://www.npmjs.com/package/${pkgData.name}`,
        tags: (pkgData.keywords || []).slice(0, 10),
        status,
      },
      readme: includeReadme
        ? pkgData.readme
          ? pkgData.readme.length > 10000
            ? pkgData.readme.slice(0, 10000) + "\n\n[Truncated...]"
            : pkgData.readme
          : null
        : null,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("npm scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "npm fetch failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to fetch npm package data or search packages",
    examples: {
      package: { package: "@anthropic-ai/sdk" },
      packageWithReadme: { package: "@anthropic-ai/sdk", includeReadme: true },
      search: { search: "claude ai", limit: 10 },
    },
  });
}
