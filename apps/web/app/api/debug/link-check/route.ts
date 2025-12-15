/**
 * Link Check API
 *
 * Validates all internal website links and reports broken URLs.
 * Used by the diagnostics page to verify site integrity.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { pool } from "@/lib/db";

// All known internal routes to check
const INTERNAL_ROUTES = [
  // Main pages
  "/",
  "/docs",
  "/resources",
  "/changelog",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/accessibility",
  "/rss.xml",

  // Getting Started
  "/docs/getting-started",
  "/docs/getting-started/installation",
  "/docs/getting-started/quickstart",
  "/docs/getting-started/troubleshooting",
  "/docs/getting-started/migration",

  // Configuration
  "/docs/configuration",
  "/docs/configuration/claude-md",
  "/docs/configuration/settings",
  "/docs/configuration/environment",
  "/docs/configuration/permissions",

  // Tips & Tricks
  "/docs/tips-and-tricks",
  "/docs/tips-and-tricks/prompting",
  "/docs/tips-and-tricks/productivity",
  "/docs/tips-and-tricks/advanced-prompting",
  "/docs/tips-and-tricks/debugging",

  // API
  "/docs/api",
  "/docs/api/authentication",
  "/docs/api/tool-use",
  "/docs/api/streaming",
  "/docs/api/error-handling",
  "/docs/api/rate-limits",
  "/docs/api/models",

  // Integrations
  "/docs/integrations",
  "/docs/integrations/mcp-servers",
  "/docs/integrations/ide-plugins",
  "/docs/integrations/hooks",
  "/docs/integrations/github-actions",
  "/docs/integrations/docker",
  "/docs/integrations/databases",

  // Tutorials
  "/docs/tutorials",
  "/docs/tutorials/code-review",
  "/docs/tutorials/documentation-generation",
  "/docs/tutorials/test-generation",

  // Examples
  "/docs/examples",
  "/docs/examples/real-world-projects",

  // Resources categories
  "/resources/official",
  "/resources/tools",
  "/resources/mcp-servers",
  "/resources/rules",
  "/resources/prompts",
  "/resources/agents",
  "/resources/tutorials",
  "/resources/sdks",
  "/resources/showcases",
  "/resources/community",

  // Auth pages
  "/auth/signin",
  "/auth/signout",
  "/auth/error",

  // Dashboard (admin only)
  "/dashboard",
  "/dashboard/users",
  "/dashboard/beta",
  "/dashboard/feedback",
  "/dashboard/suggestions",
  "/dashboard/comments",
  "/dashboard/faq-analytics",
  "/dashboard/notifications",
  "/dashboard/diagnostics",

  // User pages
  "/profile",
  "/settings",
  "/settings/profile",
  "/settings/notifications",
  "/settings/security",
  "/settings/appearance",

  // API routes (should return JSON, not error)
  "/api/auth/get-session",
  "/api/resources",
];

interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  error?: string;
  category: string;
}

interface LinkCheckSummary {
  totalLinks: number;
  checkedLinks: number;
  successfulLinks: number;
  failedLinks: number;
  redirects: number;
  errorRate: number;
  averageResponseTime: number;
  results: LinkCheckResult[];
  brokenLinks: LinkCheckResult[];
  slowLinks: LinkCheckResult[];
}

function categorizeUrl(url: string): string {
  if (url.startsWith("/api")) return "API";
  if (url.startsWith("/docs/getting-started")) return "Getting Started";
  if (url.startsWith("/docs/configuration")) return "Configuration";
  if (url.startsWith("/docs/tips-and-tricks")) return "Tips & Tricks";
  if (url.startsWith("/docs/api")) return "API Reference";
  if (url.startsWith("/docs/integrations")) return "Integrations";
  if (url.startsWith("/docs/tutorials")) return "Tutorials";
  if (url.startsWith("/docs/examples")) return "Examples";
  if (url.startsWith("/docs")) return "Documentation";
  if (url.startsWith("/resources")) return "Resources";
  if (url.startsWith("/dashboard")) return "Dashboard";
  if (url.startsWith("/settings")) return "Settings";
  if (url.startsWith("/auth")) return "Authentication";
  return "Main";
}

export async function GET() {
  try {
    // Check authentication - admin only for full check
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Get base URL from environment or use localhost for development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

    // First, test connectivity to the base URL
    let connectivityOk = false;
    let connectivityError = "";
    try {
      const testController = new AbortController();
      const testTimeout = setTimeout(() => testController.abort(), 5000);
      const testResponse = await fetch(baseUrl, {
        method: "GET",
        signal: testController.signal,
        headers: { "User-Agent": "Claude-Insider-Link-Checker/1.0" },
      });
      clearTimeout(testTimeout);
      connectivityOk = testResponse.status < 500;
    } catch (e) {
      connectivityError = e instanceof Error ? e.message : "Unknown error";
    }

    // If connectivity test failed, return early with helpful info
    if (!connectivityOk) {
      return NextResponse.json({
        success: false,
        error: "Cannot reach base URL",
        details: {
          baseUrl,
          isLocalhost,
          connectivityError,
          hint: isLocalhost
            ? "Localhost check requires the dev server to be running on port 3001"
            : "Ensure NEXT_PUBLIC_APP_URL is correctly configured and the site is accessible",
        },
        summary: {
          totalLinks: INTERNAL_ROUTES.length,
          checkedLinks: 0,
          successfulLinks: 0,
          failedLinks: INTERNAL_ROUTES.length,
          redirects: 0,
          errorRate: 100,
          averageResponseTime: 0,
          results: [],
          brokenLinks: [],
          slowLinks: [],
        },
        checkedAt: new Date().toISOString(),
      });
    }

    const results: LinkCheckResult[] = [];
    const startTime = Date.now();

    // Check each route
    for (const route of INTERNAL_ROUTES) {
      const fullUrl = `${baseUrl}${route}`;
      const checkStart = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        // Try HEAD first, fallback to GET if HEAD fails
        let response = await fetch(fullUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent": "Claude-Insider-Link-Checker/1.0",
          },
        });

        // Some servers don't support HEAD properly, try GET
        if (response.status === 405) {
          const getController = new AbortController();
          const getTimeout = setTimeout(() => getController.abort(), 10000);
          response = await fetch(fullUrl, {
            method: "GET",
            redirect: "manual",
            signal: getController.signal,
            headers: {
              "User-Agent": "Claude-Insider-Link-Checker/1.0",
            },
          });
          clearTimeout(getTimeout);
        }

        clearTimeout(timeoutId);

        const responseTime = Date.now() - checkStart;

        results.push({
          url: route,
          status: response.status,
          statusText: response.statusText || getStatusText(response.status),
          responseTime,
          category: categorizeUrl(route),
        });
      } catch (error) {
        const responseTime = Date.now() - checkStart;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({
          url: route,
          status: 0,
          statusText: "Network Error",
          responseTime,
          error: errorMessage.includes("abort") ? "Request timeout" : errorMessage,
          category: categorizeUrl(route),
        });
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const totalTime = Date.now() - startTime;

    // Calculate summary statistics
    const successfulLinks = results.filter(r => r.status >= 200 && r.status < 400);
    const failedLinks = results.filter(r => r.status === 0 || r.status >= 400);
    const redirects = results.filter(r => r.status >= 300 && r.status < 400);
    const slowLinks = results.filter(r => r.responseTime > 2000); // > 2 seconds
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    const summary: LinkCheckSummary = {
      totalLinks: INTERNAL_ROUTES.length,
      checkedLinks: results.length,
      successfulLinks: successfulLinks.length,
      failedLinks: failedLinks.length,
      redirects: redirects.length,
      errorRate: (failedLinks.length / results.length) * 100,
      averageResponseTime: Math.round(avgResponseTime),
      results: results.sort((a, b) => {
        // Sort by status (errors first), then by response time
        if (a.status === 0 && b.status !== 0) return -1;
        if (b.status === 0 && a.status !== 0) return 1;
        if (a.status >= 400 && b.status < 400) return -1;
        if (b.status >= 400 && a.status < 400) return 1;
        return b.responseTime - a.responseTime;
      }),
      brokenLinks: failedLinks,
      slowLinks,
    };

    return NextResponse.json({
      success: true,
      baseUrl,
      isLocalhost,
      summary,
      duration: totalTime,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Link Check Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Link check failed" },
      { status: 500 }
    );
  }
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[status] || "Unknown";
}
