"use client";

/**
 * UserAvatar Component
 *
 * Displays user avatar with fallback to initials.
 * Supports multiple sizes and optional online status indicator.
 */

import Image from "next/image";
import { cn } from "@/lib/design-system";

export interface UserAvatarProps {
  /** User's name for generating initials */
  name?: string | null;
  /** URL to the avatar image */
  src?: string | null;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Additional CSS classes */
  className?: string;
  /** Show online status indicator */
  showStatus?: boolean;
  /** Online status */
  isOnline?: boolean;
  /** Alt text for the image */
  alt?: string;
}

const sizeConfig = {
  xs: {
    container: "w-6 h-6",
    text: "text-xs",
    status: "w-1.5 h-1.5 border",
  },
  sm: {
    container: "w-8 h-8",
    text: "text-sm",
    status: "w-2 h-2 border-2",
  },
  md: {
    container: "w-10 h-10",
    text: "text-base",
    status: "w-2.5 h-2.5 border-2",
  },
  lg: {
    container: "w-14 h-14",
    text: "text-xl",
    status: "w-3 h-3 border-2",
  },
  xl: {
    container: "w-20 h-20",
    text: "text-2xl",
    status: "w-4 h-4 border-2",
  },
  "2xl": {
    container: "w-24 h-24",
    text: "text-3xl",
    status: "w-5 h-5 border-2",
  },
};

/**
 * Generate initials from a name
 */
function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({
  name,
  src,
  size = "md",
  className,
  showStatus = false,
  isOnline = false,
  alt,
}: UserAvatarProps) {
  const config = sizeConfig[size];
  const initials = getInitials(name);
  const hasImage = !!src;

  return (
    <div className={cn("relative inline-flex flex-shrink-0", className)}>
      {/* Avatar container */}
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden",
          config.container,
          !hasImage && "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600"
        )}
      >
        {hasImage ? (
          <Image
            src={src}
            alt={alt || name || "User avatar"}
            width={96}
            height={96}
            className="w-full h-full object-cover"
            unoptimized={src.startsWith("data:") || src.includes("googleusercontent")}
          />
        ) : (
          <span
            className={cn(
              "font-semibold text-white select-none",
              config.text
            )}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full",
            "border-white dark:border-[#0a0a0a]",
            config.status,
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

/**
 * Skeleton placeholder for loading state
 */
export function UserAvatarSkeleton({
  size = "md",
  className,
}: {
  size?: UserAvatarProps["size"];
  className?: string;
}) {
  const config = sizeConfig[size || "md"];

  return (
    <div
      className={cn(
        "rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse",
        config.container,
        className
      )}
    />
  );
}
