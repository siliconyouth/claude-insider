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

    // Get the current user data including email 2FA status
    const { data: user } = await supabase
      .from("user")
      .select("twoFactorSecret, twoFactorEnabled, email2FAEnabled")
      .eq("id", session.user.id)
      .single();

    if (!user?.twoFactorEnabled) {
      return { error: "Two-factor authentication is not enabled" };
    }

    // MANDATORY MFA: Check if email 2FA is enabled before allowing TOTP disable
    if (!user.email2FAEnabled) {
      return { error: "You must enable Email 2FA before disabling your authenticator app. At least one MFA method is required." };
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return { error: "Invalid verification code" };
    }

    // Disable TOTP 2FA but keep overall 2FA enabled via email 2FA
    // Clear TOTP-specific fields but keep twoFactorEnabled true
    const { error } = await supabase
      .from("user")
      .update({
        // Keep twoFactorEnabled true since email 2FA is active
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        // Keep twoFactorVerifiedAt as record of when 2FA was first set up
      })
      .eq("id", session.user.id);

    // Also delete all TOTP devices
    await supabase
      .from("two_factor_devices")
      .delete()
      .eq("user_id", session.user.id);

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

// ========================================
// Multi-Device 2FA Functions
// ========================================

/**
 * Device info returned to client
 */
export interface TwoFactorDevice {
  id: string;
  name: string;
  deviceType: string;
  isPrimary: boolean;
  isVerified: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * Get all 2FA devices for current user
 */
export async function get2FADevices(): Promise<{
  devices?: TwoFactorDevice[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("two_factor_devices")
      .select("id, device_name, device_type, is_primary, is_verified, last_used_at, created_at")
      .eq("user_id", session.user.id)
      .eq("is_verified", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[2FA] Get devices error:", error);
      return { error: "Failed to get devices" };
    }

    const devices: TwoFactorDevice[] = (data || []).map((d: {
      id: string;
      device_name: string;
      device_type: string;
      is_primary: boolean;
      is_verified: boolean;
      last_used_at: string | null;
      created_at: string;
    }) => ({
      id: d.id,
      name: d.device_name,
      deviceType: d.device_type,
      isPrimary: d.is_primary,
      isVerified: d.is_verified,
      lastUsedAt: d.last_used_at,
      createdAt: d.created_at,
    }));

    return { devices };
  } catch (error) {
    console.error("[2FA] Get devices error:", error);
    return { error: "Failed to get devices" };
  }
}

/**
 * Start adding a new 2FA device
 * Returns QR code and secret for user to scan
 */
export async function initAdd2FADevice(deviceName: string): Promise<{
  deviceId?: string;
  secret?: string;
  qrCodeUrl?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (!deviceName.trim()) {
      return { error: "Device name is required" };
    }

    if (deviceName.length > 100) {
      return { error: "Device name is too long" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get user email
    const { data: user } = await supabase
      .from("user")
      .select("email")
      .eq("id", session.user.id)
      .single();

    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Generate the otpauth URL
    const otpauthUrl = authenticator.keyuri(
      user?.email || session.user.email || "user",
      `${APP_NAME} (${deviceName.trim()})`,
      secret
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Create unverified device in database
    const { data: deviceData, error } = await supabase
      .from("two_factor_devices")
      .insert({
        user_id: session.user.id,
        device_name: deviceName.trim(),
        device_type: "totp",
        secret: secret,
        is_verified: false,
        is_primary: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[2FA] Create device error:", error);
      return { error: "Failed to create device" };
    }

    return {
      deviceId: deviceData.id,
      secret,
      qrCodeUrl,
    };
  } catch (error) {
    console.error("[2FA] Init add device error:", error);
    return { error: "Failed to start device setup" };
  }
}

/**
 * Verify and activate a new 2FA device
 */
export async function verifyAndAdd2FADevice(
  deviceId: string,
  code: string
): Promise<{
  success?: boolean;
  backupCodes?: string[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (code.length !== 6) {
      return { error: "Please enter a 6-digit code" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get the pending device
    const { data: device } = await supabase
      .from("two_factor_devices")
      .select("id, secret, is_verified")
      .eq("id", deviceId)
      .eq("user_id", session.user.id)
      .single();

    if (!device) {
      return { error: "Device not found" };
    }

    if (device.is_verified) {
      return { error: "Device is already verified" };
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: device.secret,
    });

    if (!isValid) {
      return { error: "Invalid verification code. Please try again." };
    }

    // Check if this is the first verified device
    const { data: existingDevices } = await supabase
      .from("two_factor_devices")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("is_verified", true);

    const isFirstDevice = !existingDevices || existingDevices.length === 0;

    // Verify the device
    const { error: verifyError } = await supabase
      .from("two_factor_devices")
      .update({
        is_verified: true,
        is_primary: isFirstDevice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId)
      .eq("user_id", session.user.id);

    if (verifyError) {
      console.error("[2FA] Verify device error:", verifyError);
      return { error: "Failed to verify device" };
    }

    // If first device, enable 2FA on user and generate backup codes
    let backupCodes: string[] | undefined;
    if (isFirstDevice) {
      backupCodes = generateBackupCodes();

      await supabase
        .from("user")
        .update({
          twoFactorEnabled: true,
          twoFactorSecret: device.secret, // Store primary secret for backward compat
          twoFactorBackupCodes: backupCodes,
          twoFactorVerifiedAt: new Date().toISOString(),
        })
        .eq("id", session.user.id);
    }

    return { success: true, backupCodes };
  } catch (error) {
    console.error("[2FA] Verify device error:", error);
    return { error: "Failed to verify device" };
  }
}

/**
 * Rename a 2FA device
 */
export async function rename2FADevice(
  deviceId: string,
  newName: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (!newName.trim()) {
      return { error: "Name cannot be empty" };
    }

    if (newName.length > 100) {
      return { error: "Name is too long" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("two_factor_devices")
      .update({
        device_name: newName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("[2FA] Rename device error:", error);
      return { error: "Failed to rename device" };
    }

    return { success: true };
  } catch (error) {
    console.error("[2FA] Rename device error:", error);
    return { error: "Failed to rename device" };
  }
}

/**
 * Remove a 2FA device (requires verification)
 */
export async function remove2FADevice(
  deviceId: string,
  code: string
): Promise<{
  success?: boolean;
  twoFactorDisabled?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (code.length !== 6) {
      return { error: "Please enter a 6-digit code" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get all verified devices
    const { data: devices } = await supabase
      .from("two_factor_devices")
      .select("id, secret, is_primary")
      .eq("user_id", session.user.id)
      .eq("is_verified", true);

    if (!devices || devices.length === 0) {
      return { error: "No devices found" };
    }

    // Verify code against any device
    const validDevice = devices.find((d: { secret: string }) =>
      authenticator.verify({ token: code, secret: d.secret })
    );

    if (!validDevice) {
      return { error: "Invalid verification code" };
    }

    // Find the device to remove
    const deviceToRemove = devices.find((d: { id: string }) => d.id === deviceId);
    if (!deviceToRemove) {
      return { error: "Device not found" };
    }

    // Delete the device
    const { error: deleteError } = await supabase
      .from("two_factor_devices")
      .delete()
      .eq("id", deviceId)
      .eq("user_id", session.user.id);

    if (deleteError) {
      console.error("[2FA] Delete device error:", deleteError);
      return { error: "Failed to remove device" };
    }

    // Check if any devices remain
    const remainingCount = devices.length - 1;

    if (remainingCount === 0) {
      // Check if email 2FA is enabled before allowing complete 2FA disable
      const { data: user } = await supabase
        .from("user")
        .select("email2FAEnabled")
        .eq("id", session.user.id)
        .single();

      if (!user?.email2FAEnabled) {
        // No email 2FA backup - this should have been blocked by the frontend
        // But block it here too for safety (mandatory MFA enforcement)
        return { error: "You must enable Email 2FA before removing your last authenticator" };
      }

      // Email 2FA is enabled, so we can remove the last TOTP device
      // Clear TOTP-specific fields but keep twoFactorEnabled via email 2FA
      await supabase
        .from("user")
        .update({
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          // Keep twoFactorEnabled true since email 2FA is active
          // twoFactorVerifiedAt stays as record of when 2FA was first set up
        })
        .eq("id", session.user.id);

      return { success: true, twoFactorDisabled: false }; // 2FA is NOT disabled, email 2FA is still active
    }

    // If primary was removed, make another device primary
    if (deviceToRemove.is_primary && remainingCount > 0) {
      const newPrimary = devices.find((d: { id: string }) => d.id !== deviceId);
      if (newPrimary) {
        await supabase
          .from("two_factor_devices")
          .update({
            is_primary: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", newPrimary.id)
          .eq("user_id", session.user.id);

        // Update user's twoFactorSecret for backward compat
        await supabase
          .from("user")
          .update({ twoFactorSecret: newPrimary.secret })
          .eq("id", session.user.id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[2FA] Remove device error:", error);
    return { error: "Failed to remove device" };
  }
}

/**
 * Set a device as primary
 */
export async function setPrimary2FADevice(deviceId: string): Promise<{
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

    // Get the device
    const { data: device } = await supabase
      .from("two_factor_devices")
      .select("id, secret, is_verified")
      .eq("id", deviceId)
      .eq("user_id", session.user.id)
      .single();

    if (!device) {
      return { error: "Device not found" };
    }

    if (!device.is_verified) {
      return { error: "Device is not verified" };
    }

    // Unset current primary
    await supabase
      .from("two_factor_devices")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("is_primary", true);

    // Set new primary
    const { error } = await supabase
      .from("two_factor_devices")
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("[2FA] Set primary error:", error);
      return { error: "Failed to set primary device" };
    }

    // Update user's twoFactorSecret for backward compat
    await supabase
      .from("user")
      .update({ twoFactorSecret: device.secret })
      .eq("id", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("[2FA] Set primary error:", error);
    return { error: "Failed to set primary device" };
  }
}

/**
 * Get 2FA device count for current user
 */
export async function get2FADeviceCount(): Promise<number> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("two_factor_devices")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("is_verified", true);

    if (error) return 0;
    return data?.length || 0;
  } catch {
    return 0;
  }
}
