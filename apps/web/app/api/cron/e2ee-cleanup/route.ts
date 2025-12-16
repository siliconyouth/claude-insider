/**
 * E2EE Session Cleanup Cron API Route
 *
 * Cleans up stale E2EE sessions and expired verification requests.
 * Should be called daily by a cron job.
 *
 * Cleanup tasks:
 * - Remove expired one-time prekeys (> 30 days old, unclaimed)
 * - Clean up expired verification sessions (> 10 minutes old, not completed)
 * - Mark inactive devices (> 90 days since last seen)
 * - Remove orphaned sessions from deleted users
 *
 * @example
 * POST /api/cron/e2ee-cleanup
 * Headers: { "Authorization": "Bearer <CRON_SECRET>" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Verify cron secret to prevent unauthorized calls
// eslint-disable-next-line turbo/no-undeclared-env-vars
const CRON_SECRET = process.env.CRON_SECRET;

// Time thresholds in days
const PREKEY_EXPIRY_DAYS = 30;
const DEVICE_INACTIVE_DAYS = 90;
const VERIFICATION_EXPIRY_MINUTES = 10;

interface CleanupResult {
  expiredPrekeys: number;
  expiredVerifications: number;
  inactiveDevices: number;
  orphanedSessions: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const now = new Date();
    const results: CleanupResult = {
      expiredPrekeys: 0,
      expiredVerifications: 0,
      inactiveDevices: 0,
      orphanedSessions: 0,
    };

    // 1. Remove expired unclaimed one-time prekeys (> 30 days old)
    const prekeyExpiryDate = new Date(
      now.getTime() - PREKEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: deletedPrekeys, error: prekeyError } = await supabase
      .from("one_time_prekeys")
      .delete()
      .lt("created_at", prekeyExpiryDate)
      .is("claimed_at", null)
      .select("id");

    if (prekeyError) {
      console.error("[E2EE Cleanup] Error deleting prekeys:", prekeyError);
    } else {
      results.expiredPrekeys = deletedPrekeys?.length || 0;
    }

    // 2. Clean up expired verification sessions (> 10 minutes, not completed)
    const verificationExpiryDate = new Date(
      now.getTime() - VERIFICATION_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    const { data: deletedVerifications, error: verificationError } = await supabase
      .from("device_verifications")
      .delete()
      .lt("created_at", verificationExpiryDate)
      .neq("status", "verified")
      .select("id");

    if (verificationError) {
      console.error("[E2EE Cleanup] Error deleting verifications:", verificationError);
    } else {
      results.expiredVerifications = deletedVerifications?.length || 0;
    }

    // 3. Mark inactive devices (> 90 days since last seen)
    const inactiveDate = new Date(
      now.getTime() - DEVICE_INACTIVE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: inactiveDevices, error: inactiveError } = await supabase
      .from("device_keys")
      .update({ device_type: "inactive" })
      .lt("last_seen_at", inactiveDate)
      .neq("device_type", "inactive")
      .select("id");

    if (inactiveError) {
      console.error("[E2EE Cleanup] Error marking inactive devices:", inactiveError);
    } else {
      results.inactiveDevices = inactiveDevices?.length || 0;
    }

    // 4. Remove orphaned sessions (devices from deleted users)
    // This uses a subquery to find device_keys with no matching user
    const { data: orphanedDevices, error: orphanError } = await supabase.rpc(
      "cleanup_orphaned_e2ee_devices"
    );

    if (orphanError) {
      // RPC might not exist yet, log but don't fail
      console.warn("[E2EE Cleanup] RPC not available:", orphanError.message);
    } else {
      results.orphanedSessions = orphanedDevices || 0;
    }

    console.log("[E2EE Cleanup] Completed:", results);

    return NextResponse.json({
      success: true,
      message: "E2EE cleanup completed successfully",
      results,
    });
  } catch (error) {
    console.error("[E2EE Cleanup] Error:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check / manual trigger info
export async function GET() {
  return NextResponse.json({
    name: "E2EE Session Cleanup",
    description: "Cleans up stale E2EE sessions, expired prekeys, and inactive devices",
    schedule: "Daily at 3:00 AM UTC (recommended)",
    thresholds: {
      prekeyExpiryDays: PREKEY_EXPIRY_DAYS,
      deviceInactiveDays: DEVICE_INACTIVE_DAYS,
      verificationExpiryMinutes: VERIFICATION_EXPIRY_MINUTES,
    },
    usage: {
      method: "POST",
      headers: { Authorization: "Bearer <CRON_SECRET>" },
    },
  });
}
