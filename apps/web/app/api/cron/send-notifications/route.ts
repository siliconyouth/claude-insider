/**
 * Admin Notifications Cron API Route
 *
 * Processes scheduled admin notifications and delivers them
 * through the configured channels (in-app, web push, email).
 *
 * Should be called by Vercel Cron every minute.
 *
 * @example
 * GET /api/cron/send-notifications
 * Headers: { "Authorization": "Bearer <CRON_SECRET>" }
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { createNotification } from "@/app/actions/notifications";
import {
  sendPushNotificationToUsers,
  isWebPushConfigured,
} from "@/lib/web-push";
import { sendEmail } from "@/lib/email";

// eslint-disable-next-line turbo/no-undeclared-env-vars
const CRON_SECRET = process.env.CRON_SECRET;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

interface TargetUser {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminNotificationRow {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  send_in_app: boolean;
  send_push: boolean;
  send_email: boolean;
  target_type: "all" | "role" | "users";
  target_roles: string[];
  target_user_ids: string[];
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization for production
    const authHeader = request.headers.get("authorization");
    const cronHeader = request.headers.get("x-vercel-cron");

    // Allow Vercel Cron or manual calls with CRON_SECRET
    if (process.env.NODE_ENV === "production") {
      if (!cronHeader && (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[CronNotifications] Starting scheduled notifications check...");

    // Find notifications that are ready to send
    const scheduledResult = await pool.query<AdminNotificationRow>(`
      SELECT id, title, message, link, send_in_app, send_push, send_email,
             target_type, target_roles, target_user_ids
      FROM admin_notifications
      WHERE status = 'scheduled'
        AND scheduled_at <= NOW()
      LIMIT 10
    `);

    if (scheduledResult.rows.length === 0) {
      console.log("[CronNotifications] No scheduled notifications to process");
      return NextResponse.json({
        success: true,
        message: "No scheduled notifications",
        processed: 0,
      });
    }

    console.log(
      `[CronNotifications] Found ${scheduledResult.rows.length} notification(s) to process`
    );

    let totalProcessed = 0;
    let totalFailed = 0;

    for (const notification of scheduledResult.rows) {
      try {
        console.log(`[CronNotifications] Processing notification: ${notification.id}`);

        // Mark as sending
        await pool.query(
          `UPDATE admin_notifications SET status = 'sending', updated_at = NOW() WHERE id = $1`,
          [notification.id]
        );

        // Get target users
        const targetUsers = await getTargetUsers(notification);
        console.log(`[CronNotifications] Target users: ${targetUsers.length}`);

        // Update total recipients
        await pool.query(
          `UPDATE admin_notifications SET total_recipients = $1 WHERE id = $2`,
          [targetUsers.length, notification.id]
        );

        let successCount = 0;
        let failCount = 0;

        // Process in batches
        const batchSize = 50;
        for (let i = 0; i < targetUsers.length; i += batchSize) {
          const batch = targetUsers.slice(i, i + batchSize);

          const results = await Promise.allSettled(
            batch.map((user) =>
              sendNotificationToUser(notification, user)
            )
          );

          // Track delivery status
          for (let j = 0; j < results.length; j++) {
            const settledResult = results[j];
            const targetUser = batch[j];

            if (!targetUser || !settledResult) continue;

            let deliveryResult: { in_app: boolean; push: boolean; email: boolean; error?: string };
            if (settledResult.status === "fulfilled") {
              deliveryResult = settledResult.value;
            } else {
              const rejectedResult = settledResult as PromiseRejectedResult;
              deliveryResult = {
                in_app: false,
                push: false,
                email: false,
                error: rejectedResult.reason?.message || "Unknown error",
              };
            }

            // Record delivery
            await pool.query(
              `INSERT INTO admin_notification_deliveries
               (notification_id, user_id, in_app_sent, in_app_sent_at, push_sent, push_sent_at, email_sent, email_sent_at, error)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (notification_id, user_id) DO UPDATE SET
                 in_app_sent = EXCLUDED.in_app_sent,
                 in_app_sent_at = EXCLUDED.in_app_sent_at,
                 push_sent = EXCLUDED.push_sent,
                 push_sent_at = EXCLUDED.push_sent_at,
                 email_sent = EXCLUDED.email_sent,
                 email_sent_at = EXCLUDED.email_sent_at,
                 error = EXCLUDED.error`,
              [
                notification.id,
                targetUser.user_id,
                deliveryResult.in_app,
                deliveryResult.in_app ? new Date() : null,
                deliveryResult.push,
                deliveryResult.push ? new Date() : null,
                deliveryResult.email,
                deliveryResult.email ? new Date() : null,
                deliveryResult.error || null,
              ]
            );

            if (deliveryResult.in_app || deliveryResult.push || deliveryResult.email) {
              successCount++;
            } else {
              failCount++;
            }
          }
        }

        // Update notification status
        await pool.query(
          `UPDATE admin_notifications
           SET status = 'sent',
               sent_at = NOW(),
               successful_deliveries = $1,
               failed_deliveries = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [successCount, failCount, notification.id]
        );

        console.log(
          `[CronNotifications] Completed notification ${notification.id}: ${successCount} success, ${failCount} failed`
        );

        totalProcessed++;
      } catch (notifError) {
        console.error(
          `[CronNotifications] Failed to process notification ${notification.id}:`,
          notifError
        );

        // Mark as failed
        await pool.query(
          `UPDATE admin_notifications
           SET status = 'failed',
               last_error = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [(notifError as Error).message || "Unknown error", notification.id]
        );

        totalFailed++;
      }
    }

    console.log(
      `[CronNotifications] Finished: ${totalProcessed} processed, ${totalFailed} failed`
    );

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      failed: totalFailed,
    });
  } catch (error) {
    console.error("[CronNotifications] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get target users for a notification based on targeting rules
 */
async function getTargetUsers(
  notification: AdminNotificationRow
): Promise<TargetUser[]> {
  let query: string;
  let params: string[] | string[][] = [];

  if (notification.target_type === "all") {
    query = `SELECT id as user_id, email, name, role FROM "user" WHERE email IS NOT NULL`;
  } else if (notification.target_type === "role") {
    query = `SELECT id as user_id, email, name, role FROM "user" WHERE role = ANY($1) AND email IS NOT NULL`;
    params = [notification.target_roles];
  } else {
    query = `SELECT id as user_id, email, name, role FROM "user" WHERE id = ANY($1) AND email IS NOT NULL`;
    params = [notification.target_user_ids];
  }

  const result = await pool.query<TargetUser>(query, params);
  return result.rows;
}

/**
 * Send notification to a single user through all enabled channels
 */
async function sendNotificationToUser(
  notification: AdminNotificationRow,
  user: TargetUser
): Promise<{ in_app: boolean; push: boolean; email: boolean; error?: string }> {
  const result = { in_app: false, push: false, email: false, error: undefined as string | undefined };

  try {
    // In-app notification
    if (notification.send_in_app) {
      try {
        const inAppResult = await createNotification({
          userId: user.user_id,
          type: "admin_notification",
          title: notification.title,
          message: notification.message || undefined,
          data: {
            link: notification.link,
            adminNotificationId: notification.id,
          },
        });
        result.in_app = !inAppResult.error;
      } catch (e) {
        console.error(`[CronNotifications] In-app error for ${user.user_id}:`, e);
      }
    }

    // Web Push notification
    if (notification.send_push && isWebPushConfigured()) {
      try {
        const pushResult = await sendPushNotificationToUsers([user.user_id], {
          title: notification.title,
          body: notification.message || "",
          url: notification.link || "/notifications",
          tag: `admin-${notification.id}`,
        });
        result.push = pushResult.totalSent > 0;
      } catch (e) {
        console.error(`[CronNotifications] Push error for ${user.user_id}:`, e);
      }
    }

    // Email notification
    if (notification.send_email && user.email) {
      try {
        const emailResult = await sendEmail({
          to: user.email,
          subject: notification.title,
          html: generateEmailHtml(notification, user),
        });
        result.email = emailResult.success;
      } catch (e) {
        console.error(`[CronNotifications] Email error for ${user.user_id}:`, e);
      }
    }

    return result;
  } catch (error) {
    result.error = (error as Error).message || "Unknown error";
    return result;
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHtml(
  notification: AdminNotificationRow,
  user: TargetUser
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.claudeinsider.com";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #111111; border-radius: 12px; border: 1px solid #262626;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; border-bottom: 1px solid #262626;">
              <a href="${appUrl}" style="font-size: 24px; font-weight: bold; color: #ffffff; text-decoration: none;">
                Claude Insider
              </a>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${user.name ? `<p style="color: #9ca3af; font-size: 14px; margin: 0 0 20px;">Hi ${user.name},</p>` : ""}
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px;">
                ${notification.title}
              </h1>
              ${
                notification.message
                  ? `<p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${notification.message}</p>`
                  : ""
              }
              ${
                notification.link
                  ? `<a href="${notification.link}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">View Details</a>`
                  : ""
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #262626;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                You're receiving this because you have an account on Claude Insider.
                <br>
                <a href="${appUrl}/settings" style="color: #06b6d4;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

