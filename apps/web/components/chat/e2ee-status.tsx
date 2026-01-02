/**
 * E2EE Status Components
 *
 * Visual indicators for end-to-end encryption status in the chat UI.
 * Shows lock icons, status badges, and tooltips to inform users about encryption.
 *
 * Status types:
 * - encrypted: Successfully encrypted/decrypted (green lock)
 * - decrypting: Awaiting decryption (spinner)
 * - decryption_failed: Key missing or corrupt (red warning)
 * - unverified_sender: Sender device not verified (orange shield)
 * - plaintext: Unencrypted message (no indicator or gray)
 * - ai_accessed: AI had access with consent (blue AI badge)
 */

"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/design-system";

// ============================================================================
// TYPES
// ============================================================================

export type E2EEIndicatorStatus =
  | "encrypted" // Successfully encrypted/decrypted
  | "decrypting" // Awaiting decryption
  | "decryption_failed" // Key missing or corrupt
  | "unverified_sender" // Sender device not verified
  | "plaintext" // Unencrypted (groups or AI)
  | "ai_accessed"; // AI had access (with consent)

export interface E2EEIndicatorProps {
  status: E2EEIndicatorStatus;
  /** Size of the indicator */
  size?: "sm" | "md" | "lg";
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional class name */
  className?: string;
}

export interface E2EEBadgeProps {
  /** Whether the conversation is encrypted */
  isEncrypted: boolean;
  /** Whether this is a DM (shows "Default E2EE" for DMs) */
  isDM?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

export interface E2EEConversationHeaderProps {
  /** Whether the conversation is encrypted */
  isEncrypted: boolean;
  /** Conversation type */
  type: "direct" | "group";
  /** Whether to show full badge or just icon */
  compact?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  E2EEIndicatorStatus,
  {
    icon: string;
    color: string;
    bgColor: string;
    label: string;
    tooltip: string;
  }
> = {
  encrypted: {
    icon: "🔒",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Encrypted",
    tooltip: "This message is end-to-end encrypted. Only you and the recipient can read it.",
  },
  decrypting: {
    icon: "⏳",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Decrypting",
    tooltip: "Decrypting message...",
  },
  decryption_failed: {
    icon: "⚠️",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Decryption Failed",
    tooltip: "Unable to decrypt this message. The encryption key may be missing.",
  },
  unverified_sender: {
    icon: "🛡️",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "Unverified",
    tooltip: "This message is from an unverified device. Consider verifying the sender.",
  },
  plaintext: {
    icon: "📝",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    label: "Not Encrypted",
    tooltip: "This message is not end-to-end encrypted.",
  },
  ai_accessed: {
    icon: "✨",
    color: "text-blue-600 dark:text-cyan-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "AI Accessed",
    tooltip: "AI features were used with this message (with your consent).",
  },
};

const SIZE_CONFIG = {
  sm: {
    icon: "text-xs",
    badge: "text-[10px] px-1.5 py-0.5",
    indicator: "w-4 h-4",
  },
  md: {
    icon: "text-sm",
    badge: "text-xs px-2 py-1",
    indicator: "w-5 h-5",
  },
  lg: {
    icon: "text-base",
    badge: "text-sm px-2.5 py-1.5",
    indicator: "w-6 h-6",
  },
};

// ============================================================================
// E2EE INDICATOR (Lock icon for messages)
// ============================================================================

/**
 * Small indicator icon for individual messages
 */
export const E2EEIndicator = memo(function E2EEIndicator({
  status,
  size = "sm",
  showTooltip = true,
  className,
}: E2EEIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        sizeConfig.indicator,
        config.color,
        className
      )}
      title={showTooltip ? config.tooltip : undefined}
      aria-label={config.label}
    >
      <span className={sizeConfig.icon}>{config.icon}</span>
    </span>
  );
});

// ============================================================================
// E2EE BADGE (For conversation headers)
// ============================================================================

/**
 * Badge showing E2EE status for conversation
 */
export const E2EEBadge = memo(function E2EEBadge({
  isEncrypted,
  isDM = false,
  size = "sm",
  className,
}: E2EEBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];

  if (!isEncrypted) {
    // Don't show badge for unencrypted conversations (clean UI)
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        "bg-emerald-100 dark:bg-emerald-900/30",
        "text-emerald-700 dark:text-emerald-300",
        "border border-emerald-200 dark:border-emerald-800",
        sizeConfig.badge,
        className
      )}
      title={
        isDM
          ? "This DM is end-to-end encrypted by default"
          : "This conversation is end-to-end encrypted"
      }
    >
      <span className={sizeConfig.icon}>🔒</span>
      <span>{isDM ? "E2EE" : "Encrypted"}</span>
    </span>
  );
});

// ============================================================================
// E2EE CONVERSATION HEADER
// ============================================================================

/**
 * E2EE status display for conversation headers
 */
export const E2EEConversationHeader = memo(function E2EEConversationHeader({
  isEncrypted,
  type,
  compact = false,
  className,
}: E2EEConversationHeaderProps) {
  const isDM = type === "direct";

  if (compact) {
    return (
      <E2EEIndicator
        status={isEncrypted ? "encrypted" : "plaintext"}
        size="sm"
        className={className}
      />
    );
  }

  return (
    <E2EEBadge
      isEncrypted={isEncrypted}
      isDM={isDM}
      size="sm"
      className={className}
    />
  );
});

// ============================================================================
// E2EE MESSAGE STATUS (For message bubbles)
// ============================================================================

export interface E2EEMessageStatusProps {
  /** Whether the message is encrypted */
  isEncrypted: boolean;
  /** Decryption status */
  decryptionStatus?: "success" | "pending" | "failed";
  /** Whether sender is verified */
  senderVerified?: boolean;
  /** Whether AI accessed this message */
  aiAccessed?: boolean;
  /** Size */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

/**
 * E2EE status for individual message bubbles
 */
export const E2EEMessageStatus = memo(function E2EEMessageStatus({
  isEncrypted,
  decryptionStatus = "success",
  senderVerified = true,
  aiAccessed = false,
  size = "sm",
  className,
}: E2EEMessageStatusProps) {
  const status = useMemo((): E2EEIndicatorStatus => {
    if (!isEncrypted) return "plaintext";
    if (decryptionStatus === "pending") return "decrypting";
    if (decryptionStatus === "failed") return "decryption_failed";
    if (!senderVerified) return "unverified_sender";
    if (aiAccessed) return "ai_accessed";
    return "encrypted";
  }, [isEncrypted, decryptionStatus, senderVerified, aiAccessed]);

  // Don't show indicator for plaintext (cleaner UI)
  if (status === "plaintext") {
    return null;
  }

  return <E2EEIndicator status={status} size={size} className={className} />;
});

// ============================================================================
// E2EE INFO BANNER (For conversation info panel)
// ============================================================================

export interface E2EEInfoBannerProps {
  /** Whether the conversation is encrypted */
  isEncrypted: boolean;
  /** Conversation type */
  type: "direct" | "group";
  /** Number of verified participants */
  verifiedCount?: number;
  /** Total participants */
  totalParticipants?: number;
  /** Additional class name */
  className?: string;
}

/**
 * Informational banner about E2EE status
 */
export const E2EEInfoBanner = memo(function E2EEInfoBanner({
  isEncrypted,
  type,
  verifiedCount = 0,
  totalParticipants = 0,
  className,
}: E2EEInfoBannerProps) {
  const isDM = type === "direct";

  if (!isEncrypted) {
    return (
      <div
        className={cn(
          "rounded-lg p-3",
          "bg-gray-100 dark:bg-gray-800",
          "border border-gray-200 dark:border-gray-700",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">📝</span>
          <div className="flex-1">
            <p className="text-sm font-medium ui-text-heading">
              Not End-to-End Encrypted
            </p>
            <p className="text-xs ui-text-secondary mt-1">
              Messages in this {isDM ? "conversation" : "group"} are stored on
              our servers. Enable E2EE for enhanced privacy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg p-3",
        "bg-emerald-50 dark:bg-emerald-900/20",
        "border border-emerald-200 dark:border-emerald-800",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">🔒</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            End-to-End Encrypted
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
            {isDM
              ? "Messages are encrypted and can only be read by you and the recipient."
              : `Messages are encrypted. ${verifiedCount} of ${totalParticipants} participants verified.`}
          </p>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// E2EE SETUP PROGRESS (During key exchange)
// ============================================================================

export interface E2EESetupProgressProps {
  /** Current step */
  step: "initializing" | "exchanging_keys" | "establishing_session" | "ready" | "error";
  /** Error message if step is error */
  error?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Progress indicator during E2EE setup
 */
export const E2EESetupProgress = memo(function E2EESetupProgress({
  step,
  error,
  className,
}: E2EESetupProgressProps) {
  const stepConfig = {
    initializing: { label: "Initializing encryption...", icon: "⏳" },
    exchanging_keys: { label: "Exchanging keys...", icon: "🔑" },
    establishing_session: { label: "Establishing secure session...", icon: "🔐" },
    ready: { label: "Encryption ready", icon: "✅" },
    error: { label: error || "Encryption setup failed", icon: "❌" },
  };

  const config = stepConfig[step];
  const isComplete = step === "ready";
  const isError = step === "error";

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        isComplete && "text-emerald-600 dark:text-emerald-400",
        isError && "text-red-600 dark:text-red-400",
        !isComplete && !isError && "text-blue-600 dark:text-blue-400",
        className
      )}
    >
      <span className="text-base">{config.icon}</span>
      <span>{config.label}</span>
      {!isComplete && !isError && (
        <span className="animate-pulse">...</span>
      )}
    </div>
  );
});
