/**
 * Sentry Issue Detail API
 *
 * Provides admin-only access to individual Sentry issues:
 * - GET: Fetch issue details with latest event (stack trace)
 * - PATCH: Update issue status (resolve, ignore, unresolve)
 *
 * @see https://docs.sentry.io/api/events/retrieve-an-issue/
 * @see https://docs.sentry.io/api/events/update-an-issue/
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  fetchSentryIssue,
  fetchSentryIssueLatestEvent,
  updateSentryIssue,
  isSentryConfigured,
  type SentryIssueStatus,
} from "@/lib/sentry-api";

interface RouteContext {
  params: Promise<{ issueId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check if Sentry is configured
    if (!isSentryConfigured()) {
      return NextResponse.json(
        { error: "Sentry is not configured. Missing environment variables." },
        { status: 503 }
      );
    }

    // Verify authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { issueId } = await context.params;

    if (!issueId) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    // Fetch issue details and latest event in parallel
    const [issue, latestEvent] = await Promise.all([
      fetchSentryIssue(issueId),
      fetchSentryIssueLatestEvent(issueId).catch(() => null),
    ]);

    return NextResponse.json({
      issue,
      latestEvent,
    });
  } catch (error) {
    console.error("[Sentry API] Error fetching issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch Sentry issue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Check if Sentry is configured
    if (!isSentryConfigured()) {
      return NextResponse.json(
        { error: "Sentry is not configured. Missing environment variables." },
        { status: 503 }
      );
    }

    // Verify authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { issueId } = await context.params;

    if (!issueId) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body as { status: SentryIssueStatus };

    if (!status || !["resolved", "unresolved", "ignored"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (resolved, unresolved, ignored)" },
        { status: 400 }
      );
    }

    // Update issue status
    const updatedIssue = await updateSentryIssue(issueId, status);

    return NextResponse.json({
      issue: updatedIssue,
      message: `Issue marked as ${status}`,
    });
  } catch (error) {
    console.error("[Sentry API] Error updating issue:", error);
    return NextResponse.json(
      { error: "Failed to update Sentry issue" },
      { status: 500 }
    );
  }
}
