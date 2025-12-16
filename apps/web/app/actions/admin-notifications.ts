"use server";

/**
 * Admin Notifications Server Actions
 *
 * CRUD operations for admin-created notifications with targeting,
 * scheduling, and multi-channel delivery support.
 */

import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export type AdminNotificationStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
export type TargetType = "all" | "role" | "users";

export interface AdminNotification {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  send_in_app: boolean;
  send_push: boolean;
  send_email: boolean;
  target_type: TargetType;
  target_roles: string[];
  target_user_ids: string[];
  status: AdminNotificationStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  successful_deliveries: number;
  failed_deliveries: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_error: string | null;
  // Joined data
  creator?: {
    name: string;
    email: string;
  };
}

export interface CreateAdminNotificationParams {
  title: string;
  message?: string;
  link?: string;
  send_in_app?: boolean;
  send_push?: boolean;
  send_email?: boolean;
  target_type: TargetType;
  target_roles?: string[];
  target_user_ids?: string[];
  scheduled_at?: string; // ISO date string, null for immediate
}

/**
 * Check if user has admin privileges
 * Requires at least MODERATOR role (which includes admin and superadmin)
 */
async function checkAdminAccess(): Promise<{ userId: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const result = await pool.query(
    `SELECT role FROM "user" WHERE id = $1`,
    [session.user.id]
  );

  const role = result.rows[0]?.role as UserRole | undefined;
  if (!hasMinRole(role, ROLES.MODERATOR)) {
    return { error: "You don't have permission to manage notifications" };
  }

  return { userId: session.user.id };
}

/**
 * Get all admin notifications
 */
export async function getAdminNotifications(options?: {
  status?: AdminNotificationStatus;
  limit?: number;
  offset?: number;
}): Promise<{
  data?: AdminNotification[];
  total?: number;
  error?: string;
}> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    let query = `
      SELECT
        n.*,
        u.name as creator_name,
        u.email as creator_email
      FROM admin_notifications n
      LEFT JOIN "user" u ON n.created_by = u.id
    `;

    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (options?.status) {
      query += ` WHERE n.status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM admin_notifications`;
    const countParams: string[] = [];
    if (options?.status) {
      countQuery += ` WHERE status = $1`;
      countParams.push(options.status);
    }
    const countResult = await pool.query(countQuery, countParams);

    const notifications: AdminNotification[] = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      link: row.link,
      send_in_app: row.send_in_app,
      send_push: row.send_push,
      send_email: row.send_email,
      target_type: row.target_type,
      target_roles: row.target_roles || [],
      target_user_ids: row.target_user_ids || [],
      status: row.status,
      scheduled_at: row.scheduled_at?.toISOString() || null,
      sent_at: row.sent_at?.toISOString() || null,
      total_recipients: row.total_recipients || 0,
      successful_deliveries: row.successful_deliveries || 0,
      failed_deliveries: row.failed_deliveries || 0,
      created_by: row.created_by,
      created_at: row.created_at?.toISOString(),
      updated_at: row.updated_at?.toISOString(),
      last_error: row.last_error,
      creator: row.creator_name ? {
        name: row.creator_name,
        email: row.creator_email,
      } : undefined,
    }));

    return {
      data: notifications,
      total: parseInt(countResult.rows[0]?.count || "0"),
    };
  } catch (error) {
    console.error("[AdminNotifications] Get error:", error);
    return { error: "Failed to fetch notifications" };
  }
}

/**
 * Get a single admin notification by ID
 */
export async function getAdminNotification(id: string): Promise<{
  data?: AdminNotification;
  error?: string;
}> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    const result = await pool.query(
      `
      SELECT
        n.*,
        u.name as creator_name,
        u.email as creator_email
      FROM admin_notifications n
      LEFT JOIN "user" u ON n.created_by = u.id
      WHERE n.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Notification not found" };
    }

    const row = result.rows[0];
    return {
      data: {
        id: row.id,
        title: row.title,
        message: row.message,
        link: row.link,
        send_in_app: row.send_in_app,
        send_push: row.send_push,
        send_email: row.send_email,
        target_type: row.target_type,
        target_roles: row.target_roles || [],
        target_user_ids: row.target_user_ids || [],
        status: row.status,
        scheduled_at: row.scheduled_at?.toISOString() || null,
        sent_at: row.sent_at?.toISOString() || null,
        total_recipients: row.total_recipients || 0,
        successful_deliveries: row.successful_deliveries || 0,
        failed_deliveries: row.failed_deliveries || 0,
        created_by: row.created_by,
        created_at: row.created_at?.toISOString(),
        updated_at: row.updated_at?.toISOString(),
        last_error: row.last_error,
        creator: row.creator_name ? {
          name: row.creator_name,
          email: row.creator_email,
        } : undefined,
      },
    };
  } catch (error) {
    console.error("[AdminNotifications] Get single error:", error);
    return { error: "Failed to fetch notification" };
  }
}

/**
 * Create a new admin notification
 */
export async function createAdminNotification(
  params: CreateAdminNotificationParams
): Promise<{ id?: string; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    // Validate
    if (!params.title.trim()) {
      return { error: "Title is required" };
    }

    if (params.target_type === "role" && (!params.target_roles || params.target_roles.length === 0)) {
      return { error: "Please select at least one role" };
    }

    if (params.target_type === "users" && (!params.target_user_ids || params.target_user_ids.length === 0)) {
      return { error: "Please select at least one user" };
    }

    const result = await pool.query(
      `
      INSERT INTO admin_notifications (
        title, message, link,
        send_in_app, send_push, send_email,
        target_type, target_roles, target_user_ids,
        status, scheduled_at,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
      `,
      [
        params.title.trim(),
        params.message?.trim() || null,
        params.link?.trim() || null,
        params.send_in_app ?? true,
        params.send_push ?? true,
        params.send_email ?? false,
        params.target_type,
        params.target_roles || [],
        params.target_user_ids || [],
        "draft",
        params.scheduled_at ? new Date(params.scheduled_at) : null,
        access.userId,
      ]
    );

    revalidatePath("/dashboard/notifications");
    return { id: result.rows[0].id };
  } catch (error) {
    console.error("[AdminNotifications] Create error:", error);
    return { error: "Failed to create notification" };
  }
}

/**
 * Update an admin notification
 */
export async function updateAdminNotification(
  id: string,
  params: Partial<CreateAdminNotificationParams>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    // Check if notification exists and is editable
    const existing = await pool.query(
      `SELECT status FROM admin_notifications WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return { error: "Notification not found" };
    }

    if (!["draft", "scheduled"].includes(existing.rows[0].status)) {
      return { error: "Cannot edit a notification that has already been sent" };
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | boolean | string[] | Date | null)[] = [];
    let paramIndex = 1;

    if (params.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(params.title.trim());
    }
    if (params.message !== undefined) {
      updates.push(`message = $${paramIndex++}`);
      values.push(params.message?.trim() || null);
    }
    if (params.link !== undefined) {
      updates.push(`link = $${paramIndex++}`);
      values.push(params.link?.trim() || null);
    }
    if (params.send_in_app !== undefined) {
      updates.push(`send_in_app = $${paramIndex++}`);
      values.push(params.send_in_app);
    }
    if (params.send_push !== undefined) {
      updates.push(`send_push = $${paramIndex++}`);
      values.push(params.send_push);
    }
    if (params.send_email !== undefined) {
      updates.push(`send_email = $${paramIndex++}`);
      values.push(params.send_email);
    }
    if (params.target_type !== undefined) {
      updates.push(`target_type = $${paramIndex++}`);
      values.push(params.target_type);
    }
    if (params.target_roles !== undefined) {
      updates.push(`target_roles = $${paramIndex++}`);
      values.push(params.target_roles);
    }
    if (params.target_user_ids !== undefined) {
      updates.push(`target_user_ids = $${paramIndex++}`);
      values.push(params.target_user_ids);
    }
    if (params.scheduled_at !== undefined) {
      updates.push(`scheduled_at = $${paramIndex++}`);
      values.push(params.scheduled_at ? new Date(params.scheduled_at) : null);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE admin_notifications SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("[AdminNotifications] Update error:", error);
    return { error: "Failed to update notification" };
  }
}

/**
 * Schedule or send a notification immediately
 */
export async function scheduleAdminNotification(
  id: string,
  sendImmediately: boolean = false
): Promise<{ success?: boolean; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    // Check if notification exists
    const existing = await pool.query(
      `SELECT status, scheduled_at FROM admin_notifications WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return { error: "Notification not found" };
    }

    if (!["draft", "scheduled"].includes(existing.rows[0].status)) {
      return { error: "Cannot schedule a notification that has already been sent" };
    }

    if (sendImmediately) {
      // Set scheduled_at to now so the cron picks it up immediately
      await pool.query(
        `UPDATE admin_notifications SET status = 'scheduled', scheduled_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      );
    } else {
      // Just mark as scheduled (use existing scheduled_at)
      if (!existing.rows[0].scheduled_at) {
        return { error: "Please set a scheduled time first" };
      }
      await pool.query(
        `UPDATE admin_notifications SET status = 'scheduled', updated_at = NOW() WHERE id = $1`,
        [id]
      );
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("[AdminNotifications] Schedule error:", error);
    return { error: "Failed to schedule notification" };
  }
}

/**
 * Cancel a scheduled or draft notification
 * Uses atomic update to handle race conditions with cron job
 */
export async function cancelAdminNotification(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    // Atomic update that returns the old status for error handling
    // This prevents TOCTOU race conditions where status changes between check and update
    const result = await pool.query<{ id: string; old_status: string }>(
      `UPDATE admin_notifications
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status IN ('draft', 'scheduled')
       RETURNING id, (SELECT status FROM admin_notifications WHERE id = $1) as old_status`,
      [id]
    );

    if (result.rows.length === 0) {
      // Check why it failed - notification doesn't exist or wrong status
      const checkResult = await pool.query<{ status: string }>(
        `SELECT status FROM admin_notifications WHERE id = $1`,
        [id]
      );

      if (checkResult.rows.length === 0) {
        return { error: "Notification not found" };
      }

      const currentStatus = checkResult.rows[0]?.status;
      if (currentStatus === "sending" || currentStatus === "sent") {
        return { error: `Cannot cancel notification that is already ${currentStatus}` };
      }
      if (currentStatus === "cancelled") {
        return { error: "Notification is already cancelled" };
      }
      return { error: `Cannot cancel notification with status: ${currentStatus}` };
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("[AdminNotifications] Cancel error:", error);
    return { error: "Failed to cancel notification" };
  }
}

/**
 * Delete a draft notification
 */
export async function deleteAdminNotification(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    const result = await pool.query(
      `DELETE FROM admin_notifications WHERE id = $1 AND status = 'draft' RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Notification not found or cannot be deleted" };
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("[AdminNotifications] Delete error:", error);
    return { error: "Failed to delete notification" };
  }
}

/**
 * Search users for targeting
 */
export async function searchUsersForNotification(query: string): Promise<{
  data?: Array<{
    id: string;
    name: string;
    email: string;
    username: string | null;
    role: string;
  }>;
  error?: string;
}> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    if (!query || query.length < 2) {
      return { data: [] };
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const result = await pool.query(
      `
      SELECT id, name, email, username, role
      FROM "user"
      WHERE LOWER(name) LIKE $1
         OR LOWER(email) LIKE $1
         OR LOWER(username) LIKE $1
      ORDER BY name
      LIMIT 20
      `,
      [searchTerm]
    );

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        name: row.name || "Unknown",
        email: row.email,
        username: row.username,
        role: row.role || "user",
      })),
    };
  } catch (error) {
    console.error("[AdminNotifications] Search error:", error);
    return { error: "Failed to search users" };
  }
}

/**
 * Get recipient count for preview
 */
export async function getRecipientCount(params: {
  target_type: TargetType;
  target_roles?: string[];
  target_user_ids?: string[];
}): Promise<{ count?: number; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    let query: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let queryParams: any[];

    if (params.target_type === "all") {
      query = `SELECT COUNT(*) FROM "user" WHERE email IS NOT NULL`;
      queryParams = [];
    } else if (params.target_type === "role") {
      if (!params.target_roles || params.target_roles.length === 0) {
        return { count: 0 };
      }
      query = `SELECT COUNT(*) FROM "user" WHERE role = ANY($1) AND email IS NOT NULL`;
      queryParams = [params.target_roles];
    } else if (params.target_type === "users") {
      if (!params.target_user_ids || params.target_user_ids.length === 0) {
        return { count: 0 };
      }
      query = `SELECT COUNT(*) FROM "user" WHERE id = ANY($1) AND email IS NOT NULL`;
      queryParams = [params.target_user_ids];
    } else {
      return { count: 0 };
    }

    const result = await pool.query<{ count: string }>(query, queryParams);
    return { count: parseInt(result.rows[0]?.count || "0") };
  } catch (error) {
    console.error("[AdminNotifications] Count error:", error);
    return { error: "Failed to get recipient count" };
  }
}

/**
 * Send version update notification to all opted-in users
 */
export async function sendVersionNotification(params: {
  version: string;
  title: string;
  highlights?: string[];
}): Promise<{ success?: boolean; notifiedCount?: number; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if ("error" in access) return { error: access.error };

    // Import the notification function
    const { notifyVersionUpdate } = await import("@/lib/admin-notifications");

    const result = await notifyVersionUpdate(params);

    if (result.success) {
      revalidatePath("/dashboard/notifications");
      return { success: true, notifiedCount: result.notifiedCount };
    }

    return { error: result.error || "Failed to send notifications" };
  } catch (error) {
    console.error("[AdminNotifications] Version notify error:", error);
    return { error: "Failed to send version notification" };
  }
}
