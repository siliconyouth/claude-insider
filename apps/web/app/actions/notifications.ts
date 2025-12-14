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

export type NotificationType =
  | "comment"
  | "reply"
  | "suggestion_approved"
  | "suggestion_rejected"
  | "suggestion_merged"
  | "follow"
  | "mention"
  | "welcome"
  | "system";

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
  email_comments: boolean;
  email_replies: boolean;
  email_suggestions: boolean;
  email_follows: boolean;
  email_digest: boolean;
  email_digest_frequency: "daily" | "weekly" | "monthly";
}

const defaultPreferences: NotificationPreferences = {
  in_app_comments: true,
  in_app_replies: true,
  in_app_suggestions: true,
  in_app_follows: true,
  in_app_mentions: true,
  email_comments: false,
  email_replies: true,
  email_suggestions: true,
  email_follows: false,
  email_digest: false,
  email_digest_frequency: "weekly",
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
 * Reads from the profiles.notification_preferences JSON column.
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

    const supabase = await createAdminClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[Notifications] Preferences fetch error:", error);
      return { error: "Failed to load preferences" };
    }

    // Parse the JSON preferences or use defaults
    const prefs = profile?.notification_preferences as NotificationPreferences | null;

    return {
      data: prefs
        ? {
            in_app_comments: prefs.in_app_comments ?? defaultPreferences.in_app_comments,
            in_app_replies: prefs.in_app_replies ?? defaultPreferences.in_app_replies,
            in_app_suggestions: prefs.in_app_suggestions ?? defaultPreferences.in_app_suggestions,
            in_app_follows: prefs.in_app_follows ?? defaultPreferences.in_app_follows,
            in_app_mentions: prefs.in_app_mentions ?? defaultPreferences.in_app_mentions,
            email_comments: prefs.email_comments ?? defaultPreferences.email_comments,
            email_replies: prefs.email_replies ?? defaultPreferences.email_replies,
            email_suggestions: prefs.email_suggestions ?? defaultPreferences.email_suggestions,
            email_follows: prefs.email_follows ?? defaultPreferences.email_follows,
            email_digest: prefs.email_digest ?? defaultPreferences.email_digest,
            email_digest_frequency: prefs.email_digest_frequency ?? defaultPreferences.email_digest_frequency,
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
 * Uses the profiles.notification_preferences JSON column to store preferences.
 * This is more reliable than a separate table and matches the existing schema.
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

    const supabase = await createAdminClient();

    // Get current preferences from profiles table
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", session.user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[Notifications] Fetch error:", fetchError);
      return { error: "Failed to load preferences" };
    }

    // Merge current preferences with new ones
    const currentPrefs = (profile?.notification_preferences as NotificationPreferences) || defaultPreferences;
    const updatedPrefs = { ...currentPrefs, ...preferences };

    // Update profiles table with merged preferences
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        notification_preferences: updatedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (updateError) {
      console.error("[Notifications] Update error:", updateError);
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

    // Get user data for email notifications
    const { data: user } = await supabase
      .from("user")
      .select("email, name")
      .eq("id", params.userId)
      .single();

    // Get actor data for email subject line
    let actorName: string | undefined;
    if (params.actorId) {
      const { data: actor } = await supabase
        .from("user")
        .select("name, username")
        .eq("id", params.actorId)
        .single();
      actorName = actor?.name || actor?.username;
    }

    // Check user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", params.userId)
      .single();

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
            actionUrl: getActionUrl(params.resourceType, params.resourceId),
          });
        } catch (emailError) {
          console.error("[Notifications] Email send error:", emailError);
          // Don't fail the notification if email fails
        }
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
    default:
      return "email_comments"; // Default fallback
  }
}

/**
 * Get action URL based on resource type
 */
function getActionUrl(resourceType?: string, resourceId?: string): string | undefined {
  if (!resourceType || !resourceId) return undefined;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

  switch (resourceType) {
    case "resource":
      return `${baseUrl}/resources`;
    case "doc":
      return `${baseUrl}/docs`;
    case "suggestion":
      return `${baseUrl}/suggestions`;
    default:
      return `${baseUrl}/notifications`;
  }
}
