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
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

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
 * POST endpoint for manual triggering (moderator+ only)
 * Uses Better Auth session for authentication
 */
export async function POST(_request: Request) {
  try {
    // Check for Better Auth session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - login required" },
        { status: 401 }
      );
    }

    // Check role - moderator+ can trigger scans
    const roleResult = await pool.query<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json(
        { error: "Forbidden - moderator access required" },
        { status: 403 }
      );
    }

    console.log(`[Cron] Manual discovery triggered by user ${session.user.id}`);

    const result = await runScheduledDiscovery();

    console.log(`[Cron] Manual discovery completed: ${result.totalQueued} queued`);

    return NextResponse.json({
      success: true,
      message: "Manual discovery completed",
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
