/**
 * Admin Notification System
 *
 * Notifies admin users about important system events:
 * - New user signups
 * - New beta applications
 *
 * Sends both in-app notifications and emails.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const APP_NAME = "Claude Insider";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

interface AdminNotifyParams {
  type: "new_user" | "beta_application";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Get all admin users
 */
async function getAdminUsers(): Promise<
  Array<{ id: string; email: string; name: string | null }>
> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user")
      .select("id, email, name")
      .eq("role", "admin");

    if (error) {
      console.error("[AdminNotify] Error fetching admins:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[AdminNotify] Unexpected error:", error);
    return [];
  }
}

/**
 * Create in-app notification for an admin
 */
async function createAdminNotification(
  adminId: string,
  params: AdminNotifyParams
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    await supabase.from("notifications").insert({
      user_id: adminId,
      type: "system",
      title: params.title,
      message: params.message,
      data: params.data || {},
      actor_id: params.actorId || null,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
    });
  } catch (error) {
    console.error("[AdminNotify] Error creating notification:", error);
  }
}

/**
 * Send admin notification email
 */
async function sendAdminNotificationEmail(
  email: string,
  adminName: string | null,
  params: AdminNotifyParams
): Promise<void> {
  const greeting = adminName ? `Hi ${adminName},` : "Hi Admin,";

  const actionUrl =
    params.type === "new_user"
      ? `${APP_URL}/dashboard/users`
      : `${APP_URL}/dashboard/beta`;

  const buttonText =
    params.type === "new_user" ? "View Users" : "Review Applications";

  const iconSvg =
    params.type === "new_user"
      ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <!-- Content Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(to bottom right, #7c3aed, #2563eb); padding: 12px;">
                  ${iconSvg}
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                ${params.title}
              </h2>
              <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
                ${greeting}<br><br>
                ${params.message}
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
                    <a href="${actionUrl}" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
              <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">
                You received this email because you are an admin of ${APP_NAME}.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
          <tr>
            <td style="text-align: center; color: #71717a; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="${APP_URL}" style="color: #2563eb; text-decoration: none;">claudeinsider.com</a>
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

  try {
    await sendEmail({
      to: email,
      subject: `[${APP_NAME} Admin] ${params.title}`,
      html,
    });
  } catch (error) {
    console.error("[AdminNotify] Error sending email:", error);
  }
}

/**
 * Notify all admins about an event
 */
export async function notifyAdmins(params: AdminNotifyParams): Promise<void> {
  const admins = await getAdminUsers();

  if (admins.length === 0) {
    console.log("[AdminNotify] No admin users found to notify");
    return;
  }

  // Send notifications in parallel
  await Promise.all(
    admins.map(async (admin) => {
      // Create in-app notification
      await createAdminNotification(admin.id, params);

      // Send email notification
      await sendAdminNotificationEmail(admin.email, admin.name, params);
    })
  );

  console.log(`[AdminNotify] Notified ${admins.length} admin(s) about: ${params.type}`);
}

/**
 * Notify admins about a new user signup
 */
export async function notifyAdminsNewUser(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<void> {
  const userName = user.name || user.email.split("@")[0];

  await notifyAdmins({
    type: "new_user",
    title: "New User Signup",
    message: `A new user has signed up: <strong>${userName}</strong> (${user.email}). You can view their profile in the admin dashboard.`,
    actorId: user.id,
    resourceType: "user",
    resourceId: user.id,
    data: {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    },
  });
}

/**
 * Notify admins about a new beta application
 */
export async function notifyAdminsBetaApplication(application: {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  experienceLevel: string;
}): Promise<void> {
  await notifyAdmins({
    type: "beta_application",
    title: "New Beta Application",
    message: `<strong>${application.userName}</strong> (${application.userEmail}) has applied to join the beta program with <strong>${application.experienceLevel}</strong> experience level. Please review their application.`,
    actorId: application.userId,
    resourceType: "beta_application",
    resourceId: application.id,
    data: {
      applicationId: application.id,
      userId: application.userId,
      userEmail: application.userEmail,
      userName: application.userName,
      experienceLevel: application.experienceLevel,
    },
  });
}
