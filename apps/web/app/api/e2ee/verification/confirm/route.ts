/**
 * E2EE Verification Confirm API
 *
 * Confirms or rejects SAS emoji match.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { verificationId, emojiIndices, isMatch } = body as {
      verificationId: string;
      emojiIndices: number[];
      isMatch: boolean;
    };

    if (!verificationId || emojiIndices === undefined || isMatch === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: verification } = await supabase
      .from("e2ee_sas_verifications")
      .select("*")
      .eq("id", verificationId)
      .single();

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    const v = verification as {
      initiator_user_id: string;
      target_user_id: string;
      status: string;
    };

    if (
      v.initiator_user_id !== session.user.id &&
      v.target_user_id !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Not a participant in this verification" },
        { status: 403 }
      );
    }

    if (!["key_exchanged", "sas_ready", "sas_match"].includes(v.status)) {
      return NextResponse.json(
        { error: "Verification is not ready for confirmation" },
        { status: 400 }
      );
    }

    // Complete the verification
    const { data: success, error } = await supabase.rpc(
      "complete_sas_verification" as never,
      {
        p_verification_id: verificationId,
        p_sas_emoji_indices: JSON.stringify(emojiIndices),
        p_is_match: isMatch,
      } as never
    );

    if (error) {
      console.error("Failed to complete verification:", error);
      return NextResponse.json(
        { error: "Failed to complete verification" },
        { status: 500 }
      );
    }

    // If matched, also update user trust relationship
    if (isMatch) {
      const otherUserId =
        v.initiator_user_id === session.user.id
          ? v.target_user_id
          : v.initiator_user_id;

      // Get the other user's master key (if exists)
      const { data: masterKey } = await supabase
        .from("e2ee_cross_signing_keys")
        .select("public_key")
        .eq("user_id", otherUserId)
        .eq("key_type", "master")
        .eq("is_active", true)
        .single();

      // Create or update trust relationship
      await supabase.from("e2ee_user_trust").upsert(
        {
          truster_user_id: session.user.id,
          trusted_user_id: otherUserId,
          trusted_master_key: masterKey?.public_key || "device-verified",
          trust_level: "verified",
          verification_method: "sas",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "truster_user_id,trusted_user_id" }
      );
    }

    return NextResponse.json({ success: success || isMatch, verified: isMatch });
  } catch (error) {
    console.error("Verification confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
