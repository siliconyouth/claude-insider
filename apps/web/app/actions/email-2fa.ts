"use server";

/**
 * Email Two-Factor Authentication Server Actions
 *
 * Handle email-based 2FA with codes and magic links.
 * Acts as a fallback when authenticator apps are unavailable.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const APP_NAME = "Claude Insider";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

// Code expires in 10 minutes
const CODE_EXPIRY_MINUTES = 10;
// Magic link expires in 15 minutes
const MAGIC_LINK_EXPIRY_MINUTES = 15;

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure random token for magic links
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ========================================
// Email 2FA Code Functions
// ========================================

/**
 * Send a 2FA code via email
 */
export async function sendEmail2FACode(options?: { type?: "login" | "verify_device" | "disable_2fa" }): Promise<{
  success?: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get user email
    const { data: user } = await supabase
      .from("user")
      .select("email, name")
      .eq("id", session.user.id)
      .single();

    if (!user?.email) {
      return { error: "User email not found" };
    }

    // Generate code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    const type = options?.type || "login";

    // Invalidate any existing codes for this user and type
    await supabase
      .from("email_2fa_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("type", type)
      .is("used_at", null);

    // Store the code
    const { error: insertError } = await supabase
      .from("email_2fa_codes")
      .insert({
        user_id: session.user.id,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[Email2FA] Insert code error:", insertError);
      return { error: "Failed to generate code" };
    }

    // Send email
    const typeLabel = type === "login" ? "sign-in" : type === "disable_2fa" ? "security change" : "device verification";
    const result = await sendEmail({
      to: user.email,
      subject: `Your ${APP_NAME} ${typeLabel} code: ${code}`,
      html: getEmail2FACodeHtml(code, user.name, typeLabel),
    });

    if (!result.success) {
      return { error: result.error || "Failed to send email" };
    }

    return { success: true, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    console.error("[Email2FA] Send code error:", error);
    return { error: "Failed to send 2FA code" };
  }
}

/**
 * Verify an email 2FA code
 */
export async function verifyEmail2FACode(code: string, type: "login" | "verify_device" | "disable_2fa" = "login"): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (!code || code.length !== 6) {
      return { error: "Please enter a 6-digit code" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Find the code
    const { data: storedCode, error: fetchError } = await supabase
      .from("email_2fa_codes")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("code", code)
      .eq("type", type)
      .is("used_at", null)
      .single();

    if (fetchError || !storedCode) {
      return { error: "Invalid or expired code" };
    }

    // Check expiry
    if (new Date(storedCode.expires_at) < new Date()) {
      return { error: "Code has expired. Please request a new one." };
    }

    // Check attempts
    if (storedCode.attempts >= storedCode.max_attempts) {
      return { error: "Too many failed attempts. Please request a new code." };
    }

    // Mark code as used
    await supabase
      .from("email_2fa_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", storedCode.id);

    return { success: true };
  } catch (error) {
    console.error("[Email2FA] Verify code error:", error);
    return { error: "Failed to verify code" };
  }
}

/**
 * Increment failed attempt count
 */
export async function incrementEmail2FAAttempts(code: string): Promise<void> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    await supabase
      .from("email_2fa_codes")
      .update({ attempts: supabase.sql`attempts + 1` })
      .eq("user_id", session.user.id)
      .eq("code", code)
      .is("used_at", null);
  } catch (error) {
    console.error("[Email2FA] Increment attempts error:", error);
  }
}

// ========================================
// Magic Link Functions
// ========================================

/**
 * Send a magic login link via email
 */
export async function sendMagicLoginLink(email?: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // If email provided, look up user by email (for login flow)
    // Otherwise use current session
    let userId: string;
    let userEmail: string;
    let userName: string | undefined;

    if (email) {
      const { data: user } = await supabase
        .from("user")
        .select("id, email, name, email2FAEnabled, twoFactorEnabled")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (!user) {
        // Don't reveal if email exists
        return { success: true };
      }

      // Only allow magic links for users with email 2FA enabled
      if (!user.email2FAEnabled && !user.twoFactorEnabled) {
        return { error: "Email login not enabled for this account" };
      }

      userId = user.id;
      userEmail = user.email;
      userName = user.name;
    } else {
      const session = await getSession();
      if (!session?.user?.id) {
        return { error: "You must be signed in" };
      }

      const { data: user } = await supabase
        .from("user")
        .select("email, name")
        .eq("id", session.user.id)
        .single();

      if (!user) {
        return { error: "User not found" };
      }

      userId = session.user.id;
      userEmail = user.email;
      userName = user.name;
    }

    // Generate magic link token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing magic links for this user
    await supabase
      .from("magic_login_links")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("used_at", null);

    // Store the magic link
    const { error: insertError } = await supabase
      .from("magic_login_links")
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[Email2FA] Insert magic link error:", insertError);
      return { error: "Failed to create magic link" };
    }

    // Build the magic link URL
    const magicLinkUrl = `${APP_URL}/auth/magic-link?token=${token}`;

    // Send email
    const result = await sendEmail({
      to: userEmail,
      subject: `Sign in to ${APP_NAME}`,
      html: getMagicLinkEmailHtml(magicLinkUrl, userName),
    });

    if (!result.success) {
      return { error: result.error || "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email2FA] Send magic link error:", error);
    return { error: "Failed to send magic link" };
  }
}

/**
 * Verify a magic login link token
 */
export async function verifyMagicLink(token: string): Promise<{
  success?: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    if (!token) {
      return { error: "Invalid token" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Find the magic link
    const { data: link, error: fetchError } = await supabase
      .from("magic_login_links")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (fetchError || !link) {
      return { error: "Invalid or expired link" };
    }

    // Check expiry
    if (new Date(link.expires_at) < new Date()) {
      return { error: "This link has expired. Please request a new one." };
    }

    // Mark as used
    await supabase
      .from("magic_login_links")
      .update({ used_at: new Date().toISOString() })
      .eq("id", link.id);

    return { success: true, userId: link.user_id };
  } catch (error) {
    console.error("[Email2FA] Verify magic link error:", error);
    return { error: "Failed to verify link" };
  }
}

// ========================================
// Email 2FA Management
// ========================================

/**
 * Enable email 2FA for current user
 */
export async function enableEmail2FA(): Promise<{
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

    // Check if user has verified email
    const { data: user } = await supabase
      .from("user")
      .select("emailVerified, email")
      .eq("id", session.user.id)
      .single();

    if (!user?.emailVerified) {
      return { error: "Please verify your email address first" };
    }

    // Enable email 2FA
    const { error } = await supabase
      .from("user")
      .update({
        email2FAEnabled: true,
        mfaSetupRequired: false,
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("[Email2FA] Enable error:", error);
      return { error: "Failed to enable email 2FA" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email2FA] Enable error:", error);
    return { error: "Failed to enable email 2FA" };
  }
}

/**
 * Disable email 2FA for current user
 * Requires verification with either TOTP or email code
 */
export async function disableEmail2FA(verificationCode: string): Promise<{
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

    // Check if user has other 2FA methods
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorEnabled")
      .eq("id", session.user.id)
      .single();

    const { data: devices } = await supabase
      .from("two_factor_devices")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("is_verified", true);

    // Must have at least one other 2FA method
    const hasOtherMFA = user?.twoFactorEnabled || (devices && devices.length > 0);
    if (!hasOtherMFA) {
      return { error: "You must have at least one 2FA method enabled" };
    }

    // Verify the code
    const result = await verifyEmail2FACode(verificationCode, "disable_2fa");
    if (!result.success) {
      return { error: result.error || "Invalid verification code" };
    }

    // Disable email 2FA
    const { error } = await supabase
      .from("user")
      .update({ email2FAEnabled: false })
      .eq("id", session.user.id);

    if (error) {
      console.error("[Email2FA] Disable error:", error);
      return { error: "Failed to disable email 2FA" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email2FA] Disable error:", error);
    return { error: "Failed to disable email 2FA" };
  }
}

/**
 * Get email 2FA status for current user
 */
export async function getEmail2FAStatus(): Promise<{
  enabled?: boolean;
  emailVerified?: boolean;
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
      .select("email2FAEnabled, emailVerified")
      .eq("id", session.user.id)
      .single();

    if (error) {
      return { error: "Failed to get status" };
    }

    return {
      enabled: user?.email2FAEnabled || false,
      emailVerified: user?.emailVerified || false,
    };
  } catch (error) {
    console.error("[Email2FA] Status error:", error);
    return { error: "Failed to get status" };
  }
}

/**
 * Check if user has any MFA enabled (for login flow)
 */
export async function checkUserMFAStatus(email: string): Promise<{
  hasTOTP?: boolean;
  hasEmail2FA?: boolean;
  hasPasskeys?: boolean;
  mfaRequired?: boolean;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: user } = await supabase
      .from("user")
      .select("id, twoFactorEnabled, email2FAEnabled, mfaSetupRequired")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user) {
      // Don't reveal if user exists
      return { mfaRequired: false };
    }

    // Check for passkeys
    const { data: passkeys } = await supabase
      .from("passkeys")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    // Check for TOTP devices
    const { data: devices } = await supabase
      .from("two_factor_devices")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_verified", true)
      .limit(1);

    const hasTOTP = user.twoFactorEnabled || (devices && devices.length > 0);
    const hasEmail2FA = user.email2FAEnabled || false;
    const hasPasskeys = passkeys && passkeys.length > 0;

    return {
      hasTOTP,
      hasEmail2FA,
      hasPasskeys,
      mfaRequired: user.mfaSetupRequired,
    };
  } catch (error) {
    console.error("[Email2FA] Check MFA status error:", error);
    return { error: "Failed to check MFA status" };
  }
}

// ========================================
// Email Templates
// ========================================

/**
 * Email template for 2FA code
 */
function getEmail2FACodeHtml(code: string, userName?: string, typeLabel: string = "sign-in"): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                Your ${typeLabel} code
              </h2>
              <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6; text-align: center;">
                ${greeting}<br><br>
                Use the code below to complete your ${typeLabel}:
              </p>

              <!-- Code Box -->
              <div style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 12px; padding: 4px; margin: 0 auto 24px auto; max-width: 280px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 20px; text-align: center;">
                  <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">
                    ${code}
                  </span>
                </div>
              </div>

              <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px; text-align: center;">
                This code expires in <strong>${CODE_EXPIRY_MINUTES} minutes</strong>.
              </p>

              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

              <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">
                If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
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
 * Email template for magic login link
 */
function getMagicLinkEmailHtml(magicLinkUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

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
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(to bottom right, #7c3aed, #2563eb); padding: 12px;">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" style="width: 24px; height: 24px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                Sign in to ${APP_NAME}
              </h2>
              <p style="margin: 0 0 24px 0; color: #52525b; line-height: 1.6; text-align: center;">
                ${greeting}<br><br>
                Click the button below to securely sign in to your account. No password required!
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
                    <a href="${magicLinkUrl}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Sign In Securely
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px; text-align: center;">
                This link expires in <strong>${MAGIC_LINK_EXPIRY_MINUTES} minutes</strong> and can only be used once.
              </p>

              <p style="margin: 0 0 16px 0; color: #71717a; font-size: 13px; text-align: center;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 0 0 24px 0; color: #2563eb; font-size: 12px; word-break: break-all; text-align: center;">
                ${magicLinkUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

              <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">
                If you didn't request this link, you can safely ignore this email. Your account is secure.
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
