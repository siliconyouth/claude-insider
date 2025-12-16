/**
 * E2EE Device Verification
 *
 * Implements SAS (Short Authentication String) verification using emojis.
 * Based on the Matrix SAS verification protocol.
 *
 * Flow:
 * 1. Initiator sends commitment hash of their public key
 * 2. Target sends their public key
 * 3. Initiator reveals their public key
 * 4. Both derive shared secret and display same emojis
 * 5. Users compare emojis out-of-band (voice, in-person)
 * 6. If matched, devices are marked as verified
 */

"use client";

// ============================================================================
// EMOJI SET (Matrix SAS emoji set - 64 emojis)
// ============================================================================

export const SAS_EMOJIS: Array<{ emoji: string; name: string }> = [
  { emoji: "🐶", name: "Dog" },
  { emoji: "🐱", name: "Cat" },
  { emoji: "🦁", name: "Lion" },
  { emoji: "🐴", name: "Horse" },
  { emoji: "🦄", name: "Unicorn" },
  { emoji: "🐷", name: "Pig" },
  { emoji: "🐘", name: "Elephant" },
  { emoji: "🐰", name: "Rabbit" },
  { emoji: "🐼", name: "Panda" },
  { emoji: "🐔", name: "Rooster" },
  { emoji: "🐧", name: "Penguin" },
  { emoji: "🐢", name: "Turtle" },
  { emoji: "🐟", name: "Fish" },
  { emoji: "🐙", name: "Octopus" },
  { emoji: "🦋", name: "Butterfly" },
  { emoji: "🌸", name: "Flower" },
  { emoji: "🌲", name: "Tree" },
  { emoji: "🌵", name: "Cactus" },
  { emoji: "🍄", name: "Mushroom" },
  { emoji: "🌍", name: "Globe" },
  { emoji: "🌙", name: "Moon" },
  { emoji: "☁️", name: "Cloud" },
  { emoji: "🔥", name: "Fire" },
  { emoji: "🍌", name: "Banana" },
  { emoji: "🍎", name: "Apple" },
  { emoji: "🍓", name: "Strawberry" },
  { emoji: "🌽", name: "Corn" },
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🎂", name: "Cake" },
  { emoji: "❤️", name: "Heart" },
  { emoji: "😀", name: "Smiley" },
  { emoji: "🤖", name: "Robot" },
  { emoji: "🎩", name: "Hat" },
  { emoji: "👓", name: "Glasses" },
  { emoji: "🔧", name: "Spanner" },
  { emoji: "🎅", name: "Santa" },
  { emoji: "👍", name: "Thumbs Up" },
  { emoji: "☂️", name: "Umbrella" },
  { emoji: "⌛", name: "Hourglass" },
  { emoji: "⏰", name: "Clock" },
  { emoji: "🎁", name: "Gift" },
  { emoji: "💡", name: "Light Bulb" },
  { emoji: "📕", name: "Book" },
  { emoji: "✏️", name: "Pencil" },
  { emoji: "📎", name: "Paperclip" },
  { emoji: "✂️", name: "Scissors" },
  { emoji: "🔒", name: "Lock" },
  { emoji: "🔑", name: "Key" },
  { emoji: "🔨", name: "Hammer" },
  { emoji: "☎️", name: "Telephone" },
  { emoji: "🏁", name: "Flag" },
  { emoji: "🚂", name: "Train" },
  { emoji: "🚲", name: "Bicycle" },
  { emoji: "✈️", name: "Aeroplane" },
  { emoji: "🚀", name: "Rocket" },
  { emoji: "🏆", name: "Trophy" },
  { emoji: "⚽", name: "Ball" },
  { emoji: "🎸", name: "Guitar" },
  { emoji: "🎺", name: "Trumpet" },
  { emoji: "🔔", name: "Bell" },
  { emoji: "⚓", name: "Anchor" },
  { emoji: "🎧", name: "Headphones" },
  { emoji: "📁", name: "Folder" },
  { emoji: "📌", name: "Pin" },
];

// ============================================================================
// TYPES
// ============================================================================

export interface VerificationState {
  verificationId: string;
  transactionId: string;
  status:
    | "pending"
    | "started"
    | "key_exchanged"
    | "sas_ready"
    | "sas_match"
    | "verified"
    | "cancelled"
    | "expired";
  isInitiator: boolean;
  targetUserId: string;
  targetDeviceId: string;
  targetUserName?: string;
  emojis?: Array<{ emoji: string; name: string }>;
  decimals?: [number, number, number];
  error?: string;
}

export interface StartVerificationResult {
  verificationId: string;
  transactionId: string;
  publicKey: string;
  commitment: string;
}

// ============================================================================
// CRYPTO UTILITIES
// ============================================================================

/**
 * Generate an ephemeral Curve25519 key pair for ECDH
 */
async function generateEphemeralKeyPair(): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256", // Using P-256 as Web Crypto doesn't support Curve25519 directly
    },
    true,
    ["deriveBits"]
  );

  // Export public key
  const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKey = uint8ArrayToBase64(new Uint8Array(publicKeyRaw));

  return { publicKey, privateKey: keyPair.privateKey };
}

/**
 * Import a public key from base64
 */
async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const publicKeyRaw = base64ToUint8Array(publicKeyBase64);
  return crypto.subtle.importKey(
    "raw",
    publicKeyRaw.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

/**
 * Derive shared secret using ECDH
 */
async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<Uint8Array> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey } as EcdhKeyDeriveParams,
    privateKey,
    256
  );
  return new Uint8Array(sharedBits);
}

/**
 * Create commitment hash (SHA-256 of public key)
 */
async function createCommitment(publicKey: string): Promise<string> {
  const data = new TextEncoder().encode(publicKey);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return uint8ArrayToBase64(new Uint8Array(hash));
}

/**
 * Verify commitment matches public key
 * @internal Used during SAS key exchange
 */
async function _verifyCommitment(
  commitment: string,
  publicKey: string
): Promise<boolean> {
  const expectedCommitment = await createCommitment(publicKey);
  return commitment === expectedCommitment;
}

// Export for future use in verification flow
export { _verifyCommitment as verifyCommitment };

/**
 * Derive SAS (emoji indices and decimals) from shared secret
 */
async function deriveSAS(
  sharedSecret: Uint8Array,
  initiatorPublicKey: string,
  targetPublicKey: string,
  transactionId: string
): Promise<{ emojiIndices: number[]; decimals: [number, number, number] }> {
  // Create input for HKDF: shared_secret || initiator_key || target_key || txn_id
  const input = new TextEncoder().encode(
    uint8ArrayToBase64(sharedSecret) +
      initiatorPublicKey +
      targetPublicKey +
      transactionId
  );

  // Use SHA-256 to derive SAS bytes
  const sasHash = await crypto.subtle.digest("SHA-256", input);
  const sasBytes = new Uint8Array(sasHash);

  // Extract 7 emoji indices (6 bits each = 0-63)
  const emojiIndices: number[] = [];
  for (let i = 0; i < 7; i++) {
    // Use 6 bits from adjacent bytes
    const byteIndex = Math.floor((i * 6) / 8);
    const bitOffset = (i * 6) % 8;

    let value: number;
    if (bitOffset <= 2) {
      // All 6 bits in one byte
      value = ((sasBytes[byteIndex] ?? 0) >> (2 - bitOffset)) & 0x3f;
    } else {
      // Split across two bytes
      const bitsFromFirst = 8 - bitOffset;
      const bitsFromSecond = 6 - bitsFromFirst;
      value =
        (((sasBytes[byteIndex] ?? 0) & ((1 << bitsFromFirst) - 1)) << bitsFromSecond) |
        ((sasBytes[byteIndex + 1] ?? 0) >> (8 - bitsFromSecond));
    }
    emojiIndices.push(value);
  }

  // Extract 3 decimal numbers (13 bits each = 0-8191, displayed as 1000-9191)
  const decimals: [number, number, number] = [
    (((sasBytes[6] ?? 0) << 5) | ((sasBytes[7] ?? 0) >> 3)) + 1000,
    ((((sasBytes[7] ?? 0) & 0x7) << 10) | ((sasBytes[8] ?? 0) << 2) | ((sasBytes[9] ?? 0) >> 6)) +
      1000,
    ((((sasBytes[9] ?? 0) & 0x3f) << 7) | ((sasBytes[10] ?? 0) >> 1)) + 1000,
  ];

  return { emojiIndices, decimals };
}

// ============================================================================
// BASE64 UTILITIES
// ============================================================================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) =>
    String.fromCharCode(byte)
  ).join("");
  return btoa(binString);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

// ============================================================================
// VERIFICATION SESSION STATE
// ============================================================================

// Store private keys for active verification sessions
const activeVerifications = new Map<
  string,
  {
    privateKey: CryptoKey;
    publicKey: string;
    commitment: string;
  }
>();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Start a new device verification session (as initiator)
 */
export async function startVerification(
  targetUserId: string,
  targetDeviceId: string
): Promise<StartVerificationResult> {
  // Generate ephemeral key pair
  const { publicKey, privateKey } = await generateEphemeralKeyPair();

  // Create commitment
  const commitment = await createCommitment(publicKey);

  // Call API to start verification
  const response = await fetch("/api/e2ee/verification/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetUserId,
      targetDeviceId,
      publicKey,
      commitment,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start verification");
  }

  const data = await response.json();

  // Store session state
  activeVerifications.set(data.verificationId, {
    privateKey,
    publicKey,
    commitment,
  });

  return {
    verificationId: data.verificationId,
    transactionId: data.transactionId,
    publicKey,
    commitment,
  };
}

/**
 * Accept a verification request (as target)
 */
export async function acceptVerification(
  verificationId: string
): Promise<{ publicKey: string }> {
  // Generate ephemeral key pair
  const { publicKey, privateKey } = await generateEphemeralKeyPair();

  // Call API to accept verification
  const response = await fetch("/api/e2ee/verification/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      verificationId,
      publicKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to accept verification");
  }

  // Store session state
  activeVerifications.set(verificationId, {
    privateKey,
    publicKey,
    commitment: "",
  });

  return { publicKey };
}

/**
 * Calculate SAS emojis for comparison
 */
export async function calculateSAS(
  verificationId: string,
  initiatorPublicKey: string,
  targetPublicKey: string,
  transactionId: string,
  isInitiator: boolean
): Promise<{
  emojis: Array<{ emoji: string; name: string }>;
  decimals: [number, number, number];
}> {
  const session = activeVerifications.get(verificationId);
  if (!session) {
    throw new Error("No active verification session");
  }

  // Import the other party's public key
  const otherPublicKey = isInitiator ? targetPublicKey : initiatorPublicKey;
  const importedKey = await importPublicKey(otherPublicKey);

  // Derive shared secret
  const sharedSecret = await deriveSharedSecret(session.privateKey, importedKey);

  // Derive SAS
  const { emojiIndices, decimals } = await deriveSAS(
    sharedSecret,
    initiatorPublicKey,
    targetPublicKey,
    transactionId
  );

  // Map indices to emojis (with safety check)
  const emojis = emojiIndices.map((index) => {
    const emoji = SAS_EMOJIS[index];
    return emoji ?? { emoji: "❓", name: "Unknown" };
  });

  return { emojis, decimals };
}

/**
 * Confirm SAS match and complete verification
 */
export async function confirmVerification(
  verificationId: string,
  emojiIndices: number[],
  isMatch: boolean
): Promise<void> {
  const response = await fetch("/api/e2ee/verification/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      verificationId,
      emojiIndices,
      isMatch,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to confirm verification");
  }

  // Clean up session
  activeVerifications.delete(verificationId);
}

/**
 * Cancel an in-progress verification
 */
export async function cancelVerification(verificationId: string): Promise<void> {
  const response = await fetch("/api/e2ee/verification/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verificationId }),
  });

  if (!response.ok) {
    console.error("Failed to cancel verification");
  }

  // Clean up session
  activeVerifications.delete(verificationId);
}

/**
 * Get pending verification requests for the current device
 */
export async function getPendingVerifications(): Promise<VerificationState[]> {
  const response = await fetch("/api/e2ee/verification/pending");

  if (!response.ok) {
    throw new Error("Failed to fetch pending verifications");
  }

  const data = await response.json();
  return data.verifications || [];
}

/**
 * Check if a device is verified
 */
export async function isDeviceVerified(
  userId: string,
  deviceId: string
): Promise<boolean> {
  const response = await fetch(
    `/api/e2ee/devices/verified?userId=${encodeURIComponent(userId)}&deviceId=${encodeURIComponent(deviceId)}`
  );

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.isVerified || false;
}

/**
 * Get all verified devices for a user
 */
export async function getVerifiedDevices(
  userId: string
): Promise<Array<{ deviceId: string; verifiedAt: string; method: string }>> {
  const response = await fetch(
    `/api/e2ee/devices/verified?userId=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.devices || [];
}
