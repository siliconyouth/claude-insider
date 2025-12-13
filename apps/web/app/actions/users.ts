"use server";

/**
 * User Search & Blocking Server Actions
 *
 * Search for users and manage blocked users list.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export interface SearchUserResult {
  id: string;
  username: string | null;
  name: string;
  bio: string | null;
  image: string | null;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

/**
 * Search users by name or username
 */
export async function searchUsers(query: string): Promise<{
  users?: SearchUserResult[];
  error?: string;
}> {
  try {
    if (!query || query.trim().length < 2) {
      return { users: [] };
    }

    const session = await getSession();
    const currentUserId = session?.user?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Search users with partial matching on name and username
    const searchTerm = `%${query.trim().toLowerCase()}%`;

    const { data: users, error } = await supabase
      .from("user")
      .select("id, username, name, bio, image")
      .or(`name.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .neq("id", currentUserId || "")
      .limit(20);

    if (error) {
      console.error("[Users] Search error:", error);
      return { error: "Failed to search users" };
    }

    // If logged in, get blocked users and following status
    let blockedIds: Set<string> = new Set();
    let followingIds: Set<string> = new Set();

    if (currentUserId && users?.length) {
      const userIds = users.map((u: { id: string }) => u.id);

      // Get blocked users
      const { data: blocks } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", currentUserId)
        .in("blocked_id", userIds);

      // Get users who blocked current user
      const { data: blockedBy } = await supabase
        .from("user_blocks")
        .select("blocker_id")
        .eq("blocked_id", currentUserId)
        .in("blocker_id", userIds);

      blockedIds = new Set([
        ...(blocks?.map((b: { blocked_id: string }) => b.blocked_id) || []),
        ...(blockedBy?.map((b: { blocker_id: string }) => b.blocker_id) || []),
      ]);

      // Get following status
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", userIds);

      followingIds = new Set(
        follows?.map((f: { following_id: string }) => f.following_id) || []
      );
    }

    // Filter out blocked users and add status flags
    const filteredUsers = (users || [])
      .filter((u: { id: string }) => !blockedIds.has(u.id))
      .map((u: { id: string; username: string | null; name: string; bio: string | null; image: string | null }) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        bio: u.bio,
        image: u.image,
        isFollowing: followingIds.has(u.id),
        isBlocked: false,
      }));

    return { users: filteredUsers };
  } catch (error) {
    console.error("[Users] Search error:", error);
    return { error: "Failed to search users" };
  }
}

/**
 * Block a user
 */
export async function blockUser(userId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (userId === session.user.id) {
      return { error: "You cannot block yourself" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if user exists
    const { data: targetUser } = await supabase
      .from("user")
      .select("id")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return { error: "User not found" };
    }

    // Create block
    const { error } = await supabase.from("user_blocks").insert({
      blocker_id: session.user.id,
      blocked_id: userId,
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "User already blocked" };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("[Users] Block error:", error);
    return { error: "Failed to block user" };
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string): Promise<{
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

    await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", session.user.id)
      .eq("blocked_id", userId);

    return { success: true };
  } catch (error) {
    console.error("[Users] Unblock error:", error);
    return { error: "Failed to unblock user" };
  }
}

export interface BlockedUser {
  id: string;
  username: string | null;
  name: string;
  image: string | null;
  blockedAt: string;
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(): Promise<{
  users?: BlockedUser[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user_blocks")
      .select(
        `
        created_at,
        blocked:blocked_id (id, username, name, image)
      `
      )
      .eq("blocker_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const users: BlockedUser[] = (data || [])
      .filter((b: { blocked: { id: string } | null }) => b.blocked)
      .map((b: {
        created_at: string;
        blocked: { id: string; username: string | null; name: string; image: string | null };
      }) => ({
        id: b.blocked.id,
        username: b.blocked.username,
        name: b.blocked.name,
        image: b.blocked.image,
        blockedAt: b.created_at,
      }));

    return { users };
  } catch (error) {
    console.error("[Users] Get blocked users error:", error);
    return { error: "Failed to get blocked users" };
  }
}

/**
 * Check if a user is blocked (either direction)
 */
export async function isUserBlocked(userId: string): Promise<{
  blocked?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { blocked: false };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("user_blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${session.user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${session.user.id})`
      )
      .limit(1);

    return { blocked: (data?.length || 0) > 0 };
  } catch (error) {
    console.error("[Users] Check block error:", error);
    return { error: "Failed to check block status" };
  }
}

/**
 * Get total blocked count for current user
 */
export async function getBlockedCount(): Promise<{
  count?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { count: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { count, error } = await supabase
      .from("user_blocks")
      .select("id", { count: "exact", head: true })
      .eq("blocker_id", session.user.id);

    if (error) {
      throw error;
    }

    return { count: count || 0 };
  } catch (error) {
    console.error("[Users] Get blocked count error:", error);
    return { error: "Failed to get blocked count" };
  }
}
