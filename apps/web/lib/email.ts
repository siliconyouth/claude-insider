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
