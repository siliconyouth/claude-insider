/**
 * Scheduled Discovery Cron Endpoint
 *
 * GET /api/cron/discover
 *
 * Triggered by Vercel Cron to run automatic resource discovery.
 * Protected by CRON_SECRET environment variable.
 *
 * Schedule: Every 6 hours (cron: "0 0,6,12,18 * * *")
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { runScheduledDiscovery } from "@/lib/scheduled-discovery";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron or has the secret
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

     
    const cronSecret = process.env.CRON_SECRET;

    // In development, allow without secret
    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      // Check for Vercel's internal cron header or our secret
      const isVercelCron = request.headers.get("x-vercel-cron") === "true";
      const hasValidSecret =
        cronSecret && authHeader === `Bearer ${cronSecret}`;

      if (!isVercelCron && !hasValidSecret) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("[Cron] Starting scheduled discovery...");

    // Run the scheduled discovery
    const result = await runScheduledDiscovery();

    console.log(`[Cron] Discovery completed: ${result.totalQueued} new resources queued`);

    return NextResponse.json({
      success: true,
      runId: result.runId,
      startTime: result.startTime.toISOString(),
      endTime: result.endTime.toISOString(),
      totalDuration: `${Math.round(result.totalDuration / 1000)}s`,
      summary: {
        sourcesProcessed: result.sourcesProcessed,
        totalDiscovered: result.totalDiscovered,
        totalQueued: result.totalQueued,
      },
      results: result.results.map((r) => ({
        source: r.sourceName,
        type: r.sourceType,
        status: r.status,
        discovered: r.discoveredCount,
        queued: r.queuedCount,
        duplicates: r.duplicateCount,
        duration: `${Math.round(r.duration / 1000)}s`,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("[Cron] Discovery failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Discovery failed",
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering (admin only)
 */
export async function POST(request: Request) {
  try {
    // Check for admin authentication
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Simple auth check - in production this should use proper auth
    const hasToken = cookie.includes("payload-token=");

    if (!hasToken) {
      return NextResponse.json(
        { error: "Unauthorized - admin login required" },
        { status: 401 }
      );
    }

    // Parse request body for options (reserved for future use)
    try {
      await request.json();
    } catch {
      // No body provided, use defaults
    }

    console.log("[Cron] Manual discovery triggered");

    const result = await runScheduledDiscovery();

    return NextResponse.json({
      success: true,
      message: "Manual discovery completed",
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Manual discovery failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Discovery failed",
      },
      { status: 500 }
    );
  }
}
