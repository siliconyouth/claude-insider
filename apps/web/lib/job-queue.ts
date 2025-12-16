/**
 * Job Queue Library
 *
 * Simple, database-backed job queue for background processing.
 * Uses Supabase/PostgreSQL with atomic job claiming.
 *
 * Features:
 * - Automatic retries with exponential backoff
 * - Priority queue
 * - Delayed/scheduled jobs
 * - Type-safe job definitions
 *
 * @example
 * // Add a job
 * await addJob('email', { to: 'user@example.com', template: 'welcome' });
 *
 * // Add a high-priority job
 * await addJob('webhook', { url: '...', data: {} }, { priority: 10 });
 *
 * // Add a delayed job (run in 5 minutes)
 * await addJob('reminder', { userId: '...' }, { delay: 5 * 60 * 1000 });
 */

import { pool } from "@/lib/db";

// =============================================================================
// TYPES
// =============================================================================

export type JobType =
  | "email"
  | "email_bulk"
  | "donation_receipt"
  | "donation_thank_you"
  | "webhook"
  | "notification"
  | "cleanup";

export interface JobPayload {
  // Email jobs
  email?: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  };
  email_bulk?: {
    emails: string[];
    subject: string;
    html: string;
    text?: string;
  };
  // Donation jobs
  donation_receipt?: {
    donationId: string;
  };
  donation_thank_you?: {
    email: string;
    donorName?: string;
    amount: number;
    currency: string;
    isRecurring?: boolean;
  };
  // Webhook jobs
  webhook?: {
    url: string;
    method: "POST" | "GET";
    headers?: Record<string, string>;
    body?: unknown;
  };
  // Notification jobs
  notification?: {
    userId: string;
    type: string;
    data: Record<string, unknown>;
  };
  // Cleanup jobs
  cleanup?: {
    table: string;
    olderThanDays: number;
  };
}

export interface Job {
  id: string;
  type: JobType;
  payload: JobPayload;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  attempts: number;
  max_attempts: number;
  run_at: string;
  priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_error: string | null;
  error_count: number;
}

export interface AddJobOptions {
  priority?: number; // Higher = more important (default: 0)
  delay?: number; // Milliseconds to wait before running
  maxAttempts?: number; // Max retry attempts (default: 3)
}

export interface QueueStats {
  status: string;
  count: number;
  oldest: string | null;
}

// =============================================================================
// JOB QUEUE FUNCTIONS
// =============================================================================

/**
 * Add a job to the queue
 */
export async function addJob(
  type: JobType,
  payload: JobPayload[JobType],
  options: AddJobOptions = {}
): Promise<string> {
  const { priority = 0, delay = 0, maxAttempts = 3 } = options;
  const runAt = delay > 0 ? new Date(Date.now() + delay).toISOString() : new Date().toISOString();

  const result = await pool.query(
    `INSERT INTO job_queue (type, payload, priority, run_at, max_attempts)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [type, JSON.stringify({ [type]: payload }), priority, runAt, maxAttempts]
  );

  const jobId = result.rows[0]?.id;
  console.log(`[JobQueue] Added job: ${type} (id: ${jobId})`);
  return jobId;
}

/**
 * Claim jobs for processing (atomic operation with FOR UPDATE SKIP LOCKED)
 */
export async function claimJobs(
  limit: number = 10,
  types?: JobType[]
): Promise<Job[]> {
  // Build query based on whether types filter is provided
  if (types && types.length > 0) {
    const result = await pool.query(
      `UPDATE job_queue
       SET status = 'processing', started_at = now(), attempts = attempts + 1
       WHERE id IN (
         SELECT id FROM job_queue
         WHERE status = 'pending'
           AND run_at <= now()
           AND attempts < max_attempts
           AND type = ANY($2)
         ORDER BY priority DESC, run_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [limit, types]
    );
    return result.rows as Job[];
  }

  const result = await pool.query(
    `UPDATE job_queue
     SET status = 'processing', started_at = now(), attempts = attempts + 1
     WHERE id IN (
       SELECT id FROM job_queue
       WHERE status = 'pending'
         AND run_at <= now()
         AND attempts < max_attempts
       ORDER BY priority DESC, run_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [limit]
  );

  return result.rows as Job[];
}

/**
 * Mark a job as completed
 */
export async function completeJob(jobId: string): Promise<void> {
  await pool.query(
    `UPDATE job_queue SET status = 'completed', completed_at = now() WHERE id = $1`,
    [jobId]
  );
  console.log(`[JobQueue] Completed job: ${jobId}`);
}

/**
 * Mark a job as failed (will retry if attempts < max_attempts)
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  await pool.query(
    `UPDATE job_queue
     SET
       status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
       last_error = $2,
       error_count = error_count + 1,
       started_at = CASE WHEN attempts >= max_attempts THEN started_at ELSE NULL END
     WHERE id = $1`,
    [jobId, error]
  );
  console.log(`[JobQueue] Failed job: ${jobId} - ${error}`);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats[]> {
  const result = await pool.query(
    `SELECT status, COUNT(*)::INT as count, MIN(created_at) as oldest
     FROM job_queue GROUP BY status`
  );
  return result.rows as QueueStats[];
}

/**
 * Clean up old completed jobs
 */
export async function cleanupOldJobs(days: number = 7): Promise<number> {
  const result = await pool.query(
    `DELETE FROM job_queue
     WHERE status IN ('completed', 'failed', 'cancelled')
       AND completed_at < now() - ($1 || ' days')::INTERVAL`,
    [days]
  );
  const deleted = result.rowCount || 0;
  console.log(`[JobQueue] Cleaned up ${deleted} old jobs`);
  return deleted;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Queue an email to be sent
 */
export async function queueEmail(
  to: string,
  subject: string,
  html: string,
  options: { text?: string; priority?: number } = {}
): Promise<string> {
  return addJob(
    "email",
    { to, subject, html, text: options.text },
    { priority: options.priority ?? 5 }
  );
}

/**
 * Queue a donation thank you email
 */
export async function queueDonationThankYou(
  email: string,
  donorName: string | undefined,
  amount: number,
  currency: string,
  isRecurring: boolean = false
): Promise<string> {
  return addJob(
    "donation_thank_you",
    { email, donorName, amount, currency, isRecurring },
    { priority: 10 } // High priority for donations
  );
}

/**
 * Queue a donation receipt generation
 */
export async function queueDonationReceipt(donationId: string): Promise<string> {
  return addJob(
    "donation_receipt",
    { donationId },
    { priority: 8 }
  );
}

/**
 * Queue a webhook call
 */
export async function queueWebhook(
  url: string,
  body: unknown,
  options: { method?: "POST" | "GET"; headers?: Record<string, string>; priority?: number } = {}
): Promise<string> {
  return addJob(
    "webhook",
    {
      url,
      method: options.method ?? "POST",
      headers: options.headers,
      body,
    },
    { priority: options.priority ?? 5 }
  );
}
