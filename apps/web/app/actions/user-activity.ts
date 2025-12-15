"use server";

/**
 * User Activity Server Actions
 *
 * Provides unified activity timeline for users combining data from:
 * - user_activity table (views, searches)
 * - favorites, ratings, comments
 * - collections, achievements
 * - reports submitted
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { canPerformAction, ACTIONS, type UserRole } from "@/lib/roles";

// ============================================
// TYPES
// ============================================

export type ActivityType =
  | "view_doc"
  | "view_resource"
  | "search"
  | "favorite"
  | "unfavorite"
  | "rate"
  | "comment"
  | "comment_reply"
  | "collection_create"
  | "collection_add"
  | "achievement_earned"
  | "report_submitted"
  | "follow"
  | "followed_by"
  | "reading_list_create"
  | "profile_update"
  | "account_created";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityStats {
  totalComments: number;
  totalFavorites: number;
  totalRatings: number;
  totalCollections: number;
  totalAchievements: number;
  totalReports: number;
  totalFollowing: number;
  totalFollowers: number;
  memberSince: string;
  lastActive?: string;
}

// ============================================
// DATABASE ROW TYPES
// ============================================

interface AchievementJoinRow {
  id: string;
  earned_at: string;
  achievements: {
    name: string;
    description: string;
    icon: string;
    tier: string;
  } | null;
}

interface ReportActivityRow {
  id: string;
  report_type: string;
  reason: string;
  status: string;
  created_at: string;
}

interface FollowJoinRow {
  id: string;
  created_at: string;
  following: {
    name?: string;
    username?: string;
  } | null;
}

// ============================================
// GET OWN ACTIVITY (for settings page)
// ============================================

export async function getOwnActivity(
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; activities?: ActivityItem[]; total?: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    return await getUserActivityInternal(session.user.id, limit, offset, true);
  } catch (error) {
    console.error("Get own activity error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET USER ACTIVITY (for public profile)
// ============================================

export async function getUserActivity(
  userId: string,
  limit: number = 30,
  offset: number = 0
): Promise<{ success: boolean; activities?: ActivityItem[]; total?: number; error?: string }> {
  try {
    // Public profile - only show public activities
    return await getUserActivityInternal(userId, limit, offset, false);
  } catch (error) {
    console.error("Get user activity error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET USER ACTIVITY FOR ADMIN
// ============================================

export async function getAdminUserActivity(
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ success: boolean; activities?: ActivityItem[]; total?: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();
    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role as UserRole, ACTIONS.VIEW_USERS)) {
      return { success: false, error: "You do not have permission to view user activity" };
    }

    // Admin can see all activities including private ones
    return await getUserActivityInternal(userId, limit, offset, true);
  } catch (error) {
    console.error("Get admin user activity error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET ACTIVITY STATS
// ============================================

export async function getActivityStats(
  userId?: string
): Promise<{ success: boolean; stats?: ActivityStats; error?: string }> {
  try {
    const session = await getSession();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "User ID required" };
    }

    const supabase = await createAdminClient();

    // Get user info
    const { data: user } = await supabase
      .from("user")
      .select("createdAt, lastActiveAt")
      .eq("id", targetUserId)
      .single();

    // Get counts in parallel
    const [
      commentsResult,
      favoritesResult,
      ratingsResult,
      collectionsResult,
      achievementsResult,
      reportsResult,
      followingResult,
      followersResult,
    ] = await Promise.all([
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId),
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId),
      supabase
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId),
      supabase
        .from("collections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId),
      supabase
        .from("user_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("reporter_id", targetUserId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", targetUserId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", targetUserId),
    ]);

    // Cast user data for field access
    const userData = user as { createdAt?: string } | null;

    const stats: ActivityStats = {
      totalComments: commentsResult.count || 0,
      totalFavorites: favoritesResult.count || 0,
      totalRatings: ratingsResult.count || 0,
      totalCollections: collectionsResult.count || 0,
      totalAchievements: achievementsResult.count || 0,
      totalReports: reportsResult.count || 0,
      totalFollowing: followingResult.count || 0,
      totalFollowers: followersResult.count || 0,
      memberSince: userData?.createdAt || "",
      lastActive: undefined, // Will be implemented with presence system
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Get activity stats error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// INTERNAL HELPER
// ============================================

async function getUserActivityInternal(
  userId: string,
  limit: number,
  offset: number,
  includePrivate: boolean
): Promise<{ success: boolean; activities?: ActivityItem[]; total?: number; error?: string }> {
  const supabase = await createAdminClient();
  const activities: ActivityItem[] = [];

  // Get comments (public activity)
  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, resource_type, resource_id, parent_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (comments) {
    for (const comment of comments) {
      activities.push({
        id: `comment-${comment.id}`,
        type: comment.parent_id ? "comment_reply" : "comment",
        title: comment.parent_id ? "Replied to a comment" : "Left a comment",
        description: comment.content.substring(0, 100) + (comment.content.length > 100 ? "..." : ""),
        link: `/${comment.resource_type === "doc" ? "docs" : "resources"}/${comment.resource_id}`,
        metadata: { resourceType: comment.resource_type, resourceId: comment.resource_id },
        createdAt: comment.created_at || new Date().toISOString(),
      });
    }
  }

  // Get favorites (can be private or public based on settings)
  if (includePrivate) {
    const { data: favorites } = await supabase
      .from("favorites")
      .select("id, resource_type, resource_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (favorites) {
      for (const fav of favorites) {
        activities.push({
          id: `favorite-${fav.id}`,
          type: "favorite",
          title: "Added to favorites",
          description: `Favorited a ${fav.resource_type}`,
          link: `/${fav.resource_type === "doc" ? "docs" : "resources"}/${fav.resource_id}`,
          metadata: { resourceType: fav.resource_type, resourceId: fav.resource_id },
          createdAt: fav.created_at || new Date().toISOString(),
        });
      }
    }
  }

  // Get ratings (public activity)
  const { data: ratings } = await supabase
    .from("ratings")
    .select("id, resource_type, resource_id, rating, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ratings) {
    for (const rating of ratings) {
      activities.push({
        id: `rating-${rating.id}`,
        type: "rate",
        title: `Rated ${rating.rating} stars`,
        description: `Rated a ${rating.resource_type}`,
        link: `/${rating.resource_type === "doc" ? "docs" : "resources"}/${rating.resource_id}`,
        metadata: { resourceType: rating.resource_type, resourceId: rating.resource_id, rating: rating.rating },
        createdAt: rating.created_at || new Date().toISOString(),
      });
    }
  }

  // Get collections (public ones only for non-private view)
  const collectionsQuery = supabase
    .from("collections")
    .select("id, name, is_public, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includePrivate) {
    collectionsQuery.eq("is_public", true);
  }

  const { data: collections } = await collectionsQuery;

  if (collections) {
    for (const col of collections) {
      activities.push({
        id: `collection-${col.id}`,
        type: "collection_create",
        title: "Created a collection",
        description: col.name,
        link: `/collections/${col.id}`,
        metadata: { isPublic: col.is_public },
        createdAt: col.created_at || new Date().toISOString(),
      });
    }
  }

  // Get achievements (public activity)
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select(`
      id,
      earned_at,
      achievements (
        name,
        description,
        icon,
        tier
      )
    `)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })
    .limit(limit);

  if (achievements) {
    const achievementRows = achievements as unknown as AchievementJoinRow[];
    for (const ach of achievementRows) {
      if (ach.achievements) {
        activities.push({
          id: `achievement-${ach.id}`,
          type: "achievement_earned",
          title: "Earned an achievement",
          description: ach.achievements.name,
          link: `/profile/achievements`,
          metadata: {
            icon: ach.achievements.icon,
            tier: ach.achievements.tier,
            achievementDescription: ach.achievements.description,
          },
          createdAt: ach.earned_at,
        });
      }
    }
  }

  // Get reports submitted (private - only for own/admin view)
  if (includePrivate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reports } = await (supabase as any)
      .from("reports")
      .select("id, report_type, reason, status, created_at")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (reports) {
      const reportRows = reports as unknown as ReportActivityRow[];
      for (const report of reportRows) {
        activities.push({
          id: `report-${report.id}`,
          type: "report_submitted",
          title: "Submitted a report",
          description: `Reported a ${report.report_type} for ${report.reason}`,
          metadata: {
            reportType: report.report_type,
            reason: report.reason,
            status: report.status,
          },
          createdAt: report.created_at || new Date().toISOString(),
        });
      }
    }
  }

  // Get follows (public activity)
  // Note: "follows" table not in generated types, cast to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: follows } = await (supabase as any)
    .from("follows")
    .select(`
      id,
      created_at,
      following:following_id (
        name,
        username
      )
    `)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (follows) {
    const followRows = follows as unknown as FollowJoinRow[];
    for (const follow of followRows) {
      if (follow.following) {
        activities.push({
          id: `follow-${follow.id}`,
          type: "follow",
          title: "Started following",
          description: follow.following.name || follow.following.username || "a user",
          link: follow.following.username ? `/users/${follow.following.username}` : undefined,
          createdAt: follow.created_at || new Date().toISOString(),
        });
      }
    }
  }

  // Sort all activities by date (newest first)
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply pagination
  const total = activities.length;
  const paginatedActivities = activities.slice(offset, offset + limit);

  return {
    success: true,
    activities: paginatedActivities,
    total,
  };
}

// ============================================
// LOG ACTIVITY (for tracking views, searches)
// ============================================

export async function logActivity(
  activityType: "view_doc" | "view_resource" | "search",
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      // Anonymous users - don't log
      return { success: true };
    }

    const supabase = await createAdminClient();

    await supabase.from("user_activity").insert({
      user_id: session.user.id,
      activity_type: activityType,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      metadata: (metadata || {}) as Record<string, string>,
    });

    return { success: true };
  } catch (error) {
    console.error("Log activity error:", error);
    // Don't fail the main operation if logging fails
    return { success: true };
  }
}

// ============================================
// CLEAR OLD ACTIVITY (admin function)
// ============================================

export async function clearOldActivity(
  daysOld: number = 90
): Promise<{ success: boolean; deleted?: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();
    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role as UserRole, ACTIONS.MODERATE_COMMENTS)) {
      return { success: false, error: "You do not have permission to manage activity logs" };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("user_activity")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select("id");

    if (error) {
      console.error("Clear old activity error:", error);
      return { success: false, error: "Failed to clear old activity" };
    }

    return { success: true, deleted: data?.length || 0 };
  } catch (error) {
    console.error("Clear old activity error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
