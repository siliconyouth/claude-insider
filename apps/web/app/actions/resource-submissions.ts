"use server";

/**
 * Resource Submissions Server Actions
 *
 * Handle user-submitted resources with rate limiting, duplicate detection,
 * and status tracking. Works with the AI analysis cron job and admin
 * moderation workflow.
 *
 * Flow: User submits → Rate limit check → Duplicate check → Create submission
 *       → Cron job processes → AI analysis → ResourceDiscoveryQueue → Admin review
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { pool } from "@/lib/db";
import { createNotification } from "./notifications";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "crypto";

// ============================================================================
// Types
// ============================================================================

export type SubmissionStatus =
  | "pending"      // Waiting for AI analysis
  | "analyzing"    // AI analysis in progress
  | "queued"       // In ResourceDiscoveryQueue for admin review
  | "approved"     // Accepted and added to resources
  | "rejected";    // Rejected by moderator

export type RejectionReason =
  | "spam"
  | "duplicate"
  | "off-topic"
  | "low-quality"
  | "not-relevant"
  | "inappropriate";

export interface ResourceSubmission {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  notes: string | null;
  submitter_type: "public" | "anonymous";
  submitter_user_id: string | null;
  submitter_email: string | null;
  submitter_name: string | null;
  status: SubmissionStatus;
  ai_analysis: Record<string, unknown> | null;
  ai_confidence: number | null;
  ai_relevance: number | null;
  ai_quality: number | null;
  ai_error: string | null;
  discovery_queue_id: string | null;
  created_resource_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: RejectionReason | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitResourceParams {
  url: string;
  title?: string;
  description?: string;
  notes?: string;
  email?: string;  // For anonymous submissions (optional)
  name?: string;   // For anonymous submissions (optional)
}

export interface SubmitResourceResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  isDuplicate?: boolean;
  existingResourceId?: string;
  existingResourceUrl?: string;
}

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

const RATE_LIMITS = {
  anonymous: { maxPerDay: 1, description: "1 submission per day" },
  logged_in: { maxPerDay: 5, description: "5 submissions per day" },
  verified: { maxPerDay: 10, description: "10 submissions per day" },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hash an IP address for privacy-compliant rate limiting
 */
function hashIP(ip: string): string {
  return createHash("sha256").update(ip + process.env.BETTER_AUTH_SECRET).digest("hex");
}

/**
 * Extract and normalize a URL for duplicate checking
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, lowercase host
    let normalized = `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}`;
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    // Keep query params if meaningful (for some sites)
    if (parsed.search && !parsed.search.includes("utm_")) {
      normalized += parsed.search;
    }
    return normalized;
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================================================
// Main Actions
// ============================================================================

/**
 * Submit a resource for review
 */
export async function submitResource(
  params: SubmitResourceParams
): Promise<SubmitResourceResult> {
  try {
    const { url, title, description, notes, email, name } = params;

    // 1. Validate URL
    if (!url || typeof url !== "string" || !isValidUrl(url)) {
      return { success: false, error: "Please enter a valid URL (http or https)" };
    }

    const normalizedUrl = normalizeUrl(url);

    // 2. Get current user (optional)
    const session = await getSession();
    const userId = session?.user?.id;
    const isLoggedIn = !!userId;

    // 3. Get IP for anonymous rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
    const ipHash = hashIP(ip);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // 4. Rate limit check
    const rateCheckResult = await checkRateLimit(userId, ipHash, isLoggedIn);
    if (!rateCheckResult.allowed) {
      return {
        success: false,
        error: rateCheckResult.error || "Rate limit exceeded. Please try again later.",
      };
    }

    // 5. Duplicate check - check all three tables
    const duplicateCheck = await checkForDuplicates(supabase, normalizedUrl);
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: duplicateCheck.error,
        isDuplicate: true,
        existingResourceId: duplicateCheck.existingId,
        existingResourceUrl: duplicateCheck.existingUrl,
      };
    }

    // 6. Create submission record
    const { data: submission, error: insertError } = await supabase
      .from("resource_submissions")
      .insert({
        url: normalizedUrl,
        title: title?.trim() || null,
        description: description?.trim() || null,
        notes: notes?.trim() || null,
        submitter_type: isLoggedIn ? "public" : "anonymous",
        submitter_user_id: userId || null,
        submitter_email: !isLoggedIn && email ? email.trim() : null,
        submitter_name: !isLoggedIn && name ? name.trim() : null,
        submitter_ip_hash: !isLoggedIn ? ipHash : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[ResourceSubmissions] Insert error:", insertError);
      return { success: false, error: "Failed to submit resource. Please try again." };
    }

    // 7. Notify admins about new submission
    await notifyAdminsNewSubmission(submission.id, normalizedUrl, userId, name);

    // 8. Send confirmation to user (if logged in) with email and push notification
    if (userId) {
      await createNotification({
        userId,
        type: "resource_submission_received",
        title: "Resource Submitted",
        message: "Thanks for your submission! We'll review it and let you know when it's processed.",
        data: { submissionId: submission.id, url: normalizedUrl },
        resourceType: "submission",
        resourceId: submission.id,
      });
    }

    revalidatePath("/resources");

    return {
      success: true,
      submissionId: submission.id,
    };
  } catch (error) {
    console.error("[ResourceSubmissions] Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Get user's submissions with status
 */
export async function getUserSubmissions(): Promise<{
  data?: ResourceSubmission[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to view your submissions" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("resource_submissions")
      .select("*")
      .eq("submitter_user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ResourceSubmissions] Fetch error:", error);
      return { error: "Failed to load submissions" };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("[ResourceSubmissions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get submission status by ID
 */
export async function getSubmissionStatus(submissionId: string): Promise<{
  data?: ResourceSubmission;
  error?: string;
}> {
  try {
    const session = await getSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("resource_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { error: "Submission not found" };
      }
      console.error("[ResourceSubmissions] Fetch error:", error);
      return { error: "Failed to load submission" };
    }

    // Only allow viewing if: user owns it OR user is admin
    if (data.submitter_user_id !== session?.user?.id) {
      const isAdmin = await checkIsAdmin(session?.user?.id);
      if (!isAdmin) {
        return { error: "You don't have permission to view this submission" };
      }
    }

    return { data };
  } catch (error) {
    console.error("[ResourceSubmissions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get pending submissions for admin review
 */
export async function getPendingSubmissions(options?: {
  status?: SubmissionStatus;
  limit?: number;
  offset?: number;
}): Promise<{
  data?: ResourceSubmission[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // Check admin access
    const isAdmin = await checkIsAdmin(session.user.id);
    if (!isAdmin) {
      return { error: "You don't have permission to view submissions" };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    let query = supabase
      .from("resource_submissions")
      .select("*", { count: "exact" });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[ResourceSubmissions] Fetch error:", error);
      return { error: "Failed to load submissions" };
    }

    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error("[ResourceSubmissions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update submission status (admin action)
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  options?: {
    reviewNotes?: string;
    rejectionReason?: RejectionReason;
    createdResourceId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" };
    }

    const isAdmin = await checkIsAdmin(session.user.id);
    if (!isAdmin) {
      return { success: false, error: "You don't have permission to update submissions" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (options?.reviewNotes) {
      updateData.review_notes = options.reviewNotes;
    }
    if (options?.rejectionReason) {
      updateData.rejection_reason = options.rejectionReason;
    }
    if (options?.createdResourceId) {
      updateData.created_resource_id = options.createdResourceId;
    }

    const { data: submission, error: updateError } = await supabase
      .from("resource_submissions")
      .update(updateData)
      .eq("id", submissionId)
      .select("submitter_user_id, url, status")
      .single();

    if (updateError) {
      console.error("[ResourceSubmissions] Update error:", updateError);
      return { success: false, error: "Failed to update submission" };
    }

    // Notify user of status change with email and push
    if (submission.submitter_user_id) {
      if (status === "approved") {
        await createNotification({
          userId: submission.submitter_user_id,
          type: "resource_submission_approved",
          title: "Resource Approved!",
          message: `Great news! Your submitted resource has been approved and added to Claude Insider.`,
          data: {
            submissionId,
            resourceId: options?.createdResourceId,
            url: submission.url,
          },
          resourceType: "submission",
          resourceId: submissionId,
        });
      } else if (status === "rejected") {
        const reasonText = options?.rejectionReason
          ? ` Reason: ${formatRejectionReason(options.rejectionReason)}`
          : "";
        await createNotification({
          userId: submission.submitter_user_id,
          type: "resource_submission_rejected",
          title: "Submission Not Accepted",
          message: `Your submitted resource was not accepted.${reasonText}`,
          data: { submissionId, url: submission.url },
          resourceType: "submission",
          resourceId: submissionId,
        });
      }
    }

    revalidatePath("/dashboard/discovery");
    revalidatePath("/profile/submissions");

    return { success: true };
  } catch (error) {
    console.error("[ResourceSubmissions] Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================================================
// Helper Functions (Internal)
// ============================================================================

/**
 * Check rate limits for submissions
 */
async function checkRateLimit(
  userId: string | undefined,
  ipHash: string,
  isLoggedIn: boolean
): Promise<{ allowed: boolean; error?: string }> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  try {
    if (isLoggedIn && userId) {
      // Check user's submissions in last 24 hours
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM resource_submissions
         WHERE submitter_user_id = $1 AND created_at > $2`,
        [userId, oneDayAgo]
      );

      const count = parseInt(result.rows[0]?.count || "0", 10);

      // Check if user has verified email for higher limit
      const userResult = await pool.query(
        `SELECT "emailVerified" FROM "user" WHERE id = $1`,
        [userId]
      );
      const isVerified = !!userResult.rows[0]?.emailVerified;

      const limit = isVerified ? RATE_LIMITS.verified : RATE_LIMITS.logged_in;

      if (count >= limit.maxPerDay) {
        return {
          allowed: false,
          error: `You've reached your daily limit (${limit.description}). Please try again tomorrow.`,
        };
      }
    } else {
      // Anonymous: check by IP hash
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM resource_submissions
         WHERE submitter_ip_hash = $1 AND created_at > $2`,
        [ipHash, oneDayAgo]
      );

      const count = parseInt(result.rows[0]?.count || "0", 10);

      if (count >= RATE_LIMITS.anonymous.maxPerDay) {
        return {
          allowed: false,
          error: `Anonymous submissions are limited to ${RATE_LIMITS.anonymous.description}. Sign in for more submissions.`,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("[ResourceSubmissions] Rate limit check error:", error);
    // Allow on error to not block legitimate submissions
    return { allowed: true };
  }
}

/**
 * Check for duplicate URLs across all relevant tables
 */
async function checkForDuplicates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  normalizedUrl: string
): Promise<{
  isDuplicate: boolean;
  error?: string;
  existingId?: string;
  existingUrl?: string;
}> {
  try {
    // 1. Check resource_submissions (pending/analyzing)
    const { data: existingSubmission } = await supabase
      .from("resource_submissions")
      .select("id, url")
      .eq("url", normalizedUrl)
      .in("status", ["pending", "analyzing", "queued"])
      .limit(1)
      .single();

    if (existingSubmission) {
      return {
        isDuplicate: true,
        error: "This URL has already been submitted and is awaiting review.",
        existingId: existingSubmission.id,
        existingUrl: existingSubmission.url,
      };
    }

    // 2. Check resource_discovery_queue (pending)
    const { data: existingQueue } = await supabase
      .from("resource_discovery_queue")
      .select("id, discovered_url")
      .eq("discovered_url", normalizedUrl)
      .eq("status", "pending")
      .limit(1)
      .single();

    if (existingQueue) {
      return {
        isDuplicate: true,
        error: "This URL is already in our review queue.",
        existingId: existingQueue.id,
        existingUrl: existingQueue.discovered_url,
      };
    }

    // 3. Check resources table (using pool for direct query since resources may be in a different schema)
    const resourceResult = await pool.query(
      `SELECT id, url FROM resources WHERE url ILIKE $1 LIMIT 1`,
      [normalizedUrl]
    );

    if (resourceResult.rows.length > 0) {
      const resource = resourceResult.rows[0];
      return {
        isDuplicate: true,
        error: "This resource already exists in our database.",
        existingId: resource.id,
        existingUrl: resource.url,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("[ResourceSubmissions] Duplicate check error:", error);
    // Don't block on error, let it through and let admin handle duplicates
    return { isDuplicate: false };
  }
}

/**
 * Check if user is admin/moderator
 */
async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  try {
    const result = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [userId]
    );
    const role = result.rows[0]?.role;
    return ["admin", "superadmin", "moderator"].includes(role);
  } catch {
    return false;
  }
}

/**
 * Notify admins about new submission
 */
async function notifyAdminsNewSubmission(
  submissionId: string,
  url: string,
  submitterId: string | undefined,
  submitterName: string | undefined
): Promise<void> {
  try {
    // Get admin users
    const result = await pool.query(
      `SELECT id FROM "user" WHERE role IN ('admin', 'superadmin', 'moderator') LIMIT 10`
    );

    const submitterLabel = submitterId
      ? "a user"
      : submitterName
        ? submitterName
        : "Anonymous";

    for (const row of result.rows) {
      await createNotification({
        userId: row.id,
        type: "system",
        title: "New Resource Submission",
        message: `${submitterLabel} submitted a resource for review: ${url}`,
        data: { submissionId, url },
        actorId: submitterId,
      });
    }
  } catch (error) {
    // Don't fail the main operation if notification fails
    console.error("[ResourceSubmissions] Admin notification error:", error);
  }
}

/**
 * Format rejection reason for display
 */
function formatRejectionReason(reason: RejectionReason): string {
  const reasons: Record<RejectionReason, string> = {
    spam: "Identified as spam",
    duplicate: "Already exists in our database",
    "off-topic": "Not related to Claude AI",
    "low-quality": "Does not meet quality standards",
    "not-relevant": "Not relevant to our audience",
    inappropriate: "Contains inappropriate content",
  };
  return reasons[reason] || reason;
}

// ============================================================================
// Admin Statistics
// ============================================================================

/**
 * Get submission statistics for admin dashboard
 */
export async function getSubmissionStats(): Promise<{
  data?: {
    total: number;
    pending: number;
    analyzing: number;
    queued: number;
    approved: number;
    rejected: number;
    todayCount: number;
    weekCount: number;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    const isAdmin = await checkIsAdmin(session.user.id);
    if (!isAdmin) {
      return { error: "You don't have permission" };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'analyzing') as analyzing,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE created_at >= $1) as today_count,
        COUNT(*) FILTER (WHERE created_at >= $2) as week_count
      FROM resource_submissions
    `, [todayStart, weekAgo]);

    const row = result.rows[0];

    return {
      data: {
        total: parseInt(row.total, 10),
        pending: parseInt(row.pending, 10),
        analyzing: parseInt(row.analyzing, 10),
        queued: parseInt(row.queued, 10),
        approved: parseInt(row.approved, 10),
        rejected: parseInt(row.rejected, 10),
        todayCount: parseInt(row.today_count, 10),
        weekCount: parseInt(row.week_count, 10),
      },
    };
  } catch (error) {
    console.error("[ResourceSubmissions] Stats error:", error);
    return { error: "Failed to load statistics" };
  }
}
