/**
 * E2EE Verification Pending API
 *
 * Fetches pending verification requests for the current user.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface VerificationRow {
  id: string;
  transaction_id: string;
  status: string;
  initiator_user_id: string;
  initiator_device_id: string;
  target_user_id: string;
  target_device_id: string;
  initiator_public_key: string;
  target_public_key: string | null;
  expires_at: string;
  created_at: string;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Get pending verifications where user is either initiator or target
    const { data: verifications, error } = await supabase
      .from("e2ee_sas_verifications")
      .select("*")
      .or(
        `initiator_user_id.eq.${session.user.id},target_user_id.eq.${session.user.id}`
      )
      .in("status", ["pending", "started", "key_exchanged", "sas_ready"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch verifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch verifications" },
        { status: 500 }
      );
    }

    const rows = (verifications || []) as VerificationRow[];

    // Get user names for display
    const userIds = [
      ...new Set(
        rows.flatMap((v) => [v.initiator_user_id, v.target_user_id])
      ),
    ];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const { data: users } = await supabase
      .from("user")
      .select("id, name")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.display_name])
    );
    const userMap = new Map(
      (users || []).map((u) => [u.id, u.name])
    );

    const result = rows.map((v) => {
      const isInitiator = v.initiator_user_id === session.user.id;
      const otherUserId = isInitiator ? v.target_user_id : v.initiator_user_id;
      const otherDeviceId = isInitiator
        ? v.target_device_id
        : v.initiator_device_id;

      return {
        verificationId: v.id,
        transactionId: v.transaction_id,
        status: v.status,
        isInitiator,
        targetUserId: otherUserId,
        targetDeviceId: otherDeviceId,
        targetUserName:
          profileMap.get(otherUserId) || userMap.get(otherUserId) || "Unknown",
        initiatorPublicKey: v.initiator_public_key,
        targetPublicKey: v.target_public_key,
        expiresAt: v.expires_at,
        createdAt: v.created_at,
      };
    });

    return NextResponse.json({ verifications: result });
  } catch (error) {
    console.error("Verification pending error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
