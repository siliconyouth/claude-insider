"use server";

/**
 * Group Chat Server Actions
 *
 * Handles group conversation management including:
 * - Creating group chats
 * - Inviting users
 * - Managing roles (owner/admin/member)
 * - Leaving groups
 * - Updating group settings
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================
// TYPES
// ============================================

export interface GroupConversation {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  status?: "online" | "offline" | "idle";
  joinedAt: string;
  invitedBy?: string;
}

export interface GroupInvitation {
  id: string;
  conversationId: string;
  conversationName?: string;
  inviterId: string;
  inviterName?: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt?: string;
}

// ============================================
// DATABASE ROW TYPES (for Supabase queries)
// ============================================

interface InvitationRow {
  id: string;
  conversation_id: string;
  conversation_name?: string;
  inviter_id: string;
  inviter_name?: string;
  message?: string;
  created_at: string;
  expires_at?: string;
}

interface ParticipantRow {
  id: string;
  user_id: string;
  role?: string;
  joined_at: string;
  invited_by?: string;
  user?: { id: string; name?: string };
}

interface ProfileRow {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
}

interface PresenceRow {
  user_id: string;
  status: string;
}

interface ChatSettingsRow {
  user_id: string;
  sound_enabled?: boolean;
  sound_new_message?: string;
  sound_typing?: boolean;
  sound_mention?: boolean;
  sound_invitation?: boolean;
}

// ============================================
// CREATE GROUP
// ============================================

export async function createGroupConversation(
  name: string,
  description?: string,
  avatarUrl?: string
): Promise<{
  success: boolean;
  conversationId?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    if (!name.trim()) {
      return { success: false, error: "Group name is required" };
    }

    if (name.length > 100) {
      return { success: false, error: "Group name must be 100 characters or less" };
    }

    const supabase = await createAdminClient();

    // Note: RPC function not in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("create_group_conversation", {
      p_creator_id: session.user.id,
      p_name: name.trim(),
      p_description: description?.trim() ?? undefined,
      p_avatar_url: avatarUrl ?? undefined,
    });

    if (error) {
      console.error("Create group error:", error);
      return { success: false, error: "Failed to create group" };
    }

    return { success: true, conversationId: data as string };
  } catch (error) {
    console.error("Create group error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// INVITE TO GROUP
// ============================================

export async function inviteToGroup(
  conversationId: string,
  inviteeId: string,
  message?: string
): Promise<{
  success: boolean;
  invitationId?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("invite_to_group", {
      p_inviter_id: session.user.id,
      p_invitee_id: inviteeId,
      p_conversation_id: conversationId,
      p_message: message?.trim() ?? undefined,
    });

    if (error) {
      console.error("Invite to group error:", error);
      const errorMessage = error.message?.includes("already")
        ? "User is already invited or a member"
        : error.message?.includes("blocked")
        ? "Cannot invite this user"
        : error.message?.includes("admin")
        ? "You don't have permission to invite"
        : "Failed to send invitation";
      return { success: false, error: errorMessage };
    }

    return { success: true, invitationId: data as string };
  } catch (error) {
    console.error("Invite to group error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// ACCEPT INVITATION
// ============================================

export async function acceptGroupInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("accept_group_invitation", {
      p_user_id: session.user.id,
      p_invitation_id: invitationId,
    });

    if (error) {
      console.error("Accept invitation error:", error);
      return {
        success: false,
        error: error.message?.includes("expired") ? "Invitation has expired" : "Failed to accept invitation",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Accept invitation error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// DECLINE INVITATION
// ============================================

export async function declineGroupInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("decline_group_invitation", {
      p_user_id: session.user.id,
      p_invitation_id: invitationId,
    });

    if (error) {
      console.error("Decline invitation error:", error);
      return { success: false, error: "Failed to decline invitation" };
    }

    return { success: true };
  } catch (error) {
    console.error("Decline invitation error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// LEAVE GROUP
// ============================================

export async function leaveGroupConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("leave_group_conversation", {
      p_user_id: session.user.id,
      p_conversation_id: conversationId,
    });

    if (error) {
      console.error("Leave group error:", error);
      return { success: false, error: "Failed to leave group" };
    }

    return { success: true };
  } catch (error) {
    console.error("Leave group error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// UPDATE MEMBER ROLE
// ============================================

export async function updateGroupMemberRole(
  conversationId: string,
  targetUserId: string,
  newRole: "admin" | "member"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("update_group_member_role", {
      p_admin_id: session.user.id,
      p_target_user_id: targetUserId,
      p_conversation_id: conversationId,
      p_new_role: newRole,
    });

    if (error) {
      console.error("Update role error:", error);
      return {
        success: false,
        error: error.message?.includes("permission")
          ? "You don't have permission to change roles"
          : "Failed to update role",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Update role error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// TRANSFER OWNERSHIP
// ============================================

export async function transferGroupOwnership(
  conversationId: string,
  newOwnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("update_group_member_role", {
      p_admin_id: session.user.id,
      p_target_user_id: newOwnerId,
      p_conversation_id: conversationId,
      p_new_role: "owner",
    });

    if (error) {
      console.error("Transfer ownership error:", error);
      return { success: false, error: "Failed to transfer ownership" };
    }

    return { success: true };
  } catch (error) {
    console.error("Transfer ownership error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// REMOVE FROM GROUP
// ============================================

export async function removeFromGroup(
  conversationId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("remove_from_group", {
      p_admin_id: session.user.id,
      p_target_user_id: targetUserId,
      p_conversation_id: conversationId,
    });

    if (error) {
      console.error("Remove from group error:", error);
      return {
        success: false,
        error: error.message?.includes("permission")
          ? "You don't have permission to remove this user"
          : "Failed to remove user",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Remove from group error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET PENDING INVITATIONS
// ============================================

export async function getPendingInvitations(): Promise<{
  success: boolean;
  invitations?: GroupInvitation[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true, invitations: [] };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_pending_invitations", {
      p_user_id: session.user.id,
    });

    if (error) {
      console.error("Get invitations error:", error);
      return { success: false, error: "Failed to fetch invitations" };
    }

    const rows = (data || []) as InvitationRow[];
    const invitations: GroupInvitation[] = rows.map((inv) => ({
      id: inv.id,
      conversationId: inv.conversation_id,
      conversationName: inv.conversation_name,
      inviterId: inv.inviter_id,
      inviterName: inv.inviter_name,
      message: inv.message,
      status: "pending",
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
    }));

    return { success: true, invitations };
  } catch (error) {
    console.error("Get invitations error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET GROUP MEMBERS
// ============================================

export async function getGroupMembers(
  conversationId: string
): Promise<{
  success: boolean;
  members?: GroupMember[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Verify user is a participant (dm_participants is a custom table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a member of this group" };
    }

    // Get all members with their info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members, error } = await supabase
      .from("dm_participants")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        invited_by,
        user:user_id (
          id,
          name
        )
      `)
      .eq("conversation_id", conversationId)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Get members error:", error);
      return { success: false, error: "Failed to fetch members" };
    }

    // Get profiles and presence
    const memberRows = (members || []) as unknown as ParticipantRow[];
    const userIds = memberRows.map((m) => m.user_id);

    const [{ data: profiles }, { data: presences }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("user_presence").select("user_id, status").in("user_id", userIds),
    ]);

    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);
    const presenceRows = (presences || []) as PresenceRow[];
    const presenceMap = new Map(presenceRows.map((p) => [p.user_id, p.status]));

    const memberList: GroupMember[] = memberRows.map((m) => {
      const user = m.user;
      const profile = profileMap.get(m.user_id);
      const status = (presenceMap.get(m.user_id) || "offline") as "online" | "offline" | "idle";

      return {
        id: m.id,
        userId: m.user_id,
        role: (m.role || "member") as "owner" | "admin" | "member",
        name: user?.name,
        displayName: profile?.display_name ?? undefined,
        avatarUrl: profile?.avatar_url ?? undefined,
        status,
        joinedAt: m.joined_at,
        invitedBy: m.invited_by,
      };
    });

    return { success: true, members: memberList };
  } catch (error) {
    console.error("Get members error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// UPDATE GROUP SETTINGS
// ============================================

export async function updateGroupSettings(
  conversationId: string,
  settings: {
    name?: string;
    description?: string;
    avatarUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Verify user is owner or admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("role")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    const participantRow = participant as { role?: string } | null;
    const role = participantRow?.role;
    if (!role || !["owner", "admin"].includes(role)) {
      return { success: false, error: "You don't have permission to update settings" };
    }

    // Build update object
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (settings.name !== undefined) {
      if (!settings.name.trim()) {
        return { success: false, error: "Group name cannot be empty" };
      }
      updates.name = settings.name.trim();
    }
    if (settings.description !== undefined) {
      updates.description = settings.description?.trim() || null;
    }
    if (settings.avatarUrl !== undefined) {
      updates.avatar_url = settings.avatarUrl || null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("dm_conversations")
      .update(updates)
      .eq("id", conversationId)
      .eq("type", "group");

    if (error) {
      console.error("Update settings error:", error);
      return { success: false, error: "Failed to update settings" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update settings error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET CHAT SOUND SETTINGS
// ============================================

export async function getChatSoundSettings(): Promise<{
  success: boolean;
  settings?: {
    soundEnabled: boolean;
    soundNewMessage: string;
    soundTyping: boolean;
    soundMention: boolean;
    soundInvitation: boolean;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return {
        success: true,
        settings: {
          soundEnabled: true,
          soundNewMessage: "message",
          soundTyping: false,
          soundMention: true,
          soundInvitation: true,
        },
      };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("user_chat_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Get sound settings error:", error);
      return { success: false, error: "Failed to fetch settings" };
    }

    const settings = data as ChatSettingsRow | null;
    return {
      success: true,
      settings: {
        soundEnabled: settings?.sound_enabled ?? true,
        soundNewMessage: settings?.sound_new_message ?? "message",
        soundTyping: settings?.sound_typing ?? false,
        soundMention: settings?.sound_mention ?? true,
        soundInvitation: settings?.sound_invitation ?? true,
      },
    };
  } catch (error) {
    console.error("Get sound settings error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// UPDATE CHAT SOUND SETTINGS
// ============================================

export async function updateChatSoundSettings(settings: {
  soundEnabled?: boolean;
  soundNewMessage?: string;
  soundTyping?: boolean;
  soundMention?: boolean;
  soundInvitation?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (settings.soundEnabled !== undefined) updates.sound_enabled = settings.soundEnabled;
    if (settings.soundNewMessage !== undefined) updates.sound_new_message = settings.soundNewMessage;
    if (settings.soundTyping !== undefined) updates.sound_typing = settings.soundTyping;
    if (settings.soundMention !== undefined) updates.sound_mention = settings.soundMention;
    if (settings.soundInvitation !== undefined) updates.sound_invitation = settings.soundInvitation;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("user_chat_settings")
      .upsert({
        user_id: session.user.id,
        ...updates,
      });

    if (error) {
      console.error("Update sound settings error:", error);
      return { success: false, error: "Failed to update settings" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update sound settings error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
