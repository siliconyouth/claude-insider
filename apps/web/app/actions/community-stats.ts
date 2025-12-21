"use server";

/**
 * Community Statistics Server Actions
 *
 * Public statistics for the /stats community page.
 * No authentication required - all data is aggregated and anonymized.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { type LeaderboardEntry, getLevelFromPoints } from "@/lib/gamification";

// Types
export interface CommunityStats {
  // Totals
  totalUsers: number;
  totalResources: number;
  totalAchievements: number;
  totalViews: number;

  // Growth
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  viewsThisMonth: number;

  // Activity chart data (30 days)
  dailyActiveUsers: Array<{ date: string; count: number }>;

  // Leaderboard (top 10)
  topContributors: LeaderboardEntry[];

  // Popular content
  popularDocs: Array<{ slug: string; title: string; views: number }>;
  popularResources: Array<{ slug: string; title: string; views: number }>;

  // Recent achievements (public feed)
  recentAchievements: Array<{
    obfuscatedUserId: string;
    username: string;
    avatar: string | null;
    achievementName: string;
    achievementIcon: string;
    unlockedAt: string;
  }>;

  // Category breakdown (reading distribution)
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Get all community statistics for the public stats page
 */
export async function getCommunityStats(): Promise<{
  stats?: CommunityStats;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Run all queries in parallel for performance
    const [
      totalUsersResult,
      totalResourcesResult,
      totalAchievementsResult,
      totalViewsResult,
      newUsersWeekResult,
      newUsersMonthResult,
      viewsMonthResult,
      dailyActiveResult,
      topContributorsResult,
      popularDocsResult,
      popularResourcesResult,
      recentAchievementsResult,
      categoryBreakdownResult,
    ] = await Promise.all([
      // Total users
      supabase.from("user").select("*", { count: "exact", head: true }),

      // Total published resources
      supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),

      // Total achievements available
      supabase.from("achievements").select("*", { count: "exact", head: true }),

      // Total views all time
      supabase.from("resource_views").select("*", { count: "exact", head: true }),

      // New users this week
      supabase
        .from("user")
        .select("*", { count: "exact", head: true })
        .gte("createdAt", getDateAgo(7)),

      // New users this month
      supabase
        .from("user")
        .select("*", { count: "exact", head: true })
        .gte("createdAt", getDateAgo(30)),

      // Views this month
      supabase
        .from("resource_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", getDateAgo(30)),

      // Daily active users (30 days) - group by date
      supabase
        .from("resource_views")
        .select("created_at, user_id")
        .gte("created_at", getDateAgo(30))
        .not("user_id", "is", null),

      // Top contributors by achievement points
      supabase
        .from("user")
        .select("id, username, image, achievement_points")
        .gt("achievement_points", 0)
        .order("achievement_points", { ascending: false })
        .limit(10),

      // Popular docs (by view count this week)
      supabase
        .from("resource_view_stats")
        .select("resource_id, views_week")
        .eq("resource_type", "doc")
        .gt("views_week", 0)
        .order("views_week", { ascending: false })
        .limit(5),

      // Popular resources (by view count this week)
      supabase
        .from("resource_view_stats")
        .select("resource_id, views_week")
        .eq("resource_type", "resource")
        .gt("views_week", 0)
        .order("views_week", { ascending: false })
        .limit(5),

      // Recent achievements (last 10, public)
      supabase
        .from("user_achievements")
        .select(
          `
          unlocked_at,
          user:user_id (id, username, image),
          achievement:achievement_id (name, icon)
        `
        )
        .order("unlocked_at", { ascending: false })
        .limit(10),

      // Category breakdown from view history
      supabase
        .from("view_history")
        .select("resource_type")
        .gte("viewed_at", getDateAgo(30)),
    ]);

    // Process daily active users
    const dailyActiveUsers = processDailyActiveUsers(
      dailyActiveResult.data || []
    );

    // Process top contributors
    const topContributors: LeaderboardEntry[] = (
      topContributorsResult.data || []
    ).map(
      (
        user: {
          id: string;
          username: string | null;
          image: string | null;
          achievement_points: number;
        },
        index: number
      ) => ({
        user_id: user.id,
        username: user.username || "Anonymous",
        avatar: user.image,
        points: user.achievement_points || 0,
        level: getLevelFromPoints(user.achievement_points || 0).level,
        rank: index + 1,
        streak: 0, // Would need separate query
      })
    );

    // Process popular docs
    const popularDocs = (popularDocsResult.data || []).map(
      (doc: { resource_id: string; views_week: number }) => ({
        slug: doc.resource_id,
        title: formatDocTitle(doc.resource_id),
        views: doc.views_week,
      })
    );

    // Process popular resources
    const popularResources = (popularResourcesResult.data || []).map(
      (resource: { resource_id: string; views_week: number }) => ({
        slug: resource.resource_id,
        title: formatResourceTitle(resource.resource_id),
        views: resource.views_week,
      })
    );

    // Process recent achievements
    const recentAchievements = (recentAchievementsResult.data || [])
      .filter(
        (item: {
          user: { id: string; username: string | null; image: string | null } | null;
          achievement: { name: string; icon: string } | null;
        }) => item.user && item.achievement
      )
      .map(
        (item: {
          unlocked_at: string;
          user: { id: string; username: string | null; image: string | null };
          achievement: { name: string; icon: string };
        }) => ({
          obfuscatedUserId: item.user.id.substring(0, 8),
          username: item.user.username || "Anonymous",
          avatar: item.user.image,
          achievementName: item.achievement.name,
          achievementIcon: item.achievement.icon || "🏆",
          unlockedAt: item.unlocked_at,
        })
      );

    // Process category breakdown
    const categoryBreakdown = processCategoryBreakdown(
      categoryBreakdownResult.data || []
    );

    return {
      stats: {
        totalUsers: totalUsersResult.count || 0,
        totalResources: totalResourcesResult.count || 0,
        totalAchievements: totalAchievementsResult.count || 0,
        totalViews: totalViewsResult.count || 0,
        newUsersThisWeek: newUsersWeekResult.count || 0,
        newUsersThisMonth: newUsersMonthResult.count || 0,
        viewsThisMonth: viewsMonthResult.count || 0,
        dailyActiveUsers,
        topContributors,
        popularDocs,
        popularResources,
        recentAchievements,
        categoryBreakdown,
      },
    };
  } catch (error) {
    console.error("[CommunityStats] Error fetching stats:", error);
    return { error: "Failed to fetch community statistics" };
  }
}

// Helper functions

function getDateAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function processDailyActiveUsers(
  data: Array<{ created_at: string; user_id: string | null }>
): Array<{ date: string; count: number }> {
  // Group by date and count unique users
  const dateMap = new Map<string, Set<string>>();

  for (const item of data) {
    if (!item.user_id) continue;
    const date = item.created_at.split("T")[0] || item.created_at.substring(0, 10);
    if (!dateMap.has(date)) {
      dateMap.set(date, new Set());
    }
    dateMap.get(date)?.add(item.user_id);
  }

  // Fill in all 30 days
  const result: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0] || "";
    result.push({
      date: dateStr,
      count: dateMap.get(dateStr)?.size || 0,
    });
  }

  return result;
}

function processCategoryBreakdown(
  data: Array<{ resource_type: string }>
): Array<{ category: string; count: number; percentage: number }> {
  // Count by category
  const categoryMap = new Map<string, number>();
  for (const item of data) {
    const category = item.resource_type || "other";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  }

  // Convert to array with percentages
  const total = data.length || 1;
  const result = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category: formatCategoryName(category),
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return result;
}

function formatCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    doc: "Documentation",
    resource: "Resources",
    "getting-started": "Getting Started",
    configuration: "Configuration",
    api: "API Reference",
    integrations: "Integrations",
    "tips-and-tricks": "Tips & Tricks",
    tutorials: "Tutorials",
    examples: "Examples",
    other: "Other",
  };
  return categoryNames[category] || category;
}

function formatDocTitle(slug: string): string {
  // Convert slug to readable title
  // e.g., "api/streaming" -> "API Streaming"
  return slug
    .split("/")
    .pop()
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || slug;
}

function formatResourceTitle(slug: string): string {
  // Convert slug to readable title
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get leaderboard data only (lighter query for leaderboard component)
 */
export async function getLeaderboard(
  limit: number = 10
): Promise<{ entries?: LeaderboardEntry[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user")
      .select("id, username, image, achievement_points")
      .gt("achievement_points", 0)
      .order("achievement_points", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const entries: LeaderboardEntry[] = (data || []).map(
      (
        user: {
          id: string;
          username: string | null;
          image: string | null;
          achievement_points: number;
        },
        index: number
      ) => ({
        user_id: user.id,
        username: user.username || "Anonymous",
        avatar: user.image,
        points: user.achievement_points || 0,
        level: getLevelFromPoints(user.achievement_points || 0).level,
        rank: index + 1,
        streak: 0,
      })
    );

    return { entries };
  } catch (error) {
    console.error("[CommunityStats] Error fetching leaderboard:", error);
    return { error: "Failed to fetch leaderboard" };
  }
}

/**
 * Get recent achievements feed
 */
export async function getRecentAchievements(
  limit: number = 10
): Promise<{
  achievements?: CommunityStats["recentAchievements"];
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        unlocked_at,
        user:user_id (id, username, image),
        achievement:achievement_id (name, icon)
      `
      )
      .order("unlocked_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const achievements = (data || [])
      .filter(
        (item: {
          user: { id: string; username: string | null; image: string | null } | null;
          achievement: { name: string; icon: string } | null;
        }) => item.user && item.achievement
      )
      .map(
        (item: {
          unlocked_at: string;
          user: { id: string; username: string | null; image: string | null };
          achievement: { name: string; icon: string };
        }) => ({
          obfuscatedUserId: item.user.id.substring(0, 8),
          username: item.user.username || "Anonymous",
          avatar: item.user.image,
          achievementName: item.achievement.name,
          achievementIcon: item.achievement.icon || "🏆",
          unlockedAt: item.unlocked_at,
        })
      );

    return { achievements };
  } catch (error) {
    console.error("[CommunityStats] Error fetching achievements:", error);
    return { error: "Failed to fetch recent achievements" };
  }
}
