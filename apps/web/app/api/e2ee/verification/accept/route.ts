/**
 * E2EE Verification Accept API
 *
 * Accepts a pending SAS verification request.
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
    const { verificationId, publicKey } = body as {
      verificationId: string;
      publicKey: string;
    };

    if (!verificationId || !publicKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Verify the user is the target of this verification
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
      target_user_id: string;
      status: string;
      expires_at: string;
    };

    if (v.target_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to accept this verification" },
        { status: 403 }
      );
    }

    if (v.status !== "started") {
      return NextResponse.json(
        { error: "Verification is not in a valid state" },
        { status: 400 }
      );
    }

    if (new Date(v.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Verification has expired" },
        { status: 400 }
      );
    }

    // Accept the verification
    const { data: success, error } = await supabase.rpc(
      "accept_sas_verification" as never,
      {
        p_verification_id: verificationId,
        p_target_public_key: publicKey,
      } as never
    );

    if (error || !success) {
      console.error("Failed to accept verification:", error);
      return NextResponse.json(
        { error: "Failed to accept verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification accept error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
