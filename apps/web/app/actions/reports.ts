"use server";

/**
 * Reports Server Actions
 *
 * Handles user and comment reporting functionality.
 * Users can submit reports, admins can review and take action.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { canPerformAction, ACTIONS, type UserRole } from "@/lib/roles";
import { sendEmail, emailTemplates } from "@/lib/email";

// Database row types
interface ReportRow {
  id: string;
  reporter_id: string;
  report_type: string;
  reported_user_id?: string;
  reported_comment_id?: string;
  reason: string;
  description?: string;
  status: string;
  reviewed_by?: string;
  review_notes?: string;
  action_taken?: string;
  reporter_message?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

interface UserRow {
  id: string;
  name?: string;
  email: string;
}

interface CommentRow {
  id: string;
  content: string;
  user_id: string;
}

// ============================================
// TYPES
// ============================================

export type ReportType = "user" | "comment";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "misinformation"
  | "inappropriate"
  | "other";
export type ReportStatus = "pending" | "investigating" | "action_taken" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  reportType: ReportType;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedUserEmail?: string;
  reportedCommentId?: string;
  reportedCommentContent?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  actionTaken?: string;
  reporterMessage?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USER ACTIONS
// ============================================

/**
 * Report a user
 */
export async function reportUser(
  userId: string,
  reason: ReportReason,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "You must be logged in to report users" };
    }

    // Cannot report yourself
    if (userId === session.user.id) {
      return { success: false, error: "You cannot report yourself" };
    }

    const supabase = await createAdminClient();

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from("user")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return { success: false, error: "User not found" };
    }

    // Check if already reported this user recently (within 24 hours)
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", session.user.id)
      .eq("reported_user_id", userId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingReport) {
      return { success: false, error: "You have already reported this user recently" };
    }

    // Create the report
    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: session.user.id,
      report_type: "user",
      reported_user_id: userId,
      reason,
      description: description?.trim() || null,
    });

    if (insertError) {
      console.error("Failed to create report:", insertError);
      return { success: false, error: "Failed to submit report" };
    }

    return { success: true };
  } catch (error) {
    console.error("Report user error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Report a comment
 */
export async function reportComment(
  commentId: string,
  reason: ReportReason,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "You must be logged in to report comments" };
    }

    const supabase = await createAdminClient();

    // Check if comment exists and get its author
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id, content")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return { success: false, error: "Comment not found" };
    }

    // Cannot report your own comment
    if (comment.user_id === session.user.id) {
      return { success: false, error: "You cannot report your own comment" };
    }

    // Check if already reported this comment recently
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", session.user.id)
      .eq("reported_comment_id", commentId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingReport) {
      return { success: false, error: "You have already reported this comment recently" };
    }

    // Create the report
    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: session.user.id,
      report_type: "comment",
      reported_comment_id: commentId,
      reason,
      description: description?.trim() || null,
    });

    if (insertError) {
      console.error("Failed to create report:", insertError);
      return { success: false, error: "Failed to submit report" };
    }

    return { success: true };
  } catch (error) {
    console.error("Report comment error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get user's own submitted reports
 */
export async function getMyReports(): Promise<{
  success: boolean;
  reports?: Report[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        report_type,
        reported_user_id,
        reported_comment_id,
        reason,
        description,
        status,
        action_taken,
        reporter_message,
        reviewed_at,
        created_at,
        updated_at
      `)
      .eq("reporter_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to get reports:", error);
      return { success: false, error: "Failed to load reports" };
    }

    const reports: Report[] = (data as unknown as ReportRow[]).map((r: ReportRow) => ({
      id: r.id,
      reporterId: session.user.id,
      reportType: r.report_type as ReportType,
      reportedUserId: r.reported_user_id,
      reportedCommentId: r.reported_comment_id,
      reason: r.reason as ReportReason,
      description: r.description,
      status: r.status as ReportStatus,
      actionTaken: r.action_taken,
      reporterMessage: r.reporter_message,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return { success: true, reports };
  } catch (error) {
    console.error("Get my reports error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// ADMIN ACTIONS
// ============================================

/**
 * Get all reports (admin only)
 */
export async function getReports(options?: {
  status?: ReportStatus | "all";
  type?: ReportType | "all";
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  reports?: Report[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createAdminClient();

    // Check admin permission
    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role as UserRole, ACTIONS.MODERATE_COMMENTS)) {
      return { success: false, error: "You do not have permission to view reports" };
    }

    const { status = "all", type = "all", page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reports")
      .select(`
        id,
        reporter_id,
        report_type,
        reported_user_id,
        reported_comment_id,
        reason,
        description,
        status,
        reviewed_by,
        review_notes,
        action_taken,
        reporter_message,
        reviewed_at,
        created_at,
        updated_at
      `, { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (type !== "all") {
      query = query.eq("report_type", type);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to get reports:", error);
      return { success: false, error: "Failed to load reports" };
    }

    // Get reporter and reported user details
    const reportData = data as unknown as ReportRow[];
    const reporterIds = [...new Set(reportData.map((r: ReportRow) => r.reporter_id))];
    const reportedUserIds = [...new Set(reportData.filter((r: ReportRow) => r.reported_user_id).map((r: ReportRow) => r.reported_user_id as string))];
    const reviewerIds = [...new Set(reportData.filter((r: ReportRow) => r.reviewed_by).map((r: ReportRow) => r.reviewed_by as string))];
    const commentIds = [...new Set(reportData.filter((r: ReportRow) => r.reported_comment_id).map((r: ReportRow) => r.reported_comment_id as string))];

    const allUserIds = [...new Set([...reporterIds, ...reportedUserIds, ...reviewerIds])];

    const { data: users } = await supabase
      .from("user")
      .select("id, name, email")
      .in("id", allUserIds);

    const { data: comments } = commentIds.length > 0
      ? await supabase
          .from("comments")
          .select("id, content, user_id")
          .in("id", commentIds)
      : { data: [] };

    const userMap = new Map((users as UserRow[] || []).map((u: UserRow) => [u.id, u]));
    const commentMap = new Map((comments as CommentRow[] || []).map((c: CommentRow) => [c.id, c]));

    const reports: Report[] = reportData.map((r: ReportRow) => {
      const reporter = userMap.get(r.reporter_id);
      const reportedUser = r.reported_user_id ? userMap.get(r.reported_user_id) : null;
      const reviewer = r.reviewed_by ? userMap.get(r.reviewed_by) : null;
      const comment = r.reported_comment_id ? commentMap.get(r.reported_comment_id) : null;

      return {
        id: r.id,
        reporterId: r.reporter_id,
        reporterName: reporter?.name,
        reporterEmail: reporter?.email,
        reportType: r.report_type as ReportType,
        reportedUserId: r.reported_user_id,
        reportedUserName: reportedUser?.name,
        reportedUserEmail: reportedUser?.email,
        reportedCommentId: r.reported_comment_id,
        reportedCommentContent: comment?.content,
        reason: r.reason as ReportReason,
        description: r.description,
        status: r.status as ReportStatus,
        reviewedBy: r.reviewed_by,
        reviewedByName: reviewer?.name,
        reviewNotes: r.review_notes,
        actionTaken: r.action_taken,
        reporterMessage: r.reporter_message,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    return { success: true, reports, total: count || 0 };
  } catch (error) {
    console.error("Get reports error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Review a report (admin only)
 */
export async function reviewReport(
  reportId: string,
  decision: "investigating" | "action_taken" | "dismissed",
  options?: {
    reviewNotes?: string;
    actionTaken?: string;
    reporterMessage?: string;
    sendNotifications?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createAdminClient();

    // Check admin permission
    const { data: adminUser } = await supabase
      .from("user")
      .select("role, name")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role as UserRole, ACTIONS.MODERATE_COMMENTS)) {
      return { success: false, error: "You do not have permission to review reports" };
    }

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(`
        id,
        reporter_id,
        report_type,
        reported_user_id,
        reported_comment_id,
        reason,
        status
      `)
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return { success: false, error: "Report not found" };
    }

    // Type assertion for report data
    const reportData = report as unknown as Pick<ReportRow, 'id' | 'reporter_id' | 'report_type' | 'reported_user_id' | 'reported_comment_id' | 'reason' | 'status'>;

    // Update the report
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: decision,
        reviewed_by: session.user.id,
        review_notes: options?.reviewNotes?.trim() || null,
        action_taken: options?.actionTaken?.trim() || null,
        reporter_message: options?.reporterMessage?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("Failed to update report:", updateError);
      return { success: false, error: "Failed to update report" };
    }

    // Send notifications if enabled
    if (options?.sendNotifications !== false) {
      // Get reporter info
      const { data: reporter } = await supabase
        .from("user")
        .select("email, name")
        .eq("id", reportData.reporter_id)
        .single();

      // Send email to reporter about the outcome
      if (reporter?.email && (decision === "action_taken" || decision === "dismissed")) {
        const statusText = decision === "action_taken" ? "Action Taken" : "Dismissed";
        const actionMessage = options?.reporterMessage ||
          (decision === "action_taken"
            ? "We have reviewed your report and taken appropriate action."
            : "After review, we determined no action was necessary.");

        await sendEmail({
          to: reporter.email,
          subject: `Report Update: ${statusText}`,
          html: emailTemplates.reportOutcome({
            reporterName: reporter.name || "User",
            reportType: reportData.report_type,
            status: statusText,
            actionMessage,
          }),
        });
      }

      // If action was taken and it's a comment report, notify the comment author
      if (decision === "action_taken" && reportData.report_type === "comment" && reportData.reported_comment_id) {
        const { data: comment } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", reportData.reported_comment_id)
          .single();

        if (comment?.user_id) {
          const { data: commentAuthor } = await supabase
            .from("user")
            .select("email, name")
            .eq("id", comment.user_id)
            .single();

          if (commentAuthor?.email) {
            await sendEmail({
              to: commentAuthor.email,
              subject: "Your Comment Has Been Reviewed",
              html: emailTemplates.contentModerated({
                userName: commentAuthor.name || "User",
                contentType: "comment",
                reason: reportData.reason,
                actionTaken: options?.actionTaken || "Action taken",
              }),
            });
          }
        }
      }

      // If action was taken and it's a user report, notify the reported user
      if (decision === "action_taken" && reportData.report_type === "user" && reportData.reported_user_id) {
        const { data: reportedUser } = await supabase
          .from("user")
          .select("email, name")
          .eq("id", reportData.reported_user_id)
          .single();

        if (reportedUser?.email) {
          await sendEmail({
            to: reportedUser.email,
            subject: "Your Account Has Been Reviewed",
            html: emailTemplates.contentModerated({
              userName: reportedUser.name || "User",
              contentType: "account",
              reason: reportData.reason,
              actionTaken: options?.actionTaken || "Action taken",
            }),
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Review report error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get report statistics (admin only)
 */
export async function getReportStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    pending: number;
    investigating: number;
    actionTaken: number;
    dismissed: number;
    byType: { user: number; comment: number };
    byReason: Record<ReportReason, number>;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createAdminClient();

    // Check admin permission
    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role as UserRole, ACTIONS.MODERATE_COMMENTS)) {
      return { success: false, error: "You do not have permission to view report statistics" };
    }

    const { data, error } = await supabase.from("reports").select("status, report_type, reason");

    if (error) {
      console.error("Failed to get report stats:", error);
      return { success: false, error: "Failed to load statistics" };
    }

    interface StatsRow {
      status: string;
      report_type: string;
      reason: string;
    }

    const statsData = data as unknown as StatsRow[];
    const stats = {
      total: statsData.length,
      pending: statsData.filter((r: StatsRow) => r.status === "pending").length,
      investigating: statsData.filter((r: StatsRow) => r.status === "investigating").length,
      actionTaken: statsData.filter((r: StatsRow) => r.status === "action_taken").length,
      dismissed: statsData.filter((r: StatsRow) => r.status === "dismissed").length,
      byType: {
        user: statsData.filter((r: StatsRow) => r.report_type === "user").length,
        comment: statsData.filter((r: StatsRow) => r.report_type === "comment").length,
      },
      byReason: {
        spam: statsData.filter((r: StatsRow) => r.reason === "spam").length,
        harassment: statsData.filter((r: StatsRow) => r.reason === "harassment").length,
        hate_speech: statsData.filter((r: StatsRow) => r.reason === "hate_speech").length,
        misinformation: statsData.filter((r: StatsRow) => r.reason === "misinformation").length,
        inappropriate: statsData.filter((r: StatsRow) => r.reason === "inappropriate").length,
        other: statsData.filter((r: StatsRow) => r.reason === "other").length,
      },
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Get report stats error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
