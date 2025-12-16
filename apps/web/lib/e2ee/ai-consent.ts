/**
 * E2EE AI Consent System
 *
 * Manages user consent for AI access to encrypted messages.
 *
 * The Problem:
 * E2EE means the server can't read messages. But users may want
 * AI features like @claude responses in encrypted chats.
 *
 * The Solution:
 * 1. Explicit consent flow - users must opt-in per conversation
 * 2. Client-side decryption - message decrypted only when needed
 * 3. Audit logging - all AI access is logged
 * 4. Revocable - users can revoke consent at any time
 *
 * Available Features:
 * - mention_response: AI responds when @mentioned
 * - translation: AI translates messages
 * - summary: AI summarizes conversations
 * - moderation: AI checks for harmful content
 */

"use client";

// ============================================================================
// TYPES
// ============================================================================

export type AIFeature =
  | "mention_response"
  | "translation"
  | "summary"
  | "moderation";

export interface ConsentStatus {
  conversationId: string;
  userId: string;
  status: "pending" | "granted" | "denied" | "revoked";
  allowedFeatures: AIFeature[];
  consentGivenAt?: string;
  expiresAt?: string;
}

export interface ConversationAIStatus {
  conversationId: string;
  aiAllowed: boolean;
  enabledFeatures: AIFeature[];
  requireUnanimousConsent: boolean;
  participantConsent: ConsentStatus[];
  allConsented: boolean;
  missingConsent: string[]; // User IDs who haven't consented
}

export interface AIAccessLogEntry {
  id: string;
  conversationId: string;
  messageId?: string;
  authorizingUserId: string;
  featureUsed: AIFeature;
  accessedAt: string;
}

// ============================================================================
// FEATURE DEFINITIONS
// ============================================================================

export const AI_FEATURES: Record<
  AIFeature,
  {
    name: string;
    description: string;
    icon: string;
    requiresDecryption: boolean;
  }
> = {
  mention_response: {
    name: "AI Responses",
    description: "Allow @claudeinsider to respond in this chat",
    icon: "🤖",
    requiresDecryption: true,
  },
  translation: {
    name: "Translation",
    description: "Translate messages to your language",
    icon: "🌐",
    requiresDecryption: true,
  },
  summary: {
    name: "Summaries",
    description: "Get AI summaries of long conversations",
    icon: "📝",
    requiresDecryption: true,
  },
  moderation: {
    name: "Safety Check",
    description: "Check messages for harmful content",
    icon: "🛡️",
    requiresDecryption: true,
  },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get AI consent status for a conversation
 */
export async function getConversationAIStatus(
  conversationId: string
): Promise<ConversationAIStatus> {
  const response = await fetch(
    `/api/e2ee/ai-consent?conversationId=${encodeURIComponent(conversationId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch AI consent status");
  }

  return response.json();
}

/**
 * Grant AI consent for features
 */
export async function grantAIConsent(
  conversationId: string,
  features: AIFeature[] = ["mention_response"]
): Promise<void> {
  const response = await fetch("/api/e2ee/ai-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      action: "grant",
      features,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to grant consent");
  }
}

/**
 * Revoke AI consent
 */
export async function revokeAIConsent(
  conversationId: string,
  reason?: string
): Promise<void> {
  const response = await fetch("/api/e2ee/ai-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      action: "revoke",
      reason,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to revoke consent");
  }
}

/**
 * Check if AI can be used for a specific feature
 */
export async function canUseAIFeature(
  conversationId: string,
  feature: AIFeature
): Promise<boolean> {
  const status = await getConversationAIStatus(conversationId);
  return status.aiAllowed && status.enabledFeatures.includes(feature);
}

/**
 * Log AI access (called before sending to AI)
 */
export async function logAIAccess(
  conversationId: string,
  messageId: string | undefined,
  feature: AIFeature,
  contentHash: string
): Promise<string> {
  const response = await fetch("/api/e2ee/ai-consent/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      messageId,
      feature,
      contentHash,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to log AI access");
  }

  const data = await response.json();
  return data.logId;
}

/**
 * Get AI access history for a conversation
 */
export async function getAIAccessHistory(
  conversationId: string,
  limit: number = 50
): Promise<AIAccessLogEntry[]> {
  const response = await fetch(
    `/api/e2ee/ai-consent/log?conversationId=${encodeURIComponent(conversationId)}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch access history");
  }

  const data = await response.json();
  return data.entries || [];
}

// ============================================================================
// CONSENT DIALOG HELPERS
// ============================================================================

/**
 * Check if consent dialog should be shown
 */
export function shouldShowConsentDialog(status: ConversationAIStatus): boolean {
  // Show if AI is requested but not all have consented
  return !status.allConsented && status.missingConsent.length > 0;
}

/**
 * Get message for consent dialog based on missing consents
 */
export function getConsentDialogMessage(
  status: ConversationAIStatus,
  currentUserId: string
): {
  title: string;
  message: string;
  action: "request" | "waiting" | "ready";
} {
  const userNeedsToConsent = status.missingConsent.includes(currentUserId);
  const othersNeedToConsent = status.missingConsent.filter(
    (id) => id !== currentUserId
  );

  if (userNeedsToConsent) {
    return {
      title: "Enable AI in Encrypted Chat",
      message:
        "To use AI features, you need to consent to temporarily decrypting messages for AI processing. Your messages remain encrypted in storage.",
      action: "request",
    };
  }

  if (othersNeedToConsent.length > 0) {
    return {
      title: "Waiting for Others",
      message: `${othersNeedToConsent.length} other participant(s) need to consent before AI can be used in this chat.`,
      action: "waiting",
    };
  }

  return {
    title: "AI Enabled",
    message: "All participants have consented. AI features are now available.",
    action: "ready",
  };
}

// ============================================================================
// CONTENT HASHING
// ============================================================================

/**
 * Hash content for audit logging (doesn't reveal content)
 */
export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// HYBRID ENCRYPTION FOR AI
// ============================================================================

/**
 * Prepare message for AI processing
 *
 * This is the critical function that:
 * 1. Verifies consent
 * 2. Logs the access
 * 3. Returns decrypted content for AI
 *
 * The caller is responsible for client-side decryption before calling this.
 */
export async function prepareForAI(
  conversationId: string,
  messageId: string | undefined,
  decryptedContent: string,
  feature: AIFeature = "mention_response"
): Promise<{
  allowed: boolean;
  logId?: string;
  error?: string;
}> {
  // Check consent
  const canUse = await canUseAIFeature(conversationId, feature);
  if (!canUse) {
    return {
      allowed: false,
      error: "AI consent not granted for this feature",
    };
  }

  // Hash content for audit (not the actual content)
  const contentHash = await hashContent(decryptedContent);

  // Log the access
  const logId = await logAIAccess(conversationId, messageId, feature, contentHash);

  return {
    allowed: true,
    logId,
  };
}
