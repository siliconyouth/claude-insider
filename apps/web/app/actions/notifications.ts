"use server";

/**
 * Notifications Server Actions
 *
 * Handle notification operations including fetching, creating,
 * and marking notifications as read.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendNotificationEmail, type NotificationEmailParams } from "@/lib/email";
import { sendPushNotificationToUser, isWebPushConfigured } from "@/lib/web-push";

export type NotificationType =
  | "comment"
  | "reply"
  | "suggestion_approved"
  | "suggestion_rejected"
  | "suggestion_merged"
  | "follow"
  | "mention"
  | "welcome"
  | "system"
  | "admin_notification"
  | "version_update";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
  actor_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  // Joined data
  actor?: {
    name: string;
    username: string | null;
    image: string | null;
  };
}

export interface NotificationPreferences {
  in_app_comments: boolean;
  in_app_replies: boolean;
  in_app_suggestions: boolean;
  in_app_follows: boolean;
  in_app_mentions: boolean;
  in_app_version_updates: boolean;
  email_comments: boolean;
  email_replies: boolean;
  email_suggestions: boolean;
  email_follows: boolean;
  email_version_updates: boolean;
  email_digest: boolean;
  email_digest_frequency: "daily" | "weekly" | "monthly";
  browser_notifications: boolean;
}

const defaultPreferences: NotificationPreferences = {
  in_app_comments: true,
  in_app_replies: true,
  in_app_suggestions: true,
  in_app_follows: true,
  in_app_mentions: true,
  in_app_version_updates: true,
  email_comments: false,
  email_replies: true,
  email_suggestions: true,
  email_follows: false,
  email_version_updates: false,
  email_digest: false,
  email_digest_frequency: "weekly",
  browser_notifications: false,
};

/**
 * Get notifications for the current user
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<{
  data?: Notification[];
  unreadCount?: number;
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        actor:actor_id (
          name,
          username,
          image
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("[Notifications] Fetch error:", error);
      return { error: "Failed to load notifications" };
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("read", false);

    return {
      data: data || [],
      unreadCount: unreadCount || 0,
      total: count || 0,
    };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{
  count?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { count: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("read", false);

    if (error) {
      console.error("[Notifications] Count error:", error);
      return { count: 0 };
    }

    return { count: count || 0 };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { count: 0 };
  }
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds?: string[]): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    let query = supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("read", false);

    if (notificationIds && notificationIds.length > 0) {
      query = query.in("id", notificationIds);
    }

    const { error } = await query;

    if (error) {
      console.error("[Notifications] Mark read error:", error);
      return { error: "Failed to mark notifications as read" };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("[Notifications] Delete error:", error);
      return { error: "Failed to delete notification" };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead(): Promise<{
  success?: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", session.user.id)
      .eq("read", true)
      .select("id");

    if (error) {
      console.error("[Notifications] Delete all read error:", error);
      return { error: "Failed to delete notifications" };
    }

    revalidatePath("/notifications");
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get notification preferences
 *
 * Reads from the notification_preferences table.
 */
export async function getNotificationPreferences(): Promise<{
  data?: NotificationPreferences;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("[Notifications] Preferences fetch error:", error);
      return { error: "Failed to load preferences" };
    }

    return {
      data: data
        ? {
            in_app_comments: data.in_app_comments ?? defaultPreferences.in_app_comments,
            in_app_replies: data.in_app_replies ?? defaultPreferences.in_app_replies,
            in_app_suggestions: data.in_app_suggestions ?? defaultPreferences.in_app_suggestions,
            in_app_follows: data.in_app_follows ?? defaultPreferences.in_app_follows,
            in_app_mentions: data.in_app_mentions ?? defaultPreferences.in_app_mentions,
            in_app_version_updates: data.in_app_version_updates ?? defaultPreferences.in_app_version_updates,
            email_comments: data.email_comments ?? defaultPreferences.email_comments,
            email_replies: data.email_replies ?? defaultPreferences.email_replies,
            email_suggestions: data.email_suggestions ?? defaultPreferences.email_suggestions,
            email_follows: data.email_follows ?? defaultPreferences.email_follows,
            email_version_updates: data.email_version_updates ?? defaultPreferences.email_version_updates,
            email_digest: data.email_digest ?? defaultPreferences.email_digest,
            email_digest_frequency: data.email_digest_frequency ?? defaultPreferences.email_digest_frequency,
            browser_notifications: data.browser_notifications ?? defaultPreferences.browser_notifications,
          }
        : defaultPreferences,
    };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update notification preferences
 *
 * Uses the notification_preferences table with upsert.
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if row exists
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    let error;

    if (existing) {
      // Update existing row
      const result = await supabase
        .from("notification_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id);
      error = result.error;
    } else {
      // Insert new row with defaults + provided preferences
      const result = await supabase.from("notification_preferences").insert({
        user_id: session.user.id,
        ...defaultPreferences,
        ...preferences,
      });
      error = result.error;
    }

    if (error) {
      console.error("[Notifications] Preferences update error:", error);
      return { error: "Failed to update preferences" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Create a notification (internal use)
 * This is called by other actions when events occur
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
}): Promise<{ id?: string; error?: string }> {
  try {
    // Don't notify yourself
    if (params.userId === params.actorId) {
      return { id: undefined };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Run all queries in parallel for ~3x faster execution
    // These queries are independent and don't depend on each other's results
    const [userResult, actorResult, prefsResult] = await Promise.all([
      // Get user data for email notifications
      supabase.from("user").select("email, name").eq("id", params.userId).single(),
      // Get actor data for email subject line (skip if no actorId)
      params.actorId
        ? supabase.from("user").select("name, username").eq("id", params.actorId).single()
        : Promise.resolve({ data: null }),
      // Check user preferences
      supabase.from("notification_preferences").select("*").eq("user_id", params.userId).single(),
    ]);

    const user = userResult.data;
    const actorName = actorResult.data?.name || actorResult.data?.username;
    const prefs = prefsResult.data;

    // Check if in-app notification type is enabled
    const inAppPrefKey = getInAppPrefKey(params.type);
    const inAppEnabled = prefs ? prefs[inAppPrefKey] !== false : true;

    // Check if email notification type is enabled
    const emailPrefKey = getEmailPrefKey(params.type);
    const emailEnabled = prefs ? prefs[emailPrefKey] === true : false;

    // If neither is enabled, skip
    if (!inAppEnabled && !emailEnabled) {
      return { id: undefined };
    }

    let notificationId: string | undefined;

    // Create in-app notification if enabled
    if (inAppEnabled) {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message || null,
          data: params.data || {},
          actor_id: params.actorId || null,
          resource_type: params.resourceType || null,
          resource_id: params.resourceId || null,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[Notifications] Create error:", error);
        return { error: "Failed to create notification" };
      }

      notificationId = data.id;
    }

    // Send email notification if enabled and user has email
    if (emailEnabled && user?.email) {
      const emailType = params.type as NotificationEmailParams["type"];

      // Only send for supported email types
      if (["reply", "comment", "suggestion_approved", "suggestion_rejected", "suggestion_merged", "follow", "mention"].includes(params.type)) {
        try {
          await sendNotificationEmail({
            email: user.email,
            userName: user.name || undefined,
            type: emailType,
            title: params.title,
            message: params.message || params.title,
            actorName,
            actionUrl: getActionUrl(params.resourceType, params.resourceId, params.data),
          });
        } catch (emailError) {
          console.error("[Notifications] Email send error:", emailError);
          // Don't fail the notification if email fails
        }
      }
    }

    // Send push notification if browser notifications are enabled
    // This allows users to receive notifications even when not on the website
    const browserNotifsEnabled = prefs ? prefs.browser_notifications === true : false;
    if (browserNotifsEnabled && isWebPushConfigured()) {
      try {
        const pushUrl = getActionUrl(params.resourceType, params.resourceId, params.data) || "/notifications";

        await sendPushNotificationToUser(params.userId, {
          title: "Claude Insider",
          body: params.title,
          url: pushUrl,
          tag: notificationId ? `notification-${notificationId}` : `notification-${Date.now()}`,
          data: {
            notificationId,
            type: params.type,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
          },
        });
      } catch (pushError) {
        console.error("[Notifications] Push notification error:", pushError);
        // Don't fail the notification if push fails
      }
    }

    return { id: notificationId };
  } catch (error) {
    console.error("[Notifications] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get in-app preference key for notification type
 */
function getInAppPrefKey(type: NotificationType): keyof NotificationPreferences {
  switch (type) {
    case "comment":
      return "in_app_comments";
    case "reply":
      return "in_app_replies";
    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      return "in_app_suggestions";
    case "follow":
      return "in_app_follows";
    case "mention":
      return "in_app_mentions";
    case "version_update":
      return "in_app_version_updates";
    default:
      return "in_app_comments"; // Default fallback
  }
}

/**
 * Get email preference key for notification type
 */
function getEmailPrefKey(type: NotificationType): keyof NotificationPreferences {
  switch (type) {
    case "comment":
      return "email_comments";
    case "reply":
      return "email_replies";
    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      return "email_suggestions";
    case "follow":
      return "email_follows";
    case "version_update":
      return "email_version_updates";
    default:
      return "email_comments"; // Default fallback
  }
}

/**
 * Get action URL based on resource type
 *
 * Best practice: Deep link to the specific content where the action occurred,
 * rather than generic list pages. This provides better UX as users can
 * immediately see what they were notified about.
 */
function getActionUrl(
  resourceType?: string,
  resourceId?: string,
  data?: Record<string, unknown>
): string | undefined {
  if (!resourceType) return undefined;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

  switch (resourceType) {
    case "resource":
      // Link to specific resource if ID available
      return resourceId ? `${baseUrl}/resources#${resourceId}` : `${baseUrl}/resources`;

    case "doc":
      // Link to specific doc page - resourceId should be the doc slug
      return resourceId ? `${baseUrl}/docs/${resourceId}` : `${baseUrl}/docs`;

    case "suggestion":
      // Link to user's suggestions page - they can see their suggestion status there
      return `${baseUrl}/profile/suggestions`;

    case "user":
      // For follow notifications, link to the actor's profile
      // The username should be passed in data if available
      if (data?.actorUsername) {
        return `${baseUrl}/users/${data.actorUsername}`;
      }
      return `${baseUrl}/notifications`;

    case "achievement":
      // Link to profile achievements section
      return `${baseUrl}/profile#achievements`;

    case "comment":
      // Link to the content where the comment was made
      if (data?.docSlug) {
        return `${baseUrl}/docs/${data.docSlug}#comments`;
      }
      return `${baseUrl}/notifications`;

    default:
      return `${baseUrl}/notifications`;
  }
}

/**
 * Send test notifications to verify all notification channels are working
 *
 * Sends:
 * 1. In-app notification (always)
 * 2. Push notification (if browser_notifications enabled)
 * 3. Email notification (if email preferences enabled)
 */
export async function sendTestNotifications(): Promise<{
  results: {
    inApp: { success: boolean; error?: string };
    push: { success: boolean; error?: string; sent?: number };
    email: { success: boolean; error?: string };
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return {
        results: {
          inApp: { success: false, error: "Not authenticated" },
          push: { success: false, error: "Not authenticated" },
          email: { success: false, error: "Not authenticated" },
        },
        error: "You must be signed in",
      };
    }

    const userId = session.user.id;
    const results = {
      inApp: { success: false } as { success: boolean; error?: string },
      push: { success: false, sent: 0 } as { success: boolean; error?: string; sent?: number },
      email: { success: false } as { success: boolean; error?: string },
    };

    // Get user info and preferences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: user } = await supabase
      .from("user")
      .select("email, name")
      .eq("id", userId)
      .single();

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const testTime = new Date().toLocaleTimeString();

    // 1. In-App Notification (always send)
    try {
      const { error: insertError } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "system",
        title: `Test notification sent at ${testTime}`,
        message: "This is a test notification to verify your notification settings are working correctly.",
        data: { test: true, timestamp: Date.now() },
        read: false,
        resource_type: "system",
      });

      if (insertError) {
        results.inApp = { success: false, error: insertError.message };
      } else {
        results.inApp = { success: true };
      }
    } catch (err) {
      results.inApp = { success: false, error: String(err) };
    }

    // 2. Push Notification (if enabled)
    const browserNotifsEnabled = prefs?.browser_notifications === true;
    if (browserNotifsEnabled && isWebPushConfigured()) {
      try {
        const pushResult = await sendPushNotificationToUser(userId, {
          title: "Test Push Notification",
          body: `Push test sent at ${testTime}. If you see this, push notifications are working!`,
          url: "/settings",
          tag: `test-${Date.now()}`,
        });

        if (pushResult.sent > 0) {
          results.push = { success: true, sent: pushResult.sent };
        } else if (pushResult.failed > 0) {
          results.push = { success: false, error: `Failed to send to ${pushResult.failed} device(s)`, sent: 0 };
        } else {
          results.push = { success: false, error: "No push subscriptions found. Re-enable browser notifications.", sent: 0 };
        }
      } catch (err) {
        results.push = { success: false, error: String(err), sent: 0 };
      }
    } else if (!browserNotifsEnabled) {
      results.push = { success: false, error: "Browser notifications disabled in preferences", sent: 0 };
    } else {
      results.push = { success: false, error: "Push notifications not configured on server", sent: 0 };
    }

    // 3. Email Notification (if any email pref is enabled)
    const anyEmailEnabled = prefs?.email_comments || prefs?.email_replies || prefs?.email_suggestions || prefs?.email_follows || prefs?.email_version_updates;
    if (anyEmailEnabled && user?.email) {
      try {
        await sendNotificationEmail({
          email: user.email,
          userName: user.name || undefined,
          type: "comment", // Use comment type for test
          title: "Test Email Notification",
          message: `This is a test email sent at ${testTime} to verify your email notification settings are working correctly.`,
          actorName: "Claude Insider",
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com"}/settings`,
        });
        results.email = { success: true };
      } catch (err) {
        results.email = { success: false, error: String(err) };
      }
    } else if (!user?.email) {
      results.email = { success: false, error: "No email address on account" };
    } else {
      results.email = { success: false, error: "All email notifications disabled in preferences" };
    }

    revalidatePath("/notifications");

    return { results };
  } catch (error) {
    console.error("[Notifications] Test notification error:", error);
    return {
      results: {
        inApp: { success: false, error: "Unexpected error" },
        push: { success: false, error: "Unexpected error" },
        email: { success: false, error: "Unexpected error" },
      },
      error: "An unexpected error occurred",
    };
  }
}
