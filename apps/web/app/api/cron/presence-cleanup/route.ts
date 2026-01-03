/**
 * Presence Cleanup Cron Job
 *
 * Runs periodically to:
 * 1. Mark stale "online" users as "idle" (45 second threshold)
 * 2. Mark old "idle" users as "offline" (5 minute threshold)
 * 3. Clean up old typing indicators
 *
 * Schedule: Every 5 minutes via Vercel Cron
 *
 * Philosophy: "Default offline, prove online"
 * Users must actively send heartbeats to stay online.
 *
 * Endpoints:
 * - GET: Cron job trigger (requires CRON_SECRET)
 * - POST: Manual trigger for admins (requires admin session)
 *
 * Note: Thresholds imported from presence-utils.ts for consistency.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, isValidRole } from "@/lib/roles";
import {
  ONLINE_THRESHOLD_MS,
  IDLE_THRESHOLD_MS,
} from "@/lib/presence-utils";

// Typing indicators older than this are stale
const TYPING_CLEANUP_SECONDS = 30;

// Shared cleanup logic
async function runPresenceCleanup() {
  const supabase = await createAdminClient();
  const now = new Date();

  // 1. Mark stale "online" users as "idle" (> 45 seconds since last activity)
  const idleThreshold = new Date(
    now.getTime() - ONLINE_THRESHOLD_MS
  ).toISOString();

  const { data: idledUsers, error: idleError } = await supabase
    .from("user_presence")
    .update({
      status: "idle",
      updated_at: now.toISOString(),
    })
    .eq("status", "online")
    .lt("last_active_at", idleThreshold)
    .select("user_id");

  if (idleError) {
    console.error("[Presence Cleanup] Idle update error:", idleError);
  }

  // 2. Mark old "idle" users as "offline" (> 5 minutes since last activity)
  const offlineThreshold = new Date(
    now.getTime() - IDLE_THRESHOLD_MS
  ).toISOString();

  const { data: offlinedUsers, error: offlineError } = await supabase
    .from("user_presence")
    .update({
      status: "offline",
      updated_at: now.toISOString(),
    })
    .eq("status", "idle")
    .lt("last_active_at", offlineThreshold)
    .select("user_id");

  if (offlineError) {
    console.error("[Presence Cleanup] Offline update error:", offlineError);
  }

  // 3. Clean up stale typing indicators (> 30 seconds old)
  const typingThreshold = new Date(
    now.getTime() - TYPING_CLEANUP_SECONDS * 1000
  ).toISOString();

  const { error: typingError } = await supabase
    .from("dm_typing_indicators")
    .delete()
    .lt("started_at", typingThreshold);

  if (typingError) {
    console.error("[Presence Cleanup] Typing cleanup error:", typingError);
  }

  return {
    success: true,
    idledUsers: idledUsers?.length || 0,
    offlinedUsers: offlinedUsers?.length || 0,
    thresholds: {
      idleAfterMs: ONLINE_THRESHOLD_MS,
      offlineAfterMs: IDLE_THRESHOLD_MS,
    },
    timestamp: now.toISOString(),
  };
}

// GET: Cron job trigger (requires CRON_SECRET)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPresenceCleanup();
    console.log("[Presence Cleanup] Cron:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Presence Cleanup] Error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup presence" },
      { status: 500 }
    );
  }
}

// POST: Manual trigger for admins
export async function POST() {
  try {
    // Check for admin session
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require admin role
    const userRole = (session.user as { role?: string }).role || "user";
    if (!isValidRole(userRole) || !hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const result = await runPresenceCleanup();
    console.log("[Presence Cleanup] Manual trigger by admin:", session.user.id, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Presence Cleanup] Error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup presence" },
      { status: 500 }
    );
  }
}
