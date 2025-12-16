/**
 * Encrypted Messaging Hook
 *
 * Client-side wrapper for E2EE messaging operations.
 * Handles encryption before sending and decryption after receiving.
 *
 * Key responsibilities:
 * - Fetches recipient device keys for encryption
 * - Encrypts messages with Olm (1:1) or Megolm (groups)
 * - Decrypts received messages
 * - Manages Megolm session key sharing
 * - Provides E2EE status for UI indicators
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import {
  encryptMessage,
  decryptMessage,
  processMegolmSessionShare,
  isE2EEReady,
  getCurrentDeviceId,
  type EncryptedMessagePayload,
  type DeviceInfo,
  type SessionSharePayload,
} from "@/lib/e2ee";
import { sendMessage as sendMessageAction } from "@/app/actions/messaging";
import type { Message } from "@/app/actions/messaging";

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptedMessage extends Message {
  /** Whether message is E2EE encrypted */
  isEncrypted: boolean;
  /** Encryption algorithm used */
  encryptionAlgorithm?: "olm.v1" | "megolm.v1";
  /** Sender device ID */
  senderDeviceId?: string;
  /** Decryption error if failed */
  decryptionError?: string;
}

export interface UseEncryptedMessagingReturn {
  /** Whether E2EE is ready for this conversation */
  isE2EEReady: boolean;
  /** Whether E2EE is currently loading */
  isE2EELoading: boolean;
  /** Send an encrypted message */
  sendEncryptedMessage: (
    conversationId: string,
    content: string,
    conversationType: "direct" | "group"
  ) => Promise<{
    success: boolean;
    message?: EncryptedMessage;
    aiMentioned?: boolean;
    error?: string;
  }>;
  /** Decrypt a received message */
  decryptReceivedMessage: (
    conversationId: string,
    message: RawEncryptedMessage
  ) => Promise<EncryptedMessage>;
  /** Claim pending Megolm sessions */
  claimPendingSessions: () => Promise<void>;
  /** Error message if E2EE failed */
  error: string | null;
}

export interface RawEncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  encryptedContent?: string;
  isEncrypted: boolean;
  encryptionAlgorithm?: "olm.v1" | "megolm.v1";
  senderDeviceId?: string;
  senderKey?: string;
  sessionId?: string;
  mentions: string[];
  isAiGenerated: boolean;
  aiResponseTo?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

// ============================================================================
// FETCH HELPERS
// ============================================================================

async function fetchConversationDevices(
  conversationId: string
): Promise<DeviceInfo[]> {
  const response = await fetch("/api/e2ee/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch device keys");
  }

  const data = await response.json();
  return data.devices.map(
    (d: { userId: string; deviceId: string; identityKey: string }) => ({
      userId: d.userId,
      deviceId: d.deviceId,
      identityKey: d.identityKey,
    })
  );
}

async function claimPrekey(
  userId: string,
  deviceId: string
): Promise<{ keyId: number; publicKey: string } | null> {
  const response = await fetch("/api/e2ee/prekeys/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId: userId, targetDeviceId: deviceId }),
  });

  if (!response.ok) {
    console.error("Failed to claim prekey");
    return null;
  }

  const data = await response.json();
  return {
    keyId: data.keyId,
    publicKey: data.publicKey,
  };
}

async function shareSessionKeys(
  conversationId: string,
  sessionId: string,
  senderDeviceId: string,
  shares: SessionSharePayload[]
): Promise<void> {
  const response = await fetch("/api/e2ee/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      sessionId,
      senderDeviceId,
      shares,
    }),
  });

  if (!response.ok) {
    console.error("Failed to share session keys");
  }
}

async function fetchPendingSessions(
  deviceId: string
): Promise<
  Array<{
    conversationId: string;
    sessionId: string;
    senderDeviceId: string;
    encryptedSessionKey: string;
    firstKnownIndex: number;
  }>
> {
  const response = await fetch(
    `/api/e2ee/sessions?deviceId=${encodeURIComponent(deviceId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch pending sessions");
  }

  const data = await response.json();
  return data.sessions || [];
}

/**
 * Fetch identity key for a specific device from device_keys table.
 * Required for verifying Megolm session shares.
 */
async function fetchDeviceIdentityKey(
  deviceId: string
): Promise<string | null> {
  try {
    const response = await fetch("/api/e2ee/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });

    if (!response.ok) {
      console.error("Failed to fetch device identity key");
      return null;
    }

    const data = await response.json();
    // Find the specific device in the response
    const device = data.devices?.find(
      (d: { deviceId: string; identityKey: string }) => d.deviceId === deviceId
    );
    return device?.identityKey || null;
  } catch (err) {
    console.error("Error fetching device identity key:", err);
    return null;
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useEncryptedMessaging(): UseEncryptedMessagingReturn {
  const e2ee = useE2EEContext();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  // Check E2EE readiness
  useEffect(() => {
    let mounted = true;

    const checkReady = async () => {
      try {
        const ready = await isE2EEReady();
        const deviceId = await getCurrentDeviceId();
        if (mounted) {
          setIsReady(ready);
          deviceIdRef.current = deviceId;
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "E2EE check failed");
          setIsLoading(false);
        }
      }
    };

    if (e2ee.isInitialized) {
      checkReady();
    } else if (!e2ee.isLoading) {
      setIsLoading(false);
    }
  }, [e2ee.isInitialized, e2ee.isLoading]);

  // Send encrypted message
  const sendEncryptedMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      conversationType: "direct" | "group"
    ) => {
      if (!isReady) {
        // Fallback to unencrypted if E2EE not ready
        const result = await sendMessageAction(conversationId, content);
        if (result.success && result.message) {
          return {
            ...result,
            message: { ...result.message, isEncrypted: false } as EncryptedMessage,
          };
        }
        return result as { success: boolean; error?: string };
      }

      try {
        // Fetch recipient device keys
        const recipientDevices = await fetchConversationDevices(conversationId);

        if (recipientDevices.length === 0) {
          // No devices with E2EE, send unencrypted
          const result = await sendMessageAction(conversationId, content);
          if (result.success && result.message) {
            return {
              ...result,
              message: { ...result.message, isEncrypted: false } as EncryptedMessage,
            };
          }
          return result as { success: boolean; error?: string };
        }

        // Encrypt the message
        const { payload, sessionShares } = await encryptMessage(
          conversationId,
          content,
          conversationType,
          recipientDevices,
          claimPrekey
        );

        // Share Megolm session keys if new session was created
        if (
          sessionShares &&
          sessionShares.length > 0 &&
          payload.sessionId &&
          deviceIdRef.current
        ) {
          await shareSessionKeys(
            conversationId,
            payload.sessionId,
            deviceIdRef.current,
            sessionShares
          );
        }

        // Send the message with encrypted content
        // For now we use a custom API endpoint for E2EE messages
        const response = await fetch("/api/messages/encrypted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            encryptedPayload: payload,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, error: errorData.error || "Send failed" };
        }

        const data = await response.json();

        return {
          success: true,
          message: {
            ...data.message,
            isEncrypted: true,
            encryptionAlgorithm: payload.algorithm,
            senderDeviceId: payload.senderDeviceId,
          },
          aiMentioned: data.aiMentioned,
        };
      } catch (err) {
        console.error("Failed to send encrypted message:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Encryption failed",
        };
      }
    },
    [isReady]
  );

  // Decrypt received message
  const decryptReceivedMessage = useCallback(
    async (
      conversationId: string,
      message: RawEncryptedMessage
    ): Promise<EncryptedMessage> => {
      if (!message.isEncrypted || !message.encryptedContent) {
        // Not encrypted, return as-is
        return {
          ...message,
          isEncrypted: false,
        };
      }

      if (!isReady) {
        // E2EE not ready, return with error
        return {
          ...message,
          content: "🔒 Unable to decrypt (E2EE not set up)",
          decryptionError: "E2EE not initialized",
        };
      }

      try {
        const payload: EncryptedMessagePayload = {
          algorithm: message.encryptionAlgorithm || "megolm.v1",
          ciphertext: message.encryptedContent,
          senderDeviceId: message.senderDeviceId || "",
          senderKey: message.senderKey || "",
          sessionId: message.sessionId,
          olmMessageType: undefined, // Determined from message type
        };

        const result = await decryptMessage(conversationId, payload);

        if (result.success) {
          return {
            ...message,
            content: result.plaintext,
            isEncrypted: true,
          };
        } else {
          return {
            ...message,
            content: "🔒 Unable to decrypt",
            decryptionError: result.error,
          };
        }
      } catch (err) {
        console.error("Decryption error:", err);
        return {
          ...message,
          content: "🔒 Decryption failed",
          decryptionError: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    [isReady]
  );

  // Claim pending Megolm sessions
  const claimPendingSessions = useCallback(async () => {
    if (!isReady || !deviceIdRef.current) return;

    try {
      const sessions = await fetchPendingSessions(deviceIdRef.current);

      for (const session of sessions) {
        try {
          // Fetch the sender's identity key for verification
          const senderIdentityKey = await fetchDeviceIdentityKey(
            session.senderDeviceId
          );

          if (!senderIdentityKey) {
            console.warn(
              `Could not fetch identity key for device ${session.senderDeviceId}, skipping session ${session.sessionId}`
            );
            continue;
          }

          // Decrypt the session key with Olm and import the Megolm session
          await processMegolmSessionShare(
            session.conversationId,
            session.senderDeviceId,
            senderIdentityKey,
            session.encryptedSessionKey
          );
        } catch (err) {
          console.error(
            `Failed to process session ${session.sessionId}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("Failed to claim sessions:", err);
    }
  }, [isReady]);

  return {
    isE2EEReady: isReady,
    isE2EELoading: isLoading,
    sendEncryptedMessage,
    decryptReceivedMessage,
    claimPendingSessions,
    error,
  };
}
