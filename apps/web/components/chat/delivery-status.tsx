/**
 * Delivery Status Components
 *
 * WhatsApp/iMessage-style delivery status indicators:
 * - Single gray checkmark: Sent (server received)
 * - Double gray checkmarks: Delivered (recipient received)
 * - Double blue checkmarks: Read (recipient viewed)
 * - Red X: Failed (will retry)
 * - Gray circle/spinner: Sending
 *
 * Usage:
 * ```tsx
 * <DeliveryCheckmark status="read" />
 * <DeliveryStatus message={message} isOwnMessage={true} />
 * ```
 */

"use client";

import { memo } from "react";
import { cn } from "@/lib/design-system";
import type { DeliveryStatus } from "@/lib/chat/types";

// ============================================================================
// TYPES
// ============================================================================

export interface DeliveryCheckmarkProps {
  /** Delivery status */
  status: DeliveryStatus;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional class name */
  className?: string;
}

export interface DeliveryStatusProps {
  /** Message delivery status */
  status: DeliveryStatus;
  /** Whether this is the current user's message */
  isOwnMessage: boolean;
  /** Time the message was sent (for display) */
  sentAt?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** Additional class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    color: string;
  }
> = {
  sending: {
    icon: <SendingIcon />,
    label: "Sending",
    tooltip: "Sending message...",
    color: "text-gray-400 dark:text-gray-500",
  },
  sent: {
    icon: <SingleCheck />,
    label: "Sent",
    tooltip: "Message sent to server",
    color: "text-gray-400 dark:text-gray-500",
  },
  delivered: {
    icon: <DoubleCheck />,
    label: "Delivered",
    tooltip: "Message delivered to recipient",
    color: "text-gray-400 dark:text-gray-500",
  },
  read: {
    icon: <DoubleCheck />,
    label: "Read",
    tooltip: "Message read by recipient",
    color: "text-blue-500 dark:text-cyan-400",
  },
  failed: {
    icon: <FailedIcon />,
    label: "Failed",
    tooltip: "Message failed to send. Tap to retry.",
    color: "text-red-500 dark:text-red-400",
  },
};

const SIZE_CONFIG = {
  xs: {
    container: "h-3",
    icon: "h-3 w-3",
    text: "text-[10px]",
  },
  sm: {
    container: "h-4",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
  },
  md: {
    container: "h-5",
    icon: "h-4 w-4",
    text: "text-sm",
  },
};

// ============================================================================
// SVG ICONS
// ============================================================================

function SendingIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="animate-spin">
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="20"
        strokeDashoffset="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SingleCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8l4 4 6-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoubleCheck() {
  return (
    <svg viewBox="0 0 20 16" fill="none">
      {/* First checkmark */}
      <path
        d="M1 8l4 4 6-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Second checkmark (offset) */}
      <path
        d="M8 8l4 4 6-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 4v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// DELIVERY CHECKMARK
// ============================================================================

/**
 * Just the checkmark icon for delivery status
 */
export const DeliveryCheckmark = memo(function DeliveryCheckmark({
  status,
  size = "sm",
  showTooltip = true,
  className,
}: DeliveryCheckmarkProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        sizeConfig.icon,
        config.color,
        className
      )}
      title={showTooltip ? config.tooltip : undefined}
      aria-label={config.label}
    >
      {config.icon}
    </span>
  );
});

// ============================================================================
// DELIVERY STATUS (WITH TIMESTAMP)
// ============================================================================

/**
 * Full delivery status display with optional timestamp
 */
export const MessageDeliveryStatus = memo(function MessageDeliveryStatus({
  status,
  isOwnMessage,
  sentAt,
  size = "xs",
  className,
}: DeliveryStatusProps) {
  // Only show delivery status for own messages
  if (!isOwnMessage) {
    return null;
  }

  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        sizeConfig.container,
        className
      )}
    >
      {sentAt && (
        <span
          className={cn(
            "ui-text-secondary",
            sizeConfig.text
          )}
        >
          {formatTime(sentAt)}
        </span>
      )}
      <DeliveryCheckmark status={status} size={size} />
    </span>
  );
});

// ============================================================================
// STATUS TEXT
// ============================================================================

export interface DeliveryStatusTextProps {
  status: DeliveryStatus;
  /** Show full text or abbreviated */
  abbreviated?: boolean;
  className?: string;
}

/**
 * Text representation of delivery status
 */
export const DeliveryStatusText = memo(function DeliveryStatusText({
  status,
  abbreviated = false,
  className,
}: DeliveryStatusTextProps) {
  const config = STATUS_CONFIG[status];

  const text = abbreviated
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : config.label;

  return (
    <span
      className={cn(
        "text-xs",
        config.color,
        className
      )}
    >
      {text}
    </span>
  );
});

// ============================================================================
// STATUS BADGE (FOR DETAILS VIEW)
// ============================================================================

export interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Badge-style delivery status for message details
 */
export const DeliveryStatusBadge = memo(function DeliveryStatusBadge({
  status,
  showIcon = true,
  size = "sm",
  className,
}: DeliveryStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  const bgColor = {
    sending: "bg-gray-100 dark:bg-gray-800",
    sent: "bg-gray-100 dark:bg-gray-800",
    delivered: "bg-gray-100 dark:bg-gray-800",
    read: "bg-blue-50 dark:bg-blue-900/20",
    failed: "bg-red-50 dark:bg-red-900/20",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
        bgColor,
        className
      )}
    >
      {showIcon && (
        <span className={cn(sizeConfig.icon, config.color)}>
          {config.icon}
        </span>
      )}
      <span className={cn(sizeConfig.text, config.color, "font-medium")}>
        {config.label}
      </span>
    </span>
  );
});

// ============================================================================
// RETRY BUTTON (FOR FAILED MESSAGES)
// ============================================================================

export interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Retry button for failed messages
 */
export const RetryButton = memo(function RetryButton({
  onRetry,
  isRetrying = false,
  size = "sm",
  className,
}: RetryButtonProps) {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg",
        "bg-red-50 dark:bg-red-900/20",
        "text-red-600 dark:text-red-400",
        "hover:bg-red-100 dark:hover:bg-red-900/30",
        "transition-colors",
        "disabled:opacity-50",
        sizeConfig.text,
        className
      )}
      title="Tap to retry sending"
    >
      {isRetrying ? (
        <>
          <span className={cn(sizeConfig.icon, "animate-spin")}>
            <SendingIcon />
          </span>
          <span>Retrying...</span>
        </>
      ) : (
        <>
          <span className={sizeConfig.icon}>
            <FailedIcon />
          </span>
          <span>Tap to retry</span>
        </>
      )}
    </button>
  );
});

// ============================================================================
// READ RECEIPT AVATARS
// ============================================================================

export interface ReadReceiptAvatarsProps {
  readBy: Array<{
    userId: string;
    userName?: string;
    userAvatar?: string;
    readAt?: string;
  }>;
  maxAvatars?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Small avatar stack showing who has read the message
 */
export const ReadReceiptAvatars = memo(function ReadReceiptAvatars({
  readBy,
  maxAvatars = 3,
  size = "sm",
  className,
}: ReadReceiptAvatarsProps) {
  if (readBy.length === 0) return null;

  const displayed = readBy.slice(0, maxAvatars);
  const remaining = readBy.length - maxAvatars;
  const avatarSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div
      className={cn(
        "flex items-center -space-x-1",
        className
      )}
      title={`Read by ${readBy.map((r) => r.userName || "User").join(", ")}`}
    >
      {displayed.map((reader, index) => (
        <div
          key={reader.userId}
          className={cn(
            "rounded-full border border-white dark:border-gray-900",
            "bg-gradient-to-br from-violet-500 to-cyan-500",
            "flex items-center justify-center",
            avatarSize
          )}
          style={{ zIndex: displayed.length - index }}
        >
          {reader.userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reader.userAvatar}
              alt={reader.userName || "User"}
              className={cn("rounded-full object-cover", avatarSize)}
            />
          ) : (
            <span className="text-[8px] font-medium text-white">
              {(reader.userName ?? "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full border border-white dark:border-gray-900",
            "bg-gray-200 dark:bg-gray-700",
            "flex items-center justify-center",
            "text-[8px] font-medium ui-text-secondary",
            avatarSize
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// UTILITIES
// ============================================================================

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { DeliveryStatus };
