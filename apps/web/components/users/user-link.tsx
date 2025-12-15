"use client";

/**
 * UserLink Component
 *
 * A linkified username that shows a ProfileHoverCard on hover.
 * Use this component throughout the app to make user mentions interactive.
 *
 * @example
 * // Simple username mention
 * <UserLink user={{ id: "1", name: "John", username: "john" }} />
 *
 * // With custom display
 * <UserLink user={user} showName showAvatar />
 *
 * // With action callbacks
 * <UserLink user={user} onReport={handleReport} onInviteToGroup={handleInvite} />
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { ProfileHoverCard, type ProfileHoverCardUser } from "./profile-hover-card";
import { UserAvatar } from "./user-avatar";

interface UserLinkProps {
  /** User data - must have at least id and name */
  user: ProfileHoverCardUser;
  /** Show the @ symbol before username (default: true) */
  showAt?: boolean;
  /** Show the user's display name or name instead of username */
  showName?: boolean;
  /** Show avatar alongside the text */
  showAvatar?: boolean;
  /** Avatar size when shown */
  avatarSize?: "xs" | "sm" | "md";
  /** Additional classes for the link */
  className?: string;
  /** Disable hover card */
  disableHoverCard?: boolean;
  /** Custom link href */
  href?: string;
  /** Callback when invite to group is clicked */
  onInviteToGroup?: (userId: string) => void;
  /** Callback when report is clicked */
  onReport?: (userId: string) => void;
}

export function UserLink({
  user,
  showAt = true,
  showName = false,
  showAvatar = false,
  avatarSize = "xs",
  className,
  disableHoverCard = false,
  href,
  onInviteToGroup,
  onReport,
}: UserLinkProps) {
  const profileUrl = href || (user.username ? `/users/${user.username}` : "/profile");
  const displayText = showName
    ? user.displayName || user.name
    : `${showAt ? "@" : ""}${user.username || user.name.toLowerCase().replace(/\s+/g, "")}`;

  const avatarSrc = user.avatarUrl || user.image;

  const linkContent = (
    <Link
      href={profileUrl}
      className={cn(
        "inline-flex items-center gap-1.5",
        "text-blue-600 dark:text-cyan-400",
        "hover:text-blue-700 dark:hover:text-cyan-300",
        "hover:underline decoration-blue-600/30 dark:decoration-cyan-400/30",
        "transition-colors",
        className
      )}
    >
      {showAvatar && (
        <UserAvatar
          src={avatarSrc}
          name={user.displayName || user.name}
          size={avatarSize}
        />
      )}
      <span className="font-medium">{displayText}</span>
    </Link>
  );

  if (disableHoverCard) {
    return linkContent;
  }

  return (
    <ProfileHoverCard
      user={user}
      href={href}
      onInviteToGroup={onInviteToGroup}
      onReport={onReport}
    >
      {linkContent}
    </ProfileHoverCard>
  );
}

/**
 * UserMention Component
 *
 * A specialized version of UserLink for @ mentions in text content.
 * Parses mention strings like "@username" and renders them as interactive links.
 */

interface UserMentionProps {
  /** Username to mention (without @) */
  username: string;
  /** User data if already fetched */
  user?: ProfileHoverCardUser;
  /** Additional classes */
  className?: string;
}

export function UserMention({ username, user, className }: UserMentionProps) {
  // If we have user data, use UserLink
  if (user) {
    return <UserLink user={user} className={className} />;
  }

  // Otherwise, create a minimal user object for the link
  // The hover card will show limited info but still link to the profile
  const minimalUser: ProfileHoverCardUser = {
    id: username,
    name: username,
    username: username,
  };

  return (
    <UserLink
      user={minimalUser}
      className={className}
    />
  );
}

/**
 * UserDisplay Component
 *
 * Shows user info with name, username, and optional avatar.
 * Wraps everything in a ProfileHoverCard for detailed interaction.
 */

interface UserDisplayProps {
  /** User data */
  user: ProfileHoverCardUser;
  /** Show avatar */
  showAvatar?: boolean;
  /** Avatar size */
  avatarSize?: "xs" | "sm" | "md" | "lg";
  /** Show username under name */
  showUsername?: boolean;
  /** Additional classes for container */
  className?: string;
  /** Disable hover card */
  disableHoverCard?: boolean;
  /** Callback when invite to group is clicked */
  onInviteToGroup?: (userId: string) => void;
  /** Callback when report is clicked */
  onReport?: (userId: string) => void;
}

export function UserDisplay({
  user,
  showAvatar = true,
  avatarSize = "md",
  showUsername = true,
  className,
  disableHoverCard = false,
  onInviteToGroup,
  onReport,
}: UserDisplayProps) {
  const profileUrl = user.username ? `/users/${user.username}` : "/profile";
  const displayName = user.displayName || user.name;
  const avatarSrc = user.avatarUrl || user.image;

  const content = (
    <Link
      href={profileUrl}
      className={cn(
        "inline-flex items-center gap-2",
        "hover:opacity-90 transition-opacity",
        className
      )}
    >
      {showAvatar && (
        <UserAvatar
          src={avatarSrc}
          name={displayName}
          size={avatarSize}
        />
      )}
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-gray-900 dark:text-white truncate">
          {displayName}
        </span>
        {/* Show actual name if display name is different */}
        {user.displayName && user.name && user.displayName !== user.name && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.name}
          </span>
        )}
        {showUsername && user.username && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{user.username}
          </span>
        )}
      </div>
    </Link>
  );

  if (disableHoverCard) {
    return content;
  }

  return (
    <ProfileHoverCard
      user={user}
      onInviteToGroup={onInviteToGroup}
      onReport={onReport}
    >
      {content}
    </ProfileHoverCard>
  );
}

export type { UserLinkProps, UserMentionProps, UserDisplayProps };
