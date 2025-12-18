/**
 * WebAuthn Client-Side Utilities
 *
 * Safe to import in client components - no server dependencies.
 * For server-side verification, use webauthn-server.ts instead.
 */

import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";

/**
 * Passkey data stored in database (from passkeys table)
 */
export interface StoredPasskey {
  id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_type: "platform" | "cross-platform";
  backed_up: boolean;
  transports: string[] | null;
  passkey_name: string;
  aaguid: string | null;
  last_used_at: string | null;
  created_at: string;
}

/**
 * User data for WebAuthn operations
 */
export interface WebAuthnUser {
  id: string;
  email: string;
  displayName?: string;
}

/**
 * Check if WebAuthn is supported in the current browser
 *
 * Call this on the client side before showing passkey options.
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

/**
 * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
 *
 * Useful for showing appropriate UI - e.g., "Sign in with Face ID" vs "Use passkey".
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Format last used timestamp for display
 */
export function formatLastUsed(timestamp: string | null): string {
  if (!timestamp) return "Never used";

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

/**
 * Extract device type from registration verification
 *
 * Determines if the authenticator is built-in (platform) or external (security key).
 * This helps with UI display - showing appropriate icons.
 */
export function getDeviceType(
  authenticatorAttachment?: string,
  transports?: AuthenticatorTransportFuture[]
): "platform" | "cross-platform" {
  if (authenticatorAttachment === "platform") return "platform";
  if (authenticatorAttachment === "cross-platform") return "cross-platform";

  // Infer from transports
  if (transports?.includes("internal") || transports?.includes("hybrid")) {
    return "platform";
  }

  return "cross-platform";
}

/**
 * Derive a friendly name for a passkey based on its properties
 *
 * Helps users identify their passkeys in the settings list.
 */
export function derivePasskeyName(
  deviceType: "platform" | "cross-platform",
  transports?: AuthenticatorTransportFuture[],
  aaguid?: string
): string {
  // Known AAGUID mappings for popular authenticators
  const knownAuthenticators: Record<string, string> = {
    // Apple
    "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "iPhone",
    "adce0002-35bc-c60a-648b-0b25f1f05503": "Touch ID",
    "dd4ec289-e01d-41c9-bb89-70fa845d4bf2": "Face ID",
    // Google
    "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Android",
    "b93fd961-f2e6-462f-b122-82002247de78": "Chrome",
    // Microsoft
    "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
    // YubiKey
    "ee882879-721c-4913-9775-3dfcce97072a": "YubiKey 5",
    "73bb0cd4-e502-49b8-9c6f-b59445bf720b": "YubiKey 5 FIPS",
    "c1f9a0bc-1dd2-404a-b27f-8e29047a43fd": "YubiKey Bio",
    // 1Password
    "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
    // Bitwarden
    "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
    // Dashlane
    "531126d6-e717-415c-9320-3d9aa6981239": "Dashlane",
  };

  // Check if we recognize the AAGUID
  if (aaguid && knownAuthenticators[aaguid]) {
    return knownAuthenticators[aaguid];
  }

  // Fallback to device type based names
  if (deviceType === "platform") {
    if (transports?.includes("hybrid")) {
      return "Phone Passkey";
    }
    return "Built-in Passkey";
  }

  // Security key
  if (transports?.includes("usb")) {
    return "USB Security Key";
  }
  if (transports?.includes("nfc")) {
    return "NFC Security Key";
  }
  if (transports?.includes("ble")) {
    return "Bluetooth Security Key";
  }

  return "Security Key";
}
