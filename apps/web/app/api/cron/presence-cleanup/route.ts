/**
 * Presence Cleanup Cron Job
 *
 * Runs periodically to:
 * 1. Mark stale "online" users as "idle" (1 hour threshold)
 * 2. Mark old "idle" users as "offline" (24 hour threshold)
 * 3. Clean up old typing indicators
 *
 * Schedule: Every 5 minutes via Vercel Cron
 *
 * Note: With the Matrix SDK pattern, status is computed at query time
 * from last_active_at. This cron job just updates the stored status
 * for consistency and cleans up stale data.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Thresholds
const IDLE_THRESHOLD_MINUTES = 60; // 1 hour
const OFFLINE_THRESHOLD_HOURS = 24; // 24 hours
const TYPING_CLEANUP_SECONDS = 30; // 30 seconds

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const now = new Date();

    // 1. Mark stale "online" users as "idle" (> 1 hour since last activity)
    const idleThreshold = new Date(
      now.getTime() - IDLE_THRESHOLD_MINUTES * 60 * 1000
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

    // 2. Mark old "idle" users as "offline" (> 24 hours since last activity)
    const offlineThreshold = new Date(
      now.getTime() - OFFLINE_THRESHOLD_HOURS * 60 * 60 * 1000
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

    const result = {
      success: true,
      idledUsers: idledUsers?.length || 0,
      offlinedUsers: offlinedUsers?.length || 0,
      timestamp: now.toISOString(),
    };

    console.log("[Presence Cleanup]", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Presence Cleanup] Error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup presence" },
      { status: 500 }
    );
  }
}
