"use client";

/**
 * Profile Cover Component
 *
 * Unified cover photo component for profile pages.
 * Shows custom cover photo or animated default gradient.
 * Includes avatar with shadow/ring for visibility and edit affordance.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { DefaultCover } from "./default-cover";
import { UserAvatar } from "@/components/users/user-avatar";

interface ProfileCoverProps {
  /** Custom cover photo URL (null/undefined for default gradient) */
  coverPhotoUrl?: string | null;
  /** User's avatar URL */
  avatarUrl?: string | null;
  /** User's display name */
  name: string;
  /** User's username (with @) */
  username?: string | null;
  /** Whether this is the current user's own profile */
  isOwnProfile?: boolean;
  /** Callback when edit cover is clicked */
  onEditCover?: () => void;
  /** Online status indicator */
  isOnline?: boolean;
  /** Additional className for the container */
  className?: string;
}

export function ProfileCover({
  coverPhotoUrl,
  avatarUrl,
  name,
  username,
  isOwnProfile = false,
  onEditCover,
  isOnline,
  className,
}: ProfileCoverProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleCoverClick = () => {
    if (isOwnProfile && onEditCover) {
      onEditCover();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Cover Photo Area - 3:1 aspect ratio */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-t-xl",
          // Height for 3:1 aspect ratio (h-40 = 160px, so width would be 480px)
          // Using responsive heights that approximate 3:1
          "h-32 sm:h-40 md:h-48",
          // Clickable if own profile
          isOwnProfile && onEditCover && "cursor-pointer group"
        )}
        onClick={handleCoverClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role={isOwnProfile && onEditCover ? "button" : undefined}
        tabIndex={isOwnProfile && onEditCover ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && isOwnProfile && onEditCover) {
            e.preventDefault();
            onEditCover();
          }
        }}
        aria-label={isOwnProfile && onEditCover ? "Edit cover photo" : undefined}
      >
        {/* Custom Cover or Default Animated */}
        {coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhotoUrl}
            alt="Profile cover"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <DefaultCover className="w-full h-full" />
        )}

        {/* Edit overlay for own profile */}
        {isOwnProfile && onEditCover && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-black/40 transition-opacity duration-200",
              isHovering ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-2 text-white">
              <CameraIcon className="w-6 h-6" />
              <span className="text-sm font-medium">
                {coverPhotoUrl ? "Change cover" : "Add cover photo"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Avatar + Name Section */}
      <div className="relative px-4 sm:px-6 pb-4">
        {/* Avatar - overlapping cover */}
        <div className="-mt-12 sm:-mt-16 mb-3">
          <div className="relative inline-block">
            <UserAvatar
              src={avatarUrl}
              name={name}
              size="2xl"
              showStatus={isOnline !== undefined}
              isOnline={isOnline}
              className={cn(
                "ring-4 ring-white dark:ring-[#111111]",
                "shadow-lg"
              )}
            />
          </div>
        </div>

        {/* Name and Username */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {name}
          </h1>
          {username && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{username}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Camera icon for edit overlay
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

// Export for use in other components
export { DefaultCover } from "./default-cover";
