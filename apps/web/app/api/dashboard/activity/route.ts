/**
 * Activity Feed API
 *
 * Aggregates activities from multiple sources:
 * - Security logs
 * - User sessions/logins
 * - Notifications sent
 * - Emails delivered
 * - Feedback submissions
 * - Comments
 * - Achievements unlocked
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

interface ActivityEntry {
  id: string;
  type: "security" | "user" | "notification" | "email" | "feedback" | "comment" | "achievement";
  action: string;
  description: string;
  timestamp: string;
  severity?: "info" | "warning" | "error" | "success";
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  target?: {
    type: string;
    id: string;
    label: string;
    url?: string;
  };
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication - admin/moderator only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const type = searchParams.get("type") as ActivityEntry["type"] | null;
    const offset = parseInt(searchParams.get("offset") || "0");

    const activities: ActivityEntry[] = [];

    // Fetch from different sources based on type filter
    if (!type || type === "security") {
      const securityLogs = await fetchSecurityLogs(limit, offset);
      activities.push(...securityLogs);
    }

    if (!type || type === "user") {
      const userActivities = await fetchUserActivities(limit, offset);
      activities.push(...userActivities);
    }

    if (!type || type === "notification") {
      const notifications = await fetchNotificationActivities(limit, offset);
      activities.push(...notifications);
    }

    if (!type || type === "feedback") {
      const feedback = await fetchFeedbackActivities(limit, offset);
      activities.push(...feedback);
    }

    if (!type || type === "comment") {
      const comments = await fetchCommentActivities(limit, offset);
      activities.push(...comments);
    }

    if (!type || type === "achievement") {
      const achievements = await fetchAchievementActivities(limit, offset);
      activities.push(...achievements);
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to requested count
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      total: activities.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Activity Feed Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// Fetch security logs
async function fetchSecurityLogs(limit: number, offset: number): Promise<ActivityEntry[]> {
  try {
    const result = await pool.query(
      `SELECT sl.*, u.name as user_name, u.email as user_email, u.image as user_image
       FROM security_logs sl
       LEFT JOIN "user" u ON sl.user_id = u.id
       ORDER BY sl.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      id: `security-${row.id}`,
      type: "security" as const,
      action: row.event_type || "event",
      description: formatSecurityDescription(row),
      timestamp: row.created_at,
      severity: getSeverity(row.severity, row.is_bot),
      user: row.user_id
        ? {
            id: row.user_id,
            name: row.user_name || "Unknown",
            email: row.user_email || "",
            image: row.user_image,
          }
        : undefined,
      metadata: {
        requestId: row.request_id,
        visitorId: row.visitor_id,
        ipAddress: row.ip_address,
        endpoint: row.endpoint,
        method: row.method,
        isBot: row.is_bot,
        botName: row.bot_name,
        honeypotServed: row.honeypot_served,
        statusCode: row.status_code,
        responseTime: row.response_time_ms,
      },
    }));
  } catch {
    return [];
  }
}

// Fetch user activities (sessions, signups)
async function fetchUserActivities(limit: number, offset: number): Promise<ActivityEntry[]> {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name, u.email, u.image, u.created_at as user_created_at
       FROM session s
       JOIN "user" u ON s.user_id = u.id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      id: `session-${row.id}`,
      type: "user" as const,
      action: "session_created",
      description: `User logged in: ${row.name || row.email}`,
      timestamp: row.created_at,
      severity: "success" as const,
      user: {
        id: row.user_id,
        name: row.name || "Unknown",
        email: row.email,
        image: row.image,
      },
      target: {
        type: "user",
        id: row.user_id,
        label: `View ${row.name || "User"}`,
        url: `/dashboard/users?id=${row.user_id}`,
      },
    }));
  } catch {
    return [];
  }
}

// Fetch notification activities
async function fetchNotificationActivities(limit: number, offset: number): Promise<ActivityEntry[]> {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name, u.email, u.image
       FROM notifications n
       JOIN "user" u ON n.user_id = u.id
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      id: `notification-${row.id}`,
      type: "notification" as const,
      action: "notification_sent",
      description: `${row.type}: ${row.title || "Notification sent"}`,
      timestamp: row.created_at,
      severity: "info" as const,
      user: {
        id: row.user_id,
        name: row.name || "Unknown",
        email: row.email,
        image: row.image,
      },
      target: {
        type: "notification",
        id: row.id,
        label: row.title || "View Notification",
        url: `/dashboard/notifications?id=${row.id}`,
      },
      metadata: {
        type: row.type,
        isRead: row.is_read,
        link: row.link,
      },
    }));
  } catch {
    return [];
  }
}

// Fetch feedback activities
async function fetchFeedbackActivities(limit: number, offset: number): Promise<ActivityEntry[]> {
  try {
    const result = await pool.query(
      `SELECT f.*, u.name, u.email, u.image
       FROM feedback f
       LEFT JOIN "user" u ON f.user_id = u.id
       ORDER BY f.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      id: `feedback-${row.id}`,
      type: "feedback" as const,
      action: "feedback_submitted",
      description: `${row.type}: ${(row.message as string)?.substring(0, 100) || "Feedback received"}...`,
      timestamp: row.created_at,
      severity: row.type === "bug" ? "warning" as const : "info" as const,
      user: row.user_id
        ? {
            id: row.user_id,
            name: row.name || "Anonymous",
            email: row.email || "",
            image: row.image,
          }
        : undefined,
      target: {
        type: "feedback",
        id: row.id,
        label: "View Feedback",
        url: `/dashboard/feedback?id=${row.id}`,
      },
      metadata: {
        type: row.type,
        rating: row.rating,
        status: row.status,
        page: row.page,
      },
    }));
  } catch {
    return [];
  }
}

// Fetch comment activities
async function fetchCommentActivities(limit: number, offset: number): Promise<ActivityEntry[]> {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name, u.email, u.image
       FROM comments c
       JOIN "user" u ON c.user_id = u.id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      id: `comment-${row.id}`,
      type: "comment" as const,
      action: "comment_posted",
      description: `Comment on ${row.page_slug}: "${(row.content as string)?.substring(0, 80)}..."`,
      timestamp: row.created_at,
      severity: "info" as const,
      user: {
        id: row.user_id,
        name: row.name || "Unknown",
        email: row.email,
        image: row.image,
      },
      target: {
        type: "comment",
        id: row.id,
        label: `View on ${row.page_slug}`,
        url: `/docs/${row.page_slug}#comment-${row.id}`,
      },
      metadata: {
        pageSlug: row.page_slug,
        likesCount: row.likes_count,
        isEdited: row.is_edited,
      },
    }));
  } catch {
    return [];
  }
}

// Fetch achievement activities
async function fetchAchievementActivities(limit: number, offset: number): Promise<ActivityEntry[]> {
  try {
    const result = await pool.query(
      `SELECT ua.*, u.name, u.email, u.image
       FROM user_achievements ua
       JOIN "user" u ON ua.user_id = u.id
       ORDER BY ua.unlocked_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      id: `achievement-${row.id}`,
      type: "achievement" as const,
      action: "achievement_unlocked",
      description: `Achievement unlocked: ${row.achievement_id}`,
      timestamp: row.unlocked_at,
      severity: "success" as const,
      user: {
        id: row.user_id,
        name: row.name || "Unknown",
        email: row.email,
        image: row.image,
      },
      target: {
        type: "user",
        id: row.user_id,
        label: `View ${row.name || "User"}'s Achievements`,
        url: `/dashboard/users?id=${row.user_id}&tab=achievements`,
      },
      metadata: {
        achievementId: row.achievement_id,
        progress: row.progress,
      },
    }));
  } catch {
    return [];
  }
}

// Helper functions
function formatSecurityDescription(row: Record<string, unknown>): string {
  const eventType = row.event_type as string;
  const endpoint = row.endpoint as string;
  const isBot = row.is_bot as boolean;
  const botName = row.bot_name as string;

  if (isBot) {
    return `Bot detected: ${botName || "Unknown"} accessing ${endpoint || "unknown endpoint"}`;
  }

  switch (eventType) {
    case "request":
      return `${row.method || "GET"} request to ${endpoint || "/"}`;
    case "bot_detected":
      return `Bot ${botName || "Unknown"} detected`;
    case "honeypot_served":
      return `Honeypot response served for ${endpoint}`;
    case "rate_limited":
      return `Rate limit triggered for ${row.ip_address || "unknown IP"}`;
    case "blocked":
      return `Visitor blocked: ${(row.visitor_id as string)?.substring(0, 8) || row.ip_address}`;
    default:
      return `Security event: ${eventType}`;
  }
}

function getSeverity(severity: string, isBot: boolean): "info" | "warning" | "error" | "success" {
  if (severity === "error" || severity === "critical") return "error";
  if (severity === "warning") return "warning";
  if (isBot) return "warning";
  return "info";
}
