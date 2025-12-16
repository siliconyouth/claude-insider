/**
 * E2EE Device Keys API
 *
 * Fetch device keys for conversation participants to enable encryption.
 * This endpoint returns the public keys needed to establish encrypted sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface DeviceKeyRow {
  id: string;
  user_id: string;
  device_id: string;
  identity_key: string;
  signing_key: string;
  device_name: string | null;
  device_type: string;
  last_seen_at: string;
}

/**
 * GET /api/e2ee/devices?userIds=id1,id2,id3
 *
 * Fetch device keys for the specified users.
 * Used when encrypting messages for conversation participants.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIds = request.nextUrl.searchParams.get("userIds");
    if (!userIds) {
      return NextResponse.json(
        { error: "userIds parameter required" },
        { status: 400 }
      );
    }

    const userIdList = userIds.split(",").filter(Boolean);
    if (userIdList.length === 0) {
      return NextResponse.json({ devices: [] });
    }

    const supabase = await createAdminClient();

    // Fetch device keys for the specified users
    const { data: deviceKeys, error } = await supabase
      .from("device_keys")
      .select(
        "id, user_id, device_id, identity_key, signing_key, device_name, device_type, last_seen_at"
      )
      .in("user_id", userIdList)
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch device keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch device keys" },
        { status: 500 }
      );
    }

    const rows = (deviceKeys || []) as DeviceKeyRow[];

    // Group devices by user
    const devicesByUser: Record<
      string,
      Array<{
        deviceId: string;
        identityKey: string;
        signingKey: string;
        deviceName: string | null;
        deviceType: string;
        lastSeenAt: string;
      }>
    > = {};

    for (const device of rows) {
      if (!devicesByUser[device.user_id]) {
        devicesByUser[device.user_id] = [];
      }
      const userDevices = devicesByUser[device.user_id];
      if (userDevices) {
        userDevices.push({
          deviceId: device.device_id,
          identityKey: device.identity_key,
          signingKey: device.signing_key,
          deviceName: device.device_name,
          deviceType: device.device_type,
          lastSeenAt: device.last_seen_at,
        });
      }
    }

    return NextResponse.json({ devices: devicesByUser });
  } catch (error) {
    console.error("Device keys API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/e2ee/devices/conversation
 *
 * Fetch device keys for all participants in a conversation.
 * Excludes the current user's devices (we don't encrypt to ourselves).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId } = body as { conversationId: string };

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
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

    // Get all participant user IDs (excluding current user)
    const { data: participants } = await supabase
      .from("dm_participants" as "profiles")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", session.user.id);

    if (!participants || participants.length === 0) {
      return NextResponse.json({ devices: [] });
    }

    const participantUserIds = participants.map(
      (p: { user_id: string }) => p.user_id
    );

    // Fetch device keys for participants
    const { data: deviceKeys, error } = await supabase
      .from("device_keys")
      .select(
        "id, user_id, device_id, identity_key, signing_key, device_name, device_type, last_seen_at"
      )
      .in("user_id", participantUserIds)
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch device keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch device keys" },
        { status: 500 }
      );
    }

    const rows = (deviceKeys || []) as DeviceKeyRow[];

    // Flatten to array of devices with user info
    const devices = rows.map((device) => ({
      userId: device.user_id,
      deviceId: device.device_id,
      identityKey: device.identity_key,
      signingKey: device.signing_key,
      deviceName: device.device_name,
      deviceType: device.device_type,
      lastSeenAt: device.last_seen_at,
    }));

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Device keys API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
