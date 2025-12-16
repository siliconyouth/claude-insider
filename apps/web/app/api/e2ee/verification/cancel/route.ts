/**
 * E2EE Verification Cancel API
 *
 * Cancels an in-progress verification.
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
    const { verificationId } = body as { verificationId: string };

    if (!verificationId) {
      return NextResponse.json(
        { error: "verificationId required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: verification } = await supabase
      .from("e2ee_sas_verifications")
      .select("initiator_user_id, target_user_id, status")
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

    if (["verified", "cancelled", "expired"].includes(v.status)) {
      return NextResponse.json(
        { error: "Verification is already complete" },
        { status: 400 }
      );
    }

    // Cancel the verification
    const { error } = await supabase
      .from("e2ee_sas_verifications")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", verificationId);

    if (error) {
      console.error("Failed to cancel verification:", error);
      return NextResponse.json(
        { error: "Failed to cancel verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification cancel error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
