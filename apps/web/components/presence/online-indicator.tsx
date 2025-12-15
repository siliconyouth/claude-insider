"use client";

/**
 * Online Indicator Component
 *
 * Displays a colored dot indicating user's online status:
 * - Green: Online
 * - Gray: Offline
 * - Orange: Idle/AFK (away for 1+ hour)
 */

import { cn } from "@/lib/design-system";
import type { PresenceStatus } from "@/app/actions/presence";

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
// ONLINE INDICATOR WITH LABEL
// ============================================

interface OnlineIndicatorWithLabelProps extends OnlineIndicatorProps {
  showLabel?: boolean;
}

export function OnlineIndicatorWithLabel({
  status,
  size = "md",
  showPulse = true,
  showLabel = true,
  className,
}: OnlineIndicatorWithLabelProps) {
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
          {statusLabels[status]}
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
  className,
}: AvatarWithStatusProps) {
  // Get initials from name
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

      {/* Status indicator */}
      <span
        className={cn(
          "absolute block rounded-full ring-2 ring-white dark:ring-[#0a0a0a]",
          indicatorPositionClasses[size],
          sizeClasses[size],
          statusColors[status]
        )}
        title={statusLabels[status]}
      />
    </div>
  );
}

export default OnlineIndicator;
