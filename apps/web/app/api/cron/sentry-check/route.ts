/**
 * Sentry Error Check Cron Job
 *
 * Runs hourly to:
 * 1. Fetch new unresolved issues from Sentry
 * 2. Log the check result to sentry_check_logs
 * 3. Send admin notification if new errors are found
 *
 * Schedule: Every hour at minute 0 via Vercel Cron
 *
 * Endpoints:
 * - GET: Cron job trigger (requires CRON_SECRET)
 * - POST: Manual trigger for admins (requires admin session)
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, isValidRole } from "@/lib/roles";
import {
  fetchSentryIssues,
  getSentryStats,
  getNewIssuesSince,
  isSentryConfigured,
  type SentryIssue,
} from "@/lib/sentry-api";
import { notifyAdmins } from "@/lib/admin-notifications";

// ============================================
// Types
// ============================================

interface CheckResult {
  success: boolean;
  issuesFound: number;
  newIssues: number;
  errorCount: number;
  warningCount: number;
  fatalCount: number;
  notificationSent: boolean;
  notificationId: string | null;
  durationMs: number;
  error: string | null;
  timestamp: string;
}

// ============================================
// Core Logic
// ============================================

async function runSentryCheck(): Promise<CheckResult> {
  const startTime = Date.now();
  const result: CheckResult = {
    success: false,
    issuesFound: 0,
    newIssues: 0,
    errorCount: 0,
    warningCount: 0,
    fatalCount: 0,
    notificationSent: false,
    notificationId: null,
    durationMs: 0,
    error: null,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if Sentry is configured
    if (!isSentryConfigured()) {
      result.error = "Sentry is not configured";
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get last check timestamp
    const { data: lastCheck } = await supabase
      .from("sentry_check_logs")
      .select("checked_at")
      .order("checked_at", { ascending: false })
      .limit(1)
      .single();

    // Default to 1 hour ago if no previous check
    const lastCheckTime = lastCheck?.checked_at
      ? new Date(lastCheck.checked_at)
      : new Date(Date.now() - 60 * 60 * 1000);

    // Fetch stats and new issues in parallel
    const [stats, newIssues] = await Promise.all([
      getSentryStats("24h"),
      getNewIssuesSince(lastCheckTime),
    ]);

    result.issuesFound = stats.totalIssues;
    result.newIssues = newIssues.length;
    result.errorCount = stats.errorCount;
    result.warningCount = stats.warningCount;
    result.fatalCount = stats.fatalCount;

    // Send notification if there are new issues
    if (newIssues.length > 0) {
      const notification = await sendSentryNotification(supabase, newIssues);
      result.notificationSent = notification.sent;
      result.notificationId = notification.id;
    }

    // Log the check
    const { error: logError } = await supabase.from("sentry_check_logs").insert({
      checked_at: result.timestamp,
      issues_found: result.issuesFound,
      new_issues: result.newIssues,
      error_count: result.errorCount,
      warning_count: result.warningCount,
      fatal_count: result.fatalCount,
      notification_sent: result.notificationSent,
      notification_id: result.notificationId,
      duration_ms: Date.now() - startTime,
    });

    if (logError) {
      console.error("[Sentry Check] Error logging check:", logError);
    }

    result.success = true;
    result.durationMs = Date.now() - startTime;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    result.durationMs = Date.now() - startTime;

    // Log the failed check
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await createAdminClient()) as any;
      await supabase.from("sentry_check_logs").insert({
        checked_at: result.timestamp,
        issues_found: 0,
        new_issues: 0,
        error_count: 0,
        warning_count: 0,
        fatal_count: 0,
        notification_sent: false,
        error: result.error,
        duration_ms: result.durationMs,
      });
    } catch {
      console.error("[Sentry Check] Failed to log error");
    }

    return result;
  }
}

/**
 * Send admin notification about new Sentry issues
 */
async function sendSentryNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  newIssues: SentryIssue[]
): Promise<{ sent: boolean; id: string | null }> {
  try {
    const fatalCount = newIssues.filter((i) => i.level === "fatal").length;
    const errorCount = newIssues.filter((i) => i.level === "error").length;
    const warningCount = newIssues.filter((i) => i.level === "warning").length;

    // Build summary
    const parts: string[] = [];
    if (fatalCount > 0) parts.push(`💀 ${fatalCount} fatal`);
    if (errorCount > 0) parts.push(`🔴 ${errorCount} error${errorCount > 1 ? "s" : ""}`);
    if (warningCount > 0) parts.push(`🟡 ${warningCount} warning${warningCount > 1 ? "s" : ""}`);

    const summary = parts.join(", ") || `${newIssues.length} new issue${newIssues.length > 1 ? "s" : ""}`;

    // Get top issues (max 3) for the message
    const topIssues = newIssues.slice(0, 3);
    const issueList = topIssues
      .map((issue) => {
        const levelEmoji =
          issue.level === "fatal" ? "💀" : issue.level === "error" ? "🔴" : "🟡";
        return `• ${levelEmoji} <strong>${issue.shortId}</strong>: ${issue.title.substring(0, 60)}${issue.title.length > 60 ? "..." : ""}`;
      })
      .join("<br>");

    const moreIssues =
      newIssues.length > 3 ? `<br><br>...and ${newIssues.length - 3} more` : "";

    // Create admin notification record for tracking
    const { data: notificationRecord, error: notifError } = await supabase
      .from("admin_notifications")
      .insert({
        type: "sentry_errors",
        title: `New Sentry Issues: ${summary}`,
        message: `${issueList}${moreIssues}`,
        data: {
          newIssuesCount: newIssues.length,
          fatalCount,
          errorCount,
          warningCount,
          topIssueIds: topIssues.map((i) => i.id),
        },
      })
      .select("id")
      .single();

    if (notifError) {
      console.error("[Sentry Check] Error creating notification record:", notifError);
    }

    // Send in-app notification to admins
    await notifyAdmins({
      type: "new_user", // Reusing type for now
      title: `🔴 New Sentry Issues: ${summary}`,
      message: `New errors detected in the application:<br><br>${issueList}${moreIssues}<br><br>View and manage these issues in the Sentry dashboard.`,
      data: {
        sentryIssueCount: newIssues.length,
        fatalCount,
        errorCount,
        warningCount,
      },
    });

    return {
      sent: true,
      id: notificationRecord?.id || null,
    };
  } catch (error) {
    console.error("[Sentry Check] Error sending notification:", error);
    return { sent: false, id: null };
  }
}

// ============================================
// Route Handlers
// ============================================

// GET: Cron job trigger (requires CRON_SECRET)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSentryCheck();
    console.log("[Sentry Check] Cron completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Sentry Check] Cron error:", error);
    return NextResponse.json(
      { error: "Failed to run Sentry check" },
      { status: 500 }
    );
  }
}

// POST: Manual trigger for admins
export async function POST() {
  try {
    // Check for admin session
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require admin role
    const userRole = (session.user as { role?: string }).role || "user";
    if (!isValidRole(userRole) || !hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const result = await runSentryCheck();
    console.log(
      "[Sentry Check] Manual trigger by admin:",
      session.user.id,
      result
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Sentry Check] Manual trigger error:", error);
    return NextResponse.json(
      { error: "Failed to run Sentry check" },
      { status: 500 }
    );
  }
}
