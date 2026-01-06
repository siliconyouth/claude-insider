/**
 * Sentry Issues List API
 *
 * Provides admin-only access to Sentry issues:
 * - List issues with filters (status, level, timeframe)
 * - Paginated response with cursor-based navigation
 * - Aggregate statistics
 *
 * @see https://docs.sentry.io/api/events/list-a-projects-issues/
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  fetchSentryIssues,
  getSentryStats,
  isSentryConfigured,
  type FetchIssuesOptions,
} from "@/lib/sentry-api";

export async function GET(request: NextRequest) {
  try {
    // Check if Sentry is configured
    if (!isSentryConfigured()) {
      return NextResponse.json(
        { error: "Sentry is not configured. Missing environment variables." },
        { status: 503 }
      );
    }

    // Verify authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check admin role
    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = (user?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "unresolved";
    const level = searchParams.get("level"); // error, warning, fatal
    const statsPeriod = searchParams.get("statsPeriod") || "24h";
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const sort = (searchParams.get("sort") || "date") as FetchIssuesOptions["sort"];

    // Build query string for Sentry
    let query = `is:${status}`;
    if (level) {
      query += ` level:${level}`;
    }

    // Fetch issues from Sentry
    const [issuesResult, stats] = await Promise.all([
      fetchSentryIssues({
        query,
        statsPeriod,
        cursor,
        limit,
        sort,
      }),
      getSentryStats(statsPeriod),
    ]);

    return NextResponse.json({
      issues: issuesResult.issues,
      nextCursor: issuesResult.nextCursor,
      prevCursor: issuesResult.prevCursor,
      stats,
      filters: {
        status,
        level,
        statsPeriod,
        sort,
      },
    });
  } catch (error) {
    console.error("[Sentry API] Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch Sentry issues" },
      { status: 500 }
    );
  }
}
