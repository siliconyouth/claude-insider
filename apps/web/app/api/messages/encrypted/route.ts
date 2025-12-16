/**
 * Encrypted Messages API
 *
 * Handles sending and storing E2EE encrypted messages.
 * The server stores only the encrypted content - never the plaintext.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";
import type { EncryptedMessagePayload } from "@/lib/e2ee";

interface ProfileRow {
  display_name: string | null;
  avatar_url: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  encrypted_content: string | null;
  is_encrypted: boolean;
  encryption_algorithm: string | null;
  sender_device_id: string | null;
  sender_key: string | null;
  session_id: string | null;
  mentions: string[];
  is_ai_generated: boolean;
  ai_response_to: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

/**
 * POST /api/messages/encrypted
 *
 * Send an E2EE encrypted message.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, encryptedPayload } = body as {
      conversationId: string;
      encryptedPayload: EncryptedMessagePayload;
    };

    if (!conversationId || !encryptedPayload) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: participant } = await supabase
      .from("dm_participants" as "profiles")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      );
    }

    // For encrypted messages, we still detect @mentions in the ciphertext marker
    // (The actual content is encrypted, but we can mark AI mentions in metadata)
    // In a real system, the client would indicate if AI was mentioned
    const mentions: string[] = [];
    let aiMentioned = false;

    // Check metadata for AI mention flag (set by client)
    const metadata = (encryptedPayload as EncryptedMessagePayload & { metadata?: { aiMentioned?: boolean } }).metadata;
    if (metadata?.aiMentioned) {
      aiMentioned = true;
      mentions.push(AI_ASSISTANT_USER_ID);
    }

    // Insert encrypted message
    const { data: newMessage, error } = await supabase
      .from("dm_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: "🔒 Encrypted message", // Placeholder for non-E2EE clients
        encrypted_content: encryptedPayload.ciphertext,
        is_encrypted: true,
        encryption_algorithm: encryptedPayload.algorithm,
        sender_device_id: encryptedPayload.senderDeviceId,
        sender_key: encryptedPayload.senderKey,
        session_id: encryptedPayload.sessionId || null,
        mentions,
        is_ai_generated: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send encrypted message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Get sender profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", session.user.id)
      .single();

    const profileData = profile as ProfileRow | null;
    const msg = newMessage as MessageRow;

    const message = {
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderName: profileData?.display_name || session.user.name || "You",
      senderAvatar: profileData?.avatar_url ?? undefined,
      content: msg.content,
      encryptedContent: msg.encrypted_content,
      isEncrypted: msg.is_encrypted,
      encryptionAlgorithm: msg.encryption_algorithm,
      senderDeviceId: msg.sender_device_id,
      senderKey: msg.sender_key,
      sessionId: msg.session_id,
      mentions: msg.mentions || [],
      isAiGenerated: false,
      createdAt: msg.created_at,
    };

    return NextResponse.json({ success: true, message, aiMentioned });
  } catch (error) {
    console.error("Encrypted message API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
