/**
 * E2EE Verification Details API
 *
 * Returns details about a specific verification request.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { pool } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: verificationId } = await params;

    const supabase = await createAdminClient();

    // Get verification details
    const { data: verification, error } = await supabase
      .from("e2ee_sas_verifications")
      .select("*")
      .eq("id", verificationId)
      .single();

    if (error || !verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    // Ensure the user is either the initiator or target
    const isInitiator = verification.initiator_user_id === session.user.id;
    const isTarget = verification.target_user_id === session.user.id;

    if (!isInitiator && !isTarget) {
      return NextResponse.json(
        { error: "Not authorized to view this verification" },
        { status: 403 }
      );
    }

    // Get initiator's name
    const { rows: initiatorRows } = await pool.query(
      `SELECT name FROM "user" WHERE id = $1`,
      [verification.initiator_user_id]
    );
    const initiatorName = initiatorRows[0]?.name || "Unknown";

    // Get target's name
    const { rows: targetRows } = await pool.query(
      `SELECT name FROM "user" WHERE id = $1`,
      [verification.target_user_id]
    );
    const targetName = targetRows[0]?.name || "Unknown";

    return NextResponse.json({
      verificationId: verification.id,
      transactionId: verification.transaction_id,
      status: verification.status,
      isInitiator,
      initiatorUserId: verification.initiator_user_id,
      initiatorDeviceId: verification.initiator_device_id,
      initiatorName,
      targetUserId: verification.target_user_id,
      targetDeviceId: verification.target_device_id,
      targetName,
      createdAt: verification.created_at,
    });
  } catch (error) {
    console.error("Get verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
