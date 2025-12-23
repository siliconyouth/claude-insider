/**
 * Digest Email Cron API Route
 *
 * Sends activity digest emails to users based on their frequency preference.
 * Should be called by a cron job:
 * - Daily at 9 AM UTC
 * - Weekly on Mondays at 9 AM UTC
 * - Monthly on the 1st at 9 AM UTC
 *
 * @example
 * POST /api/cron/send-digests
 * Headers: { "Authorization": "Bearer <CRON_SECRET>" }
 * Body: { "frequency": "daily" | "weekly" | "monthly" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendDigestEmail, type DigestEmailParams } from "@/lib/email";

// Verify cron secret to prevent unauthorized calls
 
const CRON_SECRET = process.env.CRON_SECRET;

interface DigestRequest {
  frequency: "daily" | "weekly" | "monthly";
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as DigestRequest;
    const { frequency } = body;

    if (!["daily", "weekly", "monthly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency. Must be daily, weekly, or monthly." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get users who have this digest frequency enabled
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("email_digest", true)
      .eq("email_digest_frequency", frequency);

    if (prefsError) {
      console.error("[Digest] Error fetching preferences:", prefsError);
      return NextResponse.json(
        { error: "Failed to fetch user preferences" },
        { status: 500 }
      );
    }

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with this digest frequency",
        sent: 0,
      });
    }

    // Calculate date range based on frequency
    const now = new Date();
    const startDate = new Date(now);

    switch (frequency) {
      case "daily":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "weekly":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const period = formatPeriod(startDate, now, frequency);
    let sent = 0;
    let failed = 0;

    // Process each user
    for (const pref of preferences) {
      const userId = pref.user_id;

      try {
        // Get user details
        const { data: user } = await supabase
          .from("user")
          .select("email, name")
          .eq("id", userId)
          .single();

        if (!user?.email) continue;

        // Get notifications for this period
        const { data: notifications } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false })
          .limit(50);

        // Calculate stats
        const stats = {
          newComments: 0,
          newReplies: 0,
          newFollowers: 0,
          newMentions: 0,
          suggestionsUpdated: 0,
        };

        const highlights: DigestEmailParams["highlights"] = [];

        for (const notif of notifications || []) {
          switch (notif.type) {
            case "comment":
              stats.newComments++;
              break;
            case "reply":
              stats.newReplies++;
              break;
            case "follow":
              stats.newFollowers++;
              break;
            case "mention":
              stats.newMentions++;
              break;
            case "suggestion_approved":
            case "suggestion_rejected":
            case "suggestion_merged":
              stats.suggestionsUpdated++;
              break;
          }

          // Add to highlights (first 5)
          if (highlights.length < 5) {
            highlights.push({
              type: mapNotificationType(notif.type),
              title: notif.title,
              message: notif.message || "",
              timestamp: notif.created_at,
            });
          }
        }

        // Skip if no activity
        const totalActivity =
          stats.newComments +
          stats.newReplies +
          stats.newFollowers +
          stats.newMentions +
          stats.suggestionsUpdated;

        // Send digest even with no activity (shows "no activity" message)
        // Users can unsubscribe if they don't want empty digests
        const result = await sendDigestEmail({
          email: user.email,
          userName: user.name || undefined,
          frequency,
          period,
          stats,
          highlights,
        });

        if (result.success) {
          sent++;
          console.log(`[Digest] Sent ${frequency} digest to ${user.email} (${totalActivity} items)`);
        } else {
          failed++;
          console.error(`[Digest] Failed to send to ${user.email}:`, result.error);
        }
      } catch (userError) {
        failed++;
        console.error(`[Digest] Error processing user ${userId}:`, userError);
      }
    }

    return NextResponse.json({
      success: true,
      frequency,
      period,
      totalUsers: preferences.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("[Digest] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Format period string based on frequency
 */
function formatPeriod(
  start: Date,
  end: Date,
  frequency: "daily" | "weekly" | "monthly"
): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", {
    ...options,
    year: "numeric",
  });

  if (frequency === "daily") {
    return startStr + ", " + end.getFullYear();
  }

  return `${startStr} - ${endStr}`;
}

/**
 * Map notification type to digest highlight type
 */
function mapNotificationType(
  type: string
): DigestEmailParams["highlights"][0]["type"] {
  switch (type) {
    case "comment":
      return "comment";
    case "reply":
      return "reply";
    case "follow":
      return "follow";
    case "mention":
      return "mention";
    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      return "suggestion";
    default:
      return "comment";
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  // Get frequency from query params for Vercel cron
  const frequency = request.nextUrl.searchParams.get("frequency") as
    | "daily"
    | "weekly"
    | "monthly"
    | null;

  if (!frequency) {
    return NextResponse.json(
      { error: "Missing frequency parameter" },
      { status: 400 }
    );
  }

  // Create a new request with the body
  const newRequest = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ frequency }),
  });

  return POST(newRequest);
}
