/**
 * useE2EE Hook
 *
 * Main React hook for E2EE key management and encryption operations.
 *
 * Features:
 * - Automatic initialization on mount
 * - Key generation and storage
 * - Cloud backup creation/restoration
 * - Olm session management for 1:1 encryption
 * - Megolm session management for group encryption
 *
 * Architecture:
 * - Private keys stored in IndexedDB (never leave device)
 * - Public keys uploaded to server for discovery
 * - Password-protected backup stored on server
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-client";

// E2EE modules
import {
  initVodozemac,
  isVodozemacAvailable,
  isWasmLoaded,
  initOlmMachine,
  getOlmMachine,
  clearOlmMachineStore,
  type OlmMachineWrapper,
} from "@/lib/e2ee/vodozemac";
import {
  getStoredAccount,
  storeAccount,
  deleteAccount,
  getOlmSession,
  storeOlmSession,
  getMegolmSession,
  storeMegolmSession,
  addInboundMegolmSession,
  incrementMegolmMessageCount,
  clearAllE2EEData,
  exportAllE2EEData,
  importE2EEData,
  getE2EEStorageStats,
} from "@/lib/e2ee/key-storage";
import {
  encryptBackup,
  decryptBackup,
  createBackupData,
  validateBackupData,
} from "@/lib/e2ee/key-backup";
import type {
  VodozemacModule,
  VodozemacAccount,
  E2EEStatus,
  E2EEState,
  E2EEActions,
  UseE2EEReturn,
  PublicKeys,
  StoredAccount,
  StoredSession,
  StoredMegolmSession,
  DeviceMismatchInfo,
} from "@/lib/e2ee/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const ONE_TIME_KEY_COUNT = 50;
const PREKEY_REPLENISH_THRESHOLD = 10;
const PICKLE_KEY = new Uint8Array(32); // Zero key for local storage (encrypted at rest by browser)

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useE2EE(): UseE2EEReturn {
  const { data: session } = useSession();

  // State
  const [status, setStatus] = useState<E2EEStatus>("uninitialized");
  const [error, setError] = useState<Error | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [identityKey, setIdentityKey] = useState<string | null>(null);
  const [signingKey, setSigningKey] = useState<string | null>(null);
  const [availablePrekeys, setAvailablePrekeys] = useState(0);
  const [hasBackup, setHasBackup] = useState(false);
  const [usingWasm, setUsingWasm] = useState(false);
  const [deviceMismatch, setDeviceMismatch] = useState<DeviceMismatchInfo | null>(null);

  // Refs for vodozemac instances (avoid state for WASM objects)
  const vodozemacRef = useRef<VodozemacModule | null>(null);
  const accountRef = useRef<VodozemacAccount | null>(null);
  const olmMachineRef = useRef<OlmMachineWrapper | null>(null);

  // Derived state
  const isInitialized = status === "ready";
  const isLoading = status === "loading" || status === "generating";

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const initialize = useCallback(async () => {
    if (!session?.user?.id) {
      setStatus("uninitialized");
      return;
    }

    if (status === "loading" || status === "generating") {
      return; // Already initializing
    }

    try {
      setStatus("loading");
      setError(null);

      // 1. Initialize WASM module
      vodozemacRef.current = await initVodozemac();
      const wasmAvailable = isWasmLoaded();
      setUsingWasm(wasmAvailable);
      console.log(`[E2EE] Crypto module initialized (WASM: ${wasmAvailable})`);

      // 2. Check for existing account in IndexedDB
      const storedAccount = await getStoredAccount();

      if (storedAccount) {
        // Restore account from pickle
        accountRef.current = vodozemacRef.current.Account.from_pickle(
          storedAccount.pickle,
          PICKLE_KEY
        );

        const keys = accountRef.current.identity_keys();
        setDeviceId(storedAccount.deviceId);
        setIdentityKey(keys.curve25519);
        setSigningKey(keys.ed25519);

        // Initialize OlmMachine if WASM is available
        if (wasmAvailable && session?.user?.id) {
          const olmResult = await initOlmMachine(
            session.user.id,
            storedAccount.deviceId
          );

          // Check for device ID mismatch
          if (olmResult.hasMismatch && olmResult.storedOlmDeviceId) {
            console.warn("[E2EE] Device mismatch detected - showing recovery UI");
            setDeviceMismatch({
              storedDeviceId: storedAccount.deviceId,
              olmDeviceId: olmResult.storedOlmDeviceId,
              detectedAt: Date.now(),
            });
            setDeviceId(storedAccount.deviceId);
            setIdentityKey(keys.curve25519);
            setSigningKey(keys.ed25519);
            setStatus("device-mismatch");
            return;
          }

          olmMachineRef.current = olmResult.machine;
        }

        // Get storage stats
        const stats = await getE2EEStorageStats();
        setAvailablePrekeys(stats.sessionCount); // Approximate

        console.log("[E2EE] Restored existing account:", storedAccount.deviceId);
        setStatus("ready");
      } else {
        // No account exists, user needs to set up E2EE
        console.log("[E2EE] No account found, needs setup");
        setStatus("needs-setup");
      }

      // 3. Check if backup exists on server
      try {
        const response = await fetch("/api/e2ee/backup");
        if (response.ok) {
          const data = await response.json();
          setHasBackup(data.hasBackup);
        }
      } catch {
        // Ignore backup check errors
      }
    } catch (err) {
      console.error("[E2EE] Initialization failed:", err);
      setError(err instanceof Error ? err : new Error("E2EE initialization failed"));
      setStatus("error");
    }
  }, [session?.user?.id, status]);

  // ============================================================================
  // KEY GENERATION
  // ============================================================================

  const generateKeys = useCallback(async () => {
    if (!vodozemacRef.current || !session?.user?.id) {
      throw new Error("Cannot generate keys: not authenticated or WASM not loaded");
    }

    try {
      setStatus("generating");
      setError(null);

      // 1. Create new Olm account
      const account = new vodozemacRef.current.Account();
      accountRef.current = account;

      // 2. Generate unique device ID
      const newDeviceId = crypto.randomUUID();

      // 3. Get identity keys
      const keys = account.identity_keys();

      // 4. Generate one-time prekeys
      account.generate_one_time_keys(ONE_TIME_KEY_COUNT);
      const oneTimeKeys = account.one_time_keys();

      // 5. Store account in IndexedDB
      const storedAccount: StoredAccount = {
        pickle: account.pickle(PICKLE_KEY),
        deviceId: newDeviceId,
        createdAt: Date.now(),
      };
      await storeAccount(storedAccount);

      // 6. Upload keys to server
      const response = await fetch("/api/e2ee/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: newDeviceId,
          identityKey: keys.curve25519,
          signingKey: keys.ed25519,
          oneTimeKeys: Object.entries(oneTimeKeys.curve25519),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload keys: ${response.status}`);
      }

      // 7. Mark keys as published
      account.mark_keys_as_published();

      // Update state
      setDeviceId(newDeviceId);
      setIdentityKey(keys.curve25519);
      setSigningKey(keys.ed25519);
      setAvailablePrekeys(ONE_TIME_KEY_COUNT);
      setStatus("ready");

      console.log("[E2EE] Keys generated and uploaded:", newDeviceId);
    } catch (err) {
      console.error("[E2EE] Key generation failed:", err);
      setError(err instanceof Error ? err : new Error("Key generation failed"));
      setStatus("error");
      throw err;
    }
  }, [session?.user?.id]);

  // ============================================================================
  // PUBLIC KEYS
  // ============================================================================

  const getPublicKeys = useCallback((): PublicKeys | null => {
    if (!identityKey || !signingKey || !deviceId) {
      return null;
    }
    return { identityKey, signingKey, deviceId };
  }, [identityKey, signingKey, deviceId]);

  // ============================================================================
  // PREKEY REPLENISHMENT
  // ============================================================================

  const replenishPrekeys = useCallback(
    async (count: number = ONE_TIME_KEY_COUNT) => {
      if (!accountRef.current || !deviceId) {
        throw new Error("Cannot replenish: no account");
      }

      try {
        // Generate new prekeys
        accountRef.current.generate_one_time_keys(count);
        const oneTimeKeys = accountRef.current.one_time_keys();

        // Upload to server
        const response = await fetch("/api/e2ee/prekeys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            oneTimeKeys: Object.entries(oneTimeKeys.curve25519),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to upload prekeys: ${response.status}`);
        }

        // Mark as published and save account
        accountRef.current.mark_keys_as_published();

        const storedAccount = await getStoredAccount();
        if (storedAccount) {
          storedAccount.pickle = accountRef.current.pickle(PICKLE_KEY);
          await storeAccount(storedAccount);
        }

        setAvailablePrekeys((prev) => prev + count);
        console.log("[E2EE] Replenished", count, "prekeys");
      } catch (err) {
        console.error("[E2EE] Prekey replenishment failed:", err);
        throw err;
      }
    },
    [deviceId]
  );

  // ============================================================================
  // BACKUP OPERATIONS
  // ============================================================================

  const createBackup = useCallback(
    async (password: string) => {
      if (!accountRef.current || !deviceId) {
        throw new Error("Cannot backup: no account");
      }

      try {
        // Export all E2EE data
        const exported = await exportAllE2EEData();

        // Create backup data structure
        const backupData = await createBackupData(
          accountRef.current.pickle(PICKLE_KEY),
          deviceId,
          exported.sessions.reduce(
            (acc, s) => ({ ...acc, [s.recipientDeviceId]: s.pickle }),
            {} as Record<string, string>
          ),
          exported.megolmSessions.reduce(
            (acc, s) => ({ ...acc, [s.conversationId]: s }),
            {} as Record<string, StoredMegolmSession>
          )
        );

        // Encrypt with password
        const encrypted = await encryptBackup(backupData, password);

        // Upload to server
        const response = await fetch("/api/e2ee/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encrypted),
        });

        if (!response.ok) {
          throw new Error(`Failed to upload backup: ${response.status}`);
        }

        setHasBackup(true);
        console.log("[E2EE] Backup created and uploaded");
      } catch (err) {
        console.error("[E2EE] Backup creation failed:", err);
        throw err;
      }
    },
    [deviceId]
  );

  const restoreFromBackup = useCallback(
    async (password: string) => {
      if (!vodozemacRef.current) {
        throw new Error("Cannot restore: WASM not loaded");
      }

      try {
        setStatus("loading");

        // Fetch encrypted backup from server
        const response = await fetch("/api/e2ee/backup");
        if (!response.ok) {
          throw new Error("No backup found");
        }

        const { backup } = await response.json();
        if (!backup) {
          throw new Error("No backup data");
        }

        // Decrypt backup
        const backupData = await decryptBackup(
          backup.encrypted_backup,
          backup.backup_iv,
          backup.backup_auth_tag,
          backup.salt,
          password
        );

        if (!validateBackupData(backupData)) {
          throw new Error("Invalid backup data");
        }

        // Restore account
        accountRef.current = vodozemacRef.current.Account.from_pickle(
          backupData.accountPickle,
          PICKLE_KEY
        );

        const keys = accountRef.current.identity_keys();

        // Store in IndexedDB
        await storeAccount({
          pickle: backupData.accountPickle,
          deviceId: backupData.deviceId,
          createdAt: Date.now(),
        });

        // Restore sessions
        const olmSessions: StoredSession[] = Object.entries(
          backupData.olmSessions
        ).map(([recipientDeviceId, pickle]) => ({
          recipientDeviceId,
          pickle,
          lastUsed: Date.now(),
          recipientIdentityKey: "", // Will be refetched on next use
        }));

        const megolmSessions: StoredMegolmSession[] = Object.values(
          backupData.megolmSessions
        );

        await importE2EEData({
          sessions: olmSessions,
          megolmSessions,
        });

        // Update state
        setDeviceId(backupData.deviceId);
        setIdentityKey(keys.curve25519);
        setSigningKey(keys.ed25519);
        setStatus("ready");

        console.log("[E2EE] Restored from backup:", backupData.deviceId);
      } catch (err) {
        console.error("[E2EE] Backup restoration failed:", err);
        setError(err instanceof Error ? err : new Error("Backup restoration failed"));
        setStatus("error");
        throw err;
      }
    },
    []
  );

  const checkBackupExists = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/e2ee/backup");
      if (response.ok) {
        const data = await response.json();
        setHasBackup(data.hasBackup);
        return data.hasBackup;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ============================================================================
  // DESTROY / LOGOUT
  // ============================================================================

  const destroy = useCallback(async () => {
    try {
      // Clear all local E2EE data
      await clearAllE2EEData();

      // Optionally notify server to mark device as inactive
      if (deviceId) {
        try {
          await fetch("/api/e2ee/keys", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId }),
          });
        } catch {
          // Ignore server errors during logout
        }
      }

      // Clear refs
      if (accountRef.current?.free) {
        accountRef.current.free();
      }
      accountRef.current = null;

      // Reset state
      setDeviceId(null);
      setIdentityKey(null);
      setSigningKey(null);
      setAvailablePrekeys(0);
      setStatus("needs-setup");

      console.log("[E2EE] All data destroyed");
    } catch (err) {
      console.error("[E2EE] Destroy failed:", err);
      throw err;
    }
  }, [deviceId]);

  // ============================================================================
  // DEVICE MISMATCH RECOVERY
  // ============================================================================

  /**
   * Regenerate device after a mismatch.
   * Clears all local E2EE data (including OlmMachine store) and creates fresh keys.
   */
  const regenerateDevice = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    try {
      setStatus("generating");
      setError(null);

      // 1. Delete the old device from server (both the stored one and the OlmMachine one)
      const deviceIdsToDelete = new Set<string>();
      if (deviceMismatch?.storedDeviceId) {
        deviceIdsToDelete.add(deviceMismatch.storedDeviceId);
      }
      if (deviceMismatch?.olmDeviceId) {
        deviceIdsToDelete.add(deviceMismatch.olmDeviceId);
      }
      if (deviceId) {
        deviceIdsToDelete.add(deviceId);
      }

      for (const id of deviceIdsToDelete) {
        try {
          await fetch("/api/e2ee/keys", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: id }),
          });
          console.log("[E2EE] Deleted old device from server:", id);
        } catch {
          // Continue even if server delete fails
        }
      }

      // 2. Clear OlmMachine's IndexedDB store
      await clearOlmMachineStore(session.user.id);

      // 3. Clear our local E2EE data
      await clearAllE2EEData();

      // 4. Clear refs
      if (accountRef.current?.free) {
        accountRef.current.free();
      }
      accountRef.current = null;
      olmMachineRef.current = null;

      // 5. Reset mismatch state
      setDeviceMismatch(null);

      // 6. Generate new keys
      await generateKeys();

      console.log("[E2EE] Device regenerated successfully");
    } catch (err) {
      console.error("[E2EE] Device regeneration failed:", err);
      setError(err instanceof Error ? err : new Error("Device regeneration failed"));
      setStatus("error");
      throw err;
    }
  }, [session?.user?.id, deviceMismatch, deviceId, generateKeys]);

  /**
   * Dismiss device mismatch and continue with fallback crypto.
   * The app will work but without full OlmMachine features.
   */
  const dismissDeviceMismatch = useCallback(() => {
    console.log("[E2EE] Dismissing device mismatch - continuing with fallback");
    setDeviceMismatch(null);
    setStatus("ready");
  }, []);

  // ============================================================================
  // MESSAGE ENCRYPTION (1:1 Olm)
  // ============================================================================

  const encryptMessage = useCallback(
    async (
      recipientUserId: string,
      recipientDeviceId: string,
      plaintext: string
    ): Promise<string> => {
      if (!accountRef.current || !vodozemacRef.current) {
        throw new Error("E2EE not initialized");
      }

      // Get or create session for recipient
      let storedSession = await getOlmSession(recipientDeviceId);
      let session;

      if (storedSession) {
        // Restore existing session
        session = vodozemacRef.current.Session.from_pickle(
          storedSession.pickle,
          PICKLE_KEY
        );
      } else {
        // Create new session - need to claim prekey from server
        const response = await fetch("/api/e2ee/prekeys/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: recipientUserId,
            targetDeviceId: recipientDeviceId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to claim prekey");
        }

        const { identityKey: recipientIdentityKey, publicKey: prekey } =
          await response.json();

        // Create outbound session
        session = new vodozemacRef.current.Session(
          accountRef.current,
          recipientIdentityKey,
          prekey
        );

        // Store session
        storedSession = {
          recipientDeviceId,
          pickle: session.pickle(PICKLE_KEY),
          lastUsed: Date.now(),
          recipientIdentityKey,
        };
        await storeOlmSession(storedSession);
      }

      // Encrypt message
      const encrypted = await session.encrypt(plaintext);

      // Update session pickle
      storedSession.pickle = session.pickle(PICKLE_KEY);
      storedSession.lastUsed = Date.now();
      await storeOlmSession(storedSession);

      // Return as JSON string
      return JSON.stringify(encrypted);
    },
    []
  );

  const decryptMessage = useCallback(
    async (
      senderUserId: string,
      senderDeviceId: string,
      ciphertext: string
    ): Promise<string> => {
      if (!accountRef.current || !vodozemacRef.current) {
        throw new Error("E2EE not initialized");
      }

      const message = JSON.parse(ciphertext);
      let storedSession = await getOlmSession(senderDeviceId);
      let session;

      if (vodozemacRef.current.is_prekey_message(ciphertext) && !storedSession) {
        // Create inbound session from prekey message
        session = accountRef.current.create_inbound_session(message.body);

        storedSession = {
          recipientDeviceId: senderDeviceId,
          pickle: session.pickle(PICKLE_KEY),
          lastUsed: Date.now(),
          recipientIdentityKey: "", // Would need to fetch
        };
        await storeOlmSession(storedSession);
      } else if (storedSession) {
        // Use existing session
        session = vodozemacRef.current.Session.from_pickle(
          storedSession.pickle,
          PICKLE_KEY
        );
      } else {
        throw new Error("No session for sender");
      }

      // Decrypt
      const plaintext = await session.decrypt(message);

      // Update session
      storedSession.pickle = session.pickle(PICKLE_KEY);
      storedSession.lastUsed = Date.now();
      await storeOlmSession(storedSession);

      return plaintext;
    },
    []
  );

  // ============================================================================
  // GROUP ENCRYPTION (Megolm)
  // ============================================================================

  const encryptGroupMessage = useCallback(
    async (
      conversationId: string,
      plaintext: string
    ): Promise<{ ciphertext: string; sessionId: string }> => {
      if (!vodozemacRef.current) {
        throw new Error("E2EE not initialized");
      }

      // Get or create outbound group session
      let stored = await getMegolmSession(conversationId);
      let groupSession;

      if (stored?.outboundPickle) {
        groupSession = vodozemacRef.current.GroupSession.from_pickle(
          stored.outboundPickle,
          PICKLE_KEY
        );

        // Check if rotation needed
        const { shouldRotate } = await incrementMegolmMessageCount(conversationId);
        if (shouldRotate) {
          // Create new session
          groupSession = new vodozemacRef.current.GroupSession();
          stored.outboundPickle = groupSession.pickle(PICKLE_KEY);
          stored.outboundCreatedAt = Date.now();
          stored.messageCount = 0;
          await storeMegolmSession(stored);

          // TODO: Share new session key with group members
        }
      } else {
        // Create new outbound session
        groupSession = new vodozemacRef.current.GroupSession();

        stored = {
          conversationId,
          outboundPickle: groupSession.pickle(PICKLE_KEY),
          inboundSessions: {},
          outboundCreatedAt: Date.now(),
          messageCount: 0,
        };
        await storeMegolmSession(stored);

        // TODO: Share session key with group members via Olm
      }

      // Encrypt
      const ciphertext = await groupSession.encrypt(plaintext);
      const sessionId = groupSession.session_id();

      // Update pickle
      stored.outboundPickle = groupSession.pickle(PICKLE_KEY);
      await storeMegolmSession(stored);

      return { ciphertext, sessionId };
    },
    []
  );

  const decryptGroupMessage = useCallback(
    async (
      conversationId: string,
      sessionId: string,
      ciphertext: string
    ): Promise<string> => {
      if (!vodozemacRef.current) {
        throw new Error("E2EE not initialized");
      }

      const stored = await getMegolmSession(conversationId);
      if (!stored) {
        throw new Error("No session for conversation");
      }

      const sessionPickle = stored.inboundSessions[sessionId];
      if (!sessionPickle) {
        throw new Error("Unknown session ID");
      }

      const inboundSession = vodozemacRef.current.InboundGroupSession.from_pickle(
        sessionPickle,
        PICKLE_KEY
      );

      const { plaintext } = await inboundSession.decrypt(ciphertext);
      return plaintext;
    },
    []
  );

  // ============================================================================
  // AUTO-INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (session?.user?.id && status === "uninitialized") {
      initialize();
    }
  }, [session?.user?.id, status, initialize]);

  // ============================================================================
  // AUTO-REPLENISH PREKEYS
  // ============================================================================

  // Track if we're currently replenishing to avoid duplicate calls
  const isReplenishingRef = useRef(false);

  useEffect(() => {
    // Only auto-replenish when:
    // 1. E2EE is ready
    // 2. Available prekeys are below threshold
    // 3. Not already replenishing
    // 4. We have a device ID (keys are generated)
    if (
      status === "ready" &&
      availablePrekeys < PREKEY_REPLENISH_THRESHOLD &&
      availablePrekeys > 0 && // Don't trigger if we haven't fetched the count yet
      !isReplenishingRef.current &&
      deviceId
    ) {
      isReplenishingRef.current = true;
      console.log(
        `[E2EE] Auto-replenishing prekeys (${availablePrekeys} < ${PREKEY_REPLENISH_THRESHOLD})`
      );

      replenishPrekeys(ONE_TIME_KEY_COUNT)
        .then(() => {
          console.log("[E2EE] Prekeys auto-replenished successfully");
        })
        .catch((err) => {
          console.error("[E2EE] Auto-replenish failed:", err);
        })
        .finally(() => {
          isReplenishingRef.current = false;
        });
    }
  }, [status, availablePrekeys, deviceId, replenishPrekeys]);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // State
    status,
    isInitialized,
    isLoading,
    error,
    deviceId,
    identityKey,
    signingKey,
    availablePrekeys,
    hasBackup,
    usingWasm, // True if using official vodozemac WASM, false if Web Crypto fallback
    deviceMismatch, // Details about device mismatch (if status is 'device-mismatch')

    // Actions
    initialize,
    generateKeys,
    getPublicKeys,
    replenishPrekeys,
    createBackup,
    restoreFromBackup,
    checkBackupExists,
    destroy,
    regenerateDevice,
    dismissDeviceMismatch,
    encryptMessage,
    decryptMessage,
    encryptGroupMessage,
    decryptGroupMessage,
  };
}
