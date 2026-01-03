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
import { computePresenceStatus } from "@/lib/presence-utils";

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
  // Read receipts (populated separately)
  readReceipts?: ReadReceipt[];
  // Reply threading
  replyToMessageId?: string;
  replyToMessage?: {
    id: string;
    senderId: string;
    senderName?: string;
    content: string;
    isDeleted?: boolean;
  };
}

export interface ReadReceipt {
  userId: string;
  userName?: string;
  userUsername?: string;
  userAvatar?: string;
  readAt: string;
}

// ============================================
// DATABASE ROW TYPES
// ============================================

interface _ParticipationRow {
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

interface _ParticipantRow {
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
  // Reply threading
  reply_to_message_id?: string;
}

interface ReadReceiptRow {
  message_id: string;
  user_id: string;
  user_name: string | null;
  user_username: string | null;
  user_image: string | null;
  read_at: string;
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
      // DEFENSIVE: Ensure participant_ids is an array before mapping (fixes "Display Error" if RPC returns null)
      participants: (row.participant_ids || []).map((userId, index) => ({
        userId,
        name: (row.participant_names || [])[index] || undefined,
        avatarUrl: row.participant_avatars?.[index] ?? undefined,
        username: row.participant_usernames?.[index] ?? undefined,
        status: ((row.participant_statuses || [])[index] || "offline") as "online" | "offline" | "idle",
        isOnline: (row.participant_statuses || [])[index] === "online",
      })),
    }));

    return { success: true, conversations };
  } catch (error) {
    console.error("Get conversations error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
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
     
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Build query (using any cast since reply_to_message_id may not be in generated types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
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
        reply_to_message_id,
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
    const messageRows = resultMessages as (MessageRow & { reply_to_message_id?: string })[];
    const senderIds = [...new Set(messageRows.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", senderIds);

    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);

    // Batch-fetch reply-to messages (Matrix SDK pattern for efficient loading)
    const replyIds = [...new Set(messageRows.filter((m) => m.reply_to_message_id).map((m) => m.reply_to_message_id!))] as string[];
    const replyMessageMap = new Map<string, { id: string; senderId: string; senderName: string; content: string; isDeleted: boolean }>();

    if (replyIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: replyMessages } = await (supabase as any)
        .from("dm_messages")
        .select("id, sender_id, content, deleted_at")
        .in("id", replyIds);

      if (replyMessages) {
        // Get additional sender IDs from reply messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replySenderIds = [...new Set((replyMessages as any[]).map((r) => r.sender_id))].filter(
          (id) => !profileMap.has(id)
        );

        if (replySenderIds.length > 0) {
          const { data: replyProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, username")
            .in("user_id", replySenderIds);

          (replyProfiles as ProfileRow[] | null)?.forEach((p) => profileMap.set(p.user_id, p));
        }

        // Get all reply sender IDs for user table fallback (in case profiles don't have display_name)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allReplySenderIds = [...new Set((replyMessages as any[]).map((r) => r.sender_id))] as string[];
        let replyUserNames: Record<string, string> = {};
        if (allReplySenderIds.length > 0) {
          const { data: replyUsers } = await supabase
            .from("user")
            .select("id, name")
            .in("id", allReplySenderIds);

          if (replyUsers) {
            replyUserNames = Object.fromEntries(
              replyUsers.map((u: { id: string; name: string | null }) => [u.id, u.name || ""])
            );
          }
        }

        // Build reply message map with proper fallback chain: profile.display_name > user.name > profile.username > "Unknown"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (replyMessages as any[]).forEach((r) => {
          const replyProfile = profileMap.get(r.sender_id);
          const userName = replyUserNames[r.sender_id];
          replyMessageMap.set(r.id, {
            id: r.id,
            senderId: r.sender_id,
            senderName: replyProfile?.display_name || userName || replyProfile?.username || "Unknown",
            content: r.deleted_at ? "[Message deleted]" : r.content,
            isDeleted: !!r.deleted_at,
          });
        });
      }
    }

    // Transform messages
    const transformedMessages: Message[] = messageRows.map((m) => {
      const sender = m.sender;
      const profile = profileMap.get(m.sender_id);
      const replyToMsg = m.reply_to_message_id ? replyMessageMap.get(m.reply_to_message_id) : undefined;

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
        // Reply threading
        replyToMessageId: m.reply_to_message_id,
        replyToMessage: replyToMsg,
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
// GET MESSAGES SINCE (Gap Detection)
// ============================================

/**
 * Fetch messages created after a given timestamp.
 * Used for gap detection after reconnection.
 */
export async function getMessagesSince(
  conversationId: string,
  afterTimestamp: string
): Promise<{
  success: boolean;
  messages?: Message[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Fetch messages after the given timestamp (max 100 for safety)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error } = await (supabase as any)
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
        reply_to_message_id,
        sender:sender_id (
          id,
          name
        )
      `)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .gt("created_at", afterTimestamp)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Get messages since error:", error);
      return { success: false, error: "Failed to fetch messages" };
    }

    if (!messages || messages.length === 0) {
      return { success: true, messages: [] };
    }

    // Get sender profiles
    const messageRows = messages as (MessageRow & { reply_to_message_id?: string })[];
    const senderIds = [...new Set(messageRows.map((m) => m.sender_id))];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", senderIds);

    interface ProfileData {
      displayName: string | null;
      username: string | null;
      avatarUrl: string | null;
    }
    const profileMap = new Map<string, ProfileData>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profiles || []).map((p: any) => [
        p.user_id,
        {
          displayName: p.display_name,
          username: p.username,
          avatarUrl: p.avatar_url,
        },
      ])
    );

    // Batch-fetch reply-to messages
    const replyIds = [...new Set(messageRows.filter((m) => m.reply_to_message_id).map((m) => m.reply_to_message_id!))] as string[];
    const replyMessageMap = new Map<string, { id: string; senderId: string; senderName: string; content: string; isDeleted: boolean }>();

    if (replyIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: replyMessages } = await (supabase as any)
        .from("dm_messages")
        .select("id, sender_id, content, deleted_at")
        .in("id", replyIds);

      if (replyMessages) {
        // Get additional sender IDs from reply messages that aren't in profileMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replySenderIds = [...new Set((replyMessages as any[]).map((r) => r.sender_id))].filter(
          (id) => !profileMap.has(id)
        );

        if (replySenderIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: replyProfiles } = await (supabase as any)
            .from("profiles")
            .select("user_id, display_name, avatar_url, username")
            .in("user_id", replySenderIds);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (replyProfiles || []).forEach((p: any) => {
            profileMap.set(p.user_id, {
              displayName: p.display_name,
              username: p.username,
              avatarUrl: p.avatar_url,
            });
          });
        }

        // Get all reply sender IDs for user table fallback (in case profiles don't have display_name)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allReplySenderIds = [...new Set((replyMessages as any[]).map((r) => r.sender_id))] as string[];
        let replyUserNames: Record<string, string> = {};
        if (allReplySenderIds.length > 0) {
          const { data: replyUsers } = await supabase
            .from("user")
            .select("id, name")
            .in("id", allReplySenderIds);

          if (replyUsers) {
            replyUserNames = Object.fromEntries(
              replyUsers.map((u: { id: string; name: string | null }) => [u.id, u.name || ""])
            );
          }
        }

        // Build reply message map with proper fallback chain: profile.displayName > user.name > profile.username > "Unknown"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (replyMessages as any[]).forEach((r) => {
          const replyProfile = profileMap.get(r.sender_id);
          const userName = replyUserNames[r.sender_id];
          replyMessageMap.set(r.id, {
            id: r.id,
            senderId: r.sender_id,
            senderName: replyProfile?.displayName || userName || replyProfile?.username || "Unknown",
            content: r.deleted_at ? "[Message deleted]" : r.content,
            isDeleted: !!r.deleted_at,
          });
        });
      }
    }

    // Transform to Message type
    const transformedMessages: Message[] = messageRows.map((m) => {
      const profile = profileMap.get(m.sender_id);
      const replyToMsg = m.reply_to_message_id ? replyMessageMap.get(m.reply_to_message_id) : undefined;

      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: profile?.displayName || m.sender?.name || "Unknown",
        senderUsername: profile?.username ?? undefined,
        senderAvatar: profile?.avatarUrl ?? undefined,
        content: m.content,
        mentions: m.mentions || [],
        isAiGenerated: m.is_ai_generated || false,
        aiResponseTo: m.ai_response_to,
        metadata: m.metadata,
        createdAt: m.created_at,
        editedAt: m.edited_at,
        deletedAt: m.deleted_at,
        encryptedContent: m.encrypted_content,
        isEncrypted: m.is_encrypted || false,
        encryptionAlgorithm: m.encryption_algorithm as Message["encryptionAlgorithm"],
        senderDeviceId: m.sender_device_id,
        senderKey: m.sender_key,
        sessionId: m.session_id,
        // Reply threading
        replyToMessageId: m.reply_to_message_id,
        replyToMessage: replyToMsg,
      };
    });

    return { success: true, messages: transformedMessages };
  } catch (error) {
    console.error("Get messages since error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// SEND MESSAGE
// ============================================

export async function sendMessage(
  conversationId: string,
  content: string,
  replyToMessageId?: string
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
     
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Get conversation type to determine AI response behavior
     
    const { data: conversation } = await supabase
      .from("dm_conversations")
      .select("type")
      .eq("id", conversationId)
      .single();

    const conversationType = (conversation as { type: string } | null)?.type || "direct";
    const isDirectDM = conversationType === "direct";

    // Detect @mentions in the message
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = content.match(mentionRegex) || [];
    const mentionUsernames: string[] = [];
    let aiMentioned = false;
    let aiExplicitlyMentioned = false;

    // Extract usernames from mentions
    for (const match of mentionMatches) {
      const username = match.slice(1).toLowerCase();
      if (username === "claudeinsider") {
        aiExplicitlyMentioned = true;
      } else {
        mentionUsernames.push(username);
      }
    }

    // AI response logic:
    // - Direct DMs: AI does NOT auto-respond (disabled to avoid unwanted AI messages)
    // - Group chats: AI only responds when @claudeinsider is explicitly mentioned AND AI is a member
    if (aiExplicitlyMentioned && !isDirectDM) {
      // Check if AI is a member of this group before responding
       
      const { data: aiParticipant } = await supabase
        .from("dm_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", AI_ASSISTANT_USER_ID)
        .single();

      aiMentioned = !!aiParticipant; // Only respond if AI is a member
    }
    // Note: In direct DMs, AI will not respond even if mentioned.
    // Users should use the AI Assistant tab for direct AI interactions.

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

    // Fetch reply-to message details if replying
    let replyToMessage: Message["replyToMessage"] | undefined;
    if (replyToMessageId) {
      const { data: replyMsg } = await supabase
        .from("dm_messages")
        .select("id, sender_id, content, deleted_at")
        .eq("id", replyToMessageId)
        .eq("conversation_id", conversationId)
        .single();

      if (replyMsg) {
        // Get sender name for the reply preview
        const { data: replySenderProfile } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("user_id", (replyMsg as { sender_id: string }).sender_id)
          .single();

        const replySender = replySenderProfile as { display_name?: string; username?: string } | null;
        const replyMsgData = replyMsg as { id: string; sender_id: string; content: string; deleted_at?: string };

        replyToMessage = {
          id: replyMsgData.id,
          senderId: replyMsgData.sender_id,
          senderName: replySender?.display_name || replySender?.username || "Unknown",
          content: replyMsgData.deleted_at ? "[Message deleted]" : replyMsgData.content,
          isDeleted: !!replyMsgData.deleted_at,
        };
      }
    }

    // Insert message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newMessage, error } = await (supabase as any)
      .from("dm_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: content.trim(),
        mentions: mentionedUserIds,
        is_ai_generated: false,
        reply_to_message_id: replyToMessageId || null,
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
      replyToMessageId: replyToMessageId,
      replyToMessage: replyToMessage,
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
        .select("user_id, last_active_at")
        .in("user_id", userIds),
    ]);

    const profiles = profilesResult.data;
    const presences = presencesResult.data;

    // Build maps for efficient lookup
    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);
    const presenceRows = (presences || []) as { user_id: string; last_active_at: string | null }[];
    const presenceMap = new Map(
      presenceRows.map((p) => [p.user_id, computePresenceStatus(p.last_active_at)])
    );

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
        .select("user_id, last_active_at")
        .in("user_id", userIds),
    ]);

    // Build maps for efficient lookup
    const profileMap = new Map(
      (profilesResult.data as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []
    );
    const presenceRows = (presencesResult.data || []) as { user_id: string; last_active_at: string | null }[];
    const presenceMap = new Map(
      presenceRows.map((p) => [p.user_id, computePresenceStatus(p.last_active_at)])
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

// ============================================
// EDIT MESSAGE
// ============================================

/**
 * Edit a message's content.
 * Only the sender can edit their own messages.
 * Sets edited_at timestamp for "Edited" badge display.
 */
export async function editMessage(
  messageId: string,
  newContent: string
): Promise<{
  success: boolean;
  message?: Message;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    if (!newContent.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    const supabase = await createAdminClient();

    // Verify ownership and get message details
    const { data: message } = await supabase
      .from("dm_messages")
      .select("id, sender_id, conversation_id, deleted_at")
      .eq("id", messageId)
      .single();

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    const msg = message as { id: string; sender_id: string; conversation_id: string; deleted_at?: string };

    if (msg.sender_id !== session.user.id) {
      return { success: false, error: "You can only edit your own messages" };
    }

    if (msg.deleted_at) {
      return { success: false, error: "Cannot edit a deleted message" };
    }

    // Update message content and set edited_at
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("dm_messages")
      .update({
        content: newContent.trim(),
        edited_at: now,
      })
      .eq("id", messageId);

    if (updateError) {
      console.error("Edit message error:", updateError);
      return { success: false, error: "Failed to edit message" };
    }

    // Fetch the updated message with sender info
    const { data: updatedMessage } = await supabase
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
        session_id
      `)
      .eq("id", messageId)
      .single();

    if (!updatedMessage) {
      return { success: false, error: "Failed to fetch updated message" };
    }

    // Get sender profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("user_id", session.user.id)
      .single();

    const updated = updatedMessage as MessageRow;
    const resultMessage: Message = {
      id: updated.id,
      conversationId: updated.conversation_id,
      senderId: updated.sender_id,
      senderName: profile?.display_name || "Unknown",
      senderUsername: profile?.username,
      senderAvatar: profile?.avatar_url,
      content: updated.content,
      mentions: updated.mentions || [],
      isAiGenerated: updated.is_ai_generated || false,
      aiResponseTo: updated.ai_response_to,
      metadata: updated.metadata,
      createdAt: updated.created_at,
      editedAt: updated.edited_at,
      deletedAt: updated.deleted_at,
      encryptedContent: updated.encrypted_content,
      isEncrypted: updated.is_encrypted || false,
      encryptionAlgorithm: updated.encryption_algorithm as Message["encryptionAlgorithm"],
      senderDeviceId: updated.sender_device_id,
      senderKey: updated.sender_key,
      sessionId: updated.session_id,
    };

    return { success: true, message: resultMessage };
  } catch (error) {
    console.error("Edit message error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// READ RECEIPTS (Seen Feature)
// ============================================

/**
 * Mark messages as read (seen) by the current user.
 * This inserts read receipts for all messages in a conversation
 * that the user hasn't already marked as read.
 *
 * @param conversationId - The conversation to mark messages as read
 * @param upToMessageId - Optional: Only mark messages up to this message ID
 * @returns Number of messages marked as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  upToMessageId?: string
): Promise<{
  success: boolean;
  markedCount?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Use RPC function for efficient bulk insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("mark_messages_read", {
      p_user_id: session.user.id,
      p_conversation_id: conversationId,
      p_up_to_message_id: upToMessageId || null,
    });

    if (error) {
      console.error("Mark messages read error:", error);
      return { success: false, error: "Failed to mark messages as read" };
    }

    return { success: true, markedCount: data as number };
  } catch (error) {
    console.error("Mark messages read error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get read receipts for a list of messages.
 * Returns a map of message ID → array of read receipts.
 *
 * @param messageIds - Array of message IDs to get receipts for
 * @returns Map of message ID to read receipts
 */
export async function getReadReceipts(
  messageIds: string[]
): Promise<{
  success: boolean;
  receipts?: Record<string, ReadReceipt[]>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    if (!messageIds || messageIds.length === 0) {
      return { success: true, receipts: {} };
    }

    const supabase = await createAdminClient();

    // Try RPC function first for efficiency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_message_read_receipts", {
      p_message_ids: messageIds,
    });

    if (error) {
      console.error("Get read receipts error:", error);
      return { success: false, error: "Failed to get read receipts" };
    }

    // Transform into map
    const rows = (data || []) as ReadReceiptRow[];
    const receiptsMap: Record<string, ReadReceipt[]> = {};

    for (const row of rows) {
      if (!receiptsMap[row.message_id]) {
        receiptsMap[row.message_id] = [];
      }
      const arr = receiptsMap[row.message_id];
      if (arr) {
        arr.push({
          userId: row.user_id,
          userName: row.user_name ?? undefined,
          userUsername: row.user_username ?? undefined,
          userAvatar: row.user_image ?? undefined,
          readAt: row.read_at,
        });
      }
    }

    return { success: true, receipts: receiptsMap };
  } catch (error) {
    console.error("Get read receipts error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// MENTION PROFILE LOOKUP
// ============================================

/**
 * Profile data for @mention hover cards
 */
export interface MentionProfile {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  isOnline?: boolean;
}

/**
 * Batch fetch profiles by usernames for @mention hover cards.
 * Returns a map of lowercase username -> profile data.
 *
 * @param usernames - Array of usernames to look up (case-insensitive)
 * @returns Map of lowercase username -> profile data
 */
export async function getProfilesByUsernames(
  usernames: string[]
): Promise<{
  success: boolean;
  profiles?: Record<string, MentionProfile>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    if (!usernames.length) {
      return { success: true, profiles: {} };
    }

    // Deduplicate and lowercase
    const uniqueUsernames = [...new Set(usernames.map((u) => u.toLowerCase()))];

    const supabase = await createAdminClient();

    // Fetch profiles by username (cast due to types being out of sync)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles, error } = await (supabase as any)
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, bio")
      .in("username", uniqueUsernames);

    if (error) {
      console.error("Error fetching profiles by username:", error);
      return { success: false, error: "Failed to fetch profiles" };
    }

    // Fetch user names from user table for profiles that don't have display_name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = (profiles || []).map((p: any) => p.user_id as string);
    let userNames: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("user")
        .select("id, name")
        .in("id", userIds);

      if (users) {
        userNames = Object.fromEntries(
          users.map((u: { id: string; name: string | null }) => [u.id, u.name || ""])
        );
      }
    }

    // Fetch online status from user_presence
    let onlineStatus: Record<string, boolean> = {};
    if (userIds.length > 0) {
      const { data: presence } = await supabase
        .from("user_presence")
        .select("user_id, last_active_at")
        .in("user_id", userIds);

      if (presence) {
        onlineStatus = Object.fromEntries(
          presence.map((p: { user_id: string; last_active_at: string | null }) => [
            p.user_id,
            computePresenceStatus(p.last_active_at) === "online",
          ])
        );
      }
    }

    // Build profile map
    const profileMap: Record<string, MentionProfile> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const profile of (profiles || []) as any[]) {
      if (profile.username) {
        const username = (profile.username as string).toLowerCase();
        profileMap[username] = {
          id: profile.user_id,
          name: profile.display_name || userNames[profile.user_id] || profile.username,
          username: profile.username,
          image: profile.avatar_url,
          bio: profile.bio,
          isOnline: onlineStatus[profile.user_id] || false,
        };
      }
    }

    return { success: true, profiles: profileMap };
  } catch (error) {
    console.error("Error in getProfilesByUsernames:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// MESSAGE REACTIONS (Matrix SDK pattern)
// ============================================

export interface Reaction {
  emoji: string;
  count: number;
  users: {
    id: string;
    name?: string;
    username?: string;
  }[];
  hasReacted: boolean; // Whether current user has reacted with this emoji
}

export interface ReactionSummary {
  messageId: string;
  reactions: Reaction[];
}

/**
 * Toggle a reaction on a message.
 * If the user has already reacted with this emoji, it removes the reaction.
 * Otherwise, it adds the reaction.
 */
export async function toggleReaction(
  messageId: string,
  emoji: string
): Promise<{ success: boolean; action?: "added" | "removed"; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createAdminClient();

    // Check if user already has this reaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", session.user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      // Remove existing reaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("message_reactions")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error("Remove reaction error:", error);
        return { success: false, error: "Failed to remove reaction" };
      }

      return { success: true, action: "removed" };
    } else {
      // Add new reaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("message_reactions").insert({
        message_id: messageId,
        user_id: session.user.id,
        emoji,
      });

      if (error) {
        console.error("Add reaction error:", error);
        return { success: false, error: "Failed to add reaction" };
      }

      return { success: true, action: "added" };
    }
  } catch (error) {
    console.error("Toggle reaction error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all reactions for a list of messages, aggregated by emoji.
 */
export async function getReactionsForMessages(
  messageIds: string[]
): Promise<{ success: boolean; reactions?: Record<string, ReactionSummary>; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    if (messageIds.length === 0) {
      return { success: true, reactions: {} };
    }

    const supabase = await createAdminClient();

    // Get all reactions for these messages
    interface ReactionRow {
      id: string;
      message_id: string;
      user_id: string;
      emoji: string;
      created_at: string;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reactionsData, error } = await (supabase as any)
      .from("message_reactions")
      .select("id, message_id, user_id, emoji, created_at")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });

    const reactions = (reactionsData || []) as ReactionRow[];

    if (error) {
      console.error("Get reactions error:", error);
      return { success: false, error: "Failed to get reactions" };
    }

    // Get user profiles for reaction users
    const userIds = [...new Set(reactions.map((r) => r.user_id))];
    let userProfiles: Record<string, { name?: string; username?: string }> = {};

    if (userIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", userIds);

      userProfiles = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profiles || []).map((p: any) => [
          p.user_id,
          { name: p.display_name, username: p.username },
        ])
      );
    }

    // Aggregate reactions by message and emoji
    const result: Record<string, ReactionSummary> = {};

    for (const reaction of reactions) {
      if (!result[reaction.message_id]) {
        result[reaction.message_id] = {
          messageId: reaction.message_id,
          reactions: [],
        };
      }

      // We just created it above if it didn't exist
      const summary = result[reaction.message_id]!;
      let emojiReaction = summary.reactions.find((r) => r.emoji === reaction.emoji);

      if (!emojiReaction) {
        emojiReaction = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasReacted: false,
        };
        summary.reactions.push(emojiReaction);
      }

      emojiReaction.count++;
      emojiReaction.users.push({
        id: reaction.user_id,
        name: userProfiles[reaction.user_id]?.name,
        username: userProfiles[reaction.user_id]?.username,
      });

      if (reaction.user_id === session.user.id) {
        emojiReaction.hasReacted = true;
      }
    }

    return { success: true, reactions: result };
  } catch (error) {
    console.error("Get reactions error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// SEARCH MESSAGES (In-Conversation Search)
// ============================================

export interface SearchResult {
  message: Message;
  matchContext: string;
  matchIndex: number;
}

/**
 * Search messages within a conversation.
 * Returns matching messages with context snippets.
 *
 * Matrix SDK pattern: Simple text search with highlighted matches.
 */
export async function searchMessages(
  conversationId: string,
  query: string,
  limit: number = 50
): Promise<{
  success: boolean;
  results?: SearchResult[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return { success: false, error: "Search query must be at least 2 characters" };
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: participant } = await supabase
      .from("dm_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return { success: false, error: "You are not a participant in this conversation" };
    }

    // Search messages using ILIKE for case-insensitive partial match
    // PostgreSQL text search is more efficient than client-side filtering
    const { data: messages, error } = await supabase
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
        sender:sender_id (
          id,
          name
        )
      `)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .ilike("content", `%${trimmedQuery}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Search messages error:", error);
      return { success: false, error: "Failed to search messages" };
    }

    if (!messages || messages.length === 0) {
      return { success: true, results: [], totalCount: 0 };
    }

    // Get sender profiles
    const messageRows = messages as MessageRow[];
    const senderIds = [...new Set(messageRows.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", senderIds);

    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.user_id, p]) || []);

    // Transform to search results with context
    const queryLower = trimmedQuery.toLowerCase();
    const results: SearchResult[] = messageRows.map((m) => {
      const sender = m.sender;
      const profile = profileMap.get(m.sender_id);

      // Find match position for context extraction
      const contentLower = m.content.toLowerCase();
      const matchIndex = contentLower.indexOf(queryLower);

      // Extract context snippet around match (50 chars on each side)
      const contextStart = Math.max(0, matchIndex - 50);
      const contextEnd = Math.min(m.content.length, matchIndex + trimmedQuery.length + 50);
      let matchContext = m.content.slice(contextStart, contextEnd);
      if (contextStart > 0) matchContext = "..." + matchContext;
      if (contextEnd < m.content.length) matchContext = matchContext + "...";

      const message: Message = {
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
      };

      return {
        message,
        matchContext,
        matchIndex,
      };
    });

    return {
      success: true,
      results,
      totalCount: results.length,
    };
  } catch (error) {
    console.error("Search messages error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
