/**
 * Resource Update Check Cron Job
 *
 * Checks for pending resource updates in the queue and triggers
 * cache revalidation. This is a fallback mechanism in case
 * Supabase webhooks fail.
 *
 * Schedule: Every 5 minutes (configured in vercel.json)
 *
 * @module app/api/cron/check-resource-updates/route
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/resources/server-queries";

interface PendingUpdate {
  id: string;
  resource_id: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  created_at: string;
}

// Type for the RPC response - will be properly typed when migration is applied
type RpcResponse = PendingUpdate[];

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();

    // Get pending updates using raw SQL since RPC types may not be generated yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingUpdates, error: fetchError } = await (supabase as any)
      .from("resource_update_queue")
      .select("id, resource_id, operation, created_at")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (fetchError) {
      // Table may not exist yet - this is expected before migration is applied
      if (fetchError.code === "42P01") {
        console.log("[CheckResourceUpdates] Table not found - migration not yet applied");
        return NextResponse.json({
          success: true,
          message: "Table not yet created",
          checked_at: new Date().toISOString(),
        });
      }
      console.error("[CheckResourceUpdates] Failed to fetch pending updates:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch pending updates" },
        { status: 500 }
      );
    }

    const updates = (pendingUpdates || []) as unknown as RpcResponse;

    if (updates.length === 0) {
      console.log("[CheckResourceUpdates] No pending updates");
      return NextResponse.json({
        success: true,
        message: "No pending updates",
        checked_at: new Date().toISOString(),
      });
    }

    console.log(`[CheckResourceUpdates] Found ${updates.length} pending updates`);

    // Revalidate all resource caches
    const revalidatedTags: string[] = [];

    revalidateTag(CACHE_TAGS.ALL_RESOURCES, "max");
    revalidatedTags.push(CACHE_TAGS.ALL_RESOURCES);

    revalidateTag(CACHE_TAGS.RESOURCE_STATS, "max");
    revalidatedTags.push(CACHE_TAGS.RESOURCE_STATS);

    revalidateTag(CACHE_TAGS.RESOURCE_TAGS, "max");
    revalidatedTags.push(CACHE_TAGS.RESOURCE_TAGS);

    // Mark updates as processed
    const updateIds = updates.map((u) => u.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: markError } = await (supabase as any)
      .from("resource_update_queue")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .in("id", updateIds);

    if (markError) {
      console.error("[CheckResourceUpdates] Failed to mark updates as processed:", markError);
      // Continue anyway - revalidation was successful
    }

    const duration = Date.now() - startTime;

    // Log the revalidation - use raw insert with type assertion for new table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logError } = await (supabase as any)
      .from("resource_cache_logs")
      .insert({
        trigger_source: "cron",
        operation: "BULK",
        tags_invalidated: revalidatedTags,
        success: true,
        duration_ms: duration,
      });

    if (logError) {
      console.error("[CheckResourceUpdates] Failed to log revalidation:", logError);
    }

    console.log(`[CheckResourceUpdates] Revalidated ${revalidatedTags.length} tags in ${duration}ms`);

    return NextResponse.json({
      success: true,
      updates_processed: updates.length,
      revalidated_tags: revalidatedTags,
      duration_ms: duration,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[CheckResourceUpdates] Error:", error);

    // Try to log the error
    try {
      const supabase = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("resource_cache_logs")
        .insert({
          trigger_source: "cron",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          duration_ms: duration,
        });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: "Failed to check resource updates" },
      { status: 500 }
    );
  }
}
