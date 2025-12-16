/**
 * E2EE Message Cryptography
 *
 * High-level encryption/decryption for chat messages using:
 * - Olm for 1:1 direct messages (perfect forward secrecy)
 * - Megolm for group messages (efficient O(1) encryption)
 *
 * This module bridges the low-level crypto primitives with the messaging system.
 */

"use client";

import { Account, initVodozemac, isVodozemacAvailable } from "./vodozemac";
import {
  getStoredAccount,
  getOlmSession,
  storeOlmSession,
  getMegolmSession,
  storeMegolmSession,
  addInboundMegolmSession,
  incrementMegolmMessageCount,
} from "./key-storage";
import type {
  VodozemacSession,
  VodozemacGroupSession,
  OlmMessage,
  DecryptedMessage,
} from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptedMessagePayload {
  /** Algorithm used: 'olm.v1' or 'megolm.v1' */
  algorithm: "olm.v1" | "megolm.v1";
  /** Encrypted ciphertext */
  ciphertext: string;
  /** Sender's device ID */
  senderDeviceId: string;
  /** Sender's Curve25519 identity key */
  senderKey: string;
  /** Session ID (for Megolm) */
  sessionId?: string;
  /** Message type for Olm: 0 = prekey, 1 = normal */
  olmMessageType?: 0 | 1;
}

export interface DecryptedMessageResult {
  /** Decrypted plaintext content */
  plaintext: string;
  /** Whether decryption was successful */
  success: boolean;
  /** Error message if decryption failed */
  error?: string;
  /** Session ID used */
  sessionId?: string;
}

export interface SessionSharePayload {
  recipientUserId: string;
  recipientDeviceId: string;
  encryptedSessionKey: string;
}

export interface DeviceInfo {
  userId: string;
  deviceId: string;
  identityKey: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum messages before Megolm session rotation */
const MEGOLM_ROTATION_MESSAGE_LIMIT = 100;

/** Maximum age before Megolm session rotation (7 days) */
const MEGOLM_ROTATION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// PICKLE KEY
// ============================================================================

let pickleKey: Uint8Array | null = null;

/**
 * Set the pickle key for session encryption
 * Should be called during E2EE initialization
 */
export function setPickleKey(key: Uint8Array): void {
  pickleKey = key;
}

/**
 * Get or generate pickle key
 */
function getPickleKey(): Uint8Array {
  if (pickleKey) return pickleKey;
  // Generate a random key if none set (for session)
  pickleKey = crypto.getRandomValues(new Uint8Array(32));
  return pickleKey;
}

// ============================================================================
// OLM SESSION MANAGEMENT
// ============================================================================

/**
 * Create an outbound Olm session for a recipient device
 * Used for 1:1 messages and Megolm key sharing
 */
export async function createOutboundOlmSession(
  recipientIdentityKey: string,
  recipientOneTimeKey: string
): Promise<VodozemacSession> {
  const vodozemac = await initVodozemac();
  if (!vodozemac) {
    throw new Error("Vodozemac not available");
  }

  const stored = await getStoredAccount();
  if (!stored) {
    throw new Error("No E2EE account found");
  }

  // Restore account from pickle
  const account = Account.fromPickle(stored.pickle, getPickleKey());

  // Create outbound session using recipient's keys
  const session = account.createOutboundSession(
    recipientIdentityKey,
    recipientOneTimeKey
  );

  return session;
}

/**
 * Get or create an Olm session for a recipient device
 */
export async function getOrCreateOlmSession(
  recipientDevice: DeviceInfo,
  claimPrekey: () => Promise<{ keyId: number; publicKey: string } | null>
): Promise<VodozemacSession | null> {
  const vodozemac = await initVodozemac();
  if (!vodozemac) return null;

  // Check for existing session
  const existingSession = await getOlmSession(recipientDevice.deviceId);
  if (existingSession) {
    return Account.sessionFromPickle(existingSession.pickle, getPickleKey());
  }

  // No existing session, need to claim a prekey
  const prekey = await claimPrekey();
  if (!prekey) {
    console.error("Failed to claim prekey for device:", recipientDevice.deviceId);
    return null;
  }

  // Create new outbound session
  const session = await createOutboundOlmSession(
    recipientDevice.identityKey,
    prekey.publicKey
  );

  // Store the session
  await storeOlmSession({
    recipientDeviceId: recipientDevice.deviceId,
    pickle: session.pickle(getPickleKey()),
    lastUsed: Date.now(),
    recipientIdentityKey: recipientDevice.identityKey,
  });

  return session;
}

/**
 * Process an incoming Olm message (prekey or regular)
 */
export async function processInboundOlmMessage(
  senderDeviceId: string,
  senderIdentityKey: string,
  message: OlmMessage
): Promise<string> {
  const vodozemac = await initVodozemac();
  if (!vodozemac) {
    throw new Error("Vodozemac not available");
  }

  const stored = await getStoredAccount();
  if (!stored) {
    throw new Error("No E2EE account found");
  }

  const account = Account.fromPickle(stored.pickle, getPickleKey());
  let session: VodozemacSession;
  let plaintext: string;

  if (message.type === 0) {
    // Prekey message - creates new inbound session
    const result = account.createInboundSession(senderIdentityKey, message.body);
    session = result.session;
    plaintext = result.plaintext;

    // Remove used one-time key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account.removeOneTimeKeys(session as any);
  } else {
    // Normal message - use existing session
    const existingSession = await getOlmSession(senderDeviceId);
    if (!existingSession) {
      throw new Error("No session found for sender device");
    }
    session = Account.sessionFromPickle(existingSession.pickle, getPickleKey());
    const decrypted = await session.decrypt(message);
    plaintext = typeof decrypted === "string" ? decrypted : String(decrypted);
  }

  // Store/update session
  await storeOlmSession({
    recipientDeviceId: senderDeviceId,
    pickle: session.pickle(getPickleKey()),
    lastUsed: Date.now(),
    recipientIdentityKey: senderIdentityKey,
  });

  return plaintext;
}

// ============================================================================
// MEGOLM SESSION MANAGEMENT
// ============================================================================

/**
 * Get or create a Megolm outbound session for a conversation
 */
export async function getOrCreateMegolmSession(
  conversationId: string
): Promise<{ session: VodozemacGroupSession; isNew: boolean }> {
  const vodozemac = await initVodozemac();
  if (!vodozemac) {
    throw new Error("Vodozemac not available");
  }

  const stored = await getMegolmSession(conversationId);

  if (stored?.outboundPickle) {
    // Check if rotation needed
    const needsRotation =
      stored.messageCount >= MEGOLM_ROTATION_MESSAGE_LIMIT ||
      (stored.outboundCreatedAt &&
        Date.now() - stored.outboundCreatedAt > MEGOLM_ROTATION_AGE_MS);

    if (!needsRotation) {
      const session = Account.groupSessionFromPickle(
        stored.outboundPickle,
        getPickleKey()
      );
      return { session, isNew: false };
    }
  }

  // Create new session
  const session = Account.createGroupSession();
  // Session ID is stored in the pickle, no need to track separately
  void session.session_id();

  // Store new session
  await storeMegolmSession({
    conversationId,
    outboundPickle: session.pickle(getPickleKey()),
    inboundSessions: stored?.inboundSessions || {},
    outboundCreatedAt: Date.now(),
    messageCount: 0,
  });

  return { session, isNew: true };
}

/**
 * Import an inbound Megolm session from a session share
 */
export async function importMegolmSession(
  conversationId: string,
  sessionId: string,
  sessionKey: string,
  _firstKnownIndex: number
): Promise<void> {
  const vodozemac = await initVodozemac();
  if (!vodozemac) {
    throw new Error("Vodozemac not available");
  }

  // Create inbound session from session key
  const inboundSession = Account.createInboundGroupSession(sessionKey);
  const pickle = inboundSession.pickle(getPickleKey());

  // Store the inbound session
  await addInboundMegolmSession(conversationId, sessionId, pickle);
}

/**
 * Decrypt a Megolm message
 */
export async function decryptMegolmMessage(
  conversationId: string,
  sessionId: string,
  ciphertext: string
): Promise<DecryptedMessage> {
  const vodozemac = await initVodozemac();
  if (!vodozemac) {
    throw new Error("Vodozemac not available");
  }

  const stored = await getMegolmSession(conversationId);
  if (!stored) {
    throw new Error("No Megolm session found for conversation");
  }

  const pickle = stored.inboundSessions[sessionId];
  if (!pickle) {
    throw new Error(`No inbound session found for session ID: ${sessionId}`);
  }

  const session = Account.inboundGroupSessionFromPickle(pickle, getPickleKey());
  const result = await session.decrypt(ciphertext);

  return typeof result === "object"
    ? result
    : { plaintext: result, message_index: 0 };
}

// ============================================================================
// HIGH-LEVEL MESSAGE ENCRYPTION
// ============================================================================

/**
 * Encrypt a message for a conversation
 *
 * For 1:1 (direct) conversations: Uses Olm
 * For group conversations: Uses Megolm
 */
export async function encryptMessage(
  conversationId: string,
  plaintext: string,
  conversationType: "direct" | "group",
  recipientDevices: DeviceInfo[],
  claimPrekey: (
    userId: string,
    deviceId: string
  ) => Promise<{ keyId: number; publicKey: string } | null>
): Promise<{
  payload: EncryptedMessagePayload;
  sessionShares?: SessionSharePayload[];
}> {
  if (!isVodozemacAvailable()) {
    throw new Error("E2EE not available");
  }

  const stored = await getStoredAccount();
  if (!stored) {
    throw new Error("No E2EE account initialized");
  }

  const account = Account.fromPickle(stored.pickle, getPickleKey());
  const identityKeys = account.identityKeys();

  if (conversationType === "direct" && recipientDevices.length === 1) {
    const recipient = recipientDevices[0];
    if (!recipient) {
      throw new Error("No recipient device provided");
    }
    // Use Olm for 1:1
    return encryptWithOlm(
      plaintext,
      stored.deviceId,
      identityKeys.curve25519,
      recipient,
      claimPrekey
    );
  }

  // Use Megolm for groups
  return encryptWithMegolm(
    conversationId,
    plaintext,
    stored.deviceId,
    identityKeys.curve25519,
    recipientDevices,
    claimPrekey
  );
}

/**
 * Encrypt with Olm (1:1 messages)
 */
async function encryptWithOlm(
  plaintext: string,
  senderDeviceId: string,
  senderKey: string,
  recipientDevice: DeviceInfo,
  claimPrekey: (
    userId: string,
    deviceId: string
  ) => Promise<{ keyId: number; publicKey: string } | null>
): Promise<{ payload: EncryptedMessagePayload }> {
  const session = await getOrCreateOlmSession(recipientDevice, () =>
    claimPrekey(recipientDevice.userId, recipientDevice.deviceId)
  );

  if (!session) {
    throw new Error("Failed to create Olm session");
  }

  const encrypted = await session.encrypt(plaintext);
  const message = typeof encrypted === "object" ? encrypted : JSON.parse(encrypted);

  // Update stored session
  await storeOlmSession({
    recipientDeviceId: recipientDevice.deviceId,
    pickle: session.pickle(getPickleKey()),
    lastUsed: Date.now(),
    recipientIdentityKey: recipientDevice.identityKey,
  });

  return {
    payload: {
      algorithm: "olm.v1",
      ciphertext: message.body,
      senderDeviceId,
      senderKey,
      olmMessageType: message.type,
    },
  };
}

/**
 * Encrypt with Megolm (group messages)
 */
async function encryptWithMegolm(
  conversationId: string,
  plaintext: string,
  senderDeviceId: string,
  senderKey: string,
  recipientDevices: DeviceInfo[],
  claimPrekey: (
    userId: string,
    deviceId: string
  ) => Promise<{ keyId: number; publicKey: string } | null>
): Promise<{
  payload: EncryptedMessagePayload;
  sessionShares?: SessionSharePayload[];
}> {
  const { session, isNew } = await getOrCreateMegolmSession(conversationId);
  const sessionId = session.session_id();
  const sessionKey = session.session_key();

  // Encrypt the message
  const ciphertext = await session.encrypt(plaintext);

  // Update session and increment message count
  await incrementMegolmMessageCount(conversationId);

  let sessionShares: SessionSharePayload[] | undefined;

  // If new session, share key with all participants via Olm
  if (isNew) {
    sessionShares = [];
    for (const device of recipientDevices) {
      try {
        const olmSession = await getOrCreateOlmSession(device, () =>
          claimPrekey(device.userId, device.deviceId)
        );

        if (olmSession) {
          // Encrypt the session key with Olm
          const encrypted = await olmSession.encrypt(
            JSON.stringify({ sessionId, sessionKey })
          );
          const message =
            typeof encrypted === "object" ? encrypted : JSON.parse(encrypted);

          sessionShares.push({
            recipientUserId: device.userId,
            recipientDeviceId: device.deviceId,
            encryptedSessionKey: JSON.stringify(message),
          });

          // Update Olm session
          await storeOlmSession({
            recipientDeviceId: device.deviceId,
            pickle: olmSession.pickle(getPickleKey()),
            lastUsed: Date.now(),
            recipientIdentityKey: device.identityKey,
          });
        }
      } catch (error) {
        console.error(
          `Failed to share Megolm key with device ${device.deviceId}:`,
          error
        );
      }
    }
  }

  return {
    payload: {
      algorithm: "megolm.v1",
      ciphertext: typeof ciphertext === "string" ? ciphertext : String(ciphertext),
      senderDeviceId,
      senderKey,
      sessionId,
    },
    sessionShares,
  };
}

// ============================================================================
// HIGH-LEVEL MESSAGE DECRYPTION
// ============================================================================

/**
 * Decrypt a received message
 */
export async function decryptMessage(
  conversationId: string,
  payload: EncryptedMessagePayload
): Promise<DecryptedMessageResult> {
  if (!isVodozemacAvailable()) {
    return {
      success: false,
      plaintext: "",
      error: "E2EE not available on this device",
    };
  }

  try {
    let plaintext: string;

    if (payload.algorithm === "olm.v1") {
      // Decrypt Olm message
      plaintext = await processInboundOlmMessage(
        payload.senderDeviceId,
        payload.senderKey,
        {
          type: payload.olmMessageType ?? 1,
          body: payload.ciphertext,
        }
      );
    } else if (payload.algorithm === "megolm.v1") {
      // Decrypt Megolm message
      if (!payload.sessionId) {
        return {
          success: false,
          plaintext: "",
          error: "Missing session ID for Megolm message",
        };
      }

      const result = await decryptMegolmMessage(
        conversationId,
        payload.sessionId,
        payload.ciphertext
      );
      plaintext = result.plaintext;
    } else {
      return {
        success: false,
        plaintext: "",
        error: `Unknown encryption algorithm: ${payload.algorithm}`,
      };
    }

    return {
      success: true,
      plaintext,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error("Failed to decrypt message:", error);
    return {
      success: false,
      plaintext: "",
      error: error instanceof Error ? error.message : "Decryption failed",
    };
  }
}

/**
 * Process a Megolm session share (received via Olm)
 */
export async function processMegolmSessionShare(
  conversationId: string,
  senderDeviceId: string,
  senderIdentityKey: string,
  encryptedSessionKey: string
): Promise<void> {
  // First decrypt the share with Olm
  const olmMessage = JSON.parse(encryptedSessionKey) as OlmMessage;
  const plaintext = await processInboundOlmMessage(
    senderDeviceId,
    senderIdentityKey,
    olmMessage
  );

  // Parse the session key
  const { sessionId, sessionKey } = JSON.parse(plaintext) as {
    sessionId: string;
    sessionKey: string;
  };

  // Import the Megolm session
  await importMegolmSession(conversationId, sessionId, sessionKey, 0);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if E2EE is ready for messaging
 */
export async function isE2EEReady(): Promise<boolean> {
  if (!isVodozemacAvailable()) return false;

  const stored = await getStoredAccount();
  return stored !== null;
}

/**
 * Get the current device's identity key
 */
export async function getDeviceIdentityKey(): Promise<string | null> {
  const stored = await getStoredAccount();
  if (!stored) return null;

  const account = Account.fromPickle(stored.pickle, getPickleKey());
  return account.identityKeys().curve25519;
}

/**
 * Get the current device ID
 */
export async function getCurrentDeviceId(): Promise<string | null> {
  const stored = await getStoredAccount();
  return stored?.deviceId ?? null;
}
