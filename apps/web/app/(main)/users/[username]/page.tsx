"use client";

/**
 * Public User Profile Page
 *
 * Beautiful profile display showing user information, achievements,
 * badges, donor status, collections, and activity.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DefaultCover } from "@/components/profile";
import { FollowButton } from "@/components/users/follow-button";
import { openMessages } from "@/components/unified-chat";
import {
  ACHIEVEMENTS,
  RARITY_CONFIG,
  type AchievementDefinition,
} from "@/lib/achievements";

interface PublicProfile {
  id: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  email?: string;
  coverPhotoUrl?: string | null;
  isBetaTester: boolean;
  isVerified: boolean;
  role: string;
  socialLinks: Record<string, string>;
  joinedAt: string;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  // New fields
  donorTier?: "bronze" | "silver" | "gold" | "platinum" | null;
  achievementPoints?: number;
  achievements?: Array<{ id: string; unlockedAt: string }>;
  isOnline?: boolean;
  lastSeen?: string;
  stats?: {
    favorites: number;
    collections: number;
    comments: number;
    suggestions: number;
  };
  collections?: Array<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    color?: string;
    icon?: string;
    isPublic: boolean;
    itemCount: number;
    createdAt: string;
  }>;
  recentComments?: Array<{
    id: string;
    resourceType: string;
    resourceId: string;
    content: string;
    createdAt: string;
  }>;
  recentSuggestions?: Array<{
    id: string;
    resourceType: string;
    resourceId: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  superadmin: {
    label: "Super Admin",
    color:
      "bg-gradient-to-r from-violet-600 to-blue-600 text-white border-violet-500",
  },
  admin: {
    label: "Admin",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
  moderator: {
    label: "Moderator",
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  },
  editor: {
    label: "Editor",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
};

const DONOR_TIER_CONFIG = {
  bronze: {
    label: "Bronze Supporter",
    color: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
  },
  silver: {
    label: "Silver Supporter",
    color: "text-gray-500 dark:text-gray-300",
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-600",
  },
  gold: {
    label: "Gold Supporter",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-400 dark:border-yellow-600",
  },
  platinum: {
    label: "Platinum Supporter",
    color: "bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent",
    bg: "bg-gradient-to-r from-violet-100 via-blue-100 to-cyan-100 dark:from-violet-900/30 dark:via-blue-900/30 dark:to-cyan-900/30",
    border: "border-violet-400 dark:border-violet-600",
  },
};

const COLLECTION_COLORS: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  violet: "from-violet-500 to-violet-600",
  cyan: "from-cyan-500 to-cyan-600",
  emerald: "from-emerald-500 to-emerald-600",
  rose: "from-rose-500 to-rose-600",
  amber: "from-amber-500 to-amber-600",
  slate: "from-slate-500 to-slate-600",
};

// Icons
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isHoveringCover, setIsHoveringCover] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/users/${username}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load profile");
        }

        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(dateString);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleMessage = () => {
    if (profile) {
      openMessages({ conversationId: undefined, userId: profile.id });
    }
  };

  const handleEditCover = () => {
    // TODO: Open cover photo cropper modal
    // For now, navigate to settings where the cover photo section will be
    window.location.href = "/settings#cover-photo";
  };

  // Get achievement details from IDs
  const getAchievementDetails = (
    achievementId: string
  ): AchievementDefinition | null => {
    return ACHIEVEMENTS[achievementId] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <Header />
        {/* Cover Skeleton */}
        <div className="h-48 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 animate-pulse" />

        <div className="max-w-5xl mx-auto px-4 -mt-20">
          {/* Profile Card Skeleton */}
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#262626] p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6 animate-pulse">
              <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-[#1a1a1a]" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-6 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {error === "User not found" ? "User Not Found" : "Error Loading Profile"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error === "User not found"
              ? `No user found with username "${username}"`
              : error}
          </p>
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            Return to homepage
          </Link>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  const roleBadge =
    profile.role && profile.role !== "user" ? ROLE_BADGES[profile.role] : null;
  const donorConfig = profile.donorTier
    ? DONOR_TIER_CONFIG[profile.donorTier]
    : null;

  // Get featured achievements (most recent + rarest)
  const featuredAchievements = (profile.achievements || [])
    .map((a) => {
      const details = getAchievementDetails(a.id);
      return details ? { ...details, unlockedAt: a.unlockedAt } : null;
    })
    .filter((a): a is AchievementDefinition & { unlockedAt: string } => a !== null)
    .sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    })
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <Header />
      <main id="main-content" className="flex-1 pt-6">
        <div className="max-w-5xl mx-auto px-4">
          {/* Main Profile Card */}
          <div
            className={cn(
              "bg-white dark:bg-[#111111] rounded-2xl",
              "border border-gray-200 dark:border-[#262626]",
              "shadow-xl shadow-black/5 dark:shadow-black/20",
              "mb-6 overflow-hidden"
            )}
          >
            {/* Hero Cover Section with Profile Info Overlay */}
            <div
              className={cn(
                "relative w-full overflow-hidden",
                // Taller aspect ratio for hero effect
                "aspect-[2.5/1] sm:aspect-[3/1]",
                // Clickable if own profile
                profile.isOwnProfile && "cursor-pointer group"
              )}
              onClick={profile.isOwnProfile ? handleEditCover : undefined}
              onMouseEnter={() => profile.isOwnProfile && setIsHoveringCover(true)}
              onMouseLeave={() => setIsHoveringCover(false)}
              role={profile.isOwnProfile ? "button" : undefined}
              tabIndex={profile.isOwnProfile ? 0 : undefined}
              onKeyDown={(e) => {
                if (profile.isOwnProfile && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleEditCover();
                }
              }}
              aria-label={profile.isOwnProfile ? "Edit cover photo" : undefined}
            >
              {/* Custom Cover or Default Animated */}
              {profile.coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.coverPhotoUrl}
                  alt="Profile cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultCover className="w-full h-full" />
              )}

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Edit overlay - appears on hover (own profile only) */}
              {profile.isOwnProfile && (
                <div
                  className={cn(
                    "absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    "bg-black/50 text-white text-sm font-medium",
                    "transition-opacity duration-200",
                    isHoveringCover ? "opacity-100" : "opacity-0"
                  )}
                >
                  <svg
                    className="w-4 h-4"
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
                  {profile.coverPhotoUrl ? "Change cover" : "Add cover"}
                </div>
              )}

              {/* Profile Info Overlay - positioned at bottom of cover */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className={cn(
                          "w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover",
                          "border-4 border-white/20",
                          "shadow-xl shadow-black/30"
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center",
                          "text-3xl sm:text-4xl font-bold",
                          "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white",
                          "border-4 border-white/20",
                          "shadow-xl shadow-black/30"
                        )}
                      >
                        {profile.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    {/* Online indicator */}
                    {profile.isOnline && (
                      <div
                        className={cn(
                          "absolute bottom-1 right-1 w-5 h-5 rounded-full",
                          "bg-emerald-500 border-2 border-white/50"
                        )}
                        title="Online"
                      />
                    )}
                  </div>

                  {/* Name, Username, Badges - over cover */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    {/* Name and badges row */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/80 text-white backdrop-blur-sm"
                          title="Verified"
                        >
                          ✓ Verified
                        </span>
                      )}
                      {profile.isBetaTester && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/80 text-white backdrop-blur-sm">
                          Beta Tester
                        </span>
                      )}
                      {roleBadge && (
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full",
                            "bg-white/20 text-white backdrop-blur-sm"
                          )}
                        >
                          {roleBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Username and donor tier */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <p className="text-white/80 drop-shadow">@{profile.username}</p>
                      {donorConfig && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
                            "bg-white/20 text-white backdrop-blur-sm"
                          )}
                        >
                          <HeartIcon className="w-3.5 h-3.5" />
                          {donorConfig.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Desktop, positioned on cover */}
                  <div className="hidden sm:flex items-center gap-2">
                    {profile.isOwnProfile ? (
                      <Link
                        href="/settings"
                        className={cn(
                          "inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium rounded-xl",
                          "bg-white text-gray-900",
                          "shadow-lg shadow-black/20",
                          "hover:bg-gray-100 transition-all duration-200"
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Profile
                      </Link>
                    ) : (
                      <>
                        <FollowButton
                          userId={profile.id}
                          isFollowing={profile.isFollowing || false}
                          size="md"
                          className="!bg-white !text-gray-900 hover:!bg-gray-100 shadow-lg shadow-black/20"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessage();
                          }}
                          className={cn(
                            "inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium rounded-xl",
                            "bg-white/20 text-white backdrop-blur-sm",
                            "hover:bg-white/30 transition-all duration-200"
                          )}
                        >
                          <MessageIcon className="w-4 h-4" />
                          Message
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      className={cn(
                        "p-2 rounded-xl",
                        "bg-white/20 text-white backdrop-blur-sm",
                        "hover:bg-white/30 transition-all duration-200"
                      )}
                    >
                      <ShareIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Info Section - Below cover */}
            <div className="px-6 sm:px-8 py-4 sm:py-6">
              {/* Mobile Action Buttons */}
              <div className="flex sm:hidden gap-2 mb-4">
                {profile.isOwnProfile ? (
                  <Link
                    href="/settings"
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl",
                      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                      "text-white"
                    )}
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <FollowButton
                      userId={profile.id}
                      isFollowing={profile.isFollowing || false}
                      size="md"
                      className="flex-1"
                    />
                    <button
                      onClick={handleMessage}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl",
                        "bg-gray-100 dark:bg-[#1a1a1a]",
                        "text-gray-700 dark:text-gray-300",
                        "border border-gray-200 dark:border-[#262626]"
                      )}
                    >
                      <MessageIcon className="w-4 h-4" />
                      Message
                    </button>
                  </>
                )}
                <button
                  onClick={handleShare}
                  className={cn(
                    "px-4 py-2.5 rounded-xl",
                    "text-gray-500 dark:text-gray-400",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <ShareIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Join Date and Last Seen */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Joined {formatDate(profile.joinedAt)}</span>
                {!profile.isOnline && profile.lastSeen && (
                  <>
                    <span>•</span>
                    <span>Last seen {formatRelativeDate(profile.lastSeen)}</span>
                  </>
                )}
              </div>

              {/* Social Links */}
              {Object.keys(profile.socialLinks).length > 0 && (
                <div className="flex gap-3">
                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                      title="Website"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                    </a>
                  )}
                  {profile.socialLinks.github && (
                    <a
                      href={`https://github.com/${profile.socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${profile.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-blue-400 transition-colors"
                      title="Twitter"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  )}
                  {profile.socialLinks.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-blue-600 transition-colors"
                      title="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

          {/* Stats Bar */}
          <div className="border-t border-gray-200 dark:border-[#262626] px-6 sm:px-8 py-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
              <Link
                href={`/users/${profile.username}/followers`}
                className="group"
              >
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {profile.followersCount || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Followers
                </div>
              </Link>
              <Link
                href={`/users/${profile.username}/following`}
                className="group"
              >
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {profile.followingCount || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Following
                </div>
              </Link>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.stats?.favorites || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Favorites
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.stats?.collections || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Collections
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(profile.achievements || []).length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Achievements
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {profile.achievementPoints || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Points
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {/* Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Achievements Section */}
            {featuredAchievements.length > 0 && (
              <section
                className={cn(
                  "bg-white dark:bg-[#111111] rounded-2xl",
                  "border border-gray-200 dark:border-[#262626]",
                  "overflow-hidden"
                )}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    Achievements
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {(profile.achievements || []).length} unlocked
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {featuredAchievements.map((achievement) => {
                      const rarityConfig = RARITY_CONFIG[achievement.rarity];
                      const Icon = achievement.icon;
                      return (
                        <div
                          key={achievement.id}
                          className={cn(
                            "p-4 rounded-xl border transition-all",
                            rarityConfig.bgColor,
                            rarityConfig.borderColor,
                            achievement.rarity === "legendary" &&
                              "ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10"
                          )}
                          title={achievement.criteria}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                                rarityConfig.iconBg
                              )}
                            >
                              <Icon
                                className={cn("w-5 h-5", rarityConfig.color)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-medium text-sm truncate",
                                  rarityConfig.color
                                )}
                              >
                                {achievement.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {achievement.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold uppercase",
                                    rarityConfig.color
                                  )}
                                >
                                  {rarityConfig.label}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {achievement.points} pts
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Collections Section */}
            {profile.collections && profile.collections.length > 0 && (
              <section
                className={cn(
                  "bg-white dark:bg-[#111111] rounded-2xl",
                  "border border-gray-200 dark:border-[#262626]",
                  "overflow-hidden"
                )}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Collections
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.collections.length} collections
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {profile.collections.map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/favorites/collections/${collection.slug}`}
                        className={cn(
                          "p-4 rounded-xl",
                          "bg-gray-50 dark:bg-[#0a0a0a]",
                          "border border-gray-200 dark:border-[#262626]",
                          "hover:border-blue-500/50 hover:shadow-md",
                          "transition-all duration-200 group"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg",
                              "bg-gradient-to-br",
                              COLLECTION_COLORS[collection.color || "blue"] ||
                                COLLECTION_COLORS.blue
                            )}
                          >
                            {collection.icon === "star" ? "★" : "📁"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                              {collection.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {collection.itemCount} item
                              {collection.itemCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        {collection.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Recent Activity */}
            {(profile.recentComments?.length ||
              profile.recentSuggestions?.length) && (
              <section
                className={cn(
                  "bg-white dark:bg-[#111111] rounded-2xl",
                  "border border-gray-200 dark:border-[#262626]",
                  "overflow-hidden"
                )}
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Recent Activity
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {profile.recentComments?.slice(0, 3).map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#0a0a0a]"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatRelativeDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {profile.recentSuggestions?.slice(0, 3).map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#0a0a0a]"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 text-[10px] font-medium rounded",
                              suggestion.status === "merged"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                : suggestion.status === "approved"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
                            )}
                          >
                            {suggestion.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeDate(suggestion.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Stats Card */}
            {profile.stats && (
              <section
                className={cn(
                  "bg-white dark:bg-[#111111] rounded-2xl",
                  "border border-gray-200 dark:border-[#262626]",
                  "p-6"
                )}
              >
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Contributions
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Comments
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {profile.stats.comments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Edit Suggestions
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {profile.stats.suggestions}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!profile.collections?.length &&
          !profile.recentComments?.length &&
          !profile.recentSuggestions?.length &&
          !featuredAchievements.length && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No public activity yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {profile.isOwnProfile
                  ? "Start creating collections and engaging with the community to build your profile!"
                  : "This user hasn't shared any public activity yet."}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
