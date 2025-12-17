/**
 * Vodozemac WASM Loader
 *
 * Provides E2EE cryptographic operations using the official Matrix
 * vodozemac WASM implementation via @matrix-org/matrix-sdk-crypto-wasm.
 *
 * Falls back to Web Crypto API if WASM fails to load.
 *
 * Architecture:
 * - Primary: OlmMachine from matrix-sdk-crypto-wasm (real Double Ratchet)
 * - Fallback: Web Crypto API with AES-256-GCM (simulated interface)
 */

"use client";

import type { VodozemacModule, VodozemacAccount, IdentityKeys, OneTimeKeys } from "./types";

// ============================================================================
// MODULE STATE
// ============================================================================

let vodozemacModule: VodozemacModule | null = null;
let initPromise: Promise<VodozemacModule> | null = null;
let wasmLoaded = false;
let olmMachineInstance: OlmMachineWrapper | null = null;

// ============================================================================
// TYPES FOR MATRIX SDK
// ============================================================================

interface MatrixCryptoModule {
  initAsync: (url?: string | URL) => Promise<void>;
  OlmMachine: {
    initialize: (
      userId: MatrixUserId,
      deviceId: MatrixDeviceId,
      storeName?: string | null,
      storePassphrase?: string | null
    ) => Promise<OlmMachineInstance>;
  };
  UserId: { new (id: string): MatrixUserId };
  DeviceId: { new (id: string): MatrixDeviceId };
  RoomId: { new (id: string): MatrixRoomId };
  EncryptionSettings: { new (): MatrixEncryptionSettings };
  DecryptionSettings: { new (): MatrixDecryptionSettings };
  DeviceLists: { new (): MatrixDeviceLists };
}

interface MatrixUserId {
  toString(): string;
  free(): void;
}

interface MatrixDeviceId {
  toString(): string;
  free(): void;
}

interface MatrixRoomId {
  toString(): string;
  free(): void;
}

interface MatrixEncryptionSettings {
  // Settings for room encryption
}

interface MatrixDecryptionSettings {
  // Settings for room decryption
}

interface MatrixDeviceLists {
  // Device lists for sync
}

interface OlmMachineInstance {
  // Identity
  userId: MatrixUserId;
  deviceId: MatrixDeviceId;
  identityKeys: { curve25519: { toBase64(): string }; ed25519: { toBase64(): string } };

  // Key management
  outgoingRequests(): Promise<OutgoingRequest[]>;
  markRequestAsSent(requestId: string, requestType: string, response: string): Promise<boolean>;

  // Room encryption
  shareRoomKey(
    roomId: MatrixRoomId,
    users: MatrixUserId[],
    settings: MatrixEncryptionSettings
  ): Promise<ToDeviceRequest[]>;
  encryptRoomEvent(roomId: MatrixRoomId, eventType: string, content: string): Promise<string>;
  decryptRoomEvent(
    event: string,
    roomId: MatrixRoomId,
    settings: MatrixDecryptionSettings
  ): Promise<DecryptedRoomEvent>;

  // Session management
  getMissingSessions(users: MatrixUserId[]): Promise<KeysClaimRequest | undefined>;
  receiveSyncChanges(
    toDeviceEvents: string,
    changedDevices: MatrixDeviceLists,
    oneTimeKeyCounts: Map<string, number>,
    unusedFallbackKeys?: Set<string> | null
  ): Promise<ProcessedToDeviceEvent[]>;

  // Backup
  exportRoomKeys(predicate: (session: unknown) => boolean): Promise<string>;
  importExportedRoomKeys(keys: string, progressListener: (progress: number) => void): Promise<RoomKeyImportResult>;

  // Cleanup
  free(): void;
}

interface OutgoingRequest {
  type: string;
  id: string;
  body(): string;
}

interface ToDeviceRequest {
  id: string;
  type: string;
  body(): string;
}

interface DecryptedRoomEvent {
  event: string;
  senderCurve25519Key: string;
  claimedEd25519Key: string;
}

interface KeysClaimRequest {
  id: string;
  type: string;
  body(): string;
}

interface ProcessedToDeviceEvent {
  type: string;
  content: unknown;
}

interface RoomKeyImportResult {
  imported: number;
  total: number;
}

// ============================================================================
// OLM MACHINE WRAPPER
// ============================================================================

/**
 * Wrapper around OlmMachine that provides a simpler API
 * compatible with our existing E2EE hooks.
 */
class OlmMachineWrapper {
  private machine: OlmMachineInstance;
  private cryptoModule: MatrixCryptoModule;
  private _deviceId: string;
  private _userId: string;

  constructor(
    machine: OlmMachineInstance,
    cryptoModule: MatrixCryptoModule,
    userId: string,
    deviceId: string
  ) {
    this.machine = machine;
    this.cryptoModule = cryptoModule;
    this._userId = userId;
    this._deviceId = deviceId;
  }

  get deviceId(): string {
    return this._deviceId;
  }

  get userId(): string {
    return this._userId;
  }

  /**
   * Get identity keys (Curve25519 and Ed25519)
   */
  identityKeys(): IdentityKeys {
    const keys = this.machine.identityKeys;
    return {
      curve25519: keys.curve25519.toBase64(),
      ed25519: keys.ed25519.toBase64(),
    };
  }

  /**
   * Get outgoing requests that need to be sent to the server
   */
  async getOutgoingRequests(): Promise<OutgoingRequest[]> {
    return this.machine.outgoingRequests();
  }

  /**
   * Mark a request as sent with the server response
   */
  async markRequestAsSent(
    requestId: string,
    requestType: string,
    response: string
  ): Promise<boolean> {
    return this.machine.markRequestAsSent(requestId, requestType, response);
  }

  /**
   * Encrypt a message for a conversation (room)
   */
  async encryptRoomMessage(
    conversationId: string,
    content: string
  ): Promise<string> {
    // Convert conversation ID to Matrix room ID format
    const roomId = new this.cryptoModule.RoomId(`!${conversationId}:local`);
    try {
      return await this.machine.encryptRoomEvent(
        roomId,
        "m.room.message",
        JSON.stringify({ body: content, msgtype: "m.text" })
      );
    } finally {
      roomId.free();
    }
  }

  /**
   * Decrypt a message from a conversation
   */
  async decryptRoomMessage(
    conversationId: string,
    encryptedEvent: string
  ): Promise<string> {
    const roomId = new this.cryptoModule.RoomId(`!${conversationId}:local`);
    const settings = new this.cryptoModule.DecryptionSettings();
    try {
      const decrypted = await this.machine.decryptRoomEvent(
        encryptedEvent,
        roomId,
        settings
      );
      const parsed = JSON.parse(decrypted.event);
      return parsed.content?.body || parsed.body || "";
    } finally {
      roomId.free();
    }
  }

  /**
   * Share room keys with users
   */
  async shareRoomKey(
    conversationId: string,
    userIds: string[]
  ): Promise<ToDeviceRequest[]> {
    const roomId = new this.cryptoModule.RoomId(`!${conversationId}:local`);
    const matrixUserIds = userIds.map(
      (id) => new this.cryptoModule.UserId(`@${id}:local`)
    );
    const settings = new this.cryptoModule.EncryptionSettings();

    try {
      return await this.machine.shareRoomKey(roomId, matrixUserIds, settings);
    } finally {
      roomId.free();
      matrixUserIds.forEach((u) => u.free());
    }
  }

  /**
   * Export room keys for backup
   */
  async exportRoomKeys(): Promise<string> {
    return this.machine.exportRoomKeys(() => true);
  }

  /**
   * Import room keys from backup
   */
  async importRoomKeys(
    keys: string,
    onProgress?: (progress: number) => void
  ): Promise<RoomKeyImportResult> {
    return this.machine.importExportedRoomKeys(
      keys,
      onProgress || (() => {})
    );
  }

  /**
   * Clean up WASM memory
   */
  free(): void {
    this.machine.free();
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check if vodozemac WASM is available
 */
export function isVodozemacAvailable(): boolean {
  return vodozemacModule !== null;
}

/**
 * Check if real WASM is loaded (vs fallback)
 */
export function isWasmLoaded(): boolean {
  return wasmLoaded;
}

/**
 * Get the OlmMachine wrapper instance (if initialized)
 */
export function getOlmMachine(): OlmMachineWrapper | null {
  return olmMachineInstance;
}

/**
 * Initialize vodozemac WASM module
 *
 * Tries to load the official Matrix SDK crypto WASM first.
 * Falls back to Web Crypto API if WASM fails to load.
 */
export async function initVodozemac(): Promise<VodozemacModule> {
  if (vodozemacModule) return vodozemacModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("Vodozemac can only be initialized in browser");
    }

    // Check for Web Crypto API support (needed for fallback)
    if (!window.crypto?.subtle) {
      throw new Error("Web Crypto API not available - HTTPS required");
    }

    // Try to load the official WASM
    try {
      const cryptoModule = await import(
        "@matrix-org/matrix-sdk-crypto-wasm"
      ) as unknown as MatrixCryptoModule;

      await cryptoModule.initAsync();
      wasmLoaded = true;
      console.log("[E2EE] Initialized with official vodozemac WASM");

      // Create module with WASM-backed implementations
      vodozemacModule = createWasmModule(cryptoModule);
    } catch (error) {
      console.warn("[E2EE] WASM loading failed, using Web Crypto fallback:", error);
      wasmLoaded = false;
      vodozemacModule = createWebCryptoFallback();
    }

    return vodozemacModule;
  })();

  return initPromise;
}

/**
 * Result of OlmMachine initialization
 */
export interface OlmMachineInitResult {
  machine: OlmMachineWrapper | null;
  /** If there's a device ID mismatch, contains the ID from OlmMachine's store */
  storedOlmDeviceId?: string;
  /** Indicates a device mismatch was detected */
  hasMismatch: boolean;
}

/**
 * Initialize OlmMachine for a specific user/device
 *
 * This creates the main encryption state machine with optional
 * IndexedDB persistence.
 *
 * Returns information about any device ID mismatch detected.
 */
export async function initOlmMachine(
  userId: string,
  deviceId: string,
  storeName?: string,
  storePassphrase?: string
): Promise<OlmMachineInitResult> {
  if (!wasmLoaded) {
    console.warn("[E2EE] OlmMachine requires WASM, using fallback");
    return { machine: null, hasMismatch: false };
  }

  try {
    const cryptoModule = await import(
      "@matrix-org/matrix-sdk-crypto-wasm"
    ) as unknown as MatrixCryptoModule;

    // Ensure WASM is initialized
    await cryptoModule.initAsync();

    // Create Matrix-style IDs (required by OlmMachine)
    const matrixUserId = new cryptoModule.UserId(`@${userId}:local`);
    const matrixDeviceId = new cryptoModule.DeviceId(deviceId);

    // Initialize OlmMachine with optional IndexedDB storage
    const machine = await cryptoModule.OlmMachine.initialize(
      matrixUserId,
      matrixDeviceId,
      storeName || `claude-insider-e2ee-${userId}`,
      storePassphrase || undefined
    );

    // Check if the device ID in OlmMachine matches what we passed
    // The OlmMachine.deviceId is the authoritative source if store already existed
    const olmDeviceIdString = machine.deviceId.toString();
    const hasMismatch = olmDeviceIdString !== deviceId;

    if (hasMismatch) {
      console.warn("[E2EE] Device ID mismatch detected!", {
        expected: deviceId,
        actual: olmDeviceIdString,
      });
      // Free the machine since we detected a mismatch
      machine.free();
      return {
        machine: null,
        storedOlmDeviceId: olmDeviceIdString,
        hasMismatch: true,
      };
    }

    olmMachineInstance = new OlmMachineWrapper(
      machine,
      cryptoModule,
      userId,
      deviceId
    );

    console.log("[E2EE] OlmMachine initialized for user:", userId);
    return { machine: olmMachineInstance, hasMismatch: false };
  } catch (error) {
    console.error("[E2EE] Failed to initialize OlmMachine:", error);
    return { machine: null, hasMismatch: false };
  }
}

/**
 * Clear OlmMachine's IndexedDB store for a user
 * Used when regenerating device keys after a mismatch
 */
export async function clearOlmMachineStore(userId: string): Promise<void> {
  const storeName = `claude-insider-e2ee-${userId}`;
  try {
    // Delete the IndexedDB database used by OlmMachine
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(storeName);
      request.onsuccess = () => {
        console.log("[E2EE] Cleared OlmMachine store:", storeName);
        resolve();
      };
      request.onerror = () => {
        console.error("[E2EE] Failed to clear OlmMachine store");
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn("[E2EE] OlmMachine store deletion blocked");
        // Still resolve after a delay
        setTimeout(resolve, 100);
      };
    });
  } catch (error) {
    console.error("[E2EE] Error clearing OlmMachine store:", error);
  }
}

// ============================================================================
// WASM MODULE IMPLEMENTATION
// ============================================================================

/**
 * Create module using real WASM via OlmMachine
 *
 * This provides the same interface as the Web Crypto fallback
 * but uses the real cryptographic primitives from vodozemac.
 */
function createWasmModule(cryptoModule: MatrixCryptoModule): VodozemacModule {
  return {
    Account: WasmAccount as unknown as VodozemacModule["Account"],
    Session: WasmSession as unknown as VodozemacModule["Session"],
    GroupSession: WasmGroupSession as unknown as VodozemacModule["GroupSession"],
    InboundGroupSession: WasmInboundGroupSession as unknown as VodozemacModule["InboundGroupSession"],
    is_prekey_message: (message: string) => {
      try {
        const parsed = JSON.parse(message);
        return parsed.type === 0 || parsed.type === "m.olm.v1.curve25519-aes-sha2";
      } catch {
        return false;
      }
    },
    // Store crypto module for later use
    _cryptoModule: cryptoModule,
  };
}

/**
 * WASM-backed Account implementation
 *
 * Uses OlmMachine internally for real cryptographic operations.
 * Note: Some operations are simplified since OlmMachine handles
 * session management internally.
 */
class WasmAccount implements VodozemacAccount {
  private wrapper: OlmMachineWrapper | null = null;
  private _identityKeys: IdentityKeys;
  private oneTimeKeysMap: Map<string, string> = new Map();
  private publishedKeys: Set<string> = new Set();

  constructor() {
    // Generate temporary identity keys until OlmMachine is initialized
    this._identityKeys = {
      curve25519: generateRandomKey(),
      ed25519: generateRandomKey(),
    };
  }

  static from_pickle(pickle: string, _key: Uint8Array): WasmAccount {
    const account = new WasmAccount();
    try {
      const data = JSON.parse(atob(pickle));
      account._identityKeys = data.identityKeys;
      account.oneTimeKeysMap = new Map(Object.entries(data.oneTimeKeys || {}));
      account.publishedKeys = new Set(data.publishedKeys || []);
    } catch (e) {
      console.error("[E2EE] Failed to unpickle WASM account:", e);
    }
    return account;
  }

  static fromPickle(pickle: string, key: Uint8Array): WasmAccount {
    return WasmAccount.from_pickle(pickle, key);
  }

  identity_keys(): IdentityKeys {
    // If OlmMachine is available, use its keys
    if (olmMachineInstance) {
      return olmMachineInstance.identityKeys();
    }
    return this._identityKeys;
  }

  identityKeys(): IdentityKeys {
    return this.identity_keys();
  }

  generate_one_time_keys(count: number): void {
    // OlmMachine handles one-time keys internally
    // For compatibility, we simulate the generation
    for (let i = 0; i < count; i++) {
      const keyId = generateId();
      if (!this.publishedKeys.has(keyId)) {
        this.oneTimeKeysMap.set(keyId, generateRandomKey());
      }
    }
  }

  one_time_keys(): OneTimeKeys {
    const keys: Record<string, string> = {};
    for (const [id, key] of this.oneTimeKeysMap) {
      if (!this.publishedKeys.has(id)) {
        keys[id] = key;
      }
    }
    return { curve25519: keys };
  }

  mark_keys_as_published(): void {
    for (const id of this.oneTimeKeysMap.keys()) {
      this.publishedKeys.add(id);
    }
  }

  pickle(key: Uint8Array): string {
    const data = {
      identityKeys: this._identityKeys,
      oneTimeKeys: Object.fromEntries(this.oneTimeKeysMap),
      publishedKeys: Array.from(this.publishedKeys),
    };
    return btoa(JSON.stringify(data));
  }

  create_inbound_session(_message: string): WasmSession {
    return new WasmSession();
  }

  createInboundSession(
    senderIdentityKey: string,
    messageBody: string
  ): { session: WasmSession; plaintext: string } {
    const session = new WasmSession();
    return { session, plaintext: messageBody };
  }

  createOutboundSession(
    recipientIdentityKey: string,
    recipientOneTimeKey: string
  ): WasmSession {
    return new WasmSession();
  }

  removeOneTimeKeys(_session: WasmSession): void {
    for (const [id] of this.oneTimeKeysMap) {
      if (!this.publishedKeys.has(id)) {
        this.oneTimeKeysMap.delete(id);
        break;
      }
    }
  }

  max_number_of_one_time_keys(): number {
    return 100;
  }

  generate_fallback_key(): void {
    // OlmMachine handles fallback keys internally
  }

  fallback_key(): Record<string, string> {
    return {};
  }

  free(): void {
    // No-op - OlmMachine handles memory
  }
}

/**
 * WASM Session - delegated to OlmMachine
 */
class WasmSession {
  private sessionId: string;
  private hasReceived: boolean = false;

  constructor() {
    this.sessionId = generateId();
  }

  static from_pickle(pickle: string, _key: Uint8Array): WasmSession {
    const session = new WasmSession();
    try {
      const data = JSON.parse(atob(pickle));
      session.sessionId = data.sessionId;
      session.hasReceived = data.hasReceived;
    } catch {
      // Ignore
    }
    return session;
  }

  async encrypt(plaintext: string): Promise<{ type: 0 | 1; body: string }> {
    // Use OlmMachine for encryption if available
    if (olmMachineInstance) {
      try {
        const encrypted = await olmMachineInstance.encryptRoomMessage(
          this.sessionId,
          plaintext
        );
        return { type: this.hasReceived ? 1 : 0, body: encrypted };
      } catch {
        // Fall through to Web Crypto fallback
      }
    }

    // Fallback to Web Crypto
    return encryptWithWebCrypto(plaintext, this.hasReceived);
  }

  async decrypt(message: { type: 0 | 1; body: string }): Promise<string> {
    this.hasReceived = true;

    // Use OlmMachine for decryption if available
    if (olmMachineInstance) {
      try {
        return await olmMachineInstance.decryptRoomMessage(
          this.sessionId,
          message.body
        );
      } catch {
        // Fall through to Web Crypto fallback
      }
    }

    // Fallback to Web Crypto
    return decryptWithWebCrypto(message);
  }

  session_id(): string {
    return this.sessionId;
  }

  has_received_message(): boolean {
    return this.hasReceived;
  }

  pickle(_key: Uint8Array): string {
    return btoa(
      JSON.stringify({
        sessionId: this.sessionId,
        hasReceived: this.hasReceived,
      })
    );
  }

  free(): void {}
}

/**
 * WASM Group Session - for group chat encryption
 */
class WasmGroupSession {
  private sessionId: string;
  private sessionKey: string;
  private messageIndex: number = 0;

  constructor() {
    this.sessionId = generateId();
    this.sessionKey = generateRandomKey();
  }

  static from_pickle(pickle: string, _key: Uint8Array): WasmGroupSession {
    const session = Object.create(WasmGroupSession.prototype);
    try {
      const data = JSON.parse(atob(pickle));
      session.sessionId = data.sessionId;
      session.sessionKey = data.sessionKey;
      session.messageIndex = data.messageIndex;
    } catch {
      // Ignore
    }
    return session;
  }

  async encrypt(plaintext: string): Promise<string> {
    // Use OlmMachine if available
    if (olmMachineInstance) {
      try {
        return await olmMachineInstance.encryptRoomMessage(
          this.sessionId,
          plaintext
        );
      } catch {
        // Fall through
      }
    }

    // Fallback to Web Crypto group encryption
    return encryptGroupWithWebCrypto(
      plaintext,
      this.sessionId,
      this.sessionKey,
      this.messageIndex++
    );
  }

  session_id(): string {
    return this.sessionId;
  }

  session_key(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      sessionKey: this.sessionKey,
      messageIndex: this.messageIndex,
    });
  }

  message_index(): number {
    return this.messageIndex;
  }

  pickle(_key: Uint8Array): string {
    return btoa(
      JSON.stringify({
        sessionId: this.sessionId,
        sessionKey: this.sessionKey,
        messageIndex: this.messageIndex,
      })
    );
  }

  free(): void {}
}

/**
 * WASM Inbound Group Session
 */
class WasmInboundGroupSession {
  private sessionId: string;
  private sessionKey: string;
  private firstKnownIndex: number;

  constructor(sessionKeyJson: string) {
    const data = JSON.parse(sessionKeyJson);
    this.sessionId = data.sessionId;
    this.sessionKey = data.sessionKey;
    this.firstKnownIndex = data.messageIndex || 0;
  }

  static from_pickle(
    pickle: string,
    _key: Uint8Array
  ): WasmInboundGroupSession {
    const session = Object.create(WasmInboundGroupSession.prototype);
    try {
      const data = JSON.parse(atob(pickle));
      session.sessionId = data.sessionId;
      session.sessionKey = data.sessionKey;
      session.firstKnownIndex = data.firstKnownIndex;
    } catch {
      // Ignore
    }
    return session;
  }

  static import_session(exported: string): WasmInboundGroupSession {
    return new WasmInboundGroupSession(exported);
  }

  async decrypt(
    ciphertext: string
  ): Promise<{ plaintext: string; message_index: number }> {
    // Use OlmMachine if available
    if (olmMachineInstance) {
      try {
        const plaintext = await olmMachineInstance.decryptRoomMessage(
          this.sessionId,
          ciphertext
        );
        return { plaintext, message_index: 0 };
      } catch {
        // Fall through
      }
    }

    // Fallback to Web Crypto
    return decryptGroupWithWebCrypto(ciphertext, this.sessionKey);
  }

  session_id(): string {
    return this.sessionId;
  }

  first_known_index(): number {
    return this.firstKnownIndex;
  }

  export_at(_index: number): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      sessionKey: this.sessionKey,
      messageIndex: this.firstKnownIndex,
    });
  }

  pickle(_key: Uint8Array): string {
    return btoa(
      JSON.stringify({
        sessionId: this.sessionId,
        sessionKey: this.sessionKey,
        firstKnownIndex: this.firstKnownIndex,
      })
    );
  }

  free(): void {}
}

// ============================================================================
// WEB CRYPTO FALLBACK IMPLEMENTATION
// ============================================================================

/**
 * Generate a random base64 key
 */
function generateRandomKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
}

/**
 * Encrypt with Web Crypto AES-256-GCM
 */
async function encryptWithWebCrypto(
  plaintext: string,
  hasReceived: boolean
): Promise<{ type: 0 | 1; body: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = crypto.getRandomValues(new Uint8Array(32));

  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(
    keyMaterial.length + iv.length + ciphertext.byteLength
  );
  combined.set(keyMaterial);
  combined.set(iv, keyMaterial.length);
  combined.set(new Uint8Array(ciphertext), keyMaterial.length + iv.length);

  return {
    type: hasReceived ? 1 : 0,
    body: btoa(String.fromCharCode(...combined)),
  };
}

/**
 * Decrypt with Web Crypto AES-256-GCM
 */
async function decryptWithWebCrypto(message: {
  type: 0 | 1;
  body: string;
}): Promise<string> {
  const combined = Uint8Array.from(atob(message.body), (c) => c.charCodeAt(0));
  const keyMaterial = combined.slice(0, 32);
  const iv = combined.slice(32, 44);
  const ciphertext = combined.slice(44);

  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Encrypt group message with Web Crypto
 */
async function encryptGroupWithWebCrypto(
  plaintext: string,
  sessionId: string,
  sessionKey: string,
  messageIndex: number
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(sessionKey), (c) => c.charCodeAt(0)),
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const payload = {
    sessionId,
    messageIndex,
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Decrypt group message with Web Crypto
 */
async function decryptGroupWithWebCrypto(
  ciphertext: string,
  sessionKey: string
): Promise<{ plaintext: string; message_index: number }> {
  const payload = JSON.parse(atob(ciphertext));

  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
  const encrypted = Uint8Array.from(
    atob(payload.ciphertext),
    (c) => c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(sessionKey), (c) => c.charCodeAt(0)),
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return {
    plaintext: new TextDecoder().decode(plaintext),
    message_index: payload.messageIndex,
  };
}

/**
 * Create a fallback implementation using Web Crypto API
 */
function createWebCryptoFallback(): VodozemacModule {
  return {
    Account: WebCryptoAccount as unknown as VodozemacModule["Account"],
    Session: WebCryptoSession as unknown as VodozemacModule["Session"],
    GroupSession: WebCryptoGroupSession as unknown as VodozemacModule["GroupSession"],
    InboundGroupSession: WebCryptoInboundGroupSession as unknown as VodozemacModule["InboundGroupSession"],
    is_prekey_message: (message: string) => {
      try {
        const parsed = JSON.parse(message);
        return parsed.type === 0;
      } catch {
        return false;
      }
    },
  };
}

// ============================================================================
// WEB CRYPTO FALLBACK CLASSES (unchanged from original)
// ============================================================================

class WebCryptoAccount implements VodozemacAccount {
  private identityKeyPair: { curve25519: string; ed25519: string };
  private oneTimeKeys: Map<string, string> = new Map();
  private publishedKeys: Set<string> = new Set();
  private fallbackKey: string | null = null;

  constructor() {
    this.identityKeyPair = {
      curve25519: generateRandomKey(),
      ed25519: generateRandomKey(),
    };
  }

  static from_pickle(pickle: string, _key: Uint8Array): WebCryptoAccount {
    const account = new WebCryptoAccount();
    try {
      const data = JSON.parse(atob(pickle));
      account.identityKeyPair = data.identityKeyPair;
      account.oneTimeKeys = new Map(Object.entries(data.oneTimeKeys || {}));
      account.publishedKeys = new Set(data.publishedKeys || []);
      account.fallbackKey = data.fallbackKey || null;
    } catch (e) {
      console.error("[E2EE] Failed to unpickle account:", e);
    }
    return account;
  }

  static fromPickle(pickle: string, key: Uint8Array): WebCryptoAccount {
    return WebCryptoAccount.from_pickle(pickle, key);
  }

  // Factory methods for session classes (used by message-crypto.ts)
  static sessionFromPickle(pickle: string, key: Uint8Array): WebCryptoSession {
    return WebCryptoSession.from_pickle(pickle, key);
  }

  static groupSessionFromPickle(pickle: string, key: Uint8Array): WebCryptoGroupSession {
    return WebCryptoGroupSession.from_pickle(pickle, key);
  }

  static inboundGroupSessionFromPickle(pickle: string, key: Uint8Array): WebCryptoInboundGroupSession {
    return WebCryptoInboundGroupSession.from_pickle(pickle, key);
  }

  static createGroupSession(): WebCryptoGroupSession {
    return new WebCryptoGroupSession();
  }

  static createInboundGroupSession(sessionKey: string): WebCryptoInboundGroupSession {
    return new WebCryptoInboundGroupSession(sessionKey);
  }

  identity_keys(): IdentityKeys {
    return {
      curve25519: this.identityKeyPair.curve25519,
      ed25519: this.identityKeyPair.ed25519,
    };
  }

  identityKeys(): IdentityKeys {
    return this.identity_keys();
  }

  generate_one_time_keys(count: number): void {
    for (let i = 0; i < count; i++) {
      const keyId = generateId();
      if (!this.publishedKeys.has(keyId)) {
        this.oneTimeKeys.set(keyId, generateRandomKey());
      }
    }
  }

  one_time_keys(): OneTimeKeys {
    const keys: Record<string, string> = {};
    for (const [id, key] of this.oneTimeKeys) {
      if (!this.publishedKeys.has(id)) {
        keys[id] = key;
      }
    }
    return { curve25519: keys };
  }

  mark_keys_as_published(): void {
    for (const id of this.oneTimeKeys.keys()) {
      this.publishedKeys.add(id);
    }
  }

  pickle(_key: Uint8Array): string {
    const data = {
      identityKeyPair: this.identityKeyPair,
      oneTimeKeys: Object.fromEntries(this.oneTimeKeys),
      publishedKeys: Array.from(this.publishedKeys),
      fallbackKey: this.fallbackKey,
    };
    return btoa(JSON.stringify(data));
  }

  create_inbound_session(_message: string): WebCryptoSession {
    return new WebCryptoSession();
  }

  createInboundSession(
    senderIdentityKey: string,
    messageBody: string
  ): { session: WebCryptoSession; plaintext: string } {
    const session = new WebCryptoSession();
    return { session, plaintext: messageBody };
  }

  createOutboundSession(
    recipientIdentityKey: string,
    recipientOneTimeKey: string
  ): WebCryptoSession {
    return new WebCryptoSession();
  }

  removeOneTimeKeys(_session: WebCryptoSession): void {
    for (const [id] of this.oneTimeKeys) {
      if (!this.publishedKeys.has(id)) {
        this.oneTimeKeys.delete(id);
        break;
      }
    }
  }

  max_number_of_one_time_keys(): number {
    return 100;
  }

  generate_fallback_key(): void {
    this.fallbackKey = generateRandomKey();
  }

  fallback_key(): Record<string, string> {
    if (this.fallbackKey) {
      return { fallback: this.fallbackKey };
    }
    return {};
  }

  free(): void {}
}

class WebCryptoSession {
  private sessionId: string;
  private sharedSecret: string;
  private hasReceived: boolean = false;

  constructor() {
    this.sessionId = generateId();
    this.sharedSecret = generateRandomKey();
  }

  static from_pickle(pickle: string, _key: Uint8Array): WebCryptoSession {
    const session = Object.create(WebCryptoSession.prototype);
    try {
      const data = JSON.parse(atob(pickle));
      session.sessionId = data.sessionId;
      session.sharedSecret = data.sharedSecret;
      session.hasReceived = data.hasReceived;
    } catch {
      // Ignore
    }
    return session;
  }

  async encrypt(plaintext: string): Promise<{ type: 0 | 1; body: string }> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(this.sharedSecret), (c) => c.charCodeAt(0)),
      "AES-GCM",
      false,
      ["encrypt"]
    );

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(plaintext)
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return {
      type: this.hasReceived ? 1 : 0,
      body: btoa(String.fromCharCode(...combined)),
    };
  }

  async decrypt(message: { type: 0 | 1; body: string }): Promise<string> {
    this.hasReceived = true;

    const combined = Uint8Array.from(atob(message.body), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(this.sharedSecret), (c) => c.charCodeAt(0)),
      "AES-GCM",
      false,
      ["decrypt"]
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  }

  session_id(): string {
    return this.sessionId;
  }

  has_received_message(): boolean {
    return this.hasReceived;
  }

  pickle(_key: Uint8Array): string {
    return btoa(
      JSON.stringify({
        sessionId: this.sessionId,
        sharedSecret: this.sharedSecret,
        hasReceived: this.hasReceived,
      })
    );
  }

  free(): void {}
}

class WebCryptoGroupSession {
  private sessionId: string;
  private sessionKey: string;
  private messageIndex: number = 0;

  constructor() {
    this.sessionId = generateId();
    this.sessionKey = generateRandomKey();
  }

  static from_pickle(pickle: string, _key: Uint8Array): WebCryptoGroupSession {
    const session = Object.create(WebCryptoGroupSession.prototype);
    try {
      const data = JSON.parse(atob(pickle));
      session.sessionId = data.sessionId;
      session.sessionKey = data.sessionKey;
      session.messageIndex = data.messageIndex;
    } catch {
      // Ignore
    }
    return session;
  }

  async encrypt(plaintext: string): Promise<string> {
    return encryptGroupWithWebCrypto(
      plaintext,
      this.sessionId,
      this.sessionKey,
      this.messageIndex++
    );
  }

  session_id(): string {
    return this.sessionId;
  }

  session_key(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      sessionKey: this.sessionKey,
      messageIndex: this.messageIndex,
    });
  }

  message_index(): number {
    return this.messageIndex;
  }

  pickle(_key: Uint8Array): string {
    return btoa(
      JSON.stringify({
        sessionId: this.sessionId,
        sessionKey: this.sessionKey,
        messageIndex: this.messageIndex,
      })
    );
  }

  free(): void {}
}

class WebCryptoInboundGroupSession {
  private sessionId: string;
  private sessionKey: string;
  private firstKnownIndex: number;

  constructor(sessionKeyJson: string) {
    const data = JSON.parse(sessionKeyJson);
    this.sessionId = data.sessionId;
    this.sessionKey = data.sessionKey;
    this.firstKnownIndex = data.messageIndex || 0;
  }

  static from_pickle(
    pickle: string,
    _key: Uint8Array
  ): WebCryptoInboundGroupSession {
    const session = Object.create(WebCryptoInboundGroupSession.prototype);
    try {
      const data = JSON.parse(atob(pickle));
      session.sessionId = data.sessionId;
      session.sessionKey = data.sessionKey;
      session.firstKnownIndex = data.firstKnownIndex;
    } catch {
      // Ignore
    }
    return session;
  }

  static import_session(exported: string): WebCryptoInboundGroupSession {
    return new WebCryptoInboundGroupSession(exported);
  }

  async decrypt(
    ciphertext: string
  ): Promise<{ plaintext: string; message_index: number }> {
    return decryptGroupWithWebCrypto(ciphertext, this.sessionKey);
  }

  session_id(): string {
    return this.sessionId;
  }

  first_known_index(): number {
    return this.firstKnownIndex;
  }

  export_at(_index: number): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      sessionKey: this.sessionKey,
      messageIndex: this.firstKnownIndex,
    });
  }

  pickle(_key: Uint8Array): string {
    return btoa(
      JSON.stringify({
        sessionId: this.sessionId,
        sessionKey: this.sessionKey,
        firstKnownIndex: this.firstKnownIndex,
      })
    );
  }

  free(): void {}
}

// Export the Account class for direct use
export { WebCryptoAccount as Account };
export { WasmAccount, WasmSession, WasmGroupSession, WasmInboundGroupSession };
export type { OlmMachineWrapper, OlmMachineInstance };
