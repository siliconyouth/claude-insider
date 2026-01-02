"use server";

/**
 * Message Pinning Server Actions
 *
 * Handles pinning/unpinning messages in conversations:
 * - Pin message with optional note
 * - Unpin message
 * - Get pinned messages for conversation
 * - Check if user can pin (admin/owner only)
 */

import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ============================================================================
// TYPES
// ============================================================================

export interface PinnedMessage {
  id: string;
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedByName: string | null;
  pinnedByAvatar: string | null;
  pinnedAt: string;
  note: string | null;
  // Message data
  messageContent: string | null;
  messageType: string;
  messageSenderId: string;
  messageSenderName: string | null;
  messageCreatedAt: string;
}

export interface PinResult {
  success: boolean;
  error?: string;
  pin?: PinnedMessage;
}

export interface UnpinResult {
  success: boolean;
  error?: string;
}

export interface PinnedMessagesResult {
  success: boolean;
  pins?: PinnedMessage[];
  error?: string;
}

// ============================================================================
// PIN MESSAGE
// ============================================================================

export async function pinMessage(
  conversationId: string,
  messageId: string,
  note?: string
): Promise<PinResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if user is participant with pin permission (owner or admin)
    const permCheck = await pool.query(
      `SELECT role FROM dm_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (permCheck.rows.length === 0) {
      return { success: false, error: "Not a participant in this conversation" };
    }

    const role = permCheck.rows[0]?.role;
    if (!["owner", "admin"].includes(role)) {
      return { success: false, error: "Only admins can pin messages" };
    }

    // Verify message exists in this conversation
    const msgCheck = await pool.query(
      `SELECT id FROM dm_messages WHERE id = $1 AND conversation_id = $2`,
      [messageId, conversationId]
    );

    if (msgCheck.rows.length === 0) {
      return { success: false, error: "Message not found in this conversation" };
    }

    // Pin the message
    const result = await pool.query<{ id: string; pinned_at: string }>(
      `INSERT INTO dm_pinned_messages (conversation_id, message_id, pinned_by, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (conversation_id, message_id) DO UPDATE SET
         pinned_by = EXCLUDED.pinned_by,
         pinned_at = NOW(),
         note = EXCLUDED.note
       RETURNING id, pinned_at`,
      [conversationId, messageId, userId, note || null]
    );

    if (result.rows[0]) {
      // Fetch full pin data
      const fullPin = await getPinnedMessageById(result.rows[0].id);
      return { success: true, pin: fullPin ?? undefined };
    }

    return { success: true };
  } catch (error) {
    console.error("[pinMessage] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pin message",
    };
  }
}

// ============================================================================
// UNPIN MESSAGE
// ============================================================================

export async function unpinMessage(
  conversationId: string,
  messageId: string
): Promise<UnpinResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if user is participant with pin permission
    const permCheck = await pool.query(
      `SELECT role FROM dm_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (permCheck.rows.length === 0) {
      return { success: false, error: "Not a participant in this conversation" };
    }

    const role = permCheck.rows[0]?.role;
    if (!["owner", "admin"].includes(role)) {
      return { success: false, error: "Only admins can unpin messages" };
    }

    // Unpin the message
    await pool.query(
      `DELETE FROM dm_pinned_messages
       WHERE conversation_id = $1 AND message_id = $2`,
      [conversationId, messageId]
    );

    return { success: true };
  } catch (error) {
    console.error("[unpinMessage] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unpin message",
    };
  }
}

// ============================================================================
// GET PINNED MESSAGES
// ============================================================================

export async function getPinnedMessages(
  conversationId: string
): Promise<PinnedMessagesResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if user is participant
    const permCheck = await pool.query(
      `SELECT 1 FROM dm_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (permCheck.rows.length === 0) {
      return { success: false, error: "Not a participant in this conversation" };
    }

    // Get all pinned messages with details
    const result = await pool.query<{
      id: string;
      conversation_id: string;
      message_id: string;
      pinned_by: string;
      pinned_by_name: string | null;
      pinned_by_avatar: string | null;
      pinned_at: string;
      note: string | null;
      message_content: string | null;
      message_type: string;
      message_sender_id: string;
      message_sender_name: string | null;
      message_created_at: string;
    }>(
      `SELECT
         p.id,
         p.conversation_id,
         p.message_id,
         p.pinned_by,
         pinner.name as pinned_by_name,
         pinner.image as pinned_by_avatar,
         p.pinned_at,
         p.note,
         m.content as message_content,
         COALESCE(m.message_type, 'text') as message_type,
         m.sender_id as message_sender_id,
         sender.name as message_sender_name,
         m.created_at as message_created_at
       FROM dm_pinned_messages p
       JOIN dm_messages m ON m.id = p.message_id
       LEFT JOIN "user" pinner ON pinner.id = p.pinned_by
       LEFT JOIN "user" sender ON sender.id = m.sender_id
       WHERE p.conversation_id = $1
       ORDER BY p.pinned_at DESC`,
      [conversationId]
    );

    const pins: PinnedMessage[] = result.rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      messageId: row.message_id,
      pinnedBy: row.pinned_by,
      pinnedByName: row.pinned_by_name,
      pinnedByAvatar: row.pinned_by_avatar,
      pinnedAt: row.pinned_at,
      note: row.note,
      messageContent: row.message_content,
      messageType: row.message_type,
      messageSenderId: row.message_sender_id,
      messageSenderName: row.message_sender_name,
      messageCreatedAt: row.message_created_at,
    }));

    return { success: true, pins };
  } catch (error) {
    console.error("[getPinnedMessages] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get pinned messages",
    };
  }
}

// ============================================================================
// GET PINNED MESSAGE COUNT
// ============================================================================

export async function getPinnedMessageCount(
  conversationId: string
): Promise<{ count: number; error?: string }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { count: 0, error: "Not authenticated" };
    }

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM dm_pinned_messages WHERE conversation_id = $1`,
      [conversationId]
    );

    return { count: parseInt(result.rows[0]?.count ?? "0", 10) };
  } catch (error) {
    console.error("[getPinnedMessageCount] Error:", error);
    return { count: 0, error: error instanceof Error ? error.message : "Failed to count" };
  }
}

// ============================================================================
// CHECK IF MESSAGE IS PINNED
// ============================================================================

export async function isMessagePinned(
  conversationId: string,
  messageId: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM dm_pinned_messages WHERE conversation_id = $1 AND message_id = $2`,
      [conversationId, messageId]
    );

    return result.rows.length > 0;
  } catch {
    return false;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function getPinnedMessageById(pinId: string): Promise<PinnedMessage | null> {
  const result = await pool.query<{
    id: string;
    conversation_id: string;
    message_id: string;
    pinned_by: string;
    pinned_by_name: string | null;
    pinned_by_avatar: string | null;
    pinned_at: string;
    note: string | null;
    message_content: string | null;
    message_type: string;
    message_sender_id: string;
    message_sender_name: string | null;
    message_created_at: string;
  }>(
    `SELECT
       p.id,
       p.conversation_id,
       p.message_id,
       p.pinned_by,
       pinner.name as pinned_by_name,
       pinner.image as pinned_by_avatar,
       p.pinned_at,
       p.note,
       m.content as message_content,
       COALESCE(m.message_type, 'text') as message_type,
       m.sender_id as message_sender_id,
       sender.name as message_sender_name,
       m.created_at as message_created_at
     FROM dm_pinned_messages p
     JOIN dm_messages m ON m.id = p.message_id
     LEFT JOIN "user" pinner ON pinner.id = p.pinned_by
     LEFT JOIN "user" sender ON sender.id = m.sender_id
     WHERE p.id = $1`,
    [pinId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    pinnedBy: row.pinned_by,
    pinnedByName: row.pinned_by_name,
    pinnedByAvatar: row.pinned_by_avatar,
    pinnedAt: row.pinned_at,
    note: row.note,
    messageContent: row.message_content,
    messageType: row.message_type,
    messageSenderId: row.message_sender_id,
    messageSenderName: row.message_sender_name,
    messageCreatedAt: row.message_created_at,
  };
}
