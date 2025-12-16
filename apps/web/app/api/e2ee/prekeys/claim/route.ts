/**
 * E2EE Prekey Claim API
 *
 * Atomically claims a one-time prekey for session establishment.
 * Uses PostgreSQL function for atomic claim operation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

// ============================================================================
// POST - Claim One-Time Prekey
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, targetDeviceId } = body;

    if (!targetUserId || !targetDeviceId) {
      return NextResponse.json(
        { error: "Missing required fields: targetUserId, targetDeviceId" },
        { status: 400 }
      );
    }

    // Prevent claiming own prekeys
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot claim own prekeys" },
        { status: 400 }
      );
    }

    // Get requester's device ID from session or generate
    const claimerDeviceId =
      request.headers.get("X-Device-Id") || "unknown";

    // Get target device's identity key and signed prekey
    const deviceResult = await pool.query(
      `SELECT identity_key, signing_key, signed_prekey, signed_prekey_signature
      FROM device_keys
      WHERE user_id = $1 AND device_id = $2`,
      [targetUserId, targetDeviceId]
    );

    if (deviceResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Target device not found" },
        { status: 404 }
      );
    }

    const targetDevice = deviceResult.rows[0];

    // Atomically claim a prekey using PostgreSQL function
    const claimResult = await pool.query(
      `SELECT * FROM claim_one_time_prekey($1, $2, $3, $4)`,
      [targetUserId, targetDeviceId, session.user.id, claimerDeviceId]
    );

    if (claimResult.rowCount === 0) {
      // No prekeys available - use fallback key or signed prekey
      return NextResponse.json({
        identityKey: targetDevice.identity_key,
        signingKey: targetDevice.signing_key,
        signedPrekey: targetDevice.signed_prekey || null,
        signedPrekeySignature: targetDevice.signed_prekey_signature || null,
        publicKey: null,
        keyId: null,
        usedFallback: true,
      });
    }

    const claimedPrekey = claimResult.rows[0];

    return NextResponse.json({
      identityKey: targetDevice.identity_key,
      signingKey: targetDevice.signing_key,
      signedPrekey: targetDevice.signed_prekey || null,
      signedPrekeySignature: targetDevice.signed_prekey_signature || null,
      publicKey: claimedPrekey.public_key,
      keyId: claimedPrekey.key_id,
      usedFallback: false,
    });
  } catch (error) {
    console.error("[E2EE API] Failed to claim prekey:", error);
    return NextResponse.json(
      { error: "Failed to claim prekey" },
      { status: 500 }
    );
  }
}
