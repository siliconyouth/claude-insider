/**
 * E2EE Key Backup
 *
 * Password-protected cloud backup of E2EE keys using:
 * - PBKDF2 for password-based key derivation (100,000 iterations)
 * - AES-256-GCM for authenticated encryption
 *
 * Security properties:
 * - Keys are encrypted client-side before upload
 * - Server never sees plaintext keys or password
 * - Salt stored with backup for recovery
 * - Auth tag prevents tampering
 */

"use client";

import type { BackupData } from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const BACKUP_VERSION = 1;

// ============================================================================
// KEY DERIVATION
// ============================================================================

/**
 * Derive an encryption key from password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

// ============================================================================
// ENCRYPTION / DECRYPTION
// ============================================================================

/**
 * Encrypt backup data with password
 *
 * Returns encrypted backup + metadata needed for decryption
 */
export async function encryptBackup(
  backupData: BackupData,
  password: string
): Promise<{
  encryptedBackup: string;
  backupIv: string;
  backupAuthTag: string;
  salt: string;
  iterations: number;
}> {
  // Generate random salt and IV
  const salt = generateSalt();
  const iv = generateIV();

  // Derive encryption key from password
  const key = await deriveKey(password, salt);

  // Serialize backup data
  const plaintext = new TextEncoder().encode(JSON.stringify(backupData));

  // Encrypt with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    plaintext
  );

  // AES-GCM appends 16-byte auth tag to ciphertext
  const ciphertextBytes = new Uint8Array(ciphertext);
  const encryptedData = ciphertextBytes.slice(0, -16);
  const authTag = ciphertextBytes.slice(-16);

  return {
    encryptedBackup: uint8ArrayToBase64(encryptedData),
    backupIv: uint8ArrayToBase64(iv),
    backupAuthTag: uint8ArrayToBase64(authTag),
    salt: uint8ArrayToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Decrypt backup data with password
 */
export async function decryptBackup(
  encryptedBackup: string,
  backupIv: string,
  backupAuthTag: string,
  salt: string,
  password: string
): Promise<BackupData> {
  // Decode base64 values
  const encryptedData = base64ToUint8Array(encryptedBackup);
  const iv = base64ToUint8Array(backupIv);
  const authTag = base64ToUint8Array(backupAuthTag);
  const saltBytes = base64ToUint8Array(salt);

  // Derive decryption key from password
  const key = await deriveKey(password, saltBytes);

  // Reconstruct ciphertext with auth tag
  const ciphertext = new Uint8Array(encryptedData.length + authTag.length);
  ciphertext.set(encryptedData);
  ciphertext.set(authTag, encryptedData.length);

  // Decrypt with AES-GCM
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext
  );

  // Parse backup data
  const backupJson = new TextDecoder().decode(plaintext);
  return JSON.parse(backupJson) as BackupData;
}

// ============================================================================
// BACKUP DATA CREATION
// ============================================================================

/**
 * Create a complete backup data object from current E2EE state
 */
export async function createBackupData(
  accountPickle: string,
  deviceId: string,
  olmSessions: Record<string, string>,
  megolmSessions: Record<string, import("./types").StoredMegolmSession>
): Promise<BackupData> {
  return {
    accountPickle,
    deviceId,
    olmSessions,
    megolmSessions,
    createdAt: Date.now(),
    version: BACKUP_VERSION,
  };
}

/**
 * Validate backup data structure
 */
export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;

  const backup = data as Record<string, unknown>;

  return (
    typeof backup.accountPickle === "string" &&
    typeof backup.deviceId === "string" &&
    typeof backup.olmSessions === "object" &&
    typeof backup.megolmSessions === "object" &&
    typeof backup.createdAt === "number" &&
    typeof backup.version === "number"
  );
}

// ============================================================================
// PASSWORD STRENGTH VALIDATION
// ============================================================================

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: string[];
  isStrong: boolean;
}

/**
 * Check password strength for backup encryption
 *
 * Requirements for "strong":
 * - At least 12 characters
 * - Mix of uppercase, lowercase, numbers
 * - At least one special character recommended
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  if (password.length < 8) {
    feedback.push("Use at least 8 characters");
  } else if (password.length < 12) {
    feedback.push("12+ characters recommended");
  }

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLower && hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (!hasLower || !hasUpper) {
    feedback.push("Mix uppercase and lowercase");
  }
  if (!hasNumber) {
    feedback.push("Add a number");
  }
  if (!hasSpecial) {
    feedback.push("Add a special character");
  }

  // Common patterns to avoid
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /(.)\1{3,}/, // Repeated characters
  ];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common patterns");
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4;

  return {
    score: normalizedScore,
    feedback,
    isStrong: normalizedScore >= 3 && password.length >= 12,
  };
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: 0 | 1 | 2 | 3 | 4): string {
  const labels: [string, string, string, string, string] = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];
  return labels[score];
}

/**
 * Get password strength color class
 */
export function getPasswordStrengthColor(score: 0 | 1 | 2 | 3 | 4): string {
  const colors: [string, string, string, string, string] = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-500",
  ];
  return colors[score];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) =>
    String.fromCharCode(byte)
  ).join("");
  return btoa(binString);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

// ============================================================================
// BACKUP RECOVERY HELPERS
// ============================================================================

/**
 * Verify a password can decrypt a backup without fully restoring
 *
 * Returns true if password is correct, throws on wrong password
 */
export async function verifyBackupPassword(
  encryptedBackup: string,
  backupIv: string,
  backupAuthTag: string,
  salt: string,
  password: string
): Promise<boolean> {
  try {
    await decryptBackup(encryptedBackup, backupIv, backupAuthTag, salt, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate backup size in bytes
 */
export function estimateBackupSize(backupData: BackupData): number {
  const json = JSON.stringify(backupData);
  return new TextEncoder().encode(json).length;
}

/**
 * Format backup size for display
 */
export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
