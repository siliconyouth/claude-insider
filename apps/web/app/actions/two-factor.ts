"use server";

/**
 * Two-Factor Authentication Server Actions
 *
 * Handle TOTP-based 2FA setup, verification, and backup codes.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = "Claude Insider";

/**
 * Generate a new TOTP secret for setup
 */
export async function generateTwoFactorSecret(): Promise<{
  secret?: string;
  qrCodeUrl?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if 2FA is already enabled
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorEnabled, email")
      .eq("id", session.user.id)
      .single();

    if (user?.twoFactorEnabled) {
      return { error: "Two-factor authentication is already enabled" };
    }

    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Generate the otpauth URL
    const otpauthUrl = authenticator.keyuri(
      user?.email || session.user.email || "user",
      APP_NAME,
      secret
    );

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store the secret temporarily (not enabled yet)
    await supabase
      .from("user")
      .update({ twoFactorSecret: secret })
      .eq("id", session.user.id);

    return { secret, qrCodeUrl };
  } catch (error) {
    console.error("[2FA] Generate secret error:", error);
    return { error: "Failed to generate 2FA secret" };
  }
}

/**
 * Verify TOTP code and enable 2FA
 */
export async function enableTwoFactor(code: string): Promise<{
  success?: boolean;
  backupCodes?: string[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get the pending secret
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorSecret, twoFactorEnabled")
      .eq("id", session.user.id)
      .single();

    if (!user?.twoFactorSecret) {
      return { error: "No 2FA setup in progress. Please start again." };
    }

    if (user.twoFactorEnabled) {
      return { error: "Two-factor authentication is already enabled" };
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return { error: "Invalid verification code. Please try again." };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA
    const { error } = await supabase
      .from("user")
      .update({
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
        twoFactorVerifiedAt: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("[2FA] Enable error:", error);
      return { error: "Failed to enable 2FA" };
    }

    return { success: true, backupCodes };
  } catch (error) {
    console.error("[2FA] Enable error:", error);
    return { error: "Failed to enable 2FA" };
  }
}

/**
 * Disable 2FA for the current user
 */
export async function disableTwoFactor(code: string): Promise<{
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

    // Get the current secret
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorSecret, twoFactorEnabled")
      .eq("id", session.user.id)
      .single();

    if (!user?.twoFactorEnabled) {
      return { error: "Two-factor authentication is not enabled" };
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return { error: "Invalid verification code" };
    }

    // Disable 2FA
    const { error } = await supabase
      .from("user")
      .update({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorVerifiedAt: null,
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("[2FA] Disable error:", error);
      return { error: "Failed to disable 2FA" };
    }

    return { success: true };
  } catch (error) {
    console.error("[2FA] Disable error:", error);
    return { error: "Failed to disable 2FA" };
  }
}

/**
 * Verify a TOTP code (for login)
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get the user's secret
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorSecret, twoFactorEnabled, twoFactorBackupCodes")
      .eq("id", userId)
      .single();

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
      return { error: "Two-factor authentication is not enabled" };
    }

    // Try TOTP code first
    const isValidTotp = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (isValidTotp) {
      return { success: true };
    }

    // Try backup code
    if (user.twoFactorBackupCodes?.includes(code)) {
      // Remove the used backup code
      const newCodes = user.twoFactorBackupCodes.filter(
        (c: string) => c !== code
      );
      await supabase
        .from("user")
        .update({ twoFactorBackupCodes: newCodes })
        .eq("id", userId);

      return { success: true };
    }

    return { error: "Invalid verification code" };
  } catch (error) {
    console.error("[2FA] Verify error:", error);
    return { error: "Failed to verify code" };
  }
}

/**
 * Get 2FA status for current user
 */
export async function getTwoFactorStatus(): Promise<{
  enabled?: boolean;
  backupCodesRemaining?: number;
  verifiedAt?: string;
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
      .select("twoFactorEnabled, twoFactorBackupCodes, twoFactorVerifiedAt")
      .eq("id", session.user.id)
      .single();

    if (error) {
      return { error: "Failed to get 2FA status" };
    }

    return {
      enabled: user?.twoFactorEnabled || false,
      backupCodesRemaining: user?.twoFactorBackupCodes?.length || 0,
      verifiedAt: user?.twoFactorVerifiedAt,
    };
  } catch (error) {
    console.error("[2FA] Status error:", error);
    return { error: "Failed to get 2FA status" };
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(code: string): Promise<{
  backupCodes?: string[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get the current secret
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorSecret, twoFactorEnabled")
      .eq("id", session.user.id)
      .single();

    if (!user?.twoFactorEnabled) {
      return { error: "Two-factor authentication is not enabled" };
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return { error: "Invalid verification code" };
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();

    // Update the backup codes
    const { error } = await supabase
      .from("user")
      .update({ twoFactorBackupCodes: backupCodes })
      .eq("id", session.user.id);

    if (error) {
      return { error: "Failed to regenerate backup codes" };
    }

    return { backupCodes };
  } catch (error) {
    console.error("[2FA] Regenerate codes error:", error);
    return { error: "Failed to regenerate backup codes" };
  }
}

/**
 * Generate random backup codes
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Check if a user has 2FA enabled (for login flow)
 */
export async function checkUserHasTwoFactor(email: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("user")
      .select("twoFactorEnabled")
      .eq("email", email)
      .single();

    return data?.twoFactorEnabled || false;
  } catch {
    return false;
  }
}
