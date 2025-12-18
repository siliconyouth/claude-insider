"use client";

/**
 * Online Indicator Component
 *
 * Displays a colored dot indicating user's online status:
 * - Green: Online
 * - Gray: Offline
 * - Orange: Idle/AFK (away for 1+ hour)
 *
 * Enhanced with "last active" display (Matrix SDK pattern):
 * - "Online" when currently active
 * - "Online 5m ago" when recently active
 * - "Away 1h ago" when idle
 * - "Offline 2d ago" when disconnected
 */

import { cn } from "@/lib/design-system";
import type { PresenceStatus } from "@/app/actions/presence";

// ============================================
// HELPER: Format "X ago" duration (Matrix SDK pattern)
// ============================================

/**
 * Formats a duration in milliseconds to a human-readable "X ago" string.
 * Based on Matrix SDK's formatDuration for presence display.
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks > 0) return `${weeks}w`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

/**
 * Get the "last active" display text based on status and time.
 * Matches Matrix SDK's PresenceLabel behavior.
 */
function getPresenceLabel(
  status: PresenceStatus,
  lastActiveAt?: string | null,
  currentlyActive?: boolean
): string {
  // If currently active, just show "Online"
  if (currentlyActive || status === "online") {
    if (!lastActiveAt) return "Online";

    const activeAgo = Date.now() - new Date(lastActiveAt).getTime();
    // If active within last minute, show "Online"
    if (activeAgo < 60000) return "Online";
    // Otherwise show "Online Xm ago"
    return `Online ${formatDuration(activeAgo)} ago`;
  }

  if (status === "idle") {
    if (!lastActiveAt) return "Away";
    const activeAgo = Date.now() - new Date(lastActiveAt).getTime();
    return `Away ${formatDuration(activeAgo)} ago`;
  }

  if (status === "offline") {
    if (!lastActiveAt) return "Offline";
    const activeAgo = Date.now() - new Date(lastActiveAt).getTime();
    // If offline for over a week, just show "Offline"
    if (activeAgo > 7 * 24 * 60 * 60 * 1000) return "Offline";
    return `Offline ${formatDuration(activeAgo)} ago`;
  }

  return "Unknown";
}

// ============================================
// COMPONENT PROPS
// ============================================

interface OnlineIndicatorProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400 dark:bg-gray-600",
  idle: "bg-orange-500",
};

const statusLabels = {
  online: "Online",
  offline: "Offline",
  idle: "Away",
};

export function OnlineIndicator({
  status,
  size = "md",
  showPulse = true,
  className,
}: OnlineIndicatorProps) {
  const isOnline = status === "online";

  return (
    <span
      className={cn(
        "relative inline-flex rounded-full",
        sizeClasses[size],
        statusColors[status],
        className
      )}
      title={statusLabels[status]}
    >
      {/* Pulse animation for online status */}
      {showPulse && isOnline && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            statusColors[status]
          )}
          style={{ animationDuration: "2s" }}
        />
      )}
    </span>
  );
}

// ============================================
// ONLINE INDICATOR WITH LABEL (Enhanced with "last active")
// ============================================

interface OnlineIndicatorWithLabelProps extends OnlineIndicatorProps {
  showLabel?: boolean;
  /** ISO timestamp of when the user was last active (for "X ago" display) */
  lastActiveAt?: string | null;
  /** If true, show just the status without duration */
  currentlyActive?: boolean;
}

/**
 * OnlineIndicatorWithLabel - Enhanced with "last active" display
 *
 * Shows presence status with optional duration:
 * - "Online" (currently active)
 * - "Online 5m ago" (recently active)
 * - "Away 1h ago" (idle)
 * - "Offline 2d ago" (disconnected)
 *
 * Based on Matrix SDK's PresenceLabel pattern.
 */
export function OnlineIndicatorWithLabel({
  status,
  size = "md",
  showPulse = true,
  showLabel = true,
  lastActiveAt,
  currentlyActive,
  className,
}: OnlineIndicatorWithLabelProps) {
  // Get the formatted label with optional "X ago" suffix
  const label = lastActiveAt
    ? getPresenceLabel(status, lastActiveAt, currentlyActive)
    : statusLabels[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <OnlineIndicator status={status} size={size} showPulse={showPulse} />
      {showLabel && (
        <span
          className={cn(
            "text-xs",
            status === "online"
              ? "text-green-600 dark:text-green-400"
              : status === "idle"
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// ============================================
// AVATAR WITH ONLINE INDICATOR
// ============================================

interface AvatarWithStatusProps {
  src?: string | null;
  alt?: string;
  name?: string;
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  /** ISO timestamp of when the user was last active (for tooltip) */
  lastActiveAt?: string | null;
  className?: string;
}

const avatarSizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const indicatorPositionClasses = {
  sm: "bottom-0 right-0",
  md: "bottom-0 right-0",
  lg: "bottom-0.5 right-0.5",
};

export function AvatarWithStatus({
  src,
  alt,
  name,
  status,
  size = "md",
  lastActiveAt,
  className,
}: AvatarWithStatusProps) {
  // Get initials from name
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get the presence label with "X ago" if lastActiveAt is provided
  const presenceTitle = lastActiveAt
    ? getPresenceLabel(status, lastActiveAt)
    : statusLabels[status];

  return (
    <div className={cn("relative inline-block", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || name || "User avatar"}
          className={cn(
            "rounded-full object-cover",
            avatarSizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-violet-500 to-blue-500",
            "text-white font-medium",
            avatarSizeClasses[size],
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          )}
        >
          {initials || "?"}
        </div>
      )}

      {/* Status indicator with enhanced tooltip */}
      <span
        className={cn(
          "absolute block rounded-full ring-2 ring-white dark:ring-[#0a0a0a]",
          indicatorPositionClasses[size],
          sizeClasses[size],
          statusColors[status]
        )}
        title={presenceTitle}
      />
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default OnlineIndicator;

// Export helper functions for use in other components
export { formatDuration, getPresenceLabel };
