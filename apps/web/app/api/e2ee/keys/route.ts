/**
 * E2EE Device Keys API
 *
 * Endpoints for managing device identity keys:
 * - POST: Register new device keys
 * - GET: List user's devices
 * - DELETE: Remove a device
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

// ============================================================================
// POST - Register Device Keys
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      deviceId,
      identityKey,
      signingKey,
      signedPrekey,
      signedPrekeyId,
      signedPrekeySignature,
      oneTimeKeys,
      deviceName,
    } = body;

    // Validate required fields
    if (!deviceId || !identityKey || !signingKey) {
      return NextResponse.json(
        { error: "Missing required fields: deviceId, identityKey, signingKey" },
        { status: 400 }
      );
    }

    // Get device type from user-agent
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = userAgent.includes("Mobile")
      ? "mobile"
      : userAgent.includes("Electron")
        ? "desktop"
        : "web";

    // Upsert device keys
    const deviceResult = await pool.query(
      `INSERT INTO device_keys (
        user_id, device_id, identity_key, signing_key,
        signed_prekey, signed_prekey_id, signed_prekey_signature,
        device_name, device_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, device_id) DO UPDATE SET
        identity_key = EXCLUDED.identity_key,
        signing_key = EXCLUDED.signing_key,
        signed_prekey = EXCLUDED.signed_prekey,
        signed_prekey_id = EXCLUDED.signed_prekey_id,
        signed_prekey_signature = EXCLUDED.signed_prekey_signature,
        last_seen_at = NOW()
      RETURNING id`,
      [
        session.user.id,
        deviceId,
        identityKey,
        signingKey,
        signedPrekey || "",
        signedPrekeyId || 0,
        signedPrekeySignature || "",
        deviceName || userAgent.substring(0, 100),
        deviceType,
      ]
    );

    const deviceKeyId = deviceResult.rows[0].id;

    // Insert one-time prekeys if provided
    if (oneTimeKeys && Array.isArray(oneTimeKeys) && oneTimeKeys.length > 0) {
      const prekeyValues = oneTimeKeys
        .map(
          ([_keyId, _publicKey]: [number | string, string], index: number) =>
            `($1, $${index * 2 + 2}, $${index * 2 + 3})`
        )
        .join(", ");

      const prekeyParams = [deviceKeyId];
      for (const [keyId, publicKey] of oneTimeKeys) {
        // keyId is a base64-encoded string from vodozemac, store as-is
        prekeyParams.push(String(keyId), publicKey);
      }

      await pool.query(
        `INSERT INTO one_time_prekeys (device_key_id, key_id, public_key)
        VALUES ${prekeyValues}
        ON CONFLICT (device_key_id, key_id) DO NOTHING`,
        prekeyParams
      );
    }

    return NextResponse.json({
      success: true,
      deviceKeyId,
      prekeysUploaded: oneTimeKeys?.length || 0,
    });
  } catch (error) {
    console.error("[E2EE API] Failed to register device keys:", error);
    return NextResponse.json(
      { error: "Failed to register device keys" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List User's Devices
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        id,
        device_id,
        identity_key,
        signing_key,
        device_name,
        device_type,
        created_at,
        last_seen_at,
        (SELECT COUNT(*)::int FROM one_time_prekeys WHERE device_key_id = device_keys.id AND claimed_at IS NULL) as available_prekeys
      FROM device_keys
      WHERE user_id = $1
      ORDER BY last_seen_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({
      devices: result.rows.map((row) => ({
        id: row.id,
        deviceId: row.device_id,
        identityKey: row.identity_key,
        signingKey: row.signing_key,
        deviceName: row.device_name,
        deviceType: row.device_type,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        availablePrekeys: row.available_prekeys,
      })),
    });
  } catch (error) {
    console.error("[E2EE API] Failed to list devices:", error);
    return NextResponse.json(
      { error: "Failed to list devices" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Device
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing deviceId" },
        { status: 400 }
      );
    }

    // Delete device (cascade deletes prekeys)
    const result = await pool.query(
      `DELETE FROM device_keys
      WHERE user_id = $1 AND device_id = $2
      RETURNING id`,
      [session.user.id, deviceId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[E2EE API] Failed to delete device:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
