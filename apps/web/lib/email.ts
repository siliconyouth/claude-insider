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
