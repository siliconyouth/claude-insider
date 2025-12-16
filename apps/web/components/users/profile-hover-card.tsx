"use client";

/**
 * ProfileHoverCard Component
 *
 * Shows a hover tooltip with user profile preview when hovering over user links.
 * Follows best practices for hover interactions:
 * - Delayed appearance (avoids accidental triggers)
 * - Stays open when hovering over the card
 * - Smooth animations
 * - Proper positioning with viewport awareness
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { UserAvatar } from "./user-avatar";
import { FollowButton } from "./follow-button";
import { ROLE_INFO, type UserRole } from "@/lib/roles";
import { useSession } from "@/lib/auth-client";

export interface ProfileHoverCardUser {
  id: string;
  name: string;
  displayName?: string | null;
  username?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: UserRole;
  joinedAt?: string;
  isFollowing?: boolean;
  stats?: {
    followers?: number;
    following?: number;
    contributions?: number;
  };
}

interface ProfileHoverCardProps {
  /** User data to display */
  user: ProfileHoverCardUser;
  /** Content that triggers the hover */
  children: React.ReactNode;
  /** Delay before showing the card (ms) */
  delayMs?: number;
  /** Preferred position of the card */
  side?: "top" | "bottom";
  /** Additional classes for the trigger element */
  className?: string;
  /** Disable the hover functionality */
  disabled?: boolean;
  /** Custom link href (defaults to /users/[username]) */
  href?: string;
  /** Show action buttons (follow, invite, report) */
  showActions?: boolean;
  /** Compact mode for smaller cards (e.g., in message bubbles) */
  compact?: boolean;
  /** Callback when invite to group is clicked */
  onInviteToGroup?: (userId: string) => void;
  /** Callback when report is clicked */
  onReport?: (userId: string) => void;
}

interface Position {
  top: number;
  left: number;
  side: "top" | "bottom";
}

const CARD_WIDTH = 320;
const CARD_WIDTH_COMPACT = 260;
const CARD_HEIGHT = 220;
const CARD_HEIGHT_COMPACT = 140;
const PADDING = 12;

export function ProfileHoverCard({
  user,
  children,
  delayMs = 300,
  side = "bottom",
  className,
  disabled = false,
  href,
  showActions = true,
  compact = false,
  onInviteToGroup,
  onReport,
}: ProfileHoverCardProps) {
  // Use compact dimensions when compact mode is enabled
  const cardWidth = compact ? CARD_WIDTH_COMPACT : CARD_WIDTH;
  const cardHeight = compact ? CARD_HEIGHT_COMPACT : CARD_HEIGHT;
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Client-side only for portal
  useEffect(() => {
     
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();

    // Calculate horizontal position (center on trigger, but shift if needed)
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    // Keep within viewport
    if (left < PADDING) left = PADDING;
    if (left + cardWidth > window.innerWidth - PADDING) {
      left = window.innerWidth - cardWidth - PADDING;
    }

    // Determine vertical position
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferredSide = side;

    let actualSide: "top" | "bottom";
    let top: number;

    if (preferredSide === "top" && spaceAbove >= cardHeight + PADDING) {
      actualSide = "top";
      top = rect.top - cardHeight - PADDING + window.scrollY;
    } else if (preferredSide === "bottom" && spaceBelow >= cardHeight + PADDING) {
      actualSide = "bottom";
      top = rect.bottom + PADDING + window.scrollY;
    } else if (spaceBelow >= spaceAbove) {
      actualSide = "bottom";
      top = rect.bottom + PADDING + window.scrollY;
    } else {
      actualSide = "top";
      top = rect.top - cardHeight - PADDING + window.scrollY;
    }

    return { top, left, side: actualSide };
  }, [side, cardWidth, cardHeight]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      const pos = calculatePosition();
      if (pos) {
        setPosition(pos);
        setIsOpen(true);
      }
    }, delayMs);
  }, [delayMs, calculatePosition, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      const pos = calculatePosition();
      if (pos) setPosition(pos);
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  const profileUrl = href || (user.username ? `/users/${user.username}` : `/profile`);
  const roleInfo = user.role ? ROLE_INFO[user.role] : null;
  const showRoleBadge = user.role && user.role !== "user";
  const displayName = user.displayName || user.name;
  const avatarSrc = user.avatarUrl || user.image;
  const isOwnProfile = session?.user?.id === user.id;
  const canShowActions = showActions && !isOwnProfile && session?.user;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const card = isOpen && position && mounted && (
    <div
      ref={cardRef}
      className={cn(
        "fixed z-[100]",
        "animate-in fade-in-0 zoom-in-95",
        "duration-200 ease-out",
        position.side === "top" ? "origin-bottom" : "origin-top"
      )}
      style={{
        top: position.top,
        left: position.left,
        width: cardWidth,
      }}
      onMouseEnter={() => {
        // Keep card open when hovering over it
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Arrow indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2",
          "w-3 h-3 rotate-45",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          position.side === "top"
            ? "bottom-[-7px] border-t-0 border-l-0"
            : "top-[-7px] border-b-0 border-r-0"
        )}
      />

      {/* Card content */}
      <div className="relative bg-white dark:bg-[#111111] rounded-xl shadow-xl border border-gray-200 dark:border-[#262626] overflow-hidden">
        {/* Header with gradient - smaller in compact mode */}
        <div className={cn(
          "bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20",
          compact ? "h-10" : "h-16"
        )} />

        {/* Avatar overlapping header - smaller in compact mode */}
        <div className={cn("px-3", compact ? "-mt-5" : "px-4 -mt-8")}>
          <Link href={profileUrl} className="block">
            <UserAvatar
              src={avatarSrc}
              name={displayName}
              size={compact ? "md" : "xl"}
              className={cn(
                "ring-2 ring-white dark:ring-[#111111]",
                !compact && "ring-4"
              )}
            />
          </Link>
        </div>

        {/* User info */}
        <div className={cn(compact ? "px-3 pb-3 pt-1" : "px-4 pb-4 pt-2")}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {/* Display name only (privacy: real name is hidden) */}
              <Link
                href={profileUrl}
                className={cn(
                  "font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 truncate block",
                  compact && "text-sm"
                )}
              >
                {displayName}
              </Link>
              {/* Username */}
              {user.username && (
                <p className={cn(
                  "text-gray-500 dark:text-gray-400",
                  compact ? "text-xs" : "text-sm"
                )}>
                  @{user.username}
                </p>
              )}
            </div>

            {/* Role badge - hide in compact mode */}
            {!compact && showRoleBadge && roleInfo && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0",
                  roleInfo.bgColor,
                  roleInfo.color
                )}
              >
                {roleInfo.label}
              </span>
            )}
          </div>

          {/* Bio - hide in compact mode */}
          {!compact && user.bio && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Stats and join date - hide in compact mode */}
          {!compact && (
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {user.stats?.followers !== undefined && (
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {user.stats.followers}
                  </strong>{" "}
                  followers
                </span>
              )}
              {user.stats?.following !== undefined && (
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {user.stats.following}
                  </strong>{" "}
                  following
                </span>
              )}
              {user.joinedAt && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Joined {formatDate(user.joinedAt)}
                </span>
              )}
            </div>
          )}

          {/* Action buttons - hide in compact mode */}
          {!compact && canShowActions && (
            <div className="mt-3 flex items-center gap-2">
              <FollowButton
                userId={user.id}
                isFollowing={user.isFollowing || false}
                size="sm"
                className="flex-1"
              />
              {onInviteToGroup && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onInviteToGroup(user.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-500 dark:text-gray-400",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    "hover:text-blue-600 dark:hover:text-cyan-400",
                    "transition-colors"
                  )}
                  title="Invite to group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </button>
              )}
              {onReport && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReport(user.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-500 dark:text-gray-400",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    "hover:text-red-500 dark:hover:text-red-400",
                    "transition-colors"
                  )}
                  title="Report user"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* View profile link - smaller in compact mode */}
          <Link
            href={profileUrl}
            className={cn(
              "block w-full text-center rounded-lg font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
              "transition-colors",
              compact ? "mt-2 px-2 py-1 text-xs" : "mt-3 px-3 py-1.5 text-sm"
            )}
          >
            {compact ? "View" : "View Profile"}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline cursor-pointer", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {mounted && createPortal(card, document.body)}
    </>
  );
}

/**
 * Skeleton placeholder for loading state
 */
export function ProfileHoverCardSkeleton() {
  return (
    <div
      className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626]"
      style={{ width: CARD_WIDTH }}
    >
      <div className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="px-4 -mt-8">
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse ring-4 ring-white dark:ring-[#111111]" />
      </div>
      <div className="px-4 pb-4 pt-2 space-y-2">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-3" />
      </div>
    </div>
  );
}
