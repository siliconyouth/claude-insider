/**
 * Resource Update Job Orchestrator
 *
 * Manages the lifecycle of resource update jobs:
 * 1. Create job → pending
 * 2. Scrape URLs → scraping
 * 3. Analyze with Claude → analyzing
 * 4. Capture screenshots → screenshots
 * 5. Ready for review → ready_for_review
 * 6. Admin approves/rejects
 * 7. Apply changes → applied
 *
 * Features:
 * - State machine with clear transitions
 * - Error handling and retry logic
 * - Progress tracking
 * - Webhook notifications (future)
 */

import "server-only";
import { pool } from "@/lib/db";
import { scrapeUrl } from "@/lib/firecrawl";
import {
  analyzeResourceUpdate,
  type ProposedChange,
  type ScrapedContent,
  type CurrentResource,
  generateChangelogSummary,
} from "@/lib/ai/resource-updater";
import {
  captureScreenshots,
  deleteResourceScreenshots,
  getScreenshotUrls,
} from "./screenshot-service";

/**
 * Job status enum
 */
export type JobStatus =
  | "pending"
  | "scraping"
  | "analyzing"
  | "screenshots"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "applied"
  | "failed";

/**
 * Full update job record
 */
export interface UpdateJob {
  id: string;
  resource_id: string;
  status: JobStatus;
  trigger_type: "manual" | "cron";
  triggered_by: string | null;
  scraped_content: ScrapedContent[] | null;
  scraped_at: Date | null;
  scrape_errors: { url: string; error: string }[] | null;
  proposed_changes: ProposedChange[] | null;
  ai_summary: string | null;
  ai_model: string;
  analyzed_at: Date | null;
  overall_confidence: number | null;
  new_screenshots: string[] | null;
  screenshot_errors: string[] | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  selected_changes: string[] | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

/**
 * Options for creating an update job
 */
export interface CreateJobOptions {
  resourceId: string;
  triggerType: "manual" | "cron";
  triggeredBy?: string;
}

/**
 * Create a new update job
 */
export async function createUpdateJob(
  options: CreateJobOptions
): Promise<string> {
  const { resourceId, triggerType, triggeredBy } = options;

  // Check if there's already a pending/in-progress job for this resource
  const existingJob = await pool.query(
    `SELECT id FROM resource_update_jobs
     WHERE resource_id = $1
     AND status IN ('pending', 'scraping', 'analyzing', 'screenshots', 'ready_for_review')
     LIMIT 1`,
    [resourceId]
  );

  if (existingJob.rows.length > 0) {
    throw new Error(
      `An update job is already in progress for this resource (job ${existingJob.rows[0].id})`
    );
  }

  // Create the job
  const result = await pool.query(
    `INSERT INTO resource_update_jobs (resource_id, trigger_type, triggered_by)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [resourceId, triggerType, triggeredBy || null]
  );

  return result.rows[0].id;
}

/**
 * Get a job by ID
 */
export async function getUpdateJob(jobId: string): Promise<UpdateJob | null> {
  const result = await pool.query(
    `SELECT * FROM resource_update_jobs WHERE id = $1`,
    [jobId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as UpdateJob;
}

/**
 * Update job status
 */
async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  additionalFields: Record<string, unknown> = {}
): Promise<void> {
  const setClauses = ["status = $2", "updated_at = NOW()"];
  const values: unknown[] = [jobId, status];

  // Add completion timestamp for terminal states
  if (["applied", "rejected", "failed"].includes(status)) {
    setClauses.push("completed_at = NOW()");
  }

  // Add additional fields
  let paramIndex = 3;
  for (const [key, value] of Object.entries(additionalFields)) {
    setClauses.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  await pool.query(
    `UPDATE resource_update_jobs SET ${setClauses.join(", ")} WHERE id = $1`,
    values
  );
}

/**
 * Process an update job through all stages
 * This is the main orchestration function
 */
export async function processUpdateJob(jobId: string): Promise<void> {
  const job = await getUpdateJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Get the resource data
  const resourceResult = await pool.query(
    `SELECT * FROM resources WHERE id = $1`,
    [job.resource_id]
  );

  if (resourceResult.rows.length === 0) {
    await updateJobStatus(jobId, "failed", {
      error_message: "Resource not found",
    });
    return;
  }

  const resource = resourceResult.rows[0] as CurrentResource;

  try {
    // Stage 1: Scrape URLs
    await updateJobStatus(jobId, "scraping");
    const scrapeResult = await scrapeResourceUrls(resource);

    await updateJobStatus(jobId, "analyzing", {
      scraped_content: JSON.stringify(scrapeResult.content),
      scraped_at: new Date(),
      scrape_errors: scrapeResult.errors.length > 0 ? JSON.stringify(scrapeResult.errors) : null,
    });

    // Stage 2: Analyze with Claude
    const analysis = await analyzeResourceUpdate(resource, scrapeResult.content);

    await updateJobStatus(jobId, "screenshots", {
      proposed_changes: JSON.stringify(analysis.proposedChanges),
      ai_summary: analysis.summary,
      analyzed_at: new Date(),
      overall_confidence: analysis.overallConfidence,
    });

    // Stage 3: Capture screenshots
    const screenshotUrls = getScreenshotUrls(resource);
    let screenshots: string[] = [];
    let screenshotErrors: string[] = [];

    if (screenshotUrls.length > 0) {
      // Delete old screenshots first
      await deleteResourceScreenshots(resource.slug);

      // Capture new screenshots
      const screenshotResults = await captureScreenshots({
        urls: screenshotUrls,
        resourceSlug: resource.slug,
        fullPage: true,
      });

      screenshots = screenshotResults
        .filter((r) => r.screenshotUrl)
        .map((r) => r.screenshotUrl!);

      screenshotErrors = screenshotResults
        .filter((r) => r.error)
        .map((r) => `${r.url}: ${r.error}`);
    }

    // Stage 4: Ready for review
    await updateJobStatus(jobId, "ready_for_review", {
      new_screenshots: screenshots.length > 0 ? screenshots : null,
      screenshot_errors: screenshotErrors.length > 0 ? screenshotErrors : null,
    });

    // TODO: Send notification to admins
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Update retry count and mark as failed
    await updateJobStatus(jobId, "failed", {
      error_message: errorMessage,
      error_details: JSON.stringify({
        stack: error instanceof Error ? error.stack : undefined,
      }),
      retry_count: job.retry_count + 1,
    });

    throw error;
  }
}

/**
 * Scrape all relevant URLs for a resource
 */
async function scrapeResourceUrls(resource: CurrentResource): Promise<{
  content: ScrapedContent[];
  errors: { url: string; error: string }[];
}> {
  const urls: string[] = [];
  const content: ScrapedContent[] = [];
  const errors: { url: string; error: string }[] = [];

  // Collect URLs to scrape
  if (resource.official_url) urls.push(resource.official_url);
  if (resource.repo_url) urls.push(resource.repo_url);
  if (resource.documentation_url) urls.push(resource.documentation_url);

  // Scrape each URL
  for (const url of urls) {
    try {
      const result = await scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000,
      });

      if (result.success && result.data?.markdown) {
        content.push({
          url,
          markdown: result.data.markdown,
          metadata: result.data.metadata,
          scrapedAt: new Date(),
        });
      } else {
        errors.push({
          url,
          error: result.error || "No content returned",
        });
      }
    } catch (error) {
      errors.push({
        url,
        error: error instanceof Error ? error.message : "Scrape failed",
      });
    }
  }

  return { content, errors };
}

/**
 * Approve and apply changes from an update job
 */
export async function applyApprovedChanges(
  jobId: string,
  approvedBy: string,
  selectedFields?: string[],
  reviewNotes?: string
): Promise<void> {
  const job = await getUpdateJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== "ready_for_review") {
    throw new Error(`Job ${jobId} is not ready for review (status: ${job.status})`);
  }

  if (!job.proposed_changes || job.proposed_changes.length === 0) {
    throw new Error(`Job ${jobId} has no proposed changes`);
  }

  // Filter changes if specific fields were selected
  const changesToApply = selectedFields
    ? job.proposed_changes.filter((c) => selectedFields.includes(c.field))
    : job.proposed_changes;

  if (changesToApply.length === 0) {
    // Nothing to apply, just mark as applied
    await updateJobStatus(jobId, "applied", {
      reviewed_by: approvedBy,
      reviewed_at: new Date(),
      review_notes: reviewNotes || "No changes selected",
      selected_changes: JSON.stringify([]),
    });
    return;
  }

  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Build UPDATE query for resources table
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];
    let paramIndex = 1;

    for (const change of changesToApply) {
      updateFields.push(`${change.field} = $${paramIndex}`);
      updateValues.push(
        Array.isArray(change.newValue)
          ? change.newValue
          : change.newValue
      );
      paramIndex++;
    }

    // Add timestamp and job reference
    updateFields.push(`last_auto_updated_at = NOW()`);
    updateFields.push(`last_update_job_id = $${paramIndex}`);
    updateValues.push(jobId);
    paramIndex++;

    updateValues.push(job.resource_id);

    await client.query(
      `UPDATE resources SET ${updateFields.join(", ")} WHERE id = $${paramIndex}`,
      updateValues
    );

    // Create changelog entry
    const changesJson = changesToApply.map((c) => ({
      field: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
    }));

    // Get current stats for snapshot
    const statsResult = await client.query(
      `SELECT github_stars, npm_weekly_downloads, pypi_monthly_downloads
       FROM resources WHERE id = $1`,
      [job.resource_id]
    );
    const statsSnapshot = statsResult.rows[0] || {};

    await client.query(
      `INSERT INTO resource_changelog
       (resource_id, update_job_id, changes, ai_summary, source_type, applied_by, stats_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        job.resource_id,
        jobId,
        JSON.stringify(changesJson),
        job.ai_summary,
        job.trigger_type === "cron" ? "auto_update" : "admin_sync",
        approvedBy,
        JSON.stringify(statsSnapshot),
      ]
    );

    // Update screenshots if we captured new ones
    if (job.new_screenshots && job.new_screenshots.length > 0) {
      await client.query(
        `UPDATE resources SET screenshots = $1 WHERE id = $2`,
        [job.new_screenshots, job.resource_id]
      );
    }

    // Update job status
    await client.query(
      `UPDATE resource_update_jobs
       SET status = 'applied',
           reviewed_by = $1,
           reviewed_at = NOW(),
           review_notes = $2,
           selected_changes = $3,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4`,
      [
        approvedBy,
        reviewNotes || null,
        JSON.stringify(selectedFields || changesToApply.map((c) => c.field)),
        jobId,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reject an update job
 */
export async function rejectUpdateJob(
  jobId: string,
  rejectedBy: string,
  notes: string
): Promise<void> {
  const job = await getUpdateJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== "ready_for_review") {
    throw new Error(`Job ${jobId} is not ready for review (status: ${job.status})`);
  }

  await updateJobStatus(jobId, "rejected", {
    reviewed_by: rejectedBy,
    reviewed_at: new Date(),
    review_notes: notes,
  });

  // Clean up screenshots that were captured but not used
  if (job.new_screenshots && job.new_screenshots.length > 0) {
    // Screenshots in the bucket will be cleaned up on next successful update
    // Or we could delete them here
  }
}

/**
 * Get jobs pending review
 */
export async function getPendingReviewJobs(
  limit: number = 20,
  offset: number = 0
): Promise<{ jobs: UpdateJob[]; total: number }> {
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM resource_update_jobs WHERE status = 'ready_for_review'`
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT j.*, r.name as resource_name, r.slug as resource_slug
     FROM resource_update_jobs j
     JOIN resources r ON j.resource_id = r.id
     WHERE j.status = 'ready_for_review'
     ORDER BY j.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    jobs: result.rows as UpdateJob[],
    total,
  };
}

/**
 * Get jobs for a specific resource
 */
export async function getResourceJobs(
  resourceId: string,
  limit: number = 10
): Promise<UpdateJob[]> {
  const result = await pool.query(
    `SELECT * FROM resource_update_jobs
     WHERE resource_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [resourceId, limit]
  );

  return result.rows as UpdateJob[];
}

/**
 * Get resources due for auto-update
 */
export async function getResourcesDueForUpdate(
  limit: number = 10
): Promise<string[]> {
  const result = await pool.query(
    `SELECT id FROM resources
     WHERE auto_update_enabled = true
     AND (
       (update_frequency = 'daily' AND (last_auto_updated_at IS NULL OR last_auto_updated_at < NOW() - INTERVAL '1 day'))
       OR (update_frequency = 'weekly' AND (last_auto_updated_at IS NULL OR last_auto_updated_at < NOW() - INTERVAL '7 days'))
       OR (update_frequency = 'monthly' AND (last_auto_updated_at IS NULL OR last_auto_updated_at < NOW() - INTERVAL '30 days'))
     )
     ORDER BY last_auto_updated_at ASC NULLS FIRST
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((r) => r.id);
}
