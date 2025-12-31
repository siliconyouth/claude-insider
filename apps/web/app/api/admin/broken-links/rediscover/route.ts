/**
 * Auto-Rediscover Broken Links API
 *
 * POST - Attempt to find new URLs for resources with broken links
 *
 * Searches GitHub and npm for resources by name/title.
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

interface RediscoverResult {
  resourceId: string;
  resourceTitle: string;
  originalUrl: string;
  suggestedUrl: string | null;
  source: string | null;
  status: "found" | "not_found" | "error";
  error?: string;
}

/**
 * Search GitHub for a repository by name
 */
async function searchGitHub(name: string): Promise<string | null> {
  try {
    // Clean up the name for search
    const searchName = name
      .replace(/^@/, "") // Remove @ prefix
      .replace(/\//g, " ") // Replace / with space
      .trim();

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(searchName)}&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ClaudeInsider/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      // Return the first result's URL
      return data.items[0].html_url;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Encode npm package name for registry API
 * Scoped packages like @scope/name need special encoding: @scope%2Fname
 */
function encodeNpmPackageName(packageName: string): string {
  if (packageName.startsWith("@")) {
    return "@" + encodeURIComponent(packageName.slice(1));
  }
  return encodeURIComponent(packageName);
}

/**
 * Check if an npm package exists using the registry API
 */
async function checkNpmPackageExists(packageName: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeNpmPackageName(packageName)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "ClaudeInsider/1.0",
        },
      }
    );
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Get npm package details from registry API
 */
async function getNpmPackageDetails(
  packageName: string
): Promise<{ homepage?: string; repository?: string } | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeNpmPackageName(packageName)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClaudeInsider/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      homepage: data.homepage || undefined,
      repository:
        typeof data.repository === "string"
          ? data.repository
          : data.repository?.url?.replace(/^git\+/, "").replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

/**
 * Search npm for a package by name using registry API
 */
async function searchNpm(name: string): Promise<string | null> {
  try {
    // First, try exact package name lookup via registry
    const exactName = name.startsWith("@") ? name : name.split("/").pop() || name;

    if (await checkNpmPackageExists(exactName)) {
      const details = await getNpmPackageDetails(exactName);
      // Prefer homepage or repository, fallback to npm page
      if (details?.homepage) return details.homepage;
      if (details?.repository) return details.repository;
      return `https://www.npmjs.com/package/${exactName}`;
    }

    // If exact match not found, search the registry
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(exactName)}&size=5`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClaudeInsider/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.objects && data.objects.length > 0) {
      const pkg = data.objects[0].package;
      // Verify the package actually exists before suggesting
      if (await checkNpmPackageExists(pkg.name)) {
        // Prefer homepage or repository URL, fallback to npm page
        if (pkg.links?.homepage) return pkg.links.homepage;
        if (pkg.links?.repository) return pkg.links.repository;
        return `https://www.npmjs.com/package/${pkg.name}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Try to find a new URL for a resource
 */
async function findNewUrl(
  title: string,
  originalUrl: string
): Promise<{ url: string | null; source: string | null }> {
  // Determine the likely source type from the original URL
  const isNpm =
    originalUrl.includes("npmjs.com") || originalUrl.includes("npm");
  // Note: isGitHub and isPyPI reserved for future source-specific logic
  const _isGitHub = originalUrl.includes("github.com");
  const _isPyPI = originalUrl.includes("pypi.org");

  // Try npm first if it was an npm package
  if (isNpm || title.startsWith("@")) {
    const npmUrl = await searchNpm(title);
    if (npmUrl) return { url: npmUrl, source: "npm" };
  }

  // Try GitHub
  const githubUrl = await searchGitHub(title);
  if (githubUrl) return { url: githubUrl, source: "github" };

  // If original was npm but GitHub search worked, try npm as fallback
  if (!isNpm) {
    const npmUrl = await searchNpm(title);
    if (npmUrl) return { url: npmUrl, source: "npm" };
  }

  return { url: null, source: null };
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !hasMinRole(session.user.role as UserRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const body = await request.json();
    const { limit = 20 } = body;

    // Get pending broken links
    const { rows: brokenLinks } = await pool.query(
      `SELECT
        v.resource_id,
        r.title,
        r.slug,
        v.url as original_url
      FROM resource_link_validations v
      INNER JOIN resources r ON r.id = v.resource_id
      LEFT JOIN broken_link_queue q ON q.resource_id = v.resource_id
      WHERE v.is_valid = false
        AND (q.id IS NULL OR q.status = 'pending')
      ORDER BY v.last_checked_at DESC
      LIMIT $1`,
      [limit]
    );

    if (brokenLinks.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: "No broken links to rediscover",
      });
    }

    const results: RediscoverResult[] = [];

    for (const link of brokenLinks) {
      try {
        // Rate limit: 500ms between searches
        await new Promise((r) => setTimeout(r, 500));

        const { url: suggestedUrl, source } = await findNewUrl(
          link.title,
          link.original_url
        );

        if (suggestedUrl) {
          // Update the queue with suggested URL
          await pool.query(
            `INSERT INTO broken_link_queue (resource_id, original_url, suggested_url, status)
             VALUES ($1, $2, $3, 'pending')
             ON CONFLICT (resource_id)
             DO UPDATE SET suggested_url = $3, updated_at = NOW()`,
            [link.resource_id, link.original_url, suggestedUrl]
          );

          results.push({
            resourceId: link.resource_id,
            resourceTitle: link.title,
            originalUrl: link.original_url,
            suggestedUrl,
            source,
            status: "found",
          });
        } else {
          results.push({
            resourceId: link.resource_id,
            resourceTitle: link.title,
            originalUrl: link.original_url,
            suggestedUrl: null,
            source: null,
            status: "not_found",
          });
        }
      } catch (error) {
        results.push({
          resourceId: link.resource_id,
          resourceTitle: link.title,
          originalUrl: link.original_url,
          suggestedUrl: null,
          source: null,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const found = results.filter((r) => r.status === "found").length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        found,
        notFound: results.filter((r) => r.status === "not_found").length,
        errors: results.filter((r) => r.status === "error").length,
      },
      message: `Found ${found} potential replacements out of ${results.length} resources`,
    });
  } catch (error) {
    console.error("[BrokenLinks] Rediscover error:", error);
    return NextResponse.json(
      { error: "Failed to rediscover resources" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
