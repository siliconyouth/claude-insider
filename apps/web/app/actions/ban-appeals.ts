"use server";

/**
 * Ban Appeals Server Actions
 *
 * Handle user ban appeals - submission, review, approval, and rejection.
 * Also handles banning/unbanning users with email notifications.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { canPerformAction, ACTIONS } from "@/lib/roles";

const APP_NAME = "Claude Insider";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

// ============================================
// Types
// ============================================

export interface BanAppeal {
  id: string;
  userId: string;
  reason: string;
  additionalContext?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewNotes?: string;
  responseMessage?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Joined user data
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
    banReason?: string;
    bannedAt?: string;
  };
  // Joined reviewer data
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BannedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
  bannedByName?: string;
  appealCount: number;
  latestAppealStatus?: "pending" | "approved" | "rejected";
}

// ============================================
// User-facing Actions (Submit Appeals)
// ============================================

/**
 * Check if current user is banned
 */
export async function checkBanStatus(): Promise<{
  banned?: boolean;
  banReason?: string;
  bannedAt?: string;
  canAppeal?: boolean;
  pendingAppeal?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: user, error } = await supabase
      .from("user")
      .select("banned, banReason, bannedAt")
      .eq("id", session.user.id)
      .single();

    if (error) {
      return { error: "Failed to check ban status" };
    }

    if (!user?.banned) {
      return { banned: false };
    }

    // Check if user has a pending appeal
    const { data: pendingAppeal } = await supabase
      .from("ban_appeals")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "pending")
      .limit(1);

    return {
      banned: true,
      banReason: user.banReason,
      bannedAt: user.bannedAt,
      canAppeal: true,
      pendingAppeal: pendingAppeal && pendingAppeal.length > 0,
    };
  } catch (error) {
    console.error("[BanAppeals] Check status error:", error);
    return { error: "Failed to check ban status" };
  }
}

/**
 * Submit a new ban appeal
 */
export async function submitBanAppeal(
  reason: string,
  additionalContext?: string
): Promise<{
  success?: boolean;
  appealId?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (!reason || reason.trim().length < 20) {
      return { error: "Please provide a detailed reason (at least 20 characters)" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Verify user is actually banned
    const { data: user } = await supabase
      .from("user")
      .select("banned, email, name")
      .eq("id", session.user.id)
      .single();

    if (!user?.banned) {
      return { error: "Your account is not banned" };
    }

    // Create the appeal
    const { data: appeal, error: insertError } = await supabase
      .from("ban_appeals")
      .insert({
        user_id: session.user.id,
        reason: reason.trim(),
        additional_context: additionalContext?.trim() || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[BanAppeals] Insert error:", insertError);
      return { error: "Failed to submit appeal" };
    }

    // Send confirmation email to user
    await sendEmail({
      to: user.email,
      subject: `Appeal Received - ${APP_NAME}`,
      html: getAppealReceivedEmailHtml(user.name),
    });

    return { success: true, appealId: appeal.id };
  } catch (error) {
    console.error("[BanAppeals] Submit error:", error);
    return { error: "Failed to submit appeal" };
  }
}

/**
 * Add additional information to an existing appeal
 */
export async function addAppealContext(
  appealId: string,
  additionalContext: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (!additionalContext || additionalContext.trim().length < 10) {
      return { error: "Please provide more detail (at least 10 characters)" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get the appeal and verify ownership
    const { data: appeal, error: fetchError } = await supabase
      .from("ban_appeals")
      .select("id, user_id, status, additional_context")
      .eq("id", appealId)
      .single();

    if (fetchError || !appeal) {
      return { error: "Appeal not found" };
    }

    if (appeal.user_id !== session.user.id) {
      return { error: "You can only update your own appeals" };
    }

    if (appeal.status !== "pending") {
      return { error: "This appeal has already been reviewed" };
    }

    // Append to additional context
    const existingContext = appeal.additional_context || "";
    const timestamp = new Date().toISOString();
    const newContext = existingContext
      ? `${existingContext}\n\n--- Additional Information (${timestamp}) ---\n${additionalContext.trim()}`
      : additionalContext.trim();

    const { error: updateError } = await supabase
      .from("ban_appeals")
      .update({ additional_context: newContext })
      .eq("id", appealId);

    if (updateError) {
      return { error: "Failed to update appeal" };
    }

    return { success: true };
  } catch (error) {
    console.error("[BanAppeals] Add context error:", error);
    return { error: "Failed to update appeal" };
  }
}

/**
 * Get user's own appeals
 */
export async function getMyAppeals(): Promise<{
  appeals?: BanAppeal[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: appeals, error } = await supabase
      .from("ban_appeals")
      .select(`
        id,
        user_id,
        reason,
        additional_context,
        status,
        response_message,
        reviewed_at,
        created_at,
        updated_at
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { error: "Failed to fetch appeals" };
    }

    return {
      appeals: appeals.map((a: Record<string, unknown>) => ({
        id: a.id,
        userId: a.user_id,
        reason: a.reason,
        additionalContext: a.additional_context,
        status: a.status,
        responseMessage: a.response_message,
        reviewedAt: a.reviewed_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
    };
  } catch (error) {
    console.error("[BanAppeals] Get my appeals error:", error);
    return { error: "Failed to fetch appeals" };
  }
}

// ============================================
// Admin Actions
// ============================================

/**
 * Ban a user (admin only)
 */
export async function banUser(
  userId: string,
  reason: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // Check admin permission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role, ACTIONS.BAN_USERS)) {
      return { error: "You don't have permission to ban users" };
    }

    if (!reason || reason.trim().length < 5) {
      return { error: "Please provide a ban reason" };
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from("user")
      .select("id, email, name, role, banned")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return { error: "User not found" };
    }

    if (targetUser.banned) {
      return { error: "User is already banned" };
    }

    // Can't ban admins
    if (targetUser.role === "admin") {
      return { error: "Cannot ban admin users" };
    }

    // Ban the user
    const { error: banError } = await supabase
      .from("user")
      .update({
        banned: true,
        banReason: reason.trim(),
        bannedAt: new Date().toISOString(),
        bannedBy: session.user.id,
      })
      .eq("id", userId);

    if (banError) {
      console.error("[BanAppeals] Ban error:", banError);
      return { error: "Failed to ban user" };
    }

    // Log the ban action
    await supabase.from("ban_history").insert({
      user_id: userId,
      action: "banned",
      reason: reason.trim(),
      performed_by: session.user.id,
    });

    // Also log to admin_logs if table exists
    await supabase.from("admin_logs").insert({
      admin_id: session.user.id,
      action: "ban_user",
      target_type: "user",
      target_id: userId,
      details: { reason: reason.trim() },
    }).catch(() => {});

    // Send ban notification email
    await sendEmail({
      to: targetUser.email,
      subject: `Account Suspended - ${APP_NAME}`,
      html: getBanNotificationEmailHtml(targetUser.name, reason.trim()),
    });

    return { success: true };
  } catch (error) {
    console.error("[BanAppeals] Ban user error:", error);
    return { error: "Failed to ban user" };
  }
}

/**
 * Unban a user (admin only)
 */
export async function unbanUser(
  userId: string,
  reason?: string
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

    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role, ACTIONS.BAN_USERS)) {
      return { error: "You don't have permission to unban users" };
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from("user")
      .select("id, email, name, banned")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return { error: "User not found" };
    }

    if (!targetUser.banned) {
      return { error: "User is not banned" };
    }

    // Unban the user
    const { error: unbanError } = await supabase
      .from("user")
      .update({
        banned: false,
        banReason: null,
        bannedAt: null,
        bannedBy: null,
      })
      .eq("id", userId);

    if (unbanError) {
      console.error("[BanAppeals] Unban error:", unbanError);
      return { error: "Failed to unban user" };
    }

    // Log the unban action
    await supabase.from("ban_history").insert({
      user_id: userId,
      action: "unbanned",
      reason: reason || "Admin decision",
      performed_by: session.user.id,
    });

    // Send unban notification email
    await sendEmail({
      to: targetUser.email,
      subject: `Account Reinstated - ${APP_NAME}`,
      html: getUnbanNotificationEmailHtml(targetUser.name),
    });

    return { success: true };
  } catch (error) {
    console.error("[BanAppeals] Unban user error:", error);
    return { error: "Failed to unban user" };
  }
}

/**
 * Get list of banned users (admin only)
 */
export async function getBannedUsers(options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  users?: BannedUser[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role, ACTIONS.BAN_USERS)) {
      return { error: "You don't have permission to view banned users" };
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("user")
      .select(`
        id,
        name,
        email,
        image,
        banReason,
        bannedAt,
        bannedBy
      `, { count: "exact" })
      .eq("banned", true)
      .order("bannedAt", { ascending: false });

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
    }

    const { data: users, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return { error: "Failed to fetch banned users" };
    }

    // Get appeal counts and latest status for each user
    const userIds = users.map((u: { id: string }) => u.id);
    const { data: appeals } = await supabase
      .from("ban_appeals")
      .select("user_id, status, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    // Get banner names
    const bannerIds = [...new Set(users.map((u: { bannedBy: string }) => u.bannedBy).filter(Boolean))];
    const { data: banners } = await supabase
      .from("user")
      .select("id, name")
      .in("id", bannerIds);

    const bannerMap = new Map(banners?.map((b: { id: string; name: string }) => [b.id, b.name]) || []);

    // Group appeals by user
    const appealsByUser = new Map<string, { count: number; latestStatus?: string }>();
    appeals?.forEach((a: { user_id: string; status: string }) => {
      const existing = appealsByUser.get(a.user_id);
      if (existing) {
        existing.count++;
      } else {
        appealsByUser.set(a.user_id, { count: 1, latestStatus: a.status });
      }
    });

    return {
      users: users.map((u: Record<string, unknown>) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        banReason: u.banReason,
        bannedAt: u.bannedAt,
        bannedBy: u.bannedBy,
        bannedByName: bannerMap.get(u.bannedBy as string),
        appealCount: appealsByUser.get(u.id as string)?.count || 0,
        latestAppealStatus: appealsByUser.get(u.id as string)?.latestStatus,
      })),
      total: count || 0,
    };
  } catch (error) {
    console.error("[BanAppeals] Get banned users error:", error);
    return { error: "Failed to fetch banned users" };
  }
}

/**
 * Get ban appeals (admin only)
 */
export async function getBanAppeals(options?: {
  status?: "pending" | "approved" | "rejected" | "all";
  page?: number;
  limit?: number;
}): Promise<{
  appeals?: BanAppeal[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role, ACTIONS.BAN_USERS)) {
      return { error: "You don't have permission to view appeals" };
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    const status = options?.status || "all";

    let query = supabase
      .from("ban_appeals")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: appeals, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return { error: "Failed to fetch appeals" };
    }

    // Get user and reviewer data
    const userIds = [...new Set([
      ...appeals.map((a: { user_id: string }) => a.user_id),
      ...appeals.map((a: { reviewed_by: string }) => a.reviewed_by).filter(Boolean),
    ])];

    const { data: users } = await supabase
      .from("user")
      .select("id, name, email, image, banReason, bannedAt")
      .in("id", userIds);

    const userMap = new Map(users?.map((u: Record<string, unknown>) => [u.id, u]) || []);

    return {
      appeals: appeals.map((a: Record<string, unknown>) => ({
        id: a.id,
        userId: a.user_id,
        reason: a.reason,
        additionalContext: a.additional_context,
        status: a.status,
        reviewedBy: a.reviewed_by,
        reviewNotes: a.review_notes,
        responseMessage: a.response_message,
        reviewedAt: a.reviewed_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        user: userMap.get(a.user_id),
        reviewer: a.reviewed_by ? userMap.get(a.reviewed_by) : undefined,
      })),
      total: count || 0,
    };
  } catch (error) {
    console.error("[BanAppeals] Get appeals error:", error);
    return { error: "Failed to fetch appeals" };
  }
}

/**
 * Review an appeal (approve or reject) - admin only
 */
export async function reviewBanAppeal(
  appealId: string,
  decision: "approved" | "rejected",
  options?: {
    reviewNotes?: string;
    responseMessage?: string;
  }
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

    const { data: adminUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!canPerformAction(adminUser?.role, ACTIONS.BAN_USERS)) {
      return { error: "You don't have permission to review appeals" };
    }

    // Get the appeal
    const { data: appeal, error: fetchError } = await supabase
      .from("ban_appeals")
      .select("id, user_id, status")
      .eq("id", appealId)
      .single();

    if (fetchError || !appeal) {
      return { error: "Appeal not found" };
    }

    if (appeal.status !== "pending") {
      return { error: "This appeal has already been reviewed" };
    }

    // Get user data
    const { data: targetUser } = await supabase
      .from("user")
      .select("id, email, name")
      .eq("id", appeal.user_id)
      .single();

    // Update the appeal
    const { error: updateError } = await supabase
      .from("ban_appeals")
      .update({
        status: decision,
        reviewed_by: session.user.id,
        review_notes: options?.reviewNotes || null,
        response_message: options?.responseMessage || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appealId);

    if (updateError) {
      return { error: "Failed to update appeal" };
    }

    // If approved, unban the user
    if (decision === "approved") {
      await supabase
        .from("user")
        .update({
          banned: false,
          banReason: null,
          bannedAt: null,
          bannedBy: null,
        })
        .eq("id", appeal.user_id);

      // Log unban
      await supabase.from("ban_history").insert({
        user_id: appeal.user_id,
        action: "unbanned",
        reason: "Appeal approved",
        performed_by: session.user.id,
        appeal_id: appealId,
      });
    }

    // Send email notification
    if (targetUser) {
      await sendEmail({
        to: targetUser.email,
        subject: decision === "approved"
          ? `Appeal Approved - ${APP_NAME}`
          : `Appeal Update - ${APP_NAME}`,
        html: decision === "approved"
          ? getAppealApprovedEmailHtml(targetUser.name, options?.responseMessage)
          : getAppealRejectedEmailHtml(targetUser.name, options?.responseMessage),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[BanAppeals] Review appeal error:", error);
    return { error: "Failed to review appeal" };
  }
}

// ============================================
// Email Templates
// ============================================

function getBanNotificationEmailHtml(userName?: string, reason?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; padding: 16px;">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626" stroke-width="2" style="width: 32px; height: 32px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                Account Suspended
              </h2>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
                We regret to inform you that your ${APP_NAME} account has been suspended due to a violation of our community guidelines.
              </p>

              ${reason ? `
              <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #dc2626; font-size: 14px;">
                  Reason for suspension:
                </p>
                <p style="margin: 0; color: #7f1d1d;">
                  ${reason}
                </p>
              </div>
              ` : ""}

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                If you believe this decision was made in error, you can submit an appeal by signing in to your account. We will review your appeal and respond within 5-7 business days.
              </p>

              <table cellspacing="0" cellpadding="0" style="margin: 24px auto;">
                <tr>
                  <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
                    <a href="${APP_URL}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Submit an Appeal
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

              <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">
                If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getUnbanNotificationEmailHtml(userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; padding: 16px;">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#16a34a" stroke-width="2" style="width: 32px; height: 32px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                Account Reinstated
              </h2>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
                Good news! Your ${APP_NAME} account has been reinstated. You now have full access to all features and content.
              </p>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                We appreciate your patience and understanding. Please continue to follow our community guidelines to ensure a positive experience for everyone.
              </p>

              <table cellspacing="0" cellpadding="0" style="margin: 24px auto;">
                <tr>
                  <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
                    <a href="${APP_URL}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Return to ${APP_NAME}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getAppealReceivedEmailHtml(userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                Appeal Received
              </h2>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                We have received your ban appeal and it is now under review. Our moderation team will carefully consider your case.
              </p>

              <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
                You can expect to hear back from us within <strong>5-7 business days</strong>. If you need to add any additional information to your appeal, you can do so by signing in to your account.
              </p>

              <p style="margin: 0; color: #71717a; font-size: 14px; text-align: center;">
                Thank you for your patience.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getAppealApprovedEmailHtml(userName?: string, message?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; padding: 16px;">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#16a34a" stroke-width="2" style="width: 32px; height: 32px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #16a34a; text-align: center;">
                Appeal Approved!
              </h2>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                Great news! Your ban appeal has been approved. Your account has been fully reinstated and you now have access to all ${APP_NAME} features.
              </p>

              ${message ? `
              <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #166534; font-size: 14px;">
                  Message from our team:
                </p>
                <p style="margin: 0; color: #14532d;">
                  ${message}
                </p>
              </div>
              ` : ""}

              <table cellspacing="0" cellpadding="0" style="margin: 24px auto;">
                <tr>
                  <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
                    <a href="${APP_URL}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Return to ${APP_NAME}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getAppealRejectedEmailHtml(userName?: string, message?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                Appeal Update
              </h2>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                After careful review of your ban appeal, we have decided to uphold the original decision. Your account remains suspended.
              </p>

              ${message ? `
              <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b; font-size: 14px;">
                  Reason:
                </p>
                <p style="margin: 0; color: #7f1d1d;">
                  ${message}
                </p>
              </div>
              ` : ""}

              <p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">
                You may submit another appeal with additional information if you believe there are circumstances we have not considered. However, please note that repeated appeals without new information may not be reviewed.
              </p>

              <p style="margin: 0; color: #71717a; font-size: 14px; text-align: center;">
                If you have questions about this decision, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
