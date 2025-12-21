"use server";

/**
 * Admin Export Server Actions
 *
 * Handles bulk data export operations for administrators:
 * - Create export jobs
 * - Track export progress
 * - Download completed exports
 * - Schedule recurring exports
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  exportData,
  type ExportFormat,
  type ExportOptions,
  USER_EXPORT_COLUMNS,
  AUDIT_LOG_COLUMNS,
  ACTIVITY_EXPORT_COLUMNS,
} from "@/lib/export-formats";

// Types
export type ExportType = "users" | "activity" | "content" | "audit_logs" | "all";

export interface ExportJobOptions {
  userIds?: string[];
  dateRange?: { start: string; end: string };
  anonymize?: boolean;
  includeDeleted?: boolean;
}

export interface ExportJob {
  id: string;
  created_by: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  export_type: ExportType;
  format: ExportFormat;
  options: ExportJobOptions;
  file_path: string | null;
  file_size: number | null;
  row_count: number | null;
  error_message: string | null;
  progress: number;
  current_step: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Create Export Job ====================

export async function createExportJob(input: {
  exportType: ExportType;
  format: ExportFormat;
  options?: ExportJobOptions;
}): Promise<{ job?: ExportJob; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check admin role
    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = (user?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return { error: "Not authorized" };
    }

    // Create the export job
    const { data: job, error } = await supabase
      .from("export_jobs")
      .insert({
        created_by: session.user.id,
        export_type: input.exportType,
        format: input.format,
        options: input.options || {},
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) throw error;

    // Start processing in background (fire and forget)
    processExportJob(job.id).catch(console.error);

    revalidatePath("/dashboard/exports");
    return { job };
  } catch (error) {
    console.error("[Export] Create job error:", error);
    return { error: "Failed to create export job" };
  }
}

// ==================== Process Export Job ====================

async function processExportJob(jobId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  try {
    // Update status to processing
    await supabase
      .from("export_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        current_step: "Initializing...",
        progress: 5,
      })
      .eq("id", jobId);

    // Get job details
    const { data: job } = await supabase
      .from("export_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) throw new Error("Job not found");

    const options = job.options as ExportJobOptions;
    let data: Record<string, unknown>[] = [];
    let exportColumns;

    // Fetch data based on export type
    switch (job.export_type) {
      case "users":
        await updateProgress(supabase, jobId, 20, "Fetching user data...");
        data = await fetchUserData(supabase, options);
        exportColumns = USER_EXPORT_COLUMNS;
        break;

      case "activity":
        await updateProgress(supabase, jobId, 20, "Fetching activity data...");
        data = await fetchActivityData(supabase, options);
        exportColumns = ACTIVITY_EXPORT_COLUMNS;
        break;

      case "audit_logs":
        await updateProgress(supabase, jobId, 20, "Fetching audit logs...");
        data = await fetchAuditLogs(supabase, options);
        exportColumns = AUDIT_LOG_COLUMNS;
        break;

      case "content":
        await updateProgress(supabase, jobId, 20, "Fetching content data...");
        data = await fetchContentData(supabase, options);
        break;

      case "all": {
        // Combine all data types
        await updateProgress(supabase, jobId, 10, "Fetching user data...");
        const users = await fetchUserData(supabase, options);
        await updateProgress(supabase, jobId, 30, "Fetching activity data...");
        const activity = await fetchActivityData(supabase, options);
        await updateProgress(supabase, jobId, 50, "Fetching audit logs...");
        const logs = await fetchAuditLogs(supabase, options);
        data = [
          ...users.map((u: Record<string, unknown>) => ({ ...u, _type: "user" })),
          ...activity.map((a: Record<string, unknown>) => ({ ...a, _type: "activity" })),
          ...logs.map((l: Record<string, unknown>) => ({ ...l, _type: "audit_log" })),
        ];
        break;
      }
    }

    await updateProgress(supabase, jobId, 70, "Generating export file...");

    // Export the data
    const exportOptions: ExportOptions = {
      format: job.format as ExportFormat,
      columns: exportColumns,
      anonymize: options.anonymize,
      prettyPrint: true,
      sheetName: job.export_type,
    };

    const result = await exportData(data, exportOptions);

    await updateProgress(supabase, jobId, 90, "Saving export file...");

    // Store the file in Supabase Storage
    const fileName = `export_${jobId}.${result.extension}`;
    const filePath = `exports/${job.created_by}/${fileName}`;

    // Convert string data to buffer for storage
    const fileData =
      typeof result.data === "string"
        ? Buffer.from(result.data, "utf-8")
        : result.data;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, fileData, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn("[Export] Storage upload failed, using data URL fallback");
      // Store as base64 in the database as fallback
      const base64Data = Buffer.from(fileData).toString("base64");
      await supabase
        .from("export_jobs")
        .update({
          status: "completed",
          file_path: `data:${result.mimeType};base64,${base64Data}`,
          file_size: fileData.length,
          row_count: result.rowCount,
          progress: 100,
          current_step: "Complete",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } else {
      // Update job with file info
      await supabase
        .from("export_jobs")
        .update({
          status: "completed",
          file_path: filePath,
          file_size: fileData.length,
          row_count: result.rowCount,
          progress: 100,
          current_step: "Complete",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
  } catch (error) {
    console.error("[Export] Process error:", error);
    await supabase
      .from("export_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Export failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

// Helper to update progress
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProgress(
  supabase: any,
  jobId: string,
  progress: number,
  step: string
) {
  await supabase
    .from("export_jobs")
    .update({
      progress,
      current_step: step,
    })
    .eq("id", jobId);
}

// ==================== Data Fetchers ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchUserData(supabase: any, options: ExportJobOptions) {
  let query = supabase
    .from("user")
    .select('id, email, name, username, role, "createdAt", "emailVerified", banned');

  if (options.userIds?.length) {
    query = query.in("id", options.userIds);
  }

  if (options.dateRange?.start) {
    query = query.gte('"createdAt"', options.dateRange.start);
  }

  if (options.dateRange?.end) {
    query = query.lte('"createdAt"', options.dateRange.end);
  }

  const { data } = await query;
  return data || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchActivityData(supabase: any, options: ExportJobOptions) {
  let query = supabase
    .from("user_activity")
    .select("id, user_id, activity_type, resource_type, resource_id, metadata, created_at");

  if (options.userIds?.length) {
    query = query.in("user_id", options.userIds);
  }

  if (options.dateRange?.start) {
    query = query.gte("created_at", options.dateRange.start);
  }

  if (options.dateRange?.end) {
    query = query.lte("created_at", options.dateRange.end);
  }

  query = query.order("created_at", { ascending: false }).limit(10000);

  const { data } = await query;
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    userId: row.user_id,
    activityType: row.activity_type,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAuditLogs(supabase: any, options: ExportJobOptions) {
  // Fetch from Payload CMS audit-logs collection via API
  // For now, return empty - this would need Payload integration
  let query = supabase
    .from("admin_logs")
    .select("id, user_id, action, target_type, target_id, details, ip_address, created_at");

  if (options.dateRange?.start) {
    query = query.gte("created_at", options.dateRange.start);
  }

  if (options.dateRange?.end) {
    query = query.lte("created_at", options.dateRange.end);
  }

  query = query.order("created_at", { ascending: false }).limit(10000);

  const { data } = await query;
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    userId: row.user_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchContentData(supabase: any, options: ExportJobOptions) {
  // Fetch reviews, comments, etc.
  const [reviews, comments] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, user_id, resource_id, rating, content, created_at")
      .limit(10000),
    supabase
      .from("comments")
      .select("id, user_id, doc_slug, content, created_at")
      .limit(10000),
  ]);

  const content: Record<string, unknown>[] = [];

  if (reviews.data) {
    content.push(
      ...reviews.data.map((r: Record<string, unknown>) => ({
        type: "review",
        id: r.id,
        userId: r.user_id,
        resourceId: r.resource_id,
        rating: r.rating,
        content: r.content,
        createdAt: r.created_at,
      }))
    );
  }

  if (comments.data) {
    content.push(
      ...comments.data.map((c: Record<string, unknown>) => ({
        type: "comment",
        id: c.id,
        userId: c.user_id,
        docSlug: c.doc_slug,
        content: c.content,
        createdAt: c.created_at,
      }))
    );
  }

  return content;
}

// ==================== Get Export Jobs ====================

export async function getExportJobs(
  page: number = 1,
  limit: number = 10
): Promise<{ jobs?: ExportJob[]; total?: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check admin role
    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = (user?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return { error: "Not authorized" };
    }

    // Get total count
    const { count } = await supabase
      .from("export_jobs")
      .select("*", { count: "exact", head: true });

    // Get paginated results
    const { data: jobs, error } = await supabase
      .from("export_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return { jobs: jobs || [], total: count || 0 };
  } catch (error) {
    console.error("[Export] Get jobs error:", error);
    return { error: "Failed to get export jobs" };
  }
}

// ==================== Get Single Export Job ====================

export async function getExportJob(
  jobId: string
): Promise<{ job?: ExportJob; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: job, error } = await supabase
      .from("export_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) throw error;

    // Check if user can access this job
    if (job.created_by !== session.user.id) {
      const { data: user } = await supabase
        .from("user")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const userRole = (user?.role as UserRole) || "user";
      if (!hasMinRole(userRole, ROLES.ADMIN)) {
        return { error: "Not authorized" };
      }
    }

    return { job };
  } catch (error) {
    console.error("[Export] Get job error:", error);
    return { error: "Failed to get export job" };
  }
}

// ==================== Cancel Export Job ====================

export async function cancelExportJob(
  jobId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check admin role
    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = (user?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return { error: "Not authorized" };
    }

    const { error } = await supabase
      .from("export_jobs")
      .update({ status: "cancelled" })
      .eq("id", jobId)
      .in("status", ["pending", "processing"]);

    if (error) throw error;

    revalidatePath("/dashboard/exports");
    return { success: true };
  } catch (error) {
    console.error("[Export] Cancel job error:", error);
    return { error: "Failed to cancel export job" };
  }
}

// ==================== Delete Export Job ====================

export async function deleteExportJob(
  jobId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check admin role
    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = (user?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return { error: "Not authorized" };
    }

    // Get job to find file path
    const { data: job } = await supabase
      .from("export_jobs")
      .select("file_path")
      .eq("id", jobId)
      .single();

    // Delete file from storage if exists
    if (job?.file_path && !job.file_path.startsWith("data:")) {
      await supabase.storage.from("exports").remove([job.file_path]);
    }

    // Delete job record
    const { error } = await supabase
      .from("export_jobs")
      .delete()
      .eq("id", jobId);

    if (error) throw error;

    revalidatePath("/dashboard/exports");
    return { success: true };
  } catch (error) {
    console.error("[Export] Delete job error:", error);
    return { error: "Failed to delete export job" };
  }
}

// ==================== Download Export ====================

export async function getExportDownloadUrl(
  jobId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: job } = await supabase
      .from("export_jobs")
      .select("file_path, created_by, status")
      .eq("id", jobId)
      .single();

    if (!job) {
      return { error: "Export not found" };
    }

    if (job.status !== "completed") {
      return { error: "Export not ready" };
    }

    // Check if user can access
    if (job.created_by !== session.user.id) {
      const { data: user } = await supabase
        .from("user")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const userRole = (user?.role as UserRole) || "user";
      if (!hasMinRole(userRole, ROLES.ADMIN)) {
        return { error: "Not authorized" };
      }
    }

    // If it's a data URL, return it directly
    if (job.file_path.startsWith("data:")) {
      return { url: job.file_path };
    }

    // Generate signed URL for storage file
    const { data: signedUrl, error } = await supabase.storage
      .from("exports")
      .createSignedUrl(job.file_path, 3600); // 1 hour expiry

    if (error) throw error;

    return { url: signedUrl.signedUrl };
  } catch (error) {
    console.error("[Export] Get download URL error:", error);
    return { error: "Failed to get download URL" };
  }
}
