/**
 * E2EE Indicator Component
 *
 * Displays encryption status for messages and conversations.
 * Shows a lock icon with different states:
 * - Green lock: Successfully encrypted/decrypted
 * - Yellow lock: Encrypted but pending decryption
 * - Red lock: Decryption failed
 * - Gray lock: E2EE not available
 */

"use client";

import { cn } from "@/lib/design-system";
import { Lock, LockOpen, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface E2EEIndicatorProps {
  /** Whether the message is encrypted */
  isEncrypted: boolean;
  /** Whether decryption was successful */
  decryptionSuccess?: boolean;
  /** Error message if decryption failed */
  decryptionError?: string;
  /** Encryption algorithm used */
  algorithm?: "olm.v1" | "megolm.v1";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional classes */
  className?: string;
}

export interface ConversationE2EEBadgeProps {
  /** Whether E2EE is enabled for the conversation */
  e2eeEnabled: boolean;
  /** Whether all participants have E2EE */
  allParticipantsHaveE2EE: boolean;
  /** Whether device verification is complete */
  isVerified?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional classes */
  className?: string;
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const sizeConfig = {
  sm: {
    icon: "h-3 w-3",
    text: "text-xs",
    padding: "px-1.5 py-0.5",
    gap: "gap-1",
  },
  md: {
    icon: "h-4 w-4",
    text: "text-sm",
    padding: "px-2 py-1",
    gap: "gap-1.5",
  },
  lg: {
    icon: "h-5 w-5",
    text: "text-base",
    padding: "px-3 py-1.5",
    gap: "gap-2",
  },
};

// ============================================================================
// MESSAGE E2EE INDICATOR
// ============================================================================

export function E2EEIndicator({
  isEncrypted,
  decryptionSuccess = true,
  decryptionError,
  algorithm,
  size = "sm",
  showTooltip = true,
  className,
}: E2EEIndicatorProps) {
  const config = sizeConfig[size];

  if (!isEncrypted) {
    // Not encrypted - show open lock
    return (
      <span
        className={cn(
          "inline-flex items-center text-gray-400",
          config.gap,
          className
        )}
        title={showTooltip ? "Not encrypted" : undefined}
      >
        <LockOpen className={config.icon} />
      </span>
    );
  }

  if (decryptionError || !decryptionSuccess) {
    // Decryption failed
    return (
      <span
        className={cn(
          "inline-flex items-center text-red-500",
          config.gap,
          className
        )}
        title={showTooltip ? `Decryption failed: ${decryptionError}` : undefined}
      >
        <ShieldAlert className={config.icon} />
      </span>
    );
  }

  // Successfully encrypted/decrypted
  const algorithmLabel = algorithm === "olm.v1" ? "Olm" : "Megolm";
  return (
    <span
      className={cn(
        "inline-flex items-center text-emerald-500",
        config.gap,
        className
      )}
      title={
        showTooltip
          ? `End-to-end encrypted (${algorithmLabel})`
          : undefined
      }
    >
      <Lock className={config.icon} />
    </span>
  );
}

// ============================================================================
// CONVERSATION E2EE BADGE
// ============================================================================

export function ConversationE2EEBadge({
  e2eeEnabled,
  allParticipantsHaveE2EE,
  isVerified = false,
  size = "sm",
  className,
}: ConversationE2EEBadgeProps) {
  const config = sizeConfig[size];

  if (!e2eeEnabled) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full",
          "bg-gray-800/50 text-gray-400",
          config.padding,
          config.gap,
          config.text,
          className
        )}
        title="End-to-end encryption not enabled"
      >
        <LockOpen className={config.icon} />
        <span>Not encrypted</span>
      </span>
    );
  }

  if (!allParticipantsHaveE2EE) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full",
          "bg-amber-900/30 text-amber-400",
          config.padding,
          config.gap,
          config.text,
          className
        )}
        title="Some participants don't have E2EE enabled"
      >
        <ShieldQuestion className={config.icon} />
        <span>Partial E2EE</span>
      </span>
    );
  }

  if (isVerified) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full",
          "bg-emerald-900/30 text-emerald-400",
          config.padding,
          config.gap,
          config.text,
          className
        )}
        title="End-to-end encrypted and verified"
      >
        <ShieldCheck className={config.icon} />
        <span>Verified</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full",
        "bg-blue-900/30 text-blue-400",
        config.padding,
        config.gap,
        config.text,
        className
      )}
      title="End-to-end encrypted (not verified)"
    >
      <Lock className={config.icon} />
      <span>Encrypted</span>
    </span>
  );
}

// ============================================================================
// E2EE STATUS BANNER
// ============================================================================

export interface E2EEStatusBannerProps {
  /** Current E2EE status */
  status: "ready" | "loading" | "not-setup" | "error";
  /** Error message if status is error */
  errorMessage?: string;
  /** Callback to set up E2EE */
  onSetup?: () => void;
  /** Additional classes */
  className?: string;
}

export function E2EEStatusBanner({
  status,
  errorMessage,
  onSetup,
  className,
}: E2EEStatusBannerProps) {
  if (status === "ready") {
    return null; // Don't show banner when everything is working
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg p-3",
        status === "loading" && "bg-blue-900/20 text-blue-300",
        status === "not-setup" && "bg-amber-900/20 text-amber-300",
        status === "error" && "bg-red-900/20 text-red-300",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {status === "loading" && (
          <>
            <Lock className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Setting up end-to-end encryption...</span>
          </>
        )}
        {status === "not-setup" && (
          <>
            <ShieldQuestion className="h-4 w-4" />
            <span className="text-sm">
              Enable E2EE to encrypt your messages
            </span>
          </>
        )}
        {status === "error" && (
          <>
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm">
              {errorMessage || "E2EE setup failed"}
            </span>
          </>
        )}
      </div>
      {status === "not-setup" && onSetup && (
        <button
          onClick={onSetup}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium",
            "bg-amber-600 text-white hover:bg-amber-500",
            "transition-colors"
          )}
        >
          Enable
        </button>
      )}
    </div>
  );
}

// ============================================================================
// DECRYPTION PLACEHOLDER
// ============================================================================

export interface DecryptionPlaceholderProps {
  /** Status of decryption */
  status: "pending" | "failed" | "unsupported";
  /** Error message if failed */
  errorMessage?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional classes */
  className?: string;
}

export function DecryptionPlaceholder({
  status,
  errorMessage,
  size = "md",
  className,
}: DecryptionPlaceholderProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center rounded-lg",
        status === "pending" && "bg-blue-900/20 text-blue-300",
        status === "failed" && "bg-red-900/20 text-red-300",
        status === "unsupported" && "bg-gray-800/50 text-gray-400",
        config.padding,
        config.gap,
        className
      )}
    >
      {status === "pending" && (
        <>
          <Lock className={cn(config.icon, "animate-pulse")} />
          <span className={config.text}>Decrypting...</span>
        </>
      )}
      {status === "failed" && (
        <>
          <ShieldAlert className={config.icon} />
          <span className={config.text}>
            {errorMessage || "Unable to decrypt"}
          </span>
        </>
      )}
      {status === "unsupported" && (
        <>
          <LockOpen className={config.icon} />
          <span className={config.text}>
            E2EE not available on this device
          </span>
        </>
      )}
    </div>
  );
}
