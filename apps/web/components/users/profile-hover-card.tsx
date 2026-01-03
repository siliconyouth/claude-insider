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
import { openMessages } from "@/components/unified-chat";

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

// Twitter-style dimensions - clean and compact
const CARD_WIDTH = 300;
const CARD_WIDTH_COMPACT = 280;
const CARD_HEIGHT = 200; // Reduced height
const CARD_HEIGHT_COMPACT = 160;
const PADDING = 4; // Small gap to allow mouse to reach card
const CLOSE_DELAY = 100; // Delay before closing to allow mouse to reach card

// Donor tier colors
const donorTierColors = {
  bronze: "text-amber-600 dark:text-amber-500",
  silver: "text-gray-400 dark:text-gray-300",
  gold: "text-yellow-500 dark:text-yellow-400",
  platinum: "text-violet-500 dark:text-violet-400",
};

// Reserved for future use with donor badge backgrounds
const _donorTierBg = {
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
  onInviteToGroup: _onInviteToGroup,
  onReport: _onReport,
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
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    // Note: Using position: fixed, so top is relative to viewport (no scrollY needed)
    if (preferredSide === "top" && spaceAbove >= cardHeight + PADDING) {
      actualSide = "top";
      top = rect.top - cardHeight - PADDING;
    } else if (preferredSide === "bottom" && spaceBelow >= cardHeight + PADDING) {
      actualSide = "bottom";
      top = rect.bottom + PADDING;
    } else if (spaceBelow >= spaceAbove) {
      actualSide = "bottom";
      top = rect.bottom + PADDING;
    } else {
      actualSide = "top";
      top = rect.top - cardHeight - PADDING;
    }

    return { top, left, side: actualSide };
  }, [side, cardWidth, cardHeight]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

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
    // Delay closing to allow mouse to reach the card
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      touchOpenedRef.current = false;
    }, CLOSE_DELAY);
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
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
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

  // Reserved for future use when displaying user activity timestamps
  const _formatLastSeen = (dateString: string) => {
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
        // Clear both open and close timeouts - card is being hovered
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card content - Twitter-style clean design */}
      <div className="relative bg-white dark:bg-[#16181c] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2f3336] overflow-hidden">
        <div className="p-4">
          {/* Top row: Avatar + Follow button */}
          <div className="flex items-start justify-between gap-3">
            {/* Avatar with online indicator */}
            <Link href={profileUrl} className="relative flex-shrink-0">
              <UserAvatar
                src={avatarSrc}
                name={displayName}
                size={compact ? "lg" : "xl"}
                className="ring-0"
              />
              {/* Online indicator */}
              {user.isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#16181c]" />
              )}
            </Link>

            {/* Follow button - Twitter style */}
            {canShowActions && (
              <FollowButton
                userId={user.id}
                isFollowing={user.isFollowing || false}
                size="sm"
              />
            )}
          </div>

          {/* Name and username */}
          <div className="mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={profileUrl}
                className="font-bold text-[15px] text-gray-900 dark:text-[#e7e9ea] hover:underline"
              >
                {displayName}
              </Link>
              {/* Verified/Role badge - inline like Twitter */}
              {showRoleBadge && roleInfo && (
                <span className={cn("w-[18px] h-[18px] flex items-center justify-center rounded-full", roleInfo.bgColor)}>
                  <CheckIcon className={cn("w-3 h-3", roleInfo.color)} />
                </span>
              )}
              {/* Donor badge */}
              {user.donorTier && (
                <HeartIcon className={cn("w-4 h-4", donorTierColors[user.donorTier])} />
              )}
            </div>
            {/* Username */}
            {user.username && (
              <p className="text-[15px] text-gray-500 dark:text-[#71767b] leading-tight">
                @{user.username}
              </p>
            )}
          </div>

          {/* Bio - Twitter shows 2 lines max */}
          {user.bio && (
            <p className="mt-2 text-[15px] text-gray-900 dark:text-[#e7e9ea] leading-snug line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Stats row - Twitter style: "42 Following  128 Followers" */}
          <div className="mt-3 flex items-center gap-4 text-[14px]">
            {user.stats?.following !== undefined && (
              <Link href={`/users/${user.username}/following`} className="hover:underline">
                <span className="font-bold text-gray-900 dark:text-[#e7e9ea]">{formatNumber(user.stats.following)}</span>
                <span className="text-gray-500 dark:text-[#71767b]"> Following</span>
              </Link>
            )}
            {user.stats?.followers !== undefined && (
              <Link href={`/users/${user.username}/followers`} className="hover:underline">
                <span className="font-bold text-gray-900 dark:text-[#e7e9ea]">{formatNumber(user.stats.followers)}</span>
                <span className="text-gray-500 dark:text-[#71767b]"> Followers</span>
              </Link>
            )}
          </div>

          {/* Message button - only show if can show actions and not compact */}
          {canShowActions && !compact && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openMessages({ userId: user.id });
              }}
              className={cn(
                "mt-3 w-full py-2 text-[14px] font-bold rounded-full",
                "border border-gray-300 dark:border-[#536471]",
                "text-gray-900 dark:text-[#e7e9ea]",
                "hover:bg-gray-100 dark:hover:bg-[#1d1f23]",
                "transition-colors"
              )}
            >
              Message
            </button>
          )}
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
        onTouchStart={handleTouchStart}
      >
        {children}
      </span>

      {mounted && createPortal(card, document.body)}
    </>
  );
}

// Icon components
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function _TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H8v2h8v-2h-3v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function _CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function _UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function _FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function _MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
