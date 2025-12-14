/**
 * Email Service using Resend
 *
 * Handles transactional emails for authentication and notifications.
 * Uses React Email templates for consistent branding.
 */

import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender configuration
// eslint-disable-next-line turbo/no-undeclared-env-vars
const FROM_EMAIL = process.env.EMAIL_FROM || "Claude Insider <noreply@claudeinsider.com>";
const APP_NAME = "Claude Insider";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

interface EmailResult {
  success: boolean;
  error?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Generic email sender
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[Email] Send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  userName?: string
): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Verify your ${APP_NAME} account`,
      html: getVerificationEmailHtml(verificationUrl, userName),
    });

    if (error) {
      console.error("[Email] Verification send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send password reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string
): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: getPasswordResetEmailHtml(resetUrl, userName),
    });

    if (error) {
      console.error("[Email] Password reset send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send welcome email after account creation
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME}!`,
      html: getWelcomeEmailHtml(userName),
    });

    if (error) {
      console.error("[Email] Welcome send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// ================================
// Email HTML Templates
// ================================

/**
 * Base email template with consistent styling
 */
function getEmailWrapper(content: string): string {
  return `
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
              ${content}
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
}

/**
 * Email verification template
 */
function getVerificationEmailHtml(verificationUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      Verify your email address
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      Thanks for signing up for ${APP_NAME}! Please click the button below to verify your email address and activate your account.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Verify Email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: #2563eb; font-size: 14px; word-break: break-all;">
      <a href="${verificationUrl}" style="color: #2563eb; text-decoration: none;">${verificationUrl}</a>
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px;">
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  return getEmailWrapper(content);
}

/**
 * Password reset template
 */
function getPasswordResetEmailHtml(resetUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      Reset your password
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: #2563eb; font-size: 14px; word-break: break-all;">
      <a href="${resetUrl}" style="color: #2563eb; text-decoration: none;">${resetUrl}</a>
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `;

  return getEmailWrapper(content);
}

/**
 * Welcome email template
 */
function getWelcomeEmailHtml(userName?: string): string {
  const greeting = userName ? `Welcome, ${userName}!` : "Welcome!";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      ${greeting}
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      Thanks for joining ${APP_NAME}! We're excited to have you as part of our community of Claude AI enthusiasts.
    </p>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      Here's what you can do now:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #52525b; line-height: 1.8;">
      <li>Browse our curated collection of <strong>Claude resources</strong></li>
      <li>Save your favorites and create <strong>collections</strong></li>
      <li>Rate resources and leave <strong>comments</strong></li>
      <li>Suggest edits to improve our <strong>documentation</strong></li>
    </ul>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${APP_URL}/resources" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Explore Resources
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0; color: #71717a; font-size: 14px;">
      If you have any questions, feel free to reach out. Happy exploring!
    </p>
  `;

  return getEmailWrapper(content);
}

// ================================
// Notification Emails
// ================================

export interface NotificationEmailParams {
  email: string;
  userName?: string;
  type: "reply" | "comment" | "suggestion_approved" | "suggestion_rejected" | "suggestion_merged" | "follow" | "mention";
  title: string;
  message: string;
  actorName?: string;
  actionUrl?: string;
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(params: NotificationEmailParams): Promise<EmailResult> {
  try {
    const subject = getNotificationSubject(params.type, params.actorName);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject,
      html: getNotificationEmailHtml(params),
    });

    if (error) {
      console.error("[Email] Notification send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Get subject line for notification type
 */
function getNotificationSubject(type: NotificationEmailParams["type"], actorName?: string): string {
  const actor = actorName || "Someone";

  switch (type) {
    case "reply":
      return `${actor} replied to your comment on ${APP_NAME}`;
    case "comment":
      return `${actor} commented on your content on ${APP_NAME}`;
    case "suggestion_approved":
      return `Your suggestion was approved on ${APP_NAME}`;
    case "suggestion_rejected":
      return `Update on your suggestion on ${APP_NAME}`;
    case "suggestion_merged":
      return `Your suggestion was merged on ${APP_NAME}`;
    case "follow":
      return `${actor} started following you on ${APP_NAME}`;
    case "mention":
      return `${actor} mentioned you on ${APP_NAME}`;
    default:
      return `New notification on ${APP_NAME}`;
  }
}

/**
 * Notification email template
 */
function getNotificationEmailHtml(params: NotificationEmailParams): string {
  const greeting = params.userName ? `Hi ${params.userName},` : "Hi there,";
  const icon = getNotificationIcon(params.type);
  const buttonText = getNotificationButtonText(params.type);
  const actionUrl = params.actionUrl || `${APP_URL}/notifications`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(to bottom right, #7c3aed, #2563eb); padding: 12px;">
        ${icon}
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
      You received this email because you have email notifications enabled.
      <a href="${APP_URL}/settings" style="color: #2563eb; text-decoration: none;">Manage preferences</a>
    </p>
  `;

  return getEmailWrapper(content);
}

/**
 * Get icon SVG for notification type
 */
function getNotificationIcon(type: NotificationEmailParams["type"]): string {
  switch (type) {
    case "reply":
    case "comment":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>`;
    case "suggestion_approved":
    case "suggestion_merged":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>`;
    case "suggestion_rejected":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>`;
    case "follow":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>`;
    case "mention":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>`;
  }
}

/**
 * Get button text for notification type
 */
function getNotificationButtonText(type: NotificationEmailParams["type"]): string {
  switch (type) {
    case "reply":
    case "comment":
      return "View Comment";
    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      return "View Suggestion";
    case "follow":
      return "View Profile";
    case "mention":
      return "View Mention";
    default:
      return "View Notification";
  }
}

// ================================
// Admin Notification Emails
// ================================

export interface AdminNotificationParams {
  email: string;
  userName?: string;
}

/**
 * Send queue digest email to admins
 */
export async function sendQueueDigestEmail(
  params: AdminNotificationParams & {
    pendingCount: number;
    highPriorityCount: number;
    recentItems: Array<{ title: string; url: string; source?: string }>;
  }
): Promise<EmailResult> {
  try {
    if (params.pendingCount === 0) {
      return { success: true }; // Don't send if queue is empty
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `[${APP_NAME}] ${params.pendingCount} items awaiting review`,
      html: getQueueDigestEmailHtml(params),
    });

    if (error) {
      console.error("[Email] Queue digest send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Queue digest email template
 */
function getQueueDigestEmailHtml(params: {
  userName?: string;
  pendingCount: number;
  highPriorityCount: number;
  recentItems: Array<{ title: string; url: string; source?: string }>;
}): string {
  const greeting = params.userName ? `Hi ${params.userName},` : "Hi Admin,";

  const itemsList = params.recentItems
    .slice(0, 5)
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
          <p style="margin: 0 0 4px 0; color: #18181b; font-weight: 500;">
            ${item.title}
          </p>
          <p style="margin: 0; color: #71717a; font-size: 13px;">
            ${item.source ? `From: ${item.source}` : item.url}
          </p>
        </td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      Discovery Queue Summary
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      Here's a summary of items waiting for your review.
    </p>

    <!-- Stats -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td width="50%" style="padding: 16px; background: #f4f4f5; border-radius: 8px 0 0 8px; text-align: center;">
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #2563eb;">
            ${params.pendingCount}
          </p>
          <p style="margin: 4px 0 0 0; color: #52525b; font-size: 14px;">
            Pending Review
          </p>
        </td>
        <td width="50%" style="padding: 16px; background: #fef3c7; border-radius: 0 8px 8px 0; text-align: center;">
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #d97706;">
            ${params.highPriorityCount}
          </p>
          <p style="margin: 4px 0 0 0; color: #92400e; font-size: 14px;">
            High Priority
          </p>
        </td>
      </tr>
    </table>

    <!-- Recent Items -->
    ${
      params.recentItems.length > 0
        ? `
    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
      Recent Discoveries
    </h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      ${itemsList}
    </table>
    `
        : ""
    }

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${APP_URL}/dashboard/resources/queue" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Review Queue
          </a>
        </td>
      </tr>
    </table>
  `;

  return getEmailWrapper(content);
}

/**
 * Send discovery completion notification
 */
export async function sendDiscoveryCompleteEmail(
  params: AdminNotificationParams & {
    runId: string;
    sourcesProcessed: number;
    totalDiscovered: number;
    totalQueued: number;
    errors: number;
  }
): Promise<EmailResult> {
  try {
    const status = params.errors > 0 ? "completed with errors" : "completed successfully";

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `[${APP_NAME}] Discovery ${status} - ${params.totalQueued} new items`,
      html: getDiscoveryCompleteEmailHtml(params),
    });

    if (error) {
      console.error("[Email] Discovery complete send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Discovery completion email template
 */
function getDiscoveryCompleteEmailHtml(params: {
  userName?: string;
  runId: string;
  sourcesProcessed: number;
  totalDiscovered: number;
  totalQueued: number;
  errors: number;
}): string {
  const greeting = params.userName ? `Hi ${params.userName},` : "Hi Admin,";
  const hasErrors = params.errors > 0;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: ${hasErrors ? "#fef3c7" : "#d1fae5"}; padding: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="${hasErrors ? "#d97706" : "#059669"}" stroke-width="2" style="width: 24px; height: 24px;">
          ${
            hasErrors
              ? '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
              : '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />'
          }
        </svg>
      </div>
    </div>

    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
      Discovery Run ${hasErrors ? "Completed with Warnings" : "Successful"}
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      A scheduled discovery run has completed. Here's the summary:
    </p>

    <!-- Stats Grid -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td width="33%" style="padding: 16px; background: #f4f4f5; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
            ${params.sourcesProcessed}
          </p>
          <p style="margin: 4px 0 0 0; color: #52525b; font-size: 13px;">
            Sources
          </p>
        </td>
        <td width="4px"></td>
        <td width="33%" style="padding: 16px; background: #dbeafe; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">
            ${params.totalDiscovered}
          </p>
          <p style="margin: 4px 0 0 0; color: #1d4ed8; font-size: 13px;">
            Discovered
          </p>
        </td>
        <td width="4px"></td>
        <td width="33%" style="padding: 16px; background: #d1fae5; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">
            ${params.totalQueued}
          </p>
          <p style="margin: 4px 0 0 0; color: #047857; font-size: 13px;">
            Queued
          </p>
        </td>
      </tr>
    </table>

    ${
      hasErrors
        ? `
    <div style="padding: 12px 16px; background: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ⚠️ ${params.errors} source(s) encountered errors during discovery.
        <a href="${APP_URL}/dashboard/resources/analytics" style="color: #d97706; text-decoration: underline;">View details</a>
      </p>
    </div>
    `
        : ""
    }

    <p style="margin: 0 0 24px 0; color: #71717a; font-size: 13px;">
      Run ID: <code style="background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${params.runId}</code>
    </p>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${APP_URL}/dashboard/resources/queue" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Review New Items
          </a>
        </td>
      </tr>
    </table>
  `;

  return getEmailWrapper(content);
}

/**
 * Send high priority alert email
 */
export async function sendHighPriorityAlertEmail(
  params: AdminNotificationParams & {
    resourceTitle: string;
    resourceUrl: string;
    reason: string;
    source?: string;
  }
): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `[${APP_NAME}] 🔔 High Priority: ${params.resourceTitle}`,
      html: getHighPriorityAlertEmailHtml(params),
    });

    if (error) {
      console.error("[Email] High priority alert send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * High priority alert email template
 */
function getHighPriorityAlertEmailHtml(params: {
  userName?: string;
  resourceTitle: string;
  resourceUrl: string;
  reason: string;
  source?: string;
}): string {
  const greeting = params.userName ? `Hi ${params.userName},` : "Hi Admin,";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(to bottom right, #f97316, #ef4444); padding: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    </div>

    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
      High Priority Resource Discovered
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      A high-priority resource has been discovered and requires your immediate attention.
    </p>

    <!-- Resource Card -->
    <div style="padding: 20px; background: #f4f4f5; border-radius: 12px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #18181b;">
        ${params.resourceTitle}
      </h3>
      <p style="margin: 0 0 12px 0; color: #2563eb; font-size: 14px; word-break: break-all;">
        <a href="${params.resourceUrl}" style="color: #2563eb; text-decoration: none;">${params.resourceUrl}</a>
      </p>
      ${params.source ? `<p style="margin: 0 0 12px 0; color: #71717a; font-size: 13px;">Source: ${params.source}</p>` : ""}
      <div style="padding: 12px; background: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>Priority Reason:</strong> ${params.reason}
        </p>
      </div>
    </div>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background: linear-gradient(to right, #f97316, #ef4444); border-radius: 8px;">
          <a href="${APP_URL}/dashboard/resources/queue" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Review Now
          </a>
        </td>
      </tr>
    </table>
  `;

  return getEmailWrapper(content);
}

/**
 * Send import completion notification
 */
export async function sendImportCompleteEmail(
  params: AdminNotificationParams & {
    totalEntries: number;
    imported: number;
    duplicates: number;
    errors: number;
    format: string;
  }
): Promise<EmailResult> {
  try {
    const status = params.errors > 0 ? "completed with errors" : "completed";

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `[${APP_NAME}] Import ${status} - ${params.imported} items imported`,
      html: getImportCompleteEmailHtml(params),
    });

    if (error) {
      console.error("[Email] Import complete send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Import completion email template
 */
function getImportCompleteEmailHtml(params: {
  userName?: string;
  totalEntries: number;
  imported: number;
  duplicates: number;
  errors: number;
  format: string;
}): string {
  const greeting = params.userName ? `Hi ${params.userName},` : "Hi Admin,";
  const hasErrors = params.errors > 0;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      ${params.format.toUpperCase()} Import ${hasErrors ? "Completed with Errors" : "Successful"}
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      Your batch import has been processed. Here's the summary:
    </p>

    <!-- Stats Grid -->
    <table role="presentation" width="100%" cellspacing="4" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td width="25%" style="padding: 16px; background: #f4f4f5; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
            ${params.totalEntries}
          </p>
          <p style="margin: 4px 0 0 0; color: #52525b; font-size: 12px;">
            Total
          </p>
        </td>
        <td width="25%" style="padding: 16px; background: #d1fae5; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">
            ${params.imported}
          </p>
          <p style="margin: 4px 0 0 0; color: #047857; font-size: 12px;">
            Imported
          </p>
        </td>
        <td width="25%" style="padding: 16px; background: #fef3c7; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #d97706;">
            ${params.duplicates}
          </p>
          <p style="margin: 4px 0 0 0; color: #92400e; font-size: 12px;">
            Duplicates
          </p>
        </td>
        <td width="25%" style="padding: 16px; background: #fee2e2; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">
            ${params.errors}
          </p>
          <p style="margin: 4px 0 0 0; color: #b91c1c; font-size: 12px;">
            Errors
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${APP_URL}/dashboard/resources/queue" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            Review Imported Items
          </a>
        </td>
      </tr>
    </table>
  `;

  return getEmailWrapper(content);
}
