"use server";

/**
 * Messaging Server Actions
 *
 * Handles direct messaging between users including:
 * - Conversation management
 * - Message sending/receiving
 * - @mention detection for AI assistant
 * - Unread counts and read receipts
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

// ============================================
// TYPES
// ============================================

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  isMuted: boolean;
  participants: ConversationParticipant[];
}

export interface ConversationParticipant {
  userId: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  isOnline?: boolean;
  status?: "online" | "offline" | "idle";
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderUsername?: string;
  senderAvatar?: string;
  content: string;
  mentions: string[];
  isAiGenerated: boolean;
  aiResponseTo?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  // E2EE fields
  encryptedContent?: string;
  isEncrypted?: boolean;
  encryptionAlgorithm?: "olm.v1" | "megolm.v1";
  senderDeviceId?: string;
  senderKey?: string;
  sessionId?: string;
}

// ============================================
// DATABASE ROW TYPES
// ============================================

interface ParticipationRow {
  conversation_id: string;
  unread_count?: number;
  is_muted?: boolean;
  last_read_at?: string;
  dm_conversations?: ConversationRow;
}

interface ConversationRow {
  id: string;
  type: string;
  name?: string;
  last_message_at?: string;
  last_message_preview?: string;
  created_at: string;
  updated_at: string;
}

interface ParticipantRow {
  conversation_id: string;
  user_id: string;
  user?: { id: string; name?: string; email?: string };
}

interface ProfileRow {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
}

interface PresenceRow {
  user_id: string;
  status: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  mentions?: string[];
  is_ai_generated?: boolean;
  ai_response_to?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  sender?: { id: string; name?: string };
  // E2EE fields
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_algorithm?: string;
  sender_device_id?: string;
  sender_key?: string;
  session_id?: string;
}

// ============================================
// GET CONVERSATIONS (Optimized v0.92.0)
// ============================================

// Row type for optimized RPC function
interface OptimizedConversationRow {
  id: string;
  is_group: boolean;
  group_name: string | null;
  group_avatar: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  participant_ids: string[];
  participant_names: string[];
  participant_usernames: string[] | null;
  participant_avatars: string[] | null;
  participant_statuses: string[];
}

export async function getConversations(): Promise<{
  success: boolean;
  conversations?: Conversation[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Use optimized RPC function (single query with JOINs instead of 4 queries)
    // Performance improvement: ~200ms → ~50ms (4x faster)
    // Note: RPC function name not in generated types until migration is run
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_conversations_optimized", {
      p_user_id: session.user.id,
    });

    if (error) {
      // Fallback to legacy implementation if RPC doesn't exist yet (migration not run)
      if (error.code === "42883") {
        // Function does not exist
        console.log("[Messaging] Falling back to legacy getConversations");
        return getConversationsLegacy(session.user.id, supabase);
      }
      console.error("Get conversations error:", error);
      return { success: false, error: "Failed to fetch conversations" };
    }

    // Transform RPC result to Conversation type
    const rows = ((data || []) as unknown) as OptimizedConversationRow[];
    const conversations: Conversation[] = rows.map((row) => ({
      id: row.id,
      type: row.is_group ? "group" : "direct",
      name: row.group_name ?? undefined,
      lastMessageAt: row.last_message_at ?? undefined,
      lastMessagePreview: row.last_message_preview ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      unreadCount: row.unread_count,
      isMuted: false, // RPC doesn't return this - can be added if needed
      participants: row.participant_ids.map((userId, index) => ({
        userId,
        name: row.participant_names[index] || undefined,
        avatarUrl: row.participant_avatars?.[index] ?? undefined,
        username: row.participant_usernames?.[index] ?? undefined,
        status: (row.participant_statuses[index] || "offline") as "online" | "offline" | "idle",
        isOnline: row.participant_statuses[index] === "online",
      })),
    }));

    return { success: true, conversations };
  } catch (error) {
    console.error("Get conversations error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Legacy implementation for fallback (when RPC function not yet deployed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getConversationsLegacy(userId: string, supabase: any): Promise<{
  success: boolean;
  conversations?: Conversation[];
  error?: string;
}> {
  // Get user's conversations with participants
  const { data: participations, error: partError } = await supabase
    .from("dm_participants")
    .select(`
      conversation_id,
      unread_count,
      is_muted,
      last_read_at,
      dm_conversations (
        id,
        type,
        name,
        last_message_at,
        last_message_preview,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false });

  if (partError) {
    console.error("Get conversations error:", partError);
    return { success: false, error: "Failed to fetch conversations" };
  }

  // Get all conversation IDs
  const participationRows = (participations || []) as ParticipationRow[];
  const conversationIds = participationRows.map((p) => p.conversation_id);

  if (conversationIds.length === 0) {
    return { success: true, conversations: [] };
  }

  // Get all participants for these conversations
  const { data: allParticipants } = await supabase
    .from("dm_participants")
    .select(`
      conversation_id,
      user_id,
      user:user_id (
        id,
        name,
        email
      )
    `)
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  // Get profiles and presence in PARALLEL (performance optimization)
  const participantRows = (allParticipants || []) as unknown as ParticipantRow[];
  const otherUserIds = participantRows.map((p) => p.user_id);

  // Run both queries simultaneously instead of sequentially
  const [profilesResult, presencesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", otherUserIds),
    supabase
      .from("user_presence")
      .select("user_id, status")
      .in("user_id", otherUserIds),
  ]);

  const profiles = profilesResult.data;
  const presences = presencesResult.data;

  // Build profile and presence maps
  const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);
  const presenceRows = (presences || []) as PresenceRow[];
  const presenceMap = new Map(presenceRows.map((p) => [p.user_id, p.status]));

  // Build conversations with participants
  const conversations: Conversation[] = participationRows.map((p) => {
    const conv = p.dm_conversations;
    const convParticipants = participantRows.filter(
      (ap) => ap.conversation_id === p.conversation_id
    );

    return {
      id: conv?.id || "",
      type: (conv?.type || "direct") as "direct" | "group",
      name: conv?.name,
      lastMessageAt: conv?.last_message_at,
      lastMessagePreview: conv?.last_message_preview,
      createdAt: conv?.created_at || "",
      updatedAt: conv?.updated_at || "",
      unreadCount: p.unread_count || 0,
      isMuted: p.is_muted || false,
      participants: convParticipants.map((cp) => {
        const user = cp.user;
        const profile = profileMap.get(cp.user_id);
        const status = presenceMap.get(cp.user_id) || "offline";
        return {
          userId: cp.user_id,
          name: user?.name,
          email: user?.email,
          avatarUrl: profile?.avatar_url ?? undefined,
          displayName: profile?.display_name ?? undefined,
          username: profile?.username ?? undefined,
          isOnline: status === "online",
          status: status as "online" | "offline" | "idle",
        };
      }),
    };
  });

  // Sort by last message time (newest first)
  conversations.sort((a, b) => {
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  return { success: true, conversations };
}

// ============================================
// GET MESSAGES
// ============================================

export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<{
  success: boolean;
  messages?: Message[];
  hasMore?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase
      .from("dm_messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        mentions,
        is_ai_generated,
        ai_response_to,
        metadata,
        created_at,
        edited_at,
        deleted_at,
        encrypted_content,
        is_encrypted,
        encryption_algorithm,
        sender_device_id,
        sender_key,
        session_id,
        sender:sender_id (
          id,
          name
        )
      `)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Get one extra to check if there are more

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Get messages error:", error);
      return { success: false, error: "Failed to fetch messages" };
    }

    // Check if there are more messages
    const hasMore = messages && messages.length > limit;
    const resultMessages = messages?.slice(0, limit) || [];

    // Get sender profiles (including username for hovercards)
    const messageRows = resultMessages as MessageRow[];
    const senderIds = [...new Set(messageRows.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", senderIds);

    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);

    // Transform messages
    const transformedMessages: Message[] = messageRows.map((m) => {
      const sender = m.sender;
      const profile = profileMap.get(m.sender_id);
      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: profile?.display_name || sender?.name || "Unknown",
        senderUsername: profile?.username ?? undefined,
        senderAvatar: profile?.avatar_url ?? undefined,
        content: m.content,
        mentions: m.mentions || [],
        isAiGenerated: m.is_ai_generated || false,
        aiResponseTo: m.ai_response_to,
        metadata: m.metadata as Record<string, unknown>,
        createdAt: m.created_at,
        editedAt: m.edited_at,
        deletedAt: m.deleted_at,
        // E2EE fields
        encryptedContent: m.encrypted_content,
        isEncrypted: m.is_encrypted || false,
        encryptionAlgorithm: m.encryption_algorithm as "olm.v1" | "megolm.v1" | undefined,
        senderDeviceId: m.sender_device_id,
        senderKey: m.sender_key,
        sessionId: m.session_id,
      };
    });

    // Reverse to get chronological order
    transformedMessages.reverse();

    return { success: true, messages: transformedMessages, hasMore };
  } catch (error) {
    console.error("Get messages error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// SEND MESSAGE
// ============================================

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{
  success: boolean;
  message?: Message;
  aiMentioned?: boolean;
  mentionedUserIds?: string[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Detect @mentions in the message
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = content.match(mentionRegex) || [];
    const mentionUsernames: string[] = [];
    let aiMentioned = false;

    // Extract usernames from mentions
    for (const match of mentionMatches) {
      const username = match.slice(1).toLowerCase();
      if (username === "claudeinsider") {
        aiMentioned = true;
      } else {
        mentionUsernames.push(username);
      }
    }

    // Look up user IDs for mentioned usernames
    const mentionedUserIds: string[] = aiMentioned ? [AI_ASSISTANT_USER_ID] : [];
    if (mentionUsernames.length > 0) {
      // Get user IDs from profiles by username (cast due to types being out of sync)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mentionedProfiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, username")
        .in("username", mentionUsernames);

      // Also check user table for usernames
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mentionedUsers } = await (supabase as any)
        .from("user")
        .select("id, username")
        .in("username", mentionUsernames);

      // Collect user IDs from both sources
      const userIdSet = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mentionedProfiles || []).forEach((p: any) => {
        if (p.user_id) userIdSet.add(p.user_id);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mentionedUsers || []).forEach((u: any) => {
        if (u.id) userIdSet.add(u.id);
      });

      // Add to mentionedUserIds (excluding sender)
      userIdSet.forEach((id) => {
        if (id !== session.user.id) {
          mentionedUserIds.push(id);
        }
      });
    }

    // Insert message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newMessage, error } = await supabase
      .from("dm_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: content.trim(),
        mentions: mentionedUserIds,
        is_ai_generated: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Send message error:", error);
      return { success: false, error: "Failed to send message" };
    }

    const msg = newMessage as MessageRow;

    // Get sender info for response (including username for hovercards)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, username")
      .eq("user_id", session.user.id)
      .single();

    // Cast to ProfileRow since Supabase types may be out of sync
    const profile = profileData as ProfileRow | null;

    // Create notifications for mentioned users (excluding AI and sender)
    const humanMentions = mentionedUserIds.filter((id) => id !== AI_ASSISTANT_USER_ID);
    if (humanMentions.length > 0) {
      // Import dynamically to avoid circular dependency
      const { createNotification } = await import("./notifications");

      const senderName = profile?.display_name || session.user.name || "Someone";
      const preview = content.length > 50 ? content.slice(0, 50) + "..." : content;

      // Create notifications in parallel
      await Promise.all(
        humanMentions.map((userId) =>
          createNotification({
            userId,
            type: "mention",
            title: `${senderName} mentioned you`,
            message: preview,
            actorId: session.user.id,
            resourceType: "dm_message",
            resourceId: msg.id,
            data: {
              conversationId,
              messageId: msg.id,
            },
          })
        )
      );
    }

    const message: Message = {
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderName: profile?.display_name || session.user.name || "You",
      senderUsername: profile?.username ?? undefined,
      senderAvatar: profile?.avatar_url ?? undefined,
      content: msg.content,
      mentions: msg.mentions || [],
      isAiGenerated: false,
      createdAt: msg.created_at,
    };

    return { success: true, message, aiMentioned, mentionedUserIds };
  } catch (error) {
    console.error("Send message error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// START CONVERSATION
// ============================================

export async function startConversation(
  targetUserId: string
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

    if (targetUserId === session.user.id) {
      return { success: false, error: "Cannot start conversation with yourself" };
    }

    const supabase = await createAdminClient();

    // Check if target user exists
    const { data: targetUser } = await supabase
      .from("user")
      .select("id, role")
      .eq("id", targetUserId)
      .single();

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Check if blocked (either direction)
    const { data: block } = await supabase
      .from("user_blocks")
      .select("id")
      .or(`blocker_id.eq.${session.user.id},blocker_id.eq.${targetUserId}`)
      .or(`blocked_id.eq.${session.user.id},blocked_id.eq.${targetUserId}`)
      .limit(1)
      .single();

    if (block) {
      return { success: false, error: "Cannot message this user" };
    }

    // Use database function to get or create conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_or_create_dm_conversation", {
      p_user1: session.user.id,
      p_user2: targetUserId,
    });

    if (error) {
      console.error("Start conversation error:", error);
      return { success: false, error: "Failed to start conversation" };
    }

    return { success: true, conversationId: data as string };
  } catch (error) {
    console.error("Start conversation error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// MARK AS READ
// ============================================

export async function markConversationAsRead(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc("mark_dm_conversation_read", {
      p_user_id: session.user.id,
      p_conversation_id: conversationId,
    });

    if (error) {
      console.error("Mark as read error:", error);
      return { success: false, error: "Failed to mark as read" };
    }

    return { success: true };
  } catch (error) {
    console.error("Mark as read error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// MUTE/UNMUTE CONVERSATION
// ============================================

export async function muteConversation(
  conversationId: string,
  muted: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("dm_participants")
      .update({ is_muted: muted })
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Mute conversation error:", error);
      return { success: false, error: "Failed to update mute status" };
    }

    return { success: true };
  } catch (error) {
    console.error("Mute conversation error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET TOTAL UNREAD COUNT
// ============================================

export async function getTotalUnreadCount(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true, count: 0 };
    }

    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_total_unread_dm_count", {
      p_user_id: session.user.id,
    });

    if (error) {
      console.error("Get unread count error:", error);
      return { success: false, error: "Failed to get unread count" };
    }

    return { success: true, count: (data as number) || 0 };
  } catch (error) {
    console.error("Get unread count error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// GET USERS FOR NEW CONVERSATION
// ============================================

export async function getUsersForMessaging(
  search?: string,
  limit: number = 20
): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    name?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    status: "online" | "offline" | "idle";
    isAiAssistant: boolean;
  }>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Get blocked users to exclude
    const { data: blocks } = await supabase
      .from("user_blocks")
      .select("blocked_id, blocker_id")
      .or(`blocker_id.eq.${session.user.id},blocked_id.eq.${session.user.id}`);

    const blockedIds = new Set<string>();
    blocks?.forEach((b) => {
      if (b.blocker_id === session.user.id) blockedIds.add(b.blocked_id);
      if (b.blocked_id === session.user.id) blockedIds.add(b.blocker_id);
    });

    // Build user query
    let query = supabase
      .from("user")
      .select("id, name, email, role")
      .neq("id", session.user.id)
      .limit(limit);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Get users error:", error);
      return { success: false, error: "Failed to fetch users" };
    }

    // Filter out blocked users
    const filteredUsers = users?.filter((u) => !blockedIds.has(u.id)) || [];

    // Get profiles and presence in PARALLEL (performance optimization)
    const userIds = filteredUsers.map((u) => u.id);
    const [profilesResult, presencesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds),
      supabase
        .from("user_presence")
        .select("user_id, status")
        .in("user_id", userIds),
    ]);

    const profiles = profilesResult.data;
    const presences = presencesResult.data;

    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);
    const presenceRows = (presences || []) as PresenceRow[];
    const presenceMap = new Map(presenceRows.map((p) => [p.user_id, p.status]));

    // Transform and sort (online first, then AI assistant)
    const result = filteredUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const status = (presenceMap.get(u.id) || "offline") as "online" | "offline" | "idle";
      return {
        id: u.id,
        name: u.name ?? undefined,
        email: u.email ?? undefined,
        displayName: profile?.display_name ?? undefined,
        avatarUrl: profile?.avatar_url ?? undefined,
        status,
        isAiAssistant: u.role === "ai_assistant",
      };
    });

    // Sort: online users first, then AI assistant, then others
    result.sort((a, b) => {
      // AI assistant always at top
      if (a.isAiAssistant && !b.isAiAssistant) return -1;
      if (!a.isAiAssistant && b.isAiAssistant) return 1;

      // Then by online status
      const statusOrder = { online: 0, idle: 1, offline: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return { success: true, users: result };
  } catch (error) {
    console.error("Get users error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// SEARCH USERS FOR MENTION (prioritized)
// ============================================

/**
 * Search users with priority ranking for mention autocomplete (like Telegram):
 * 1. Exact match (username or name)
 * 2. Users you follow
 * 3. Users following you
 * 4. Other users
 */
export async function searchUsersForMention(
  query: string,
  limit: number = 10
): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    name?: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    status: "online" | "offline" | "idle";
    isFollowing: boolean;
    isFollower: boolean;
    isExactMatch: boolean;
  }>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    if (!query || query.length < 1) {
      return { success: true, users: [] };
    }

    const supabase = await createAdminClient();
    const searchTerm = query.toLowerCase();

    // Get blocked users to exclude
    const { data: blocks } = await supabase
      .from("user_blocks")
      .select("blocked_id, blocker_id")
      .or(`blocker_id.eq.${session.user.id},blocked_id.eq.${session.user.id}`);

    const blockedIds = new Set<string>();
    blocks?.forEach((b) => {
      if (b.blocker_id === session.user.id) blockedIds.add(b.blocked_id);
      if (b.blocked_id === session.user.id) blockedIds.add(b.blocker_id);
    });

    // Run 3 queries in parallel for efficiency
    const [followingResult, followersResult, allUsersResult] = await Promise.all([
      // Users I'm following that match the query
      supabase
        .from("user_follows")
        .select(`
          following_id,
          user:following_id (
            id,
            name,
            email,
            username
          )
        `)
        .eq("follower_id", session.user.id)
        .limit(limit),

      // Users following me that match the query
      supabase
        .from("user_follows")
        .select(`
          follower_id,
          user:follower_id (
            id,
            name,
            email,
            username
          )
        `)
        .eq("following_id", session.user.id)
        .limit(limit),

      // All users matching query
      supabase
        .from("user")
        .select("id, name, email, username")
        .neq("id", session.user.id)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .limit(limit * 2), // Get more since we'll dedupe
    ]);

    // Build sets of following/follower IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followingIds = new Set((followingResult.data || []).map((r: any) => r.following_id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followerIds = new Set((followersResult.data || []).map((r: any) => r.follower_id));

    // Collect all users, deduplicating
    const userMap = new Map<string, {
      id: string;
      name?: string;
      email?: string;
      username?: string;
    }>();

    // Add following users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (followingResult.data || []).forEach((r: any) => {
      const user = r.user;
      if (user && !blockedIds.has(user.id)) {
        const matches =
          user.name?.toLowerCase().includes(searchTerm) ||
          user.username?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm);
        if (matches) {
          userMap.set(user.id, user);
        }
      }
    });

    // Add follower users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (followersResult.data || []).forEach((r: any) => {
      const user = r.user;
      if (user && !blockedIds.has(user.id) && !userMap.has(user.id)) {
        const matches =
          user.name?.toLowerCase().includes(searchTerm) ||
          user.username?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm);
        if (matches) {
          userMap.set(user.id, user);
        }
      }
    });

    // Add all users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (allUsersResult.data || []).forEach((u: any) => {
      if (!blockedIds.has(u.id) && !userMap.has(u.id)) {
        userMap.set(u.id, u);
      }
    });

    // Get profiles and presence for all collected users
    const userIds = Array.from(userMap.keys());
    if (userIds.length === 0) {
      return { success: true, users: [] };
    }

    const [profilesResult, presencesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username")
        .in("user_id", userIds),
      supabase
        .from("user_presence")
        .select("user_id, status")
        .in("user_id", userIds),
    ]);

    const profileMap = new Map(
      (profilesResult.data as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []
    );
    const presenceMap = new Map(
      (presencesResult.data as PresenceRow[] | null)?.map((p) => [p.user_id, p.status]) || []
    );

    // Build and sort result
    const users = Array.from(userMap.values()).map((u) => {
      const profile = profileMap.get(u.id);
      const status = (presenceMap.get(u.id) || "offline") as "online" | "offline" | "idle";
      const displayName = profile?.display_name || u.name;
      const username = profile?.username || u.username;

      // Check for exact match
      const isExactMatch =
        username?.toLowerCase() === searchTerm ||
        displayName?.toLowerCase() === searchTerm ||
        u.name?.toLowerCase() === searchTerm;

      return {
        id: u.id,
        name: u.name ?? undefined,
        displayName: displayName ?? undefined,
        username: username ?? undefined,
        avatarUrl: profile?.avatar_url ?? undefined,
        status,
        isFollowing: followingIds.has(u.id),
        isFollower: followerIds.has(u.id),
        isExactMatch,
      };
    });

    // Sort by priority: exact match > following > follower > other
    users.sort((a, b) => {
      // Exact matches first
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;

      // Then users I follow
      if (a.isFollowing && !b.isFollowing) return -1;
      if (!a.isFollowing && b.isFollowing) return 1;

      // Then my followers
      if (a.isFollower && !b.isFollower) return -1;
      if (!a.isFollower && b.isFollower) return 1;

      // Then alphabetical by name
      return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
    });

    return { success: true, users: users.slice(0, limit) };
  } catch (error) {
    console.error("Search users for mention error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// DELETE MESSAGE (soft delete)
// ============================================

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: message } = await supabase
      .from("dm_messages")
      .select("id, sender_id")
      .eq("id", messageId)
      .single();

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    const msg = message as MessageRow;
    if (msg.sender_id !== session.user.id) {
      return { success: false, error: "You can only delete your own messages" };
    }

    // Soft delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("dm_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) {
      console.error("Delete message error:", error);
      return { success: false, error: "Failed to delete message" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete message error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
