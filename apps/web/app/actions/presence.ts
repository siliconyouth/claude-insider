"use server";

/**
 * User Presence Server Actions (Matrix SDK Pattern)
 *
 * Computes presence status at query time based on last_active_at:
 * - Online: Activity within last 2 minutes
 * - Idle: Activity within last 1 hour but not recent
 * - Offline: No activity for over 1 hour
 *
 * This approach is more reliable than trusting stored status because
 * browser crashes and network issues can leave stale "online" entries.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  computePresenceStatus,
  ONLINE_THRESHOLD_MS,
  IDLE_THRESHOLD_MS,
  type PresenceStatus,
} from "@/lib/presence-utils";

// ============================================
// TYPES
// ============================================

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string;
  lastActiveAt: string;
}

// ============================================
// DATABASE ROW TYPES
// ============================================

interface PresenceRow {
  user_id: string;
  status: string;
  last_seen_at?: string;
  last_active_at?: string;
}

interface TypingIndicatorRow {
  user_id: string;
  conversation_id: string;
  started_at: string;
}

// ============================================
// UPDATE PRESENCE
// ============================================

export async function updatePresence(
  status: "online" | "offline"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true }; // Silently succeed for anonymous users
    }

    const supabase = await createAdminClient();

     
    const { error } = await supabase.rpc("update_user_presence", {
      p_user_id: session.user.id,
      p_status: status,
    });

    if (error) {
      console.error("Update presence error:", error);
      return { success: false, error: "Failed to update presence" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update presence error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// HEARTBEAT (keeps user online)
// ============================================

export async function heartbeat(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true };
    }

    const supabase = await createAdminClient();

    // Update last_active_at to prevent idle status
     
    const { error } = await supabase
      .from("user_presence")
      .upsert({
        user_id: session.user.id,
        status: "online",
        last_seen_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Heartbeat error:", error);
      return { success: false, error: "Failed to send heartbeat" };
    }

    return { success: true };
  } catch (error) {
    console.error("Heartbeat error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET ONLINE USERS (batch)
// ============================================

export async function getOnlineUsers(
  userIds: string[]
): Promise<{
  success: boolean;
  presences?: Record<string, PresenceStatus>;
  error?: string;
}> {
  try {
    if (userIds.length === 0) {
      return { success: true, presences: {} };
    }

    const supabase = await createAdminClient();

    // Fetch last_active_at for computing status (Matrix SDK pattern)
    const { data, error } = await supabase
      .from("user_presence")
      .select("user_id, last_active_at")
      .in("user_id", userIds);

    if (error) {
      console.error("Get online users error:", error);
      return { success: false, error: "Failed to get presence" };
    }

    const presences: Record<string, PresenceStatus> = {};

    // Default all to offline
    userIds.forEach((id) => {
      presences[id] = "offline";
    });

    // Compute status from last_active_at (Matrix SDK pattern)
    const presenceRows = (data || []) as PresenceRow[];
    presenceRows.forEach((p) => {
      presences[p.user_id] = computePresenceStatus(p.last_active_at);
    });

    return { success: true, presences };
  } catch (error) {
    console.error("Get online users error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET USER PRESENCE (single user)
// ============================================

export async function getUserPresence(
  userId: string
): Promise<{
  success: boolean;
  presence?: UserPresence;
  error?: string;
}> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("user_presence")
      .select("user_id, last_seen_at, last_active_at")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Get user presence error:", error);
      return { success: false, error: "Failed to get presence" };
    }

    if (!data) {
      return {
        success: true,
        presence: {
          userId,
          status: "offline",
          lastSeenAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
      };
    }

    const row = data as PresenceRow;
    // Compute status from last_active_at (Matrix SDK pattern)
    const computedStatus = computePresenceStatus(row.last_active_at);

    return {
      success: true,
      presence: {
        userId: row.user_id,
        status: computedStatus,
        lastSeenAt: row.last_seen_at || new Date().toISOString(),
        lastActiveAt: row.last_active_at || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Get user presence error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// SET TYPING (for typing indicators)
// ============================================

export async function setTyping(
  conversationId: string,
  isTyping: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true };
    }

    const supabase = await createAdminClient();

    if (isTyping) {
      // Upsert typing indicator
       
      const { error } = await supabase
        .from("dm_typing_indicators")
        .upsert({
          user_id: session.user.id,
          conversation_id: conversationId,
          started_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Set typing error:", error);
        return { success: false, error: "Failed to set typing" };
      }
    } else {
      // Remove typing indicator
       
      const { error } = await supabase
        .from("dm_typing_indicators")
        .delete()
        .eq("user_id", session.user.id)
        .eq("conversation_id", conversationId);

      if (error) {
        console.error("Clear typing error:", error);
        return { success: false, error: "Failed to clear typing" };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Set typing error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET TYPING USERS (for a conversation)
// ============================================

export async function getTypingUsers(
  conversationId: string
): Promise<{
  success: boolean;
  typingUserIds?: string[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true, typingUserIds: [] };
    }

    const supabase = await createAdminClient();

     
    const { data, error } = await supabase
      .from("dm_typing_indicators")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", session.user.id)
      .gte("started_at", new Date(Date.now() - 10000).toISOString()); // Only last 10 seconds

    if (error) {
      console.error("Get typing users error:", error);
      return { success: false, error: "Failed to get typing users" };
    }

    const typingRows = (data || []) as TypingIndicatorRow[];
    return { success: true, typingUserIds: typingRows.map((d) => d.user_id) };
  } catch (error) {
    console.error("Get typing users error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
