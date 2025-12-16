/**
 * E2EE One-Time Prekeys API
 *
 * Endpoints for managing one-time prekeys:
 * - POST: Upload new prekeys
 * - GET: Get available prekey count
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

// ============================================================================
// POST - Upload One-Time Prekeys
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, oneTimeKeys } = body;

    if (!deviceId || !oneTimeKeys || !Array.isArray(oneTimeKeys)) {
      return NextResponse.json(
        { error: "Missing required fields: deviceId, oneTimeKeys" },
        { status: 400 }
      );
    }

    // Get device key ID
    const deviceResult = await pool.query(
      `SELECT id FROM device_keys WHERE user_id = $1 AND device_id = $2`,
      [session.user.id, deviceId]
    );

    if (deviceResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const deviceKeyId = deviceResult.rows[0].id;

    // Insert prekeys
    if (oneTimeKeys.length > 0) {
      const values: string[] = [];
      const params: (string | number)[] = [deviceKeyId];

      oneTimeKeys.forEach(([keyId, publicKey]: [number | string, string], index: number) => {
        values.push(`($1, $${index * 2 + 2}, $${index * 2 + 3})`);
        params.push(parseInt(String(keyId)), publicKey);
      });

      await pool.query(
        `INSERT INTO one_time_prekeys (device_key_id, key_id, public_key)
        VALUES ${values.join(", ")}
        ON CONFLICT (device_key_id, key_id) DO NOTHING`,
        params
      );
    }

    // Get updated count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM one_time_prekeys
      WHERE device_key_id = $1 AND claimed_at IS NULL`,
      [deviceKeyId]
    );

    return NextResponse.json({
      success: true,
      uploaded: oneTimeKeys.length,
      availablePrekeys: countResult.rows[0].count,
    });
  } catch (error) {
    console.error("[E2EE API] Failed to upload prekeys:", error);
    return NextResponse.json(
      { error: "Failed to upload prekeys" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Available Prekey Count
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing deviceId parameter" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int as count
      FROM one_time_prekeys otp
      JOIN device_keys dk ON dk.id = otp.device_key_id
      WHERE dk.user_id = $1 AND dk.device_id = $2 AND otp.claimed_at IS NULL`,
      [session.user.id, deviceId]
    );

    return NextResponse.json({
      availablePrekeys: result.rows[0].count,
    });
  } catch (error) {
    console.error("[E2EE API] Failed to get prekey count:", error);
    return NextResponse.json(
      { error: "Failed to get prekey count" },
      { status: 500 }
    );
  }
}
