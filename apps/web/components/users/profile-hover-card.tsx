"use client";

/**
 * ProfileHoverCard Component
 *
 * Shows a hover tooltip with user profile preview when hovering over user links.
 * Follows best practices for hover and touch interactions:
 * - Desktop: hover shows card, click navigates
 * - Touch: first touch shows card, second touch navigates
 * - Delayed appearance (avoids accidental triggers)
 * - Stays open when hovering over the card
 * - Smooth animations
 * - Proper positioning with viewport awareness
 * - Dark/light mode support
 *
 * v2.0 - Enhanced design with more info in both normal and compact modes
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  isOnline?: boolean;
  lastSeen?: string;
  achievementPoints?: number;
  donorTier?: "bronze" | "silver" | "gold" | "platinum" | null;
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

const CARD_WIDTH = 340;
const CARD_WIDTH_COMPACT = 280;
const CARD_HEIGHT = 280;
const CARD_HEIGHT_COMPACT = 180;
const PADDING = 12;

// Donor tier colors
const donorTierColors = {
  bronze: "text-amber-600 dark:text-amber-500",
  silver: "text-gray-400 dark:text-gray-300",
  gold: "text-yellow-500 dark:text-yellow-400",
  platinum: "text-violet-500 dark:text-violet-400",
};

const donorTierBg = {
  bronze: "bg-amber-100 dark:bg-amber-900/30",
  silver: "bg-gray-100 dark:bg-gray-800",
  gold: "bg-yellow-100 dark:bg-yellow-900/30",
  platinum: "bg-violet-100 dark:bg-violet-900/30",
};

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
  const cardWidth = compact ? CARD_WIDTH_COMPACT : CARD_WIDTH;
  const cardHeight = compact ? CARD_HEIGHT_COMPACT : CARD_HEIGHT;
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  const isTouchDevice = useRef(false);
  const touchOpenedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    if (left < PADDING) left = PADDING;
    if (left + cardWidth > window.innerWidth - PADDING) {
      left = window.innerWidth - cardWidth - PADDING;
    }

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
    touchOpenedRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    if (isOpen && touchOpenedRef.current) {
      e.preventDefault();
      router.push(href || (user.username ? `/users/${user.username}` : `/profile`));
      setIsOpen(false);
      touchOpenedRef.current = false;
      return;
    }

    e.preventDefault();
    const pos = calculatePosition();
    if (pos) {
      setPosition(pos);
      setIsOpen(true);
      touchOpenedRef.current = true;
    }
  }, [disabled, isOpen, calculatePosition, router, href, user.username]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (!isOpen || !touchOpenedRef.current) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const isInTrigger = triggerRef.current?.contains(target);
      const isInCard = cardRef.current?.contains(target);

      if (!isInTrigger && !isInCard) {
        setIsOpen(false);
        touchOpenedRef.current = false;
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
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
        {compact ? (
          /* ==================== COMPACT MODE ==================== */
          <div className="p-3">
            {/* Top row: Avatar + Info */}
            <div className="flex gap-3">
              {/* Avatar with online indicator */}
              <Link href={profileUrl} className="relative flex-shrink-0">
                <UserAvatar
                  src={avatarSrc}
                  name={displayName}
                  size="lg"
                  className="ring-2 ring-white dark:ring-[#111111]"
                />
                {/* Online indicator */}
                {user.isOnline !== undefined && (
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#111111]",
                      user.isOnline ? "bg-emerald-500" : "bg-gray-400"
                    )}
                  />
                )}
              </Link>

              {/* User info */}
              <div className="flex-1 min-w-0">
                {/* Name row with badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={profileUrl}
                    className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 truncate"
                  >
                    {displayName}
                  </Link>
                  {/* Role badge */}
                  {showRoleBadge && roleInfo && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-medium rounded-full",
                        roleInfo.bgColor,
                        roleInfo.color
                      )}
                    >
                      {roleInfo.label}
                    </span>
                  )}
                  {/* Donor badge */}
                  {user.donorTier && (
                    <span
                      className={cn(
                        "p-0.5 rounded",
                        donorTierBg[user.donorTier]
                      )}
                      title={`${user.donorTier.charAt(0).toUpperCase() + user.donorTier.slice(1)} Donor`}
                    >
                      <HeartIcon className={cn("w-3 h-3", donorTierColors[user.donorTier])} />
                    </span>
                  )}
                </div>

                {/* Username */}
                {user.username && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>
                )}

                {/* Status line */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {user.isOnline ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Online</span>
                  ) : user.lastSeen ? (
                    formatLastSeen(user.lastSeen)
                  ) : user.joinedAt ? (
                    `Joined ${formatDate(user.joinedAt)}`
                  ) : null}
                </p>
              </div>
            </div>

            {/* Bio (compact - 1 line) */}
            {user.bio && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {user.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-2 flex items-center gap-3 text-xs">
              {user.stats?.followers !== undefined && (
                <span className="text-gray-500 dark:text-gray-400">
                  <strong className="text-gray-700 dark:text-gray-200">{formatNumber(user.stats.followers)}</strong> followers
                </span>
              )}
              {user.stats?.following !== undefined && (
                <span className="text-gray-500 dark:text-gray-400">
                  <strong className="text-gray-700 dark:text-gray-200">{formatNumber(user.stats.following)}</strong> following
                </span>
              )}
              {user.achievementPoints !== undefined && user.achievementPoints > 0 && (
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                  <TrophyIcon className="w-3 h-3 text-yellow-500" />
                  <strong className="text-gray-700 dark:text-gray-200">{formatNumber(user.achievementPoints)}</strong>
                </span>
              )}
            </div>

            {/* Action row */}
            <div className="mt-3 flex items-center gap-2">
              {canShowActions && (
                <FollowButton
                  userId={user.id}
                  isFollowing={user.isFollowing || false}
                  size="sm"
                  className="flex-1"
                />
              )}
              <Link
                href={profileUrl}
                className={cn(
                  "flex-1 text-center py-1.5 px-2 text-xs font-medium rounded-lg",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                  "transition-colors"
                )}
              >
                View Profile
              </Link>
            </div>
          </div>
        ) : (
          /* ==================== NORMAL MODE ==================== */
          <>
            {/* Header with gradient */}
            <div className="relative h-20 bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
            </div>

            {/* Avatar overlapping header */}
            <div className="px-4 -mt-10 relative">
              <Link href={profileUrl} className="relative inline-block">
                <UserAvatar
                  src={avatarSrc}
                  name={displayName}
                  size="xl"
                  className="ring-4 ring-white dark:ring-[#111111]"
                />
                {/* Online indicator */}
                {user.isOnline !== undefined && (
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#111111]",
                      user.isOnline ? "bg-emerald-500" : "bg-gray-400"
                    )}
                  />
                )}
              </Link>
            </div>

            {/* User info */}
            <div className="px-4 pb-4 pt-2">
              {/* Name row with badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={profileUrl}
                      className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 truncate"
                    >
                      {displayName}
                    </Link>
                    {/* Donor badge */}
                    {user.donorTier && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                          donorTierBg[user.donorTier],
                          donorTierColors[user.donorTier]
                        )}
                        title={`${user.donorTier.charAt(0).toUpperCase() + user.donorTier.slice(1)} Donor`}
                      >
                        <HeartIcon className="w-3 h-3" />
                        {user.donorTier.charAt(0).toUpperCase() + user.donorTier.slice(1)}
                      </span>
                    )}
                  </div>
                  {/* Username */}
                  {user.username && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  )}
                </div>

                {/* Role badge */}
                {showRoleBadge && roleInfo && (
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

              {/* Status line */}
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {user.isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online now
                  </span>
                ) : user.lastSeen ? (
                  <span>Last seen {formatLastSeen(user.lastSeen)}</span>
                ) : null}
                {user.joinedAt && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      Joined {formatDate(user.joinedAt)}
                    </span>
                  </>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {user.bio}
                </p>
              )}

              {/* Stats grid */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {user.stats?.followers !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatNumber(user.stats.followers)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Followers</p>
                  </div>
                )}
                {user.stats?.following !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatNumber(user.stats.following)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Following</p>
                  </div>
                )}
                {user.stats?.contributions !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatNumber(user.stats.contributions)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Contribs</p>
                  </div>
                )}
                {user.achievementPoints !== undefined && user.achievementPoints > 0 && (
                  <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                      <TrophyIcon className="w-3 h-3" />
                      {formatNumber(user.achievementPoints)}
                    </p>
                    <p className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70">Points</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {canShowActions && (
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
                        "p-2 rounded-lg",
                        "border border-gray-200 dark:border-[#262626]",
                        "text-gray-500 dark:text-gray-400",
                        "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                        "hover:text-blue-600 dark:hover:text-cyan-400",
                        "transition-colors"
                      )}
                      title="Invite to group"
                    >
                      <UsersIcon className="w-4 h-4" />
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
                        "p-2 rounded-lg",
                        "border border-gray-200 dark:border-[#262626]",
                        "text-gray-500 dark:text-gray-400",
                        "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                        "hover:text-red-500 dark:hover:text-red-400",
                        "transition-colors"
                      )}
                      title="Report user"
                    >
                      <FlagIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* View profile link */}
              <Link
                href={profileUrl}
                className={cn(
                  "block w-full text-center mt-3 px-3 py-2 text-sm font-medium rounded-lg",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-sm shadow-blue-500/25",
                  "hover:shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5",
                  "transition-all duration-200"
                )}
              >
                View Full Profile
              </Link>
            </div>
          </>
        )}
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
        onTouchStart={handleTouchStart}
      >
        {children}
      </span>

      {mounted && createPortal(card, document.body)}
    </>
  );
}

// Icon components
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H8v2h8v-2h-3v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

/**
 * Skeleton placeholder for loading state
 */
export function ProfileHoverCardSkeleton({ compact = false }: { compact?: boolean }) {
  const width = compact ? CARD_WIDTH_COMPACT : CARD_WIDTH;

  return (
    <div
      className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626]"
      style={{ width }}
    >
      {compact ? (
        <div className="p-3">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2" />
          <div className="flex gap-2 mt-3">
            <div className="flex-1 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="flex-1 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          <div className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="px-4 -mt-10">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse ring-4 ring-white dark:ring-[#111111]" />
          </div>
          <div className="px-4 pb-4 pt-2 space-y-2">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-3" />
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
