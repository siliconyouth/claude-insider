"use server";

/**
 * User Following Server Actions
 *
 * Handle follow/unfollow operations and fetching followers/following lists.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export interface FollowUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
  is_following?: boolean;
}

/**
 * Follow a user
 */
export async function followUser(userId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to follow users" };
    }

    if (session.user.id === userId) {
      return { error: "You cannot follow yourself" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if already following
    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", session.user.id)
      .eq("following_id", userId)
      .single();

    if (existing) {
      return { error: "You are already following this user" };
    }

    // Create follow
    const { error } = await supabase.from("user_follows").insert({
      follower_id: session.user.id,
      following_id: userId,
    });

    if (error) {
      console.error("[Following] Follow error:", error);
      return { error: "Failed to follow user" };
    }

    // Get follower info for notification
    const { data: follower } = await supabase
      .from("user")
      .select("name, username")
      .eq("id", session.user.id)
      .single();

    const followerName = follower?.name || follower?.username || "Someone";

    // Create notification for the followed user
    await createNotification({
      userId: userId,
      type: "follow",
      title: `${followerName} started following you`,
      message: `You have a new follower!`,
      actorId: session.user.id,
      resourceType: "user",
      resourceId: session.user.id,
      data: {
        actorUsername: follower?.username, // For deep linking to follower's profile
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[Following] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", session.user.id)
      .eq("following_id", userId);

    if (error) {
      console.error("[Following] Unfollow error:", error);
      return { error: "Failed to unfollow user" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[Following] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Check if current user is following another user
 */
export async function isFollowing(userId: string): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", session.user.id)
      .eq("following_id", userId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get followers of a user
 */
export async function getFollowers(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  data?: FollowUser[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, count, error } = await supabase
      .from("user_follows")
      .select(
        `
        follower:follower_id (
          id,
          name,
          username,
          image,
          bio,
          followers_count,
          following_count,
          created_at:createdAt
        )
      `,
        { count: "exact" }
      )
      .eq("following_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Following] Get followers error:", error);
      return { error: "Failed to load followers" };
    }

    // Check if current user is following each follower
    let followingIds: string[] = [];
    if (session?.user?.id) {
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", session.user.id);

      followingIds = followingData?.map((f: { following_id: string }) => f.following_id) || [];
    }

    const followers: FollowUser[] = (data || [])
      .filter((row: { follower: FollowUser | null }) => row.follower)
      .map((row: { follower: FollowUser }) => ({
        ...row.follower,
        is_following: followingIds.includes(row.follower.id),
      }));

    return { data: followers, total: count || 0 };
  } catch (error) {
    console.error("[Following] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  data?: FollowUser[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, count, error } = await supabase
      .from("user_follows")
      .select(
        `
        following:following_id (
          id,
          name,
          username,
          image,
          bio,
          followers_count,
          following_count,
          created_at:createdAt
        )
      `,
        { count: "exact" }
      )
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Following] Get following error:", error);
      return { error: "Failed to load following" };
    }

    // Check if current user is following each user
    let followingIds: string[] = [];
    if (session?.user?.id) {
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", session.user.id);

      followingIds = followingData?.map((f: { following_id: string }) => f.following_id) || [];
    }

    const following: FollowUser[] = (data || [])
      .filter((row: { following: FollowUser | null }) => row.following)
      .map((row: { following: FollowUser }) => ({
        ...row.following,
        is_following: followingIds.includes(row.following.id),
      }));

    return { data: following, total: count || 0 };
  } catch (error) {
    console.error("[Following] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get activity feed for current user (from followed users)
 */
export async function getActivityFeed(options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  data?: ActivityItem[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get IDs of users we're following
    const { data: followingData } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", session.user.id);

    const followingIds = followingData?.map((f: { following_id: string }) => f.following_id) || [];

    if (followingIds.length === 0) {
      return { data: [], total: 0 };
    }

    // Get activity from followed users
    const { data, count, error } = await supabase
      .from("user_activity")
      .select(
        `
        *,
        user:user_id (
          id,
          name,
          username,
          image
        )
      `,
        { count: "exact" }
      )
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Following] Activity feed error:", error);
      return { error: "Failed to load activity feed" };
    }

    const items: ActivityItem[] = (data || []).map(
      (row: {
        id: string;
        user_id: string;
        activity_type: string;
        resource_type: string;
        resource_id: string;
        created_at: string;
        user: { id: string; name: string; username: string | null; image: string | null };
      }) => ({
        id: row.id,
        userId: row.user_id,
        type: row.activity_type,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        createdAt: row.created_at,
        user: row.user,
      })
    );

    return { data: items, total: count || 0 };
  } catch (error) {
    console.error("[Following] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export interface ActivityItem {
  id: string;
  userId: string;
  type: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

/**
 * Get follow counts for a user
 */
export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: number;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("user")
      .select("followers_count, following_count")
      .eq("id", userId)
      .single();

    return {
      followers: data?.followers_count || 0,
      following: data?.following_count || 0,
    };
  } catch {
    return { followers: 0, following: 0 };
  }
}
