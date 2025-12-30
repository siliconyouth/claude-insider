/**
 * Cron Job: Link Validation
 *
 * Validates resource URLs and queues broken links for moderation.
 * Scheduled to run daily at 2 AM UTC.
 *
 * Vercel Cron: "0 2 * * *"
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import {
  validateResourcesBatch,
  getValidationStats,
} from "@/lib/resources/link-validator";

export const maxDuration = 300; // 5 minutes max
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const startTime = Date.now();

    // Get stats before validation
    const statsBefore = await getValidationStats(pool);

    // Validate stale resources (not checked in 24h)
    // Process up to 200 resources per run to stay within time limits
    const results = await validateResourcesBatch(pool, {
      limit: 200,
      batchSize: 10,
      delayBetweenBatches: 1500,
      onlyStale: true,
    });

    // Get stats after validation
    const statsAfter = await getValidationStats(pool);

    const duration = Date.now() - startTime;

    // Log summary
    console.log("[LinkValidation] Cron completed", {
      duration: `${duration}ms`,
      checked: results.total,
      valid: results.valid,
      invalid: results.invalid,
      redirects: results.redirects,
      errors: results.errors,
      avgResponseTime: `${results.avgResponseTime}ms`,
      newBrokenLinks: statsAfter.pendingReview - statsBefore.pendingReview,
    });

    return NextResponse.json({
      success: true,
      duration,
      results: {
        checked: results.total,
        valid: results.valid,
        invalid: results.invalid,
        redirects: results.redirects,
        errors: results.errors,
        avgResponseTime: results.avgResponseTime,
      },
      queue: {
        pendingReview: statsAfter.pendingReview,
        newEntries: statsAfter.pendingReview - statsBefore.pendingReview,
      },
      stats: {
        totalResources: statsAfter.totalResources,
        validated: statsAfter.validated,
        unchecked: statsAfter.unchecked,
        validLinks: statsAfter.valid,
        invalidLinks: statsAfter.invalid,
      },
    });
  } catch (error) {
    console.error("[LinkValidation] Cron error:", error);
    return NextResponse.json(
      {
        error: "Validation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

/**
 * POST endpoint for manual trigger with options
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const body = await request.json().catch(() => ({}));
    const {
      limit = 100,
      batchSize = 10,
      onlyUnchecked = false,
      onlyStale = false,
    } = body;

    const startTime = Date.now();

    const results = await validateResourcesBatch(pool, {
      limit,
      batchSize,
      delayBetweenBatches: 1500,
      onlyUnchecked,
      onlyStale,
    });

    const statsAfter = await getValidationStats(pool);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration,
      results,
      stats: statsAfter,
    });
  } catch (error) {
    console.error("[LinkValidation] Manual trigger error:", error);
    return NextResponse.json(
      {
        error: "Validation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
