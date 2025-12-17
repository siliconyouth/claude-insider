/**
 * E2EE Verification Start API
 *
 * Initiates a new SAS verification session.
 * Also sends a notification and optional system message to the target user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, targetDeviceId, publicKey, commitment } = body as {
      targetUserId: string;
      targetDeviceId: string;
      publicKey: string;
      commitment: string;
    };

    if (!targetUserId || !targetDeviceId || !publicKey || !commitment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Get initiator's device ID
    const { data: initiatorDevice } = await supabase
      .from("device_keys")
      .select("device_id")
      .eq("user_id", session.user.id)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .single();

    if (!initiatorDevice) {
      return NextResponse.json(
        { error: "No device found for initiator" },
        { status: 400 }
      );
    }

    const deviceId = initiatorDevice.device_id;

    // Verify target device exists
    const { data: targetDevice } = await supabase
      .from("device_keys")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("device_id", targetDeviceId)
      .single();

    if (!targetDevice) {
      return NextResponse.json(
        { error: "Target device not found" },
        { status: 404 }
      );
    }

    // Create verification session
    const { data: verificationId, error } = await supabase.rpc(
      "start_sas_verification" as never,
      {
        p_initiator_user_id: session.user.id,
        p_initiator_device_id: deviceId,
        p_target_user_id: targetUserId,
        p_target_device_id: targetDeviceId,
        p_initiator_public_key: publicKey,
        p_initiator_commitment: commitment,
      } as never
    );

    if (error) {
      console.error("Failed to start verification:", error);
      return NextResponse.json(
        { error: "Failed to start verification" },
        { status: 500 }
      );
    }

    // Get the transaction ID
    const { data: verification } = await supabase
      .from("e2ee_sas_verifications")
      .select("transaction_id")
      .eq("id", verificationId)
      .single();

    // Get initiator's name for notification
    const { rows: initiatorRows } = await pool.query(
      `SELECT name FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const initiatorName = initiatorRows[0]?.name || "Someone";

    // Send notification to target user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        targetUserId,
        "e2ee_verification",
        "🔐 Device Verification Request",
        `${initiatorName} wants to verify your device. Compare emojis to confirm you're talking to each other securely.`,
        `/messages?verify=${verificationId}`,
        JSON.stringify({
          verificationId,
          initiatorUserId: session.user.id,
          initiatorName,
        }),
      ]
    );

    return NextResponse.json({
      verificationId,
      transactionId: verification?.transaction_id,
    });
  } catch (error) {
    console.error("Verification start error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
