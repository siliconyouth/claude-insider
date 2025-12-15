/**
 * Admin Notification System
 *
 * Notifies admin and moderator users about important system events:
 * - New user signups
 * - New beta applications
 * - New edit suggestions
 * - New resource submissions
 *
 * Sends in-app notifications, emails, and push notifications.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { sendPushNotificationToUser, isWebPushConfigured } from "@/lib/web-push";

const APP_NAME = "Claude Insider";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

interface AdminNotifyParams {
  type: "new_user" | "beta_application" | "edit_suggestion" | "resource_submission";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Get all admin and moderator users
 */
async function getAdminAndModeratorUsers(): Promise<
  Array<{ id: string; email: string; name: string | null; role: string }>
> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user")
      .select("id, email, name, role")
      .in("role", ["admin", "moderator"]);

    if (error) {
      console.error("[AdminNotify] Error fetching admins/moderators:", error);
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

  // Determine action URL based on notification type
  let actionUrl: string;
  let buttonText: string;
  let iconSvg: string;

  switch (params.type) {
    case "new_user":
      actionUrl = `${APP_URL}/dashboard/users`;
      buttonText = "View Users";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>`;
      break;
    case "beta_application":
      actionUrl = `${APP_URL}/dashboard/beta`;
      buttonText = "Review Applications";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>`;
      break;
    case "edit_suggestion":
      actionUrl = `${APP_URL}/dashboard/suggestions`;
      buttonText = "Review Suggestions";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>`;
      break;
    case "resource_submission":
      actionUrl = `${APP_URL}/admin/collections/resources`;
      buttonText = "Review Resources";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>`;
      break;
    default:
      actionUrl = `${APP_URL}/dashboard`;
      buttonText = "View Dashboard";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
  }

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
 * Get push notification URL based on notification type
 */
function getPushNotificationUrl(params: AdminNotifyParams): string {
  switch (params.type) {
    case "new_user":
      return `${APP_URL}/dashboard/users`;
    case "beta_application":
      return `${APP_URL}/dashboard/beta`;
    case "edit_suggestion":
      return `${APP_URL}/dashboard/suggestions`;
    case "resource_submission":
      return `${APP_URL}/dashboard/resources/queue`;
    default:
      return `${APP_URL}/dashboard`;
  }
}

/**
 * Notify all admins and moderators about an event
 */
export async function notifyAdmins(params: AdminNotifyParams): Promise<void> {
  const staff = await getAdminAndModeratorUsers();

  if (staff.length === 0) {
    console.log("[AdminNotify] No admin/moderator users found to notify");
    return;
  }

  const pushConfigured = isWebPushConfigured();
  const pushUrl = getPushNotificationUrl(params);

  // Send notifications in parallel
  await Promise.all(
    staff.map(async (user) => {
      // Create in-app notification
      await createAdminNotification(user.id, params);

      // Send email notification
      await sendAdminNotificationEmail(user.email, user.name, params);

      // Send push notification (if configured)
      if (pushConfigured) {
        try {
          await sendPushNotificationToUser(user.id, {
            title: `[Admin] ${params.title}`,
            body: params.message.replace(/<[^>]*>/g, "").substring(0, 200), // Strip HTML, limit length
            url: pushUrl,
            tag: `admin-${params.type}-${Date.now()}`,
          });
        } catch (err) {
          console.error(`[AdminNotify] Push notification error for ${user.id}:`, err);
        }
      }
    })
  );

  const adminCount = staff.filter((u) => u.role === "admin").length;
  const modCount = staff.filter((u) => u.role === "moderator").length;
  console.log(
    `[AdminNotify] Notified ${adminCount} admin(s) and ${modCount} moderator(s) about: ${params.type}`
  );
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

/**
 * Notify admins about a new edit suggestion
 */
export async function notifyAdminsEditSuggestion(suggestion: {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  resourceType: "resource" | "doc";
  resourceId: string;
  suggestionType: "content" | "metadata" | "typo" | "other";
}): Promise<void> {
  const typeLabels: Record<string, string> = {
    content: "Content Edit",
    metadata: "Metadata Update",
    typo: "Typo Fix",
    other: "Other",
  };

  const resourceTypeLabel = suggestion.resourceType === "doc" ? "documentation" : "resource";

  await notifyAdmins({
    type: "edit_suggestion",
    title: "New Edit Suggestion",
    message: `<strong>${suggestion.userName}</strong> (${suggestion.userEmail}) has submitted an edit suggestion for a ${resourceTypeLabel}:<br><br><strong>"${suggestion.title}"</strong><br><br>Type: <strong>${typeLabels[suggestion.suggestionType] || suggestion.suggestionType}</strong>. Please review this suggestion.`,
    actorId: suggestion.userId,
    resourceType: "edit_suggestion",
    resourceId: suggestion.id,
    data: {
      suggestionId: suggestion.id,
      userId: suggestion.userId,
      userEmail: suggestion.userEmail,
      userName: suggestion.userName,
      title: suggestion.title,
      targetResourceType: suggestion.resourceType,
      targetResourceId: suggestion.resourceId,
      suggestionType: suggestion.suggestionType,
    },
  });
}

/**
 * Notify admins about a new resource submission for review
 */
export async function notifyAdminsResourceSubmission(resource: {
  id: string | number;
  title: string;
  url: string;
  category?: string;
  submittedBy?: {
    id?: string;
    email?: string;
    name?: string;
  };
  isNew?: boolean;
}): Promise<void> {
  const submitterName = resource.submittedBy?.name || resource.submittedBy?.email?.split("@")[0] || "Unknown user";
  const submitterEmail = resource.submittedBy?.email || "unknown";
  const action = resource.isNew ? "submitted a new" : "updated a";
  const categoryLabel = resource.category ? ` in <strong>${resource.category}</strong>` : "";

  await notifyAdmins({
    type: "resource_submission",
    title: "Resource Pending Review",
    message: `<strong>${submitterName}</strong> (${submitterEmail}) has ${action} resource${categoryLabel}:<br><br><strong>"${resource.title}"</strong><br><br>URL: <a href="${resource.url}" style="color: #2563eb;">${resource.url}</a><br><br>Please review this submission.`,
    actorId: resource.submittedBy?.id,
    resourceType: "resource",
    resourceId: String(resource.id),
    data: {
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceUrl: resource.url,
      category: resource.category,
      submittedBy: resource.submittedBy,
      isNew: resource.isNew,
    },
  });
}

/**
 * Notify all users about a new version release
 * Respects user notification preferences for version_updates
 */
export async function notifyVersionUpdate(params: {
  version: string;
  title: string;
  highlights?: string[];
}): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get all users who have in_app_version_updates enabled
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("user_id, in_app_version_updates, email_version_updates")
      .eq("in_app_version_updates", true);

    if (prefError) {
      console.error("[VersionNotify] Error fetching preferences:", prefError);
      return { success: false, notifiedCount: 0, error: prefError.message };
    }

    // If no preferences found, get users without preferences (they use defaults which have it enabled)
    const { data: allUsers, error: usersError } = await supabase
      .from("user")
      .select("id, email, name");

    if (usersError) {
      console.error("[VersionNotify] Error fetching users:", usersError);
      return { success: false, notifiedCount: 0, error: usersError.message };
    }

    // Build set of users with explicit opt-out
    interface UserPref {
      user_id: string;
      in_app_version_updates: boolean;
      email_version_updates: boolean;
    }
    const userPrefsMap = new Map<string, UserPref>(
      (preferences || []).map((p: UserPref) => [p.user_id, p])
    );

    // Filter users to notify (those with enabled or no preference set)
    const usersToNotify = (allUsers || []).filter((user: { id: string }) => {
      const pref = userPrefsMap.get(user.id);
      // If no preference, default is enabled; if preference exists, check if enabled
      return !pref || pref.in_app_version_updates === true;
    });

    if (usersToNotify.length === 0) {
      console.log("[VersionNotify] No users to notify");
      return { success: true, notifiedCount: 0 };
    }

    // Build notification message
    const highlightsHtml = params.highlights?.length
      ? `<ul style="margin: 8px 0; padding-left: 16px;">${params.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>`
      : "";

    // Create notifications in batches
    const batchSize = 100;
    let notifiedCount = 0;

    for (let i = 0; i < usersToNotify.length; i += batchSize) {
      const batch = usersToNotify.slice(i, i + batchSize);

      const notifications = batch.map((user: { id: string }) => ({
        user_id: user.id,
        type: "version_update",
        title: `🎉 ${params.title}`,
        message: `Version ${params.version} is now available!${highlightsHtml}`,
        data: {
          version: params.version,
          link: `${APP_URL}/changelog`,
        },
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("[VersionNotify] Error inserting notifications:", insertError);
      } else {
        notifiedCount += batch.length;
      }
    }

    console.log(`[VersionNotify] Notified ${notifiedCount} users about version ${params.version}`);
    return { success: true, notifiedCount };
  } catch (error) {
    console.error("[VersionNotify] Unexpected error:", error);
    return { success: false, notifiedCount: 0, error: (error as Error).message };
  }
}
