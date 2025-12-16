/**
 * E2EE Session Sharing API
 *
 * Handles Megolm session key distribution between devices.
 * When a new Megolm session is created, the session key is encrypted
 * with Olm and shared with all participant devices.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface SessionShare {
  recipientUserId: string;
  recipientDeviceId: string;
  encryptedSessionKey: string;
}

interface MegolmShareRow {
  id: string;
  conversation_id: string;
  session_id: string;
  sender_device_id: string;
  encrypted_session_key: string;
  first_known_index: number;
  created_at: string;
  claimed_at: string | null;
}

/**
 * POST /api/e2ee/sessions/share
 *
 * Share a Megolm session key with participant devices.
 * Called when creating a new outbound Megolm session.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, sessionId, senderDeviceId, shares } = body as {
      conversationId: string;
      sessionId: string;
      senderDeviceId: string;
      shares: SessionShare[];
    };

    if (!conversationId || !sessionId || !senderDeviceId || !shares) {
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

    // Use the database function to share session keys
    const { error } = await supabase.rpc("share_megolm_session" as never, {
      p_conversation_id: conversationId,
      p_session_id: sessionId,
      p_sender_user_id: session.user.id,
      p_sender_device_id: senderDeviceId,
      p_shares: shares,
    } as never);

    if (error) {
      console.error("Failed to share session:", error);
      return NextResponse.json(
        { error: "Failed to share session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session share API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/e2ee/sessions/pending
 *
 * Fetch unclaimed Megolm session shares for the current device.
 * Called periodically to get new session keys.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deviceId = request.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId parameter required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Claim and fetch pending session shares
    const { data, error } = await supabase.rpc("claim_megolm_sessions" as never, {
      p_user_id: session.user.id,
      p_device_id: deviceId,
    } as never);

    if (error) {
      console.error("Failed to claim sessions:", error);
      return NextResponse.json(
        { error: "Failed to claim sessions" },
        { status: 500 }
      );
    }

    const rows = (data || []) as MegolmShareRow[];

    const sessions = rows.map((s) => ({
      conversationId: s.conversation_id,
      sessionId: s.session_id,
      senderDeviceId: s.sender_device_id,
      encryptedSessionKey: s.encrypted_session_key,
      firstKnownIndex: s.first_known_index,
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Session claim API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
