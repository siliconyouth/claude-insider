/**
 * E2EE Auto - Automatic Encryption for DMs
 *
 * Handles automatic key exchange and encryption setup for DM conversations.
 * When a new DM is created (or an existing unencrypted DM is upgraded),
 * this module automatically:
 * 1. Claims prekeys from the recipient's devices
 * 2. Establishes Olm sessions
 * 3. Marks the conversation as ready for encrypted messaging
 *
 * Design principles:
 * - All DMs are encrypted by default (no user opt-in required)
 * - Key exchange happens transparently in the background
 * - Graceful degradation if E2EE unavailable (falls back to server-side message)
 * - Groups remain opt-in (handled separately)
 */

"use client";

import {
  isE2EEReady,
  getDeviceIdentityKey,
  getCurrentDeviceId,
  createOutboundOlmSession,
  getOrCreateOlmSession as _getOrCreateOlmSession,
  type DeviceInfo as _DeviceInfo,
} from "@/lib/e2ee";
import type { Conversation } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface E2EESetupResult {
  /** Whether setup was successful */
  success: boolean;
  /** Error message if setup failed */
  error?: string;
  /** Whether encryption is now active */
  encryptionActive: boolean;
  /** Session IDs created */
  sessionIds?: string[];
}

export interface E2EEStatus {
  /** Whether E2EE is available (WASM loaded, account initialized) */
  available: boolean;
  /** Whether conversation is encrypted */
  encrypted: boolean;
  /** Current status */
  status:
    | "ready" // Encryption active and ready
    | "setting_up" // Key exchange in progress
    | "degraded" // E2EE unavailable, using plaintext
    | "error"; // Setup failed
  /** Error details if any */
  error?: string;
}

export interface DeviceKeys {
  userId: string;
  deviceId: string;
  identityKey: string;
  oneTimeKey?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const _MAX_SETUP_RETRIES = 3;
const _SETUP_TIMEOUT_MS = 10_000;

// ============================================================================
// E2EE READINESS CHECK
// ============================================================================

/**
 * Check if a conversation should use E2EE
 * - DMs: Always encrypted (by default since v1.14.0)
 * - Groups: Only if explicitly enabled
 */
export function shouldEncrypt(conversation: Conversation): boolean {
  // DMs are always encrypted (unless explicitly disabled - rare)
  if (conversation.type === "direct") {
    return conversation.isEncrypted !== false;
  }

  // Groups use explicit flag
  return conversation.isEncrypted === true;
}

/**
 * Check if E2EE is available and ready for a conversation
 */
export async function checkE2EEAvailability(): Promise<{
  available: boolean;
  reason?: string;
}> {
  // Check if E2EE module is initialized
  if (!isE2EEReady()) {
    return { available: false, reason: "E2EE not initialized" };
  }

  // Check if we have a device identity
  const deviceId = getCurrentDeviceId();
  if (!deviceId) {
    return { available: false, reason: "No device identity" };
  }

  // Check if we have identity keys
  const identityKey = await getDeviceIdentityKey();
  if (!identityKey) {
    return { available: false, reason: "No identity key" };
  }

  return { available: true };
}

// ============================================================================
// AUTOMATIC KEY EXCHANGE
// ============================================================================

/**
 * Set up encryption for a new DM conversation
 * Automatically claims prekeys and establishes Olm sessions
 */
export async function setupDMEncryption(
  conversationId: string,
  participantIds: string[],
  currentUserId: string
): Promise<E2EESetupResult> {
  const sessionIds: string[] = [];

  try {
    // Check E2EE availability
    const { available, reason } = await checkE2EEAvailability();
    if (!available) {
      console.warn("[E2EE Auto] E2EE not available:", reason);
      return {
        success: false,
        error: reason,
        encryptionActive: false,
      };
    }

    // Get other participants (exclude self)
    const otherParticipants = participantIds.filter((id) => id !== currentUserId);

    if (otherParticipants.length === 0) {
      return {
        success: true,
        encryptionActive: true,
        sessionIds: [],
      };
    }

    // Fetch device keys for all participants
    const deviceKeys = await fetchParticipantDeviceKeys(otherParticipants);

    // Establish Olm sessions with each device
    for (const deviceKey of deviceKeys) {
      try {
        const session = await establishOlmSession(deviceKey);
        if (session) {
          sessionIds.push(session.sessionId);
        }
      } catch (error) {
        console.error(
          `[E2EE Auto] Failed to establish session with ${deviceKey.deviceId}:`,
          error
        );
        // Continue with other devices - we can still send to successful ones
      }
    }

    // Consider setup successful if we have at least one session
    const success = sessionIds.length > 0 || deviceKeys.length === 0;

    return {
      success,
      encryptionActive: success,
      sessionIds,
      error: success ? undefined : "Failed to establish any sessions",
    };
  } catch (error) {
    console.error("[E2EE Auto] Setup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      encryptionActive: false,
    };
  }
}

/**
 * Fetch device keys for a list of users
 */
async function fetchParticipantDeviceKeys(
  userIds: string[]
): Promise<DeviceKeys[]> {
  const deviceKeys: DeviceKeys[] = [];

  for (const userId of userIds) {
    try {
      // Fetch from our API endpoint
      const response = await fetch(`/api/e2ee/device-keys?userId=${userId}`);

      if (!response.ok) {
        console.warn(`[E2EE Auto] Failed to fetch keys for user ${userId}`);
        continue;
      }

      const data = await response.json();

      if (data.devices && Array.isArray(data.devices)) {
        for (const device of data.devices) {
          deviceKeys.push({
            userId,
            deviceId: device.deviceId,
            identityKey: device.identityKey,
            oneTimeKey: device.oneTimeKey,
          });
        }
      }
    } catch (error) {
      console.error(`[E2EE Auto] Error fetching keys for ${userId}:`, error);
    }
  }

  return deviceKeys;
}

/**
 * Establish an Olm session with a device
 */
async function establishOlmSession(
  deviceKey: DeviceKeys
): Promise<{ sessionId: string } | null> {
  // If we don't have a one-time key, we need to claim one
  if (!deviceKey.oneTimeKey) {
    const claimedKey = await claimPrekey(deviceKey.userId, deviceKey.deviceId);
    if (!claimedKey) {
      console.warn(
        `[E2EE Auto] No prekeys available for ${deviceKey.deviceId}`
      );
      return null;
    }
    deviceKey.oneTimeKey = claimedKey;
  }

  // Create the Olm session
  const session = await createOutboundOlmSession(
    deviceKey.identityKey,
    deviceKey.oneTimeKey
  );

  return { sessionId: session.session_id() };
}

/**
 * Claim a one-time prekey from a device
 */
async function claimPrekey(
  userId: string,
  deviceId: string
): Promise<string | null> {
  try {
    const response = await fetch("/api/e2ee/claim-prekey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceId }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.prekey?.publicKey || null;
  } catch (error) {
    console.error("[E2EE Auto] Prekey claim failed:", error);
    return null;
  }
}

// ============================================================================
// CONVERSATION UPGRADE
// ============================================================================

/**
 * Upgrade an existing unencrypted DM to E2EE
 * Used for historical conversations when user wants to enable encryption
 */
export async function upgradeDMToE2EE(
  conversationId: string,
  participantIds: string[],
  currentUserId: string
): Promise<E2EESetupResult> {
  // First, set up the encryption locally
  const setupResult = await setupDMEncryption(
    conversationId,
    participantIds,
    currentUserId
  );

  if (!setupResult.success) {
    return setupResult;
  }

  // Then update the server
  try {
    const response = await fetch("/api/e2ee/upgrade-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to update server",
        encryptionActive: false,
      };
    }

    return setupResult;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      encryptionActive: false,
    };
  }
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Get the E2EE status for a conversation
 */
export async function getConversationE2EEStatus(
  conversation: Conversation
): Promise<E2EEStatus> {
  // Check if E2EE is available
  const { available, reason } = await checkE2EEAvailability();

  if (!available) {
    return {
      available: false,
      encrypted: false,
      status: "degraded",
      error: reason,
    };
  }

  // Check if conversation should be encrypted
  const encrypted = shouldEncrypt(conversation);

  if (!encrypted) {
    return {
      available: true,
      encrypted: false,
      status: "ready", // Ready but not encrypted (group without E2EE)
    };
  }

  // E2EE is available and conversation is encrypted
  return {
    available: true,
    encrypted: true,
    status: "ready",
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  shouldEncrypt as isConversationEncrypted,
  checkE2EEAvailability as isE2EEAvailable,
};
