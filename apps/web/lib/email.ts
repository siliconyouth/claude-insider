/**
 * Email Service using Resend
 *
 * Handles transactional emails for authentication and notifications.
 * Uses React Email templates for consistent branding.
 *
 * CMS Integration (v0.92.0):
 * Email templates can now be managed via Payload CMS at /admin/collections/email-templates
 * When a CMS template exists and is active, it takes precedence over hardcoded templates.
 * Fallback to hardcoded templates ensures emails always work even if CMS is unavailable.
 */

import { Resend } from "resend";
import { tryCmsTemplate, EMAIL_TEMPLATE_SLUGS } from "./email-templates";

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

interface BulkEmailParams {
  emails: string[];
  subject: string;
  html: string;
  text?: string;
}

interface BulkEmailResult {
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send bulk emails (for admin notifications)
 * Uses Resend batch API for efficiency
 */
export async function sendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult> {
  const result: BulkEmailResult = { sent: 0, failed: 0, errors: [] };

  if (params.emails.length === 0) {
    return result;
  }

  try {
    // Resend batch API supports up to 100 emails per request
    const batchSize = 100;
    for (let i = 0; i < params.emails.length; i += batchSize) {
      const batch = params.emails.slice(i, i + batchSize);

      const emails = batch.map((email) => ({
        from: FROM_EMAIL,
        to: email,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }));

      try {
        const { data, error } = await resend.batch.send(emails);

        if (error) {
          console.error("[Email] Batch send error:", error);
          result.failed += batch.length;
          result.errors.push(error.message);
        } else if (data) {
          result.sent += data.data?.length || batch.length;
        }
      } catch (batchError) {
        console.error("[Email] Batch error:", batchError);
        result.failed += batch.length;
        result.errors.push((batchError as Error).message || "Batch send failed");
      }
    }

    return result;
  } catch (error) {
    console.error("[Email] Bulk email error:", error);
    result.failed = params.emails.length;
    result.errors.push((error as Error).message || "Bulk email failed");
    return result;
  }
}

/**
 * Send email verification link
 * Supports CMS template override via slug 'verification'
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  userName?: string
): Promise<EmailResult> {
  try {
    // Try CMS template first, fall back to hardcoded
    const template = await tryCmsTemplate(
      EMAIL_TEMPLATE_SLUGS.VERIFICATION,
      {
        userName: userName || 'there',
        verificationUrl,
      },
      () => ({
        subject: `Verify your ${APP_NAME} account`,
        html: getVerificationEmailHtml(verificationUrl, userName),
      })
    );

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
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
 * Supports CMS template override via slug 'password-reset'
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string
): Promise<EmailResult> {
  try {
    // Try CMS template first, fall back to hardcoded
    const template = await tryCmsTemplate(
      EMAIL_TEMPLATE_SLUGS.PASSWORD_RESET,
      {
        userName: userName || 'there',
        resetUrl,
      },
      () => ({
        subject: `Reset your ${APP_NAME} password`,
        html: getPasswordResetEmailHtml(resetUrl, userName),
      })
    );

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
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
 * Supports CMS template override via slug 'welcome'
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<EmailResult> {
  try {
    // Try CMS template first, fall back to hardcoded
    const template = await tryCmsTemplate(
      EMAIL_TEMPLATE_SLUGS.WELCOME,
      {
        userName: userName || 'there',
      },
      () => ({
        subject: `Welcome to ${APP_NAME}!`,
        html: getWelcomeEmailHtml(userName),
      })
    );

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
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
 * Email verification template (link only - legacy)
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
 * Enhanced email verification template with both link and code
 */
function getVerificationEmailWithCodeHtml(verificationUrl: string, code: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      Verify your email address
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      Thanks for signing up for ${APP_NAME}! You can verify your email using either method below:
    </p>

    <!-- Option 1: Click Button -->
    <div style="padding: 20px; background: #f4f4f5; border-radius: 12px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
        Option 1: Click the button
      </h3>
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify Email
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Option 2: Enter Code -->
    <div style="padding: 20px; background: #dbeafe; border-radius: 12px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1d4ed8;">
        Option 2: Enter verification code
      </h3>
      <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 14px;">
        Enter this code on the verification page:
      </p>
      <div style="background: #ffffff; border-radius: 8px; padding: 16px; text-align: center;">
        <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8;">
          ${code}
        </span>
      </div>
      <p style="margin: 16px 0 0 0; color: #1e40af; font-size: 13px; text-align: center;">
        This code expires in <strong>1 hour</strong>
      </p>
    </div>

    <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: #2563eb; font-size: 14px; word-break: break-all;">
      <a href="${verificationUrl}" style="color: #2563eb; text-decoration: none;">${verificationUrl}</a>
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  return getEmailWrapper(content);
}

/**
 * Send email verification with both link and code
 * Supports CMS template override via slug 'verification-code'
 */
export async function sendVerificationEmailWithCode(
  email: string,
  verificationUrl: string,
  code: string,
  userName?: string
): Promise<EmailResult> {
  try {
    // Try CMS template first, fall back to hardcoded
    const template = await tryCmsTemplate(
      EMAIL_TEMPLATE_SLUGS.VERIFICATION_CODE,
      {
        userName: userName || 'there',
        verificationUrl,
        verificationCode: code,
      },
      () => ({
        subject: `Verify your ${APP_NAME} account - Code: ${code}`,
        html: getVerificationEmailWithCodeHtml(verificationUrl, code, userName),
      })
    );

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("[Email] Verification with code send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
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
// User Digest Emails
// ================================

export interface DigestEmailParams {
  email: string;
  userName?: string;
  frequency: "daily" | "weekly" | "monthly";
  period: string; // e.g., "Dec 8-15, 2025"
  stats: {
    newComments: number;
    newReplies: number;
    newFollowers: number;
    newMentions: number;
    suggestionsUpdated: number;
  };
  highlights: Array<{
    type: "comment" | "reply" | "follow" | "mention" | "suggestion";
    title: string;
    message: string;
    url?: string;
    actorName?: string;
    timestamp: string;
  }>;
}

/**
 * Send activity digest email to user
 */
export async function sendDigestEmail(params: DigestEmailParams): Promise<EmailResult> {
  try {
    const frequencyLabel = params.frequency.charAt(0).toUpperCase() + params.frequency.slice(1);
    const subject = `Your ${frequencyLabel} ${APP_NAME} Digest - ${params.period}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject,
      html: getDigestEmailHtml(params),
    });

    if (error) {
      console.error("[Email] Digest send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Digest email template
 */
function getDigestEmailHtml(params: DigestEmailParams): string {
  const greeting = params.userName ? `Hi ${params.userName},` : "Hi there,";
  const frequencyLabel = params.frequency.charAt(0).toUpperCase() + params.frequency.slice(1);

  const totalActivity =
    params.stats.newComments +
    params.stats.newReplies +
    params.stats.newFollowers +
    params.stats.newMentions +
    params.stats.suggestionsUpdated;

  // Build highlights list
  const highlightsList = params.highlights
    .slice(0, 5)
    .map((h) => {
      const icon = getDigestHighlightIcon(h.type);
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="40" valign="top">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #f4f4f5; display: flex; align-items: center; justify-content: center;">
                    ${icon}
                  </div>
                </td>
                <td style="padding-left: 12px;">
                  <p style="margin: 0 0 4px 0; color: #18181b; font-weight: 500; font-size: 14px;">
                    ${h.title}
                  </p>
                  <p style="margin: 0; color: #71717a; font-size: 13px;">
                    ${h.message}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      Your ${frequencyLabel} Activity Digest
    </h2>
    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">
      ${params.period}
    </p>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      Here's what happened on ${APP_NAME} ${params.frequency === "daily" ? "today" : params.frequency === "weekly" ? "this week" : "this month"}.
    </p>

    <!-- Stats Grid -->
    ${totalActivity > 0 ? `
    <table role="presentation" width="100%" cellspacing="4" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        ${params.stats.newComments > 0 ? `
        <td style="padding: 16px; background: #dbeafe; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">
            ${params.stats.newComments}
          </p>
          <p style="margin: 4px 0 0 0; color: #1d4ed8; font-size: 12px;">
            New Comments
          </p>
        </td>
        ` : ""}
        ${params.stats.newReplies > 0 ? `
        <td style="padding: 16px; background: #d1fae5; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">
            ${params.stats.newReplies}
          </p>
          <p style="margin: 4px 0 0 0; color: #047857; font-size: 12px;">
            New Replies
          </p>
        </td>
        ` : ""}
        ${params.stats.newFollowers > 0 ? `
        <td style="padding: 16px; background: #fce7f3; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #db2777;">
            ${params.stats.newFollowers}
          </p>
          <p style="margin: 4px 0 0 0; color: #be185d; font-size: 12px;">
            New Followers
          </p>
        </td>
        ` : ""}
        ${params.stats.newMentions > 0 ? `
        <td style="padding: 16px; background: #fef3c7; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #d97706;">
            ${params.stats.newMentions}
          </p>
          <p style="margin: 4px 0 0 0; color: #92400e; font-size: 12px;">
            Mentions
          </p>
        </td>
        ` : ""}
      </tr>
    </table>
    ` : `
    <div style="padding: 24px; background: #f4f4f5; border-radius: 12px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; color: #52525b; font-size: 14px;">
        No new activity this ${params.frequency === "daily" ? "day" : params.frequency === "weekly" ? "week" : "month"}. Check back later!
      </p>
    </div>
    `}

    <!-- Highlights -->
    ${params.highlights.length > 0 ? `
    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
      Recent Highlights
    </h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      ${highlightsList}
    </table>
    ` : ""}

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${APP_URL}/notifications" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            View All Activity
          </a>
        </td>
      </tr>
    </table>

    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
    <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">
      You're receiving this digest because you enabled ${params.frequency} email digests.
      <a href="${APP_URL}/settings" style="color: #2563eb; text-decoration: none;">Change frequency</a> or
      <a href="${APP_URL}/settings" style="color: #2563eb; text-decoration: none;">unsubscribe</a>
    </p>
  `;

  return getEmailWrapper(content);
}

/**
 * Get icon for digest highlight type
 */
function getDigestHighlightIcon(type: DigestEmailParams["highlights"][0]["type"]): string {
  switch (type) {
    case "comment":
    case "reply":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563eb" stroke-width="2" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>`;
    case "follow":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#db2777" stroke-width="2" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>`;
    case "mention":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#d97706" stroke-width="2" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>`;
    case "suggestion":
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#059669" stroke-width="2" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#71717a" stroke-width="2" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>`;
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

// ================================
// Beta Feedback Emails
// ================================

export interface FeedbackEmailParams {
  feedbackId: string;
  feedbackType: "bug" | "feature" | "general";
  title: string;
  description: string;
  severity?: string;
  pageUrl?: string;
  userAgent?: string;
  consoleLogs?: Array<{ type: string; message: string; timestamp: string }>;
  browserInfo?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenSize?: string;
    timestamp?: string;
  };
  submitter: {
    name: string;
    email: string;
  };
}

/**
 * Send feedback notification to admins
 */
export async function sendFeedbackAdminEmail(
  adminEmail: string,
  adminName: string | undefined,
  params: FeedbackEmailParams
): Promise<EmailResult> {
  try {
    const typeLabel = params.feedbackType === "bug" ? "🐛 Bug Report" : params.feedbackType === "feature" ? "✨ Feature Request" : "💬 Feedback";
    const subject = `[${APP_NAME}] ${typeLabel}: ${params.title}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject,
      html: getFeedbackAdminEmailHtml(params, adminName),
    });

    if (error) {
      console.error("[Email] Feedback admin send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send feedback confirmation email to submitter
 */
export async function sendFeedbackConfirmationEmail(
  params: FeedbackEmailParams
): Promise<EmailResult> {
  try {
    const typeLabel = params.feedbackType === "bug" ? "Bug Report" : params.feedbackType === "feature" ? "Feature Request" : "Feedback";
    const subject = `[${APP_NAME}] Your ${typeLabel} Was Received`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.submitter.email,
      subject,
      html: getFeedbackConfirmationEmailHtml(params),
    });

    if (error) {
      console.error("[Email] Feedback confirmation send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Admin feedback notification email template
 */
function getFeedbackAdminEmailHtml(params: FeedbackEmailParams, adminName?: string): string {
  const greeting = adminName ? `Hi ${adminName},` : "Hi Admin,";
  const typeLabel = params.feedbackType === "bug" ? "Bug Report" : params.feedbackType === "feature" ? "Feature Request" : "General Feedback";
  const typeColor = params.feedbackType === "bug" ? "#dc2626" : params.feedbackType === "feature" ? "#7c3aed" : "#2563eb";
  const typeBgColor = params.feedbackType === "bug" ? "#fee2e2" : params.feedbackType === "feature" ? "#ede9fe" : "#dbeafe";

  // Build console logs summary
  let consoleLogsHtml = "";
  if (params.consoleLogs && params.consoleLogs.length > 0) {
    const errorCount = params.consoleLogs.filter(l => l.type === "error").length;
    const warnCount = params.consoleLogs.filter(l => l.type === "warn").length;
    const recentErrors = params.consoleLogs
      .filter(l => l.type === "error" || l.type === "warn")
      .slice(0, 5)
      .map(l => `<li style="color: ${l.type === "error" ? "#dc2626" : "#d97706"}; font-size: 12px; word-break: break-all;">[${l.type.toUpperCase()}] ${l.message.slice(0, 200)}${l.message.length > 200 ? "..." : ""}</li>`)
      .join("");

    consoleLogsHtml = `
      <div style="margin-top: 16px; padding: 16px; background: #1a1a1a; border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; color: #f4f4f5; font-size: 14px; font-weight: 600;">
          Console Logs (${params.consoleLogs.length} total)
        </h4>
        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
          ${errorCount > 0 ? `<span style="color: #ef4444; font-size: 13px;">🔴 ${errorCount} errors</span>` : ""}
          ${warnCount > 0 ? `<span style="color: #f59e0b; font-size: 13px;">🟡 ${warnCount} warnings</span>` : ""}
        </div>
        ${recentErrors ? `<ul style="margin: 0; padding-left: 16px; list-style-type: disc;">${recentErrors}</ul>` : ""}
      </div>
    `;
  }

  // Build browser info section
  let browserInfoHtml = "";
  if (params.browserInfo) {
    browserInfoHtml = `
      <div style="margin-top: 16px; padding: 16px; background: #f4f4f5; border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; color: #18181b; font-size: 14px; font-weight: 600;">
          Browser Information
        </h4>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #52525b;">
          ${params.browserInfo.platform ? `<tr><td style="padding: 4px 0;"><strong>Platform:</strong></td><td style="padding: 4px 0 4px 16px;">${params.browserInfo.platform}</td></tr>` : ""}
          ${params.browserInfo.screenSize ? `<tr><td style="padding: 4px 0;"><strong>Screen:</strong></td><td style="padding: 4px 0 4px 16px;">${params.browserInfo.screenSize}</td></tr>` : ""}
          ${params.browserInfo.language ? `<tr><td style="padding: 4px 0;"><strong>Language:</strong></td><td style="padding: 4px 0 4px 16px;">${params.browserInfo.language}</td></tr>` : ""}
        </table>
      </div>
    `;
  }

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background: ${typeBgColor}; border-radius: 24px;">
        <span style="color: ${typeColor}; font-weight: 600; font-size: 14px;">
          ${params.feedbackType === "bug" ? "🐛" : params.feedbackType === "feature" ? "✨" : "💬"} ${typeLabel}
        </span>
      </div>
    </div>

    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
      ${params.title}
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${greeting}<br><br>
      A new feedback submission has been received from a beta tester.
    </p>

    <!-- Submitter Info -->
    <div style="padding: 16px; background: #dbeafe; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
        <strong>Submitted by:</strong> ${params.submitter.name} (${params.submitter.email})
      </p>
    </div>

    ${params.severity ? `
    <div style="padding: 8px 16px; background: ${params.severity === "critical" ? "#fee2e2" : params.severity === "high" ? "#fef3c7" : "#f4f4f5"}; border-radius: 8px; margin-bottom: 16px; display: inline-block;">
      <span style="color: ${params.severity === "critical" ? "#dc2626" : params.severity === "high" ? "#d97706" : "#52525b"}; font-weight: 500; font-size: 13px;">
        Severity: ${params.severity.toUpperCase()}
      </span>
    </div>
    ` : ""}

    <!-- Description -->
    <div style="padding: 16px; background: #f4f4f5; border-radius: 8px; margin-bottom: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">
        Description
      </h4>
      <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
        ${params.description}
      </p>
    </div>

    ${params.pageUrl ? `
    <p style="margin: 0 0 16px 0; color: #52525b; font-size: 13px;">
      <strong>Page URL:</strong> <a href="${params.pageUrl}" style="color: #2563eb;">${params.pageUrl}</a>
    </p>
    ` : ""}

    ${browserInfoHtml}
    ${consoleLogsHtml}

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px auto 0 auto;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${APP_URL}/dashboard/feedback" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            View in Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return getEmailWrapper(content);
}

/**
 * Feedback confirmation email template for submitter
 */
function getFeedbackConfirmationEmailHtml(params: FeedbackEmailParams): string {
  const typeLabel = params.feedbackType === "bug" ? "Bug Report" : params.feedbackType === "feature" ? "Feature Request" : "Feedback";
  const typeIcon = params.feedbackType === "bug" ? "🐛" : params.feedbackType === "feature" ? "✨" : "💬";

  // Build console logs summary for user
  let consoleLogsSummary = "";
  if (params.consoleLogs && params.consoleLogs.length > 0) {
    const errorCount = params.consoleLogs.filter(l => l.type === "error").length;
    const warnCount = params.consoleLogs.filter(l => l.type === "warn").length;
    const infoCount = params.consoleLogs.filter(l => l.type === "log" || l.type === "info").length;

    consoleLogsSummary = `
      <div style="margin-top: 16px; padding: 16px; background: #f4f4f5; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">
          📋 Debug Information Included
        </h4>
        <p style="margin: 0; color: #52525b; font-size: 13px;">
          ${params.consoleLogs.length} console log entries captured
          ${errorCount > 0 ? ` (${errorCount} errors)` : ""}${warnCount > 0 ? ` (${warnCount} warnings)` : ""}${infoCount > 0 ? ` (${infoCount} info)` : ""}
        </p>
      </div>
    `;
  }

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(to bottom right, #7c3aed, #2563eb); padding: 14px;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 28px; height: 28px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>

    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
      ${typeIcon} ${typeLabel} Received
    </h2>
    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      Hi ${params.submitter.name},<br><br>
      Thank you for your ${typeLabel.toLowerCase()}! We've received your submission and our team will review it shortly.
    </p>

    <!-- Feedback Summary -->
    <div style="padding: 20px; background: #f4f4f5; border-radius: 12px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #18181b; font-size: 16px; font-weight: 600;">
        ${params.title}
      </h3>
      <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
        ${params.description.length > 500 ? params.description.slice(0, 500) + "..." : params.description}
      </p>
      ${params.severity ? `
      <p style="margin: 12px 0 0 0; color: #71717a; font-size: 13px;">
        <strong>Severity:</strong> ${params.severity}
      </p>
      ` : ""}
      ${params.pageUrl ? `
      <p style="margin: 8px 0 0 0; color: #71717a; font-size: 13px;">
        <strong>Page:</strong> ${params.pageUrl}
      </p>
      ` : ""}
    </div>

    ${consoleLogsSummary}

    <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
      ${params.feedbackType === "bug" ? "Our team will investigate this issue and work on a fix." : params.feedbackType === "feature" ? "We'll consider your suggestion for future updates." : "We appreciate you taking the time to share your thoughts with us."}
    </p>

    <p style="margin: 0 0 24px 0; color: #71717a; font-size: 14px;">
      Reference ID: <code style="background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${params.feedbackId}</code>
    </p>

    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
    <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">
      Thank you for being a beta tester and helping us improve ${APP_NAME}! 💜
    </p>
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

// ================================
// Donation Emails
// ================================

export interface DonationReceiptParams {
  email: string;
  donorName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  donationId: string;
  badgeTier: string | null;
  isFirstDonation: boolean;
  transactionDate: Date;
}

/**
 * Send donation receipt email to donor
 */
export async function sendDonationReceiptEmail(
  params: DonationReceiptParams
): Promise<EmailResult> {
  try {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: params.currency,
    }).format(params.amount);

    const subject = params.isFirstDonation
      ? `Thank you for your first donation to ${APP_NAME}! 💜`
      : `Thank you for supporting ${APP_NAME}! 💜 - ${formattedAmount}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject,
      html: emailTemplates.donationReceipt(params),
    });

    if (error) {
      console.error("[Email] Donation receipt send error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Donation receipt sent to:", params.email);
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

// ================================
// Report Email Templates
// ================================

/**
 * Email templates for moderation and reporting
 */
export const emailTemplates = {
  /**
   * Report outcome notification to the reporter
   */
  reportOutcome(params: {
    reporterName: string;
    reportType: string;
    status: string;
    actionMessage: string;
  }): string {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(to bottom right, #2563eb, #06b6d4); padding: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
        Report Update: ${params.status}
      </h2>
      <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
        Hi ${params.reporterName},<br><br>
        Thank you for your ${params.reportType} report. Our moderation team has reviewed it.
      </p>

      <div style="padding: 20px; background: #f4f4f5; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #18181b; font-size: 16px; font-weight: 600;">
          Outcome
        </h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          ${params.actionMessage}
        </p>
      </div>

      <p style="margin: 0 0 24px 0; color: #71717a; font-size: 14px;">
        We appreciate you helping keep our community safe. Your reports make a real difference.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
            <a href="${APP_URL}" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
              Continue Exploring
            </a>
          </td>
        </tr>
      </table>
    `;

    return getEmailWrapper(content);
  },

  /**
   * Content moderation notification to the reported user
   */
  /**
   * Donation receipt email to donor
   */
  donationReceipt(params: {
    donorName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    donationId: string;
    badgeTier: string | null;
    isFirstDonation: boolean;
    transactionDate: Date;
  }): string {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: params.currency,
    }).format(params.amount);

    const tierEmoji: Record<string, string> = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      platinum: "💎",
    };

    const tierBadge = params.badgeTier
      ? `
        <div style="padding: 16px; background: linear-gradient(to right, #fce7f3, #fbcfe8); border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 32px;">
            ${tierEmoji[params.badgeTier] || "💜"}
          </p>
          <p style="margin: 0; color: #be185d; font-size: 14px; font-weight: 600;">
            You&apos;ve earned the ${params.badgeTier.charAt(0).toUpperCase() + params.badgeTier.slice(1)} Supporter badge!
          </p>
          <p style="margin: 8px 0 0 0; color: #9d174d; font-size: 13px;">
            This badge is now visible on your profile.
          </p>
        </div>
      `
      : "";

    const firstDonationMessage = params.isFirstDonation
      ? `
        <div style="padding: 12px 16px; background: #d1fae5; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #047857; font-size: 14px;">
            🎉 <strong>First donation bonus!</strong> You&apos;ve also earned the "Heart of Gold" achievement!
          </p>
        </div>
      `
      : "";

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(to bottom right, #ec4899, #f43f5e); padding: 14px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width: 28px; height: 28px;">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
        Thank You For Your Donation! 💜
      </h2>

      ${tierBadge}
      ${firstDonationMessage}

      <!-- Receipt Card -->
      <div style="padding: 24px; background: #f4f4f5; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">
          Donation Receipt
        </h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #52525b;">Amount</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #18181b; font-size: 18px;">
              ${formattedAmount}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #52525b; border-top: 1px solid #e4e4e7;">Payment Method</td>
            <td style="padding: 8px 0; text-align: right; color: #18181b; border-top: 1px solid #e4e4e7;">
              ${params.paymentMethod.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #52525b; border-top: 1px solid #e4e4e7;">Date</td>
            <td style="padding: 8px 0; text-align: right; color: #18181b; border-top: 1px solid #e4e4e7;">
              ${params.transactionDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #52525b; border-top: 1px solid #e4e4e7;">Reference</td>
            <td style="padding: 8px 0; text-align: right; color: #71717a; font-family: monospace; font-size: 12px; border-top: 1px solid #e4e4e7;">
              ${params.donationId}
            </td>
          </tr>
        </table>
      </div>

      <!-- Personal Message -->
      <div style="padding: 24px; background: linear-gradient(to br, #fdf4ff, #fce7f3); border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #ec4899;">
        <p style="margin: 0 0 16px 0; color: #831843; font-size: 15px; line-height: 1.7; font-style: italic;">
          "Dear ${params.donorName},<br><br>
          Thank you from the bottom of my heart for supporting Claude Insider. Your generosity means the world to me and helps keep this project free and growing for everyone.<br><br>
          Every donation goes directly toward hosting costs, new features, and making Claude Insider better for our community. You're not just a donor—you're a vital part of what makes this project possible."
        </p>
        <p style="margin: 0; color: #9d174d; font-weight: 600;">
          — Vladimir Dukelic<br>
          <span style="font-weight: 400; font-size: 13px; color: #be185d;">Creator of Claude Insider</span>
        </p>
      </div>

      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td style="background: linear-gradient(to right, #ec4899, #f43f5e); border-radius: 8px;">
            <a href="${APP_URL}/profile" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Your Profile
            </a>
          </td>
        </tr>
      </table>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
        This receipt is for your records. If you have any questions, please contact<br>
        <a href="mailto:vladimir@dukelic.com" style="color: #ec4899; text-decoration: none;">vladimir@dukelic.com</a>
      </p>
    `;

    return getEmailWrapper(content);
  },

  contentModerated(params: {
    userName: string;
    contentType: string;
    reason: string;
    actionTaken: string;
  }): string {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: #fef3c7; padding: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#d97706" stroke-width="2" style="width: 24px; height: 24px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
        Your ${params.contentType} Has Been Reviewed
      </h2>
      <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6;">
        Hi ${params.userName},<br><br>
        We've reviewed your ${params.contentType} and found that it may have violated our community guidelines.
      </p>

      <div style="padding: 20px; background: #fef3c7; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
          Reason: ${params.reason.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </h3>
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          Action: ${params.actionTaken}
        </p>
      </div>

      <p style="margin: 0 0 24px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
        Please review our <a href="${APP_URL}/terms" style="color: #2563eb; text-decoration: none;">Terms of Service</a>
        and <a href="${APP_URL}/guidelines" style="color: #2563eb; text-decoration: none;">Community Guidelines</a>
        to ensure future content complies with our policies.
      </p>

      <p style="margin: 0 0 24px 0; color: #71717a; font-size: 14px;">
        If you believe this was a mistake, you can contact our support team.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
            <a href="${APP_URL}/settings" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Settings
            </a>
          </td>
        </tr>
      </table>
    `;

    return getEmailWrapper(content);
  },
};
