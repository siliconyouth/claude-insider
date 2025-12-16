/**
 * E2EE Type Definitions
 *
 * TypeScript interfaces for the End-to-End Encryption system
 * using Matrix Olm/Megolm protocol via vodozemac.
 */

// ============================================================================
// VODOZEMAC WASM MODULE TYPES
// ============================================================================

/**
 * Vodozemac Account - manages identity keys and generates sessions
 */
export interface VodozemacAccount {
  /** Get the Curve25519 and Ed25519 identity keys */
  identity_keys(): IdentityKeys;

  /** Generate N one-time prekeys */
  generate_one_time_keys(count: number): void;

  /** Get unpublished one-time keys */
  one_time_keys(): OneTimeKeys;

  /** Mark one-time keys as published to server */
  mark_keys_as_published(): void;

  /** Serialize account state for storage */
  pickle(key: Uint8Array): string;

  /** Create session from incoming prekey message */
  create_inbound_session(message: string): VodozemacSession;

  /** Maximum number of one-time keys the account can hold */
  max_number_of_one_time_keys(): number;

  /** Generate a new fallback key */
  generate_fallback_key(): void;

  /** Get the current fallback key */
  fallback_key(): Record<string, string>;

  /** Free WASM memory */
  free(): void;
}

/**
 * Vodozemac Session - for 1:1 encrypted communication
 */
export interface VodozemacSession {
  /** Encrypt a message */
  encrypt(plaintext: string): OlmMessage | Promise<OlmMessage>;

  /** Decrypt a message */
  decrypt(message: OlmMessage): string | Promise<string>;

  /** Get session ID for identification */
  session_id(): string;

  /** Check if session has received a message */
  has_received_message(): boolean;

  /** Serialize session for storage */
  pickle(key: Uint8Array): string;

  /** Free WASM memory */
  free(): void;
}

/**
 * Vodozemac GroupSession - for group encrypted communication (Megolm)
 */
export interface VodozemacGroupSession {
  /** Encrypt a message for the group */
  encrypt(plaintext: string): string | Promise<string>;

  /** Get session ID */
  session_id(): string;

  /** Get session key for sharing with other members */
  session_key(): string;

  /** Get current message index */
  message_index(): number;

  /** Serialize for storage */
  pickle(key: Uint8Array): string;

  /** Free WASM memory */
  free(): void;
}

/**
 * Vodozemac InboundGroupSession - for receiving group messages
 */
export interface VodozemacInboundGroupSession {
  /** Decrypt a group message */
  decrypt(ciphertext: string): DecryptedMessage | Promise<DecryptedMessage>;

  /** Get session ID */
  session_id(): string;

  /** Get first known message index */
  first_known_index(): number;

  /** Export session at a given index for sharing */
  export_at(index: number): string;

  /** Serialize for storage */
  pickle(key: Uint8Array): string;

  /** Free WASM memory */
  free(): void;
}

/**
 * Vodozemac WASM module interface
 */
export interface VodozemacModule {
  /** Create a new Account */
  Account: {
    new (): VodozemacAccount;
    from_pickle(pickle: string, key: Uint8Array): VodozemacAccount;
  };

  /** Create an outbound session */
  Session: {
    new (
      account: VodozemacAccount,
      identity_key: string,
      one_time_key: string
    ): VodozemacSession;
    from_pickle(pickle: string, key: Uint8Array): VodozemacSession;
  };

  /** Create an outbound group session */
  GroupSession: {
    new (): VodozemacGroupSession;
    from_pickle(pickle: string, key: Uint8Array): VodozemacGroupSession;
  };

  /** Create an inbound group session from exported key */
  InboundGroupSession: {
    new (session_key: string): VodozemacInboundGroupSession;
    from_pickle(pickle: string, key: Uint8Array): VodozemacInboundGroupSession;
    import_session(exported: string): VodozemacInboundGroupSession;
  };

  /** Check if a message is a prekey message */
  is_prekey_message(message: string): boolean;

  /** Internal reference to Matrix crypto module (WASM only) */
  _cryptoModule?: unknown;
}

// ============================================================================
// OLM MACHINE TYPES (Matrix SDK Crypto WASM)
// ============================================================================

/**
 * OlmMachine wrapper for simplified E2EE operations
 */
export interface OlmMachineState {
  /** User ID associated with this machine */
  userId: string;
  /** Device ID for this machine */
  deviceId: string;
  /** Whether WASM is loaded (vs Web Crypto fallback) */
  isWasmLoaded: boolean;
}

/**
 * Room key export result
 */
export interface RoomKeyExportResult {
  /** Number of keys imported */
  imported: number;
  /** Total keys in the export */
  total: number;
}

// ============================================================================
// KEY TYPES
// ============================================================================

/**
 * Identity keys returned by Account.identity_keys()
 */
export interface IdentityKeys {
  /** Curve25519 public key for key agreement */
  curve25519: string;
  /** Ed25519 public key for signing */
  ed25519: string;
}

/**
 * One-time keys returned by Account.one_time_keys()
 */
export interface OneTimeKeys {
  /** Map of key ID to Curve25519 public key */
  curve25519: Record<string, string>;
}

/**
 * Olm encrypted message
 */
export interface OlmMessage {
  /** Message type: 0 = prekey, 1 = normal */
  type: 0 | 1;
  /** Ciphertext body */
  body: string;
}

/**
 * Decrypted message with metadata
 */
export interface DecryptedMessage {
  /** Decrypted plaintext */
  plaintext: string;
  /** Message index in the ratchet */
  message_index: number;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * Stored account data in IndexedDB
 */
export interface StoredAccount {
  /** Pickled account state (encrypted) */
  pickle: string;
  /** Unique device identifier */
  deviceId: string;
  /** When the account was created */
  createdAt: number;
  /** Pickle encryption key (derived from password or random) */
  pickleKey?: string;
}

/**
 * Stored Olm session in IndexedDB
 */
export interface StoredSession {
  /** Recipient's device ID */
  recipientDeviceId: string;
  /** Pickled session state */
  pickle: string;
  /** Last time session was used */
  lastUsed: number;
  /** Recipient's identity key (for verification) */
  recipientIdentityKey: string;
}

/**
 * Stored Megolm session in IndexedDB
 */
export interface StoredMegolmSession {
  /** Conversation/room ID */
  conversationId: string;
  /** Outbound session pickle (for sending) */
  outboundPickle: string | null;
  /** Map of session ID to inbound pickle (for receiving) */
  inboundSessions: Record<string, string>;
  /** When outbound session was created */
  outboundCreatedAt: number | null;
  /** Message count for rotation policy */
  messageCount: number;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Device key data stored on server
 */
export interface DeviceKey {
  id: string;
  userId: string;
  deviceId: string;
  identityKey: string;
  signingKey: string;
  signedPrekey: string;
  signedPrekeyId: number;
  signedPrekeySignature: string;
  deviceName: string | null;
  deviceType: "web" | "mobile" | "desktop";
  createdAt: string;
  lastSeenAt: string;
}

/**
 * One-time prekey stored on server
 */
export interface OneTimePrekey {
  id: string;
  deviceKeyId: string;
  keyId: number;
  publicKey: string;
  createdAt: string;
  claimedAt: string | null;
}

/**
 * Request to register device keys
 */
export interface RegisterDeviceKeysRequest {
  deviceId: string;
  identityKey: string;
  signingKey: string;
  signedPrekey?: string;
  signedPrekeyId?: number;
  signedPrekeySignature?: string;
  oneTimeKeys?: Array<[number, string]>;
  deviceName?: string;
}

/**
 * Request to claim a one-time prekey
 */
export interface ClaimPrekeyRequest {
  targetUserId: string;
  targetDeviceId: string;
}

/**
 * Response from claiming a prekey
 */
export interface ClaimPrekeyResponse {
  keyId: number;
  publicKey: string;
  identityKey: string;
  signingKey: string;
  signedPrekey?: string;
}

// ============================================================================
// BACKUP TYPES
// ============================================================================

/**
 * Encrypted key backup stored on server
 */
export interface KeyBackup {
  id: string;
  userId: string;
  encryptedBackup: string;
  backupIv: string;
  backupAuthTag: string;
  salt: string;
  iterations: number;
  deviceCount: number;
  backupVersion: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Decrypted backup data
 */
export interface BackupData {
  /** Account pickle */
  accountPickle: string;
  /** Device ID */
  deviceId: string;
  /** All Olm session pickles */
  olmSessions: Record<string, string>;
  /** All Megolm session data */
  megolmSessions: Record<string, StoredMegolmSession>;
  /** Backup creation timestamp */
  createdAt: number;
  /** Backup version for migration */
  version: number;
}

/**
 * Request to create/update backup
 */
export interface CreateBackupRequest {
  password: string;
  backupData: BackupData;
}

/**
 * Request to restore from backup
 */
export interface RestoreBackupRequest {
  password: string;
}

// ============================================================================
// HOOK STATE TYPES
// ============================================================================

/**
 * E2EE initialization state
 */
export type E2EEStatus =
  | "uninitialized"
  | "loading"
  | "ready"
  | "generating"
  | "error"
  | "needs-setup";

/**
 * Public keys for sharing
 */
export interface PublicKeys {
  identityKey: string;
  signingKey: string;
  deviceId: string;
}

/**
 * E2EE hook state
 */
export interface E2EEState {
  /** Current status */
  status: E2EEStatus;

  /** Whether E2EE is fully initialized and ready */
  isInitialized: boolean;

  /** Whether currently loading/generating */
  isLoading: boolean;

  /** Any error that occurred */
  error: Error | null;

  /** Current device ID */
  deviceId: string | null;

  /** Curve25519 identity key */
  identityKey: string | null;

  /** Ed25519 signing key */
  signingKey: string | null;

  /** Number of available one-time prekeys */
  availablePrekeys: number;

  /** Whether backup exists */
  hasBackup: boolean;

  /** Whether using official vodozemac WASM (true) or Web Crypto fallback (false) */
  usingWasm: boolean;
}

/**
 * E2EE hook actions
 */
export interface E2EEActions {
  /** Initialize E2EE (load existing or prompt for setup) */
  initialize: () => Promise<void>;

  /** Generate new device keys */
  generateKeys: () => Promise<void>;

  /** Get public keys for sharing */
  getPublicKeys: () => PublicKeys | null;

  /** Upload more one-time prekeys */
  replenishPrekeys: (count?: number) => Promise<void>;

  /** Create encrypted backup */
  createBackup: (password: string) => Promise<void>;

  /** Restore from backup */
  restoreFromBackup: (password: string) => Promise<void>;

  /** Check if backup exists */
  checkBackupExists: () => Promise<boolean>;

  /** Destroy all local keys (logout) */
  destroy: () => Promise<void>;

  /** Encrypt a message for a recipient */
  encryptMessage: (
    recipientUserId: string,
    recipientDeviceId: string,
    plaintext: string
  ) => Promise<string>;

  /** Decrypt a received message */
  decryptMessage: (
    senderUserId: string,
    senderDeviceId: string,
    ciphertext: string
  ) => Promise<string>;

  /** Encrypt for a group conversation */
  encryptGroupMessage: (
    conversationId: string,
    plaintext: string
  ) => Promise<{ ciphertext: string; sessionId: string }>;

  /** Decrypt a group message */
  decryptGroupMessage: (
    conversationId: string,
    sessionId: string,
    ciphertext: string
  ) => Promise<string>;
}

/**
 * Complete E2EE hook return type
 */
export type UseE2EEReturn = E2EEState & E2EEActions;
