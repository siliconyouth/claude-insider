"use server";

/**
 * Personal Analytics Server Actions
 *
 * Detailed analytics for the authenticated user's profile stats page.
 * All data is user-specific and requires authentication.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  type Level,
  getLevelProgress,
  isStreakActive,
} from "@/lib/gamification";

// Types
export interface AchievementProgressItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
}

export interface ViewHistoryItem {
  id: string;
  resourceType: "doc" | "resource";
  slug: string;
  title: string;
  category?: string;
  viewedAt: string;
}

export interface PersonalAnalytics {
  // Level & Points
  level: Level;
  totalPoints: number;
  pointsThisWeek: number;
  nextLevelProgress: number;
  pointsToNextLevel: number;

  // Streak
  currentStreak: number;
  longestStreak: number;
  streakActive: boolean;
  lastActivityDate: string | null;

  // Achievements
  achievementsUnlocked: number;
  achievementsTotal: number;
  nextAchievements: AchievementProgressItem[];

  // Activity chart (30 days)
  activityChart: Array<{ date: string; count: number }>;
  peakDay: string;
  peakHour: number;
  totalActivityDays: number;

  // Reading
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentHistory: ViewHistoryItem[];
  totalItemsRead: number;

  // Engagement
  contributions: {
    comments: number;
    reviews: number;
    suggestions: number;
    collections: number;
    favorites: number;
  };

  // Impact
  impact: {
    helpfulVotes: number;
    commentLikes: number;
    profileViews: number;
    followers: number;
    following: number;
  };

  // Comparison (vs community average)
  comparison: {
    viewsVsAvg: { user: number; avg: number; percentile: number };
    favoritesVsAvg: { user: number; avg: number; percentile: number };
    commentsVsAvg: { user: number; avg: number; percentile: number };
    pointsVsAvg: { user: number; avg: number; percentile: number };
  };

  // Account info
  joinedAt: string;
  daysAsMember: number;
}

/**
 * Get all personal analytics for the authenticated user
 */
export async function getPersonalAnalytics(): Promise<{
  analytics?: PersonalAnalytics;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const userId = session.user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Run all queries in parallel
    const [
      userDataResult,
      achievementsUnlockedResult,
      achievementsTotalResult,
      achievementProgressResult,
      activityChartResult,
      activityHoursResult,
      categoryBreakdownResult,
      recentHistoryResult,
      communityAvgsResult,
      helpfulVotesResult,
      commentLikesResult,
    ] = await Promise.all([
      // User profile data with counts
      supabase
        .from("user")
        .select(
          `
          id,
          username,
          image,
          "createdAt",
          updated_at,
          achievement_points,
          current_streak,
          longest_streak,
          last_activity_date,
          comment_count,
          suggestion_count,
          favorite_count,
          collection_count,
          review_count,
          follower_count,
          following_count,
          items_read_count
        `
        )
        .eq("id", userId)
        .single(),

      // Achievements unlocked
      supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),

      // Total achievements available
      supabase.from("achievements").select("*", { count: "exact", head: true }),

      // Achievement progress (unearned achievements with progress)
      supabase
        .from("achievement_progress")
        .select(
          `
          current_value,
          achievement:achievement_id (
            id,
            name,
            description,
            icon,
            tier,
            threshold
          )
        `
        )
        .eq("user_id", userId)
        .order("current_value", { ascending: false })
        .limit(5),

      // Activity chart (30 days) - from view_history
      supabase
        .from("view_history")
        .select("viewed_at")
        .eq("user_id", userId)
        .gte("viewed_at", getDateAgo(30)),

      // Activity by hour (for peak hour calculation)
      supabase
        .from("view_history")
        .select("viewed_at")
        .eq("user_id", userId)
        .gte("viewed_at", getDateAgo(30)),

      // Category breakdown
      supabase
        .from("view_history")
        .select("resource_type")
        .eq("user_id", userId)
        .gte("viewed_at", getDateAgo(30)),

      // Recent reading history
      supabase
        .from("view_history")
        .select("id, resource_type, resource_id, title, url, viewed_at")
        .eq("user_id", userId)
        .order("viewed_at", { ascending: false })
        .limit(20),

      // Community averages for comparison
      supabase.from("user").select(
        `
          items_read_count,
          favorite_count,
          comment_count,
          achievement_points
        `
      ),

      // Helpful votes received (on user's reviews)
      supabase
        .from("review_helpful_votes")
        .select("*", { count: "exact", head: true })
        .eq("review_author_id", userId),

      // Comment likes/votes received
      supabase
        .from("comment_votes")
        .select("*", { count: "exact", head: true })
        .eq("comment_author_id", userId)
        .eq("vote_type", "up"),
    ]);

    // Process user data
    const userData = userDataResult.data;
    if (!userData) {
      return { error: "User not found" };
    }

    // Calculate level progress
    const points = userData.achievement_points || 0;
    const levelProgress = getLevelProgress(points);

    // Calculate points this week
    const pointsThisWeek = await getPointsThisWeek(supabase, userId);

    // Process activity chart
    const { activityChart, peakDay, totalActivityDays } = processActivityChart(
      activityChartResult.data || []
    );

    // Calculate peak hour
    const peakHour = calculatePeakHour(activityHoursResult.data || []);

    // Process category breakdown
    const categoryBreakdown = processCategoryBreakdown(
      categoryBreakdownResult.data || []
    );

    // Process recent history
    const recentHistory: ViewHistoryItem[] = (
      recentHistoryResult.data || []
    ).map(
      (item: {
        id: string;
        resource_type: string;
        resource_id: string;
        title: string;
        url: string | null;
        viewed_at: string;
      }) => ({
        id: item.id,
        resourceType: item.resource_type,
        resourceId: item.resource_id,
        title: item.title,
        url: item.url,
        viewedAt: item.viewed_at,
      })
    );

    // Process achievement progress
    const nextAchievements: AchievementProgressItem[] = (
      achievementProgressResult.data || []
    )
      .filter(
        (item: {
          achievement: {
            id: string;
            name: string;
            description: string;
            icon: string;
            tier: string;
            threshold: number;
          } | null;
        }) => item.achievement
      )
      .map(
        (item: {
          current_value: number;
          achievement: {
            id: string;
            name: string;
            description: string;
            icon: string;
            tier: string;
            threshold: number;
          };
        }) => ({
          id: item.achievement.id,
          name: item.achievement.name,
          description: item.achievement.description,
          icon: item.achievement.icon || "🎯",
          tier: item.achievement.tier,
          currentProgress: item.current_value,
          targetProgress: item.achievement.threshold,
          percentage: Math.min(
            Math.round((item.current_value / item.achievement.threshold) * 100),
            99
          ),
        })
      );

    // Calculate community comparisons
    const comparison = calculateComparisons(
      userData,
      communityAvgsResult.data || []
    );

    // Calculate days as member
    const joinedAt = userData.createdAt || userData.created_at;
    const daysAsMember = Math.floor(
      (Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      analytics: {
        // Level & Points
        level: levelProgress.current,
        totalPoints: points,
        pointsThisWeek,
        nextLevelProgress: Math.round(levelProgress.progress),
        pointsToNextLevel: levelProgress.pointsToNext,

        // Streak
        currentStreak: userData.current_streak || 0,
        longestStreak: userData.longest_streak || 0,
        streakActive: userData.last_activity_date
          ? isStreakActive(userData.last_activity_date)
          : false,
        lastActivityDate: userData.last_activity_date,

        // Achievements
        achievementsUnlocked: achievementsUnlockedResult.count || 0,
        achievementsTotal: achievementsTotalResult.count || 0,
        nextAchievements,

        // Activity
        activityChart,
        peakDay,
        peakHour,
        totalActivityDays,

        // Reading
        categoryBreakdown,
        recentHistory,
        totalItemsRead: userData.items_read_count || 0,

        // Engagement
        contributions: {
          comments: userData.comment_count || 0,
          reviews: userData.review_count || 0,
          suggestions: userData.suggestion_count || 0,
          collections: userData.collection_count || 0,
          favorites: userData.favorite_count || 0,
        },

        // Impact
        impact: {
          helpfulVotes: helpfulVotesResult.count || 0,
          commentLikes: commentLikesResult.count || 0,
          profileViews: 0, // Would need profile_views table
          followers: userData.follower_count || 0,
          following: userData.following_count || 0,
        },

        // Comparison
        comparison,

        // Account
        joinedAt,
        daysAsMember,
      },
    };
  } catch (error) {
    console.error("[PersonalAnalytics] Error fetching analytics:", error);
    return { error: "Failed to fetch personal analytics" };
  }
}

// Helper functions

function getDateAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function getPointsThisWeek(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string
): Promise<number> {
  try {
    // This would need a points_history table or calculate from activities
    // For now, return 0 as placeholder
    const { data } = await supabase
      .from("user_activity")
      .select("metadata")
      .eq("user_id", userId)
      .gte("created_at", getDateAgo(7))
      .eq("activity_type", "points_earned");

    let total = 0;
    for (const item of data || []) {
      const metadata = item.metadata as Record<string, unknown> | null;
      if (metadata && typeof metadata.points === "number") {
        total += metadata.points;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

function processActivityChart(data: Array<{ viewed_at: string }>): {
  activityChart: Array<{ date: string; count: number }>;
  peakDay: string;
  totalActivityDays: number;
} {
  // Group by date
  const dateMap = new Map<string, number>();
  for (const item of data) {
    const date = item.viewed_at.split("T")[0] || item.viewed_at.substring(0, 10);
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  }

  // Find peak day
  let peakDay = "";
  let peakCount = 0;
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayCounts = new Map<string, number>();

  for (const [dateStr, count] of dateMap) {
    const dayOfWeek = dayNames[new Date(dateStr).getDay()];
    if (dayOfWeek) {
      dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + count);
    }
  }

  for (const [day, count] of dayCounts) {
    if (count > peakCount) {
      peakCount = count;
      peakDay = day;
    }
  }

  // Fill in all 30 days
  const activityChart: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0] || "";
    activityChart.push({
      date: dateStr,
      count: dateMap.get(dateStr) || 0,
    });
  }

  return {
    activityChart,
    peakDay: peakDay || "N/A",
    totalActivityDays: dateMap.size,
  };
}

function calculatePeakHour(data: Array<{ viewed_at: string }>): number {
  const hourCounts = new Map<number, number>();

  for (const item of data) {
    const hour = new Date(item.viewed_at).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  let peakHour = 12; // Default to noon
  let peakCount = 0;

  for (const [hour, count] of hourCounts) {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  }

  return peakHour;
}

const CATEGORY_COLORS: Record<string, string> = {
  doc: "bg-blue-500",
  resource: "bg-violet-500",
  "getting-started": "bg-green-500",
  configuration: "bg-amber-500",
  api: "bg-cyan-500",
  integrations: "bg-purple-500",
  "tips-and-tricks": "bg-pink-500",
  tutorials: "bg-indigo-500",
  examples: "bg-teal-500",
  other: "bg-gray-500",
};

function processCategoryBreakdown(
  data: Array<{ resource_type: string }>
): Array<{ category: string; count: number; percentage: number; color: string }> {
  const categoryMap = new Map<string, number>();

  for (const item of data) {
    const category = item.resource_type || "other";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  }

  const total = data.length || 1;
  const result = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category: formatCategoryName(category),
      count,
      percentage: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other ?? "bg-gray-500",
    }))
    .sort((a, b) => b.count - a.count);

  return result as Array<{ category: string; count: number; percentage: number; color: string }>;
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

function calculateComparisons(
  userData: {
    items_read_count: number;
    favorite_count: number;
    comment_count: number;
    achievement_points: number;
  },
  allUsers: Array<{
    items_read_count: number;
    favorite_count: number;
    comment_count: number;
    achievement_points: number;
  }>
): PersonalAnalytics["comparison"] {
  // Calculate averages
  const count = allUsers.length || 1;

  const avgViews =
    allUsers.reduce((sum, u) => sum + (u.items_read_count || 0), 0) / count;
  const avgFavorites =
    allUsers.reduce((sum, u) => sum + (u.favorite_count || 0), 0) / count;
  const avgComments =
    allUsers.reduce((sum, u) => sum + (u.comment_count || 0), 0) / count;
  const avgPoints =
    allUsers.reduce((sum, u) => sum + (u.achievement_points || 0), 0) / count;

  // Calculate percentiles
  const sortedViews = allUsers
    .map((u) => u.items_read_count || 0)
    .sort((a, b) => a - b);
  const sortedFavorites = allUsers
    .map((u) => u.favorite_count || 0)
    .sort((a, b) => a - b);
  const sortedComments = allUsers
    .map((u) => u.comment_count || 0)
    .sort((a, b) => a - b);
  const sortedPoints = allUsers
    .map((u) => u.achievement_points || 0)
    .sort((a, b) => a - b);

  const calculatePercentile = (value: number, sorted: number[]): number => {
    if (sorted.length === 0) return 50;
    const index = sorted.findIndex((v) => v >= value);
    if (index === -1) return 100;
    return Math.round((index / sorted.length) * 100);
  };

  return {
    viewsVsAvg: {
      user: userData.items_read_count || 0,
      avg: Math.round(avgViews),
      percentile: calculatePercentile(
        userData.items_read_count || 0,
        sortedViews
      ),
    },
    favoritesVsAvg: {
      user: userData.favorite_count || 0,
      avg: Math.round(avgFavorites),
      percentile: calculatePercentile(
        userData.favorite_count || 0,
        sortedFavorites
      ),
    },
    commentsVsAvg: {
      user: userData.comment_count || 0,
      avg: Math.round(avgComments),
      percentile: calculatePercentile(
        userData.comment_count || 0,
        sortedComments
      ),
    },
    pointsVsAvg: {
      user: userData.achievement_points || 0,
      avg: Math.round(avgPoints),
      percentile: calculatePercentile(
        userData.achievement_points || 0,
        sortedPoints
      ),
    },
  };
}

/**
 * Get reading history with pagination
 */
export async function getReadingHistory(
  page: number = 1,
  limit: number = 20
): Promise<{
  history?: ViewHistoryItem[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      supabase
        .from("view_history")
        .select("id, resource_type, resource_id, title, url, viewed_at")
        .eq("user_id", session.user.id)
        .order("viewed_at", { ascending: false })
        .range(offset, offset + limit - 1),

      supabase
        .from("view_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id),
    ]);

    const history: ViewHistoryItem[] = (dataResult.data || []).map(
      (item: {
        id: string;
        resource_type: string;
        resource_id: string;
        title: string;
        url: string | null;
        viewed_at: string;
      }) => ({
        id: item.id,
        resourceType: item.resource_type as "doc" | "resource",
        slug: item.resource_id,
        title: item.title,
        category: item.resource_type === "doc" ? "Documentation" : "Resources",
        viewedAt: item.viewed_at,
      })
    );

    return {
      history,
      total: countResult.count || 0,
    };
  } catch (error) {
    console.error("[PersonalAnalytics] Error fetching history:", error);
    return { error: "Failed to fetch reading history" };
  }
}

/**
 * Clear reading history
 */
export async function clearReadingHistory(): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("view_history")
      .delete()
      .eq("user_id", session.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("[PersonalAnalytics] Error clearing history:", error);
    return { error: "Failed to clear reading history" };
  }
}
