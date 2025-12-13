"use server";

/**
 * Analytics Server Actions
 *
 * Handle view tracking, popular content, and user statistics.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// Types
export interface ResourceViewStats {
  resource_type: string;
  resource_id: string;
  total_views: number;
  unique_views: number;
  views_today: number;
  views_week: number;
  views_month: number;
  last_viewed_at: string | null;
}

export interface PopularResource {
  resource_type: string;
  resource_id: string;
  title: string;
  url: string;
  total_views: number;
  views_week: number;
}

export interface UserActivityStats {
  comments_count: number;
  suggestions_count: number;
  favorites_count: number;
  collections_count: number;
  reading_lists_count: number;
  items_read_count: number;
  followers_count: number;
  following_count: number;
  achievements_count: number;
  review_count: number;
  joined_at: string;
  last_active: string | null;
}

export interface SiteStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  total_views_today: number;
  total_views_week: number;
  total_comments: number;
  total_suggestions: number;
  total_resources: number;
}

// ==================== View Tracking ====================

/**
 * Track a resource view
 */
export async function trackView(input: {
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
  sessionId?: string;
  referrer?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const session = await getSession();

    // Record anonymous view
    await supabase.from("resource_views").insert({
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      user_id: session?.user?.id || null,
      session_id: input.sessionId || null,
      referrer: input.referrer || null,
    });

    // Update stats (upsert)
    await supabase.rpc("increment_view_stats", {
      p_resource_type: input.resourceType,
      p_resource_id: input.resourceId,
    });

    // If logged in, record to view history
    if (session?.user?.id) {
      await supabase.from("view_history").insert({
        user_id: session.user.id,
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        title: input.title,
        url: input.url || null,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[Analytics] Track view error:", error);
    return { success: true }; // Don't fail silently
  }
}

/**
 * Get view stats for a resource
 */
export async function getResourceViewStats(
  resourceType: string,
  resourceId: string
): Promise<{ stats?: ResourceViewStats; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("resource_view_stats")
      .select("*")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found

    return {
      stats: data || {
        resource_type: resourceType,
        resource_id: resourceId,
        total_views: 0,
        unique_views: 0,
        views_today: 0,
        views_week: 0,
        views_month: 0,
        last_viewed_at: null,
      },
    };
  } catch (error) {
    console.error("[Analytics] Get stats error:", error);
    return { error: "Failed to get view stats" };
  }
}

// ==================== Popular Content ====================

/**
 * Get popular resources (trending)
 */
export async function getPopularResources(input?: {
  resourceType?: string;
  period?: "today" | "week" | "month" | "all";
  limit?: number;
}): Promise<{ resources?: PopularResource[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const period = input?.period || "week";
    const limit = input?.limit || 10;
    const orderBy =
      period === "today"
        ? "views_today"
        : period === "week"
        ? "views_week"
        : period === "month"
        ? "views_month"
        : "total_views";

    let query = supabase
      .from("resource_view_stats")
      .select("*")
      .order(orderBy, { ascending: false })
      .limit(limit);

    if (input?.resourceType) {
      query = query.eq("resource_type", input.resourceType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map to PopularResource format
    const resources: PopularResource[] = (data || []).map(
      (item: ResourceViewStats) => ({
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        title: item.resource_id, // Will be resolved client-side
        url: `/${item.resource_type}s/${item.resource_id}`,
        total_views: item.total_views,
        views_week: item.views_week,
      })
    );

    return { resources };
  } catch (error) {
    console.error("[Analytics] Get popular error:", error);
    return { error: "Failed to get popular resources" };
  }
}

/**
 * Get trending resources (most growth in views)
 */
export async function getTrendingResources(
  limit: number = 5
): Promise<{ resources?: PopularResource[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get resources with highest ratio of recent to total views
    const { data, error } = await supabase
      .from("resource_view_stats")
      .select("*")
      .gt("views_week", 0)
      .order("views_week", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const resources: PopularResource[] = (data || []).map(
      (item: ResourceViewStats) => ({
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        title: item.resource_id,
        url: `/${item.resource_type}s/${item.resource_id}`,
        total_views: item.total_views,
        views_week: item.views_week,
      })
    );

    return { resources };
  } catch (error) {
    console.error("[Analytics] Get trending error:", error);
    return { error: "Failed to get trending resources" };
  }
}

// ==================== User Statistics ====================

/**
 * Get current user's activity stats
 */
export async function getUserActivityStats(): Promise<{
  stats?: UserActivityStats;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get user profile with counts
    const { data: user, error } = await supabase
      .from("user")
      .select(
        `
        created_at,
        updated_at,
        comment_count,
        suggestion_count,
        favorite_count,
        collection_count,
        reading_list_count,
        items_read_count,
        follower_count,
        following_count,
        review_count
      `
      )
      .eq("id", session.user.id)
      .single();

    if (error) throw error;

    // Get achievements count
    const { count: achievementsCount } = await supabase
      .from("user_achievements")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    return {
      stats: {
        comments_count: user?.comment_count || 0,
        suggestions_count: user?.suggestion_count || 0,
        favorites_count: user?.favorite_count || 0,
        collections_count: user?.collection_count || 0,
        reading_lists_count: user?.reading_list_count || 0,
        items_read_count: user?.items_read_count || 0,
        followers_count: user?.follower_count || 0,
        following_count: user?.following_count || 0,
        achievements_count: achievementsCount || 0,
        review_count: user?.review_count || 0,
        joined_at: user?.created_at || "",
        last_active: user?.updated_at || null,
      },
    };
  } catch (error) {
    console.error("[Analytics] Get user stats error:", error);
    return { error: "Failed to get user stats" };
  }
}

/**
 * Get user's reading activity over time
 */
export async function getUserReadingActivity(
  days: number = 30
): Promise<{
  activity?: Array<{ date: string; count: number }>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("view_history")
      .select("viewed_at")
      .eq("user_id", session.user.id)
      .gte("viewed_at", startDate.toISOString())
      .order("viewed_at", { ascending: true });

    if (error) throw error;

    // Group by date
    const activityMap = new Map<string, number>();
    (data || []).forEach((item: { viewed_at: string }) => {
      const dateParts = item.viewed_at.split("T");
      const dateKey = dateParts[0] || item.viewed_at.substring(0, 10);
      activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
    });

    // Fill in missing dates
    const activity: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const isoStr = date.toISOString();
      const dateStr = isoStr.split("T")[0] || isoStr.substring(0, 10);
      activity.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
      });
    }

    return { activity };
  } catch (error) {
    console.error("[Analytics] Get reading activity error:", error);
    return { error: "Failed to get reading activity" };
  }
}

// ==================== Admin Analytics ====================

/**
 * Get site-wide statistics (admin only)
 */
export async function getSiteStats(): Promise<{
  stats?: SiteStats;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // Check admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!user || !["admin", "moderator"].includes(user.role)) {
      return { error: "Not authorized" };
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from("user")
      .select("*", { count: "exact", head: true });

    // Get active users (have activity in last 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: activeUsersToday } = await supabase
      .from("user")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", yesterday.toISOString());

    // Get active users (have activity in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: activeUsersWeek } = await supabase
      .from("user")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", weekAgo.toISOString());

    // Get views today
    const { count: viewsToday } = await supabase
      .from("resource_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", yesterday.toISOString());

    // Get views this week
    const { count: viewsWeek } = await supabase
      .from("resource_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", weekAgo.toISOString());

    // Get total comments
    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    // Get total suggestions
    const { count: totalSuggestions } = await supabase
      .from("edit_suggestions")
      .select("*", { count: "exact", head: true });

    return {
      stats: {
        total_users: totalUsers || 0,
        active_users_today: activeUsersToday || 0,
        active_users_week: activeUsersWeek || 0,
        total_views_today: viewsToday || 0,
        total_views_week: viewsWeek || 0,
        total_comments: totalComments || 0,
        total_suggestions: totalSuggestions || 0,
        total_resources: 0, // Would need resource count
      },
    };
  } catch (error) {
    console.error("[Analytics] Get site stats error:", error);
    return { error: "Failed to get site stats" };
  }
}

/**
 * Get daily views for chart (admin only)
 */
export async function getDailyViews(
  days: number = 30
): Promise<{
  data?: Array<{ date: string; views: number; unique_users: number }>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!user || !["admin", "moderator"].includes(user.role)) {
      return { error: "Not authorized" };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("resource_views")
      .select("viewed_at, user_id")
      .gte("viewed_at", startDate.toISOString());

    if (error) throw error;

    // Group by date
    const viewsMap = new Map<
      string,
      { views: number; users: Set<string | null> }
    >();
    (data || []).forEach(
      (item: { viewed_at: string; user_id: string | null }) => {
        const dateParts = item.viewed_at.split("T");
        const date = dateParts[0] || item.viewed_at.substring(0, 10);
        if (!viewsMap.has(date)) {
          viewsMap.set(date, { views: 0, users: new Set() });
        }
        const entry = viewsMap.get(date);
        if (entry) {
          entry.views++;
          if (item.user_id) {
            entry.users.add(item.user_id);
          }
        }
      }
    );

    // Fill in missing dates
    const result: Array<{ date: string; views: number; unique_users: number }> =
      [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const isoString = date.toISOString();
      const dateStr = isoString.split("T")[0] || isoString.substring(0, 10);
      const entry = viewsMap.get(dateStr);
      result.push({
        date: dateStr,
        views: entry?.views || 0,
        unique_users: entry?.users.size || 0,
      });
    }

    return { data: result };
  } catch (error) {
    console.error("[Analytics] Get daily views error:", error);
    return { error: "Failed to get daily views" };
  }
}
