/**
 * Search Analytics API
 *
 * Provides admin-only access to search analytics data:
 * - Top searches
 * - Zero-result queries
 * - Recent search activity
 * - Aggregate statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
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
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse date range parameter
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";

    // Calculate date filter
    const now = new Date();
    let dateFilter: Date;
    switch (range) {
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(0); // All time
    }

    // Fetch top searches
    const { data: topSearches } = await supabase
      .from("search_analytics")
      .select("query, search_count, last_searched_at, avg_result_count")
      .gte("last_searched_at", dateFilter.toISOString())
      .order("search_count", { ascending: false })
      .limit(20);

    // Fetch zero-result queries
    const { data: noResultsQueries } = await supabase
      .from("search_analytics")
      .select("query, no_results_count, last_searched_at")
      .gt("no_results_count", 0)
      .gte("last_searched_at", dateFilter.toISOString())
      .order("no_results_count", { ascending: false })
      .limit(20);

    // Fetch recent searches (from search_history)
    const { data: recentSearches } = await supabase
      .from("search_history")
      .select("query, searched_at, result_count, user_id")
      .gte("searched_at", dateFilter.toISOString())
      .order("searched_at", { ascending: false })
      .limit(50);

    // Calculate aggregate stats
    const { data: statsData } = await supabase
      .from("search_analytics")
      .select("search_count, no_results_count, avg_result_count")
      .gte("last_searched_at", dateFilter.toISOString());

    let totalSearches = 0;
    let totalNoResults = 0;
    let totalAvgResults = 0;
    const uniqueQueries = statsData?.length || 0;

    if (statsData) {
      for (const row of statsData) {
        totalSearches += row.search_count || 0;
        totalNoResults += row.no_results_count || 0;
        totalAvgResults += (row.avg_result_count || 0) * (row.search_count || 1);
      }
    }

    const avgResultCount =
      totalSearches > 0 ? totalAvgResults / totalSearches : 0;
    const noResultsRate =
      totalSearches > 0 ? totalNoResults / totalSearches : 0;

    return NextResponse.json({
      topSearches: topSearches || [],
      noResultsQueries: noResultsQueries || [],
      recentSearches: recentSearches || [],
      stats: {
        totalSearches,
        uniqueQueries,
        avgResultCount,
        noResultsRate,
      },
    });
  } catch (error) {
    console.error("[Search Analytics API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
