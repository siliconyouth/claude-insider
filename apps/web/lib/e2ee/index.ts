/**
 * E2EE Module - End-to-End Encryption for Claude Insider
 *
 * Implements the Matrix Olm/Megolm protocol for secure messaging:
 * - Olm: 1:1 encrypted sessions with Double Ratchet-like forward secrecy
 * - Megolm: Group encryption optimized for many recipients (O(1) vs O(n))
 *
 * Architecture:
 * - Private keys stored locally in IndexedDB (never leave device)
 * - Public keys uploaded to server for recipient discovery
 * - Password-protected cloud backup for key recovery
 * - Web Crypto API fallback when WASM unavailable
 *
 * Phase 1 Components:
 * - vodozemac.ts: WASM loader with Web Crypto fallback
 * - types.ts: TypeScript interfaces for all E2EE types
 * - key-storage.ts: IndexedDB wrapper for local key storage
 * - key-backup.ts: PBKDF2 + AES-256-GCM encrypted cloud backup
 */

// Types
export type {
  VodozemacModule,
  VodozemacAccount,
  VodozemacSession,
  VodozemacGroupSession,
  VodozemacInboundGroupSession,
  IdentityKeys,
  OneTimeKeys,
  OlmMessage,
  DecryptedMessage,
  StoredAccount,
  StoredSession,
  StoredMegolmSession,
  DeviceKey,
  OneTimePrekey,
  RegisterDeviceKeysRequest,
  ClaimPrekeyRequest,
  ClaimPrekeyResponse,
  KeyBackup,
  BackupData,
  CreateBackupRequest,
  RestoreBackupRequest,
  E2EEStatus,
  PublicKeys,
  E2EEState,
  E2EEActions,
  UseE2EEReturn,
} from "./types";

// WASM/Crypto module
export {
  initVodozemac,
  isVodozemacAvailable,
  Account,
} from "./vodozemac";

// Key storage
export {
  getE2EEDatabase,
  closeE2EEDatabase,
  getStoredAccount,
  storeAccount,
  deleteAccount,
  hasStoredAccount,
  getOlmSession,
  storeOlmSession,
  deleteOlmSession,
  getAllOlmSessions,
  getRecentOlmSessions,
  deleteStaleOlmSessions,
  getMegolmSession,
  storeMegolmSession,
  deleteMegolmSession,
  getAllMegolmSessions,
  addInboundMegolmSession,
  incrementMegolmMessageCount,
  clearAllE2EEData,
  exportAllE2EEData,
  importE2EEData,
  getE2EEStorageStats,
} from "./key-storage";

// Key backup
export {
  encryptBackup,
  decryptBackup,
  createBackupData,
  validateBackupData,
  checkPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  verifyBackupPassword,
  estimateBackupSize,
  formatBackupSize,
  type PasswordStrength,
} from "./key-backup";

// Message cryptography
export {
  encryptMessage,
  decryptMessage,
  setPickleKey,
  isE2EEReady,
  getDeviceIdentityKey,
  getCurrentDeviceId,
  processMegolmSessionShare,
  createOutboundOlmSession,
  getOrCreateOlmSession,
  processInboundOlmMessage,
  getOrCreateMegolmSession,
  importMegolmSession,
  decryptMegolmMessage,
  type EncryptedMessagePayload,
  type DecryptedMessageResult,
  type SessionSharePayload,
  type DeviceInfo,
} from "./message-crypto";

// Device verification
export {
  startVerification,
  acceptVerification,
  calculateSAS,
  confirmVerification,
  cancelVerification,
  getPendingVerifications,
  isDeviceVerified,
  getVerifiedDevices,
  SAS_EMOJIS,
  type VerificationState,
  type StartVerificationResult,
} from "./device-verification";

// AI consent
export {
  getConversationAIStatus,
  grantAIConsent,
  revokeAIConsent,
  canUseAIFeature,
  logAIAccess,
  getAIAccessHistory,
  shouldShowConsentDialog,
  getConsentDialogMessage,
  hashContent,
  prepareForAI,
  AI_FEATURES,
  type AIFeature,
  type ConsentStatus,
  type ConversationAIStatus,
  type AIAccessLogEntry,
} from "./ai-consent";
