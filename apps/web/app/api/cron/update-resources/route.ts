/**
 * Resource Auto-Update Cron Job
 *
 * GET /api/cron/update-resources
 *
 * Runs weekly to check for resources due for updates and creates
 * update jobs for them. Configured in vercel.json.
 *
 * Schedule: Every Sunday at 3 AM UTC
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createUpdateJob,
  processUpdateJob,
  getResourcesDueForUpdate,
} from "@/lib/resources/update-orchestrator";

// Maximum jobs to create per cron run (to avoid timeout)
const MAX_JOBS_PER_RUN = 10;

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      console.warn("Unauthorized cron request attempted");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Get resources due for update
    const resourceIds = await getResourcesDueForUpdate(MAX_JOBS_PER_RUN);

    if (resourceIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No resources due for update",
        jobsCreated: 0,
        duration: Date.now() - startTime,
      });
    }

    // Create jobs for each resource
    const results: {
      resourceId: string;
      jobId?: string;
      error?: string;
    }[] = [];

    for (const resourceId of resourceIds) {
      try {
        const jobId = await createUpdateJob({
          resourceId,
          triggerType: "cron",
        });

        results.push({ resourceId, jobId });

        // Start processing in background (don't await)
        processUpdateJob(jobId).catch((error) => {
          console.error(`Cron job processing failed for ${jobId}:`, error);
        });
      } catch (error) {
        results.push({
          resourceId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.jobId).length;
    const errorCount = results.filter((r) => r.error).length;

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} update jobs (${errorCount} errors)`,
      jobsCreated: successCount,
      jobsFailed: errorCount,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering from admin
export async function POST(request: NextRequest) {
  return GET(request);
}
