"use client";

/**
 * User Profile Page
 *
 * Private profile dashboard showing your content (favorites, ratings, collections)
 * with the modern profile card design matching /users/[username].
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DefaultCover } from "@/components/profile";
import {
  getCompleteProfileData,
  type UserProfile,
  type FavoriteWithResource,
  type RatingWithResource,
  type CollectionWithItems,
} from "@/app/actions/profile";
import {
  ACHIEVEMENTS,
  RARITY_CONFIG,
  type AchievementDefinition,
} from "@/lib/achievements";
import Link from "next/link";

type TabType = "favorites" | "ratings" | "collections";

// Cache key for sessionStorage
const PROFILE_CACHE_KEY = "ci_profile_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedProfileData {
  profile: UserProfile;
  favorites: FavoriteWithResource[];
  ratings: RatingWithResource[];
  collections: CollectionWithItems[];
  timestamp: number;
}

function getFromCache(): CachedProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as CachedProfileData;
    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setToCache(data: Omit<CachedProfileData, "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  } catch {
    // Storage full or unavailable, ignore
  }
}

// Config objects
const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  superadmin: {
    label: "Super Admin",
    color: "bg-gradient-to-r from-violet-600 to-blue-600 text-white border-violet-500",
  },
  admin: {
    label: "Admin",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
  moderator: {
    label: "Moderator",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
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

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteWithResource[]>([]);
  const [ratings, setRatings] = useState<RatingWithResource[]>([]);
  const [collections, setCollections] = useState<CollectionWithItems[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isHoveringCover, setIsHoveringCover] = useState(false);

  // Track if we've loaded data (prevents duplicate fetches)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showSignIn();
    }
  }, [authLoading, isAuthenticated, showSignIn]);

  // Use callback to avoid recreating function
  const loadProfileData = useCallback(async (forceRefresh = false) => {
    // Try to load from cache first (instant)
    if (!forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        setProfile(cached.profile);
        setFavorites(cached.favorites);
        setRatings(cached.ratings);
        setCollections(cached.collections);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Single optimized call that fetches all data at once
      const result = await getCompleteProfileData();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setProfile(result.data.profile);
        setFavorites(result.data.favorites);
        setRatings(result.data.ratings);
        setCollections(result.data.collections);

        // Cache the results for future visits
        setToCache({
          profile: result.data.profile,
          favorites: result.data.favorites,
          ratings: result.data.ratings,
          collections: result.data.collections,
        });
      }
    } catch (err) {
      console.error("[Profile] Load error:", err);
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate fetches on auth state changes
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      loadProfileData();
    }
  }, [isAuthenticated, loadProfileData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (!profile?.username) return;
    const url = `${window.location.origin}/users/${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleEditCover = () => {
    // TODO: Open cover photo cropper modal
    // For now, we'll navigate to settings where the cover photo section will be
    window.location.href = "/settings#cover-photo";
  };

  // Get achievement details from IDs
  const getAchievementDetails = (achievementId: string): AchievementDefinition | null => {
    return ACHIEVEMENTS[achievementId] || null;
  };

  // Get featured achievements (most recent + rarest)
  const featuredAchievements = (profile?.achievements || [])
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          {/* Header Skeleton */}
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign in to view your profile
            </h1>
            <button
              onClick={showSignIn}
              className={cn(
                "px-6 py-3 text-sm font-semibold rounded-lg",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:-translate-y-0.5 transition-all duration-200"
              )}
            >
              Sign In
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => loadProfileData(true)}
              className="text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Try again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const roleBadge = profile?.role && profile.role !== "user" ? ROLE_BADGES[profile.role] : null;
  const donorConfig = profile?.donorTier ? DONOR_TIER_CONFIG[profile.donorTier] : null;

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "favorites", label: "Favorites", count: profile?.stats.favorites || 0 },
    { id: "ratings", label: "Ratings", count: profile?.stats.ratings || 0 },
    { id: "collections", label: "Collections", count: profile?.stats.collections || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
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
            {/* Cover Photo - Inside card with 3:1 aspect ratio */}
            <div
              className={cn(
                "relative w-full overflow-hidden cursor-pointer group",
                // 3:1 aspect ratio container
                "aspect-[3/1]"
              )}
              onClick={handleEditCover}
              onMouseEnter={() => setIsHoveringCover(true)}
              onMouseLeave={() => setIsHoveringCover(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleEditCover();
                }
              }}
              aria-label="Edit cover photo"
            >
              {/* Custom Cover or Default Animated */}
              {profile?.coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.coverPhotoUrl}
                  alt="Profile cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultCover className="w-full h-full" />
              )}

              {/* Edit overlay */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  "bg-black/40 transition-opacity duration-200",
                  isHoveringCover ? "opacity-100" : "opacity-0"
                )}
              >
                <div className="flex items-center gap-2 text-white">
                  <svg
                    className="w-6 h-6"
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
                  <span className="text-sm font-medium">
                    {profile?.coverPhotoUrl ? "Change cover" : "Add cover photo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Info Section - Avatar overlaps cover */}
            <div className="relative px-6 sm:px-8 pb-6 sm:pb-8">
              {/* Avatar with online indicator - overlapping the cover */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                <div className="relative flex-shrink-0 -mt-16 sm:-mt-20">
                  {profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className={cn(
                        "w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover",
                        "border-4 border-white dark:border-[#111111]",
                        "shadow-lg"
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center",
                        "text-4xl sm:text-5xl font-bold",
                        "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white",
                        "border-4 border-white dark:border-[#111111]",
                        "shadow-lg"
                      )}
                    >
                      {profile?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  {/* Online indicator */}
                  {profile?.isOnline && (
                    <div
                      className={cn(
                        "absolute bottom-2 right-2 w-5 h-5 rounded-full",
                        "bg-emerald-500 border-3 border-white dark:border-[#111111]"
                      )}
                      title="Online"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  {/* Name and badges row */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {profile?.name}
                    </h1>
                    {profile?.isVerified && (
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        title="Verified"
                      >
                        ✓ Verified
                      </span>
                    )}
                    {profile?.isBetaTester && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        Beta Tester
                      </span>
                    )}
                    {roleBadge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full border",
                          roleBadge.color
                        )}
                      >
                        {roleBadge.label}
                      </span>
                    )}
                  </div>

                  {/* Username and donor tier */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                    {profile?.username && (
                      <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
                    )}
                    {donorConfig && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                          donorConfig.bg,
                          donorConfig.border
                        )}
                      >
                        <HeartIcon className={cn("w-3.5 h-3.5", donorConfig.color)} />
                        <span className={donorConfig.color}>{donorConfig.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Email */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {profile?.email}
                  </p>

                  {/* Social Links */}
                  {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                    <div className="flex justify-center sm:justify-start gap-3 mb-4">
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
                    </div>
                  )}

                  {/* Meta info */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Joined {profile?.joinedAt ? formatDate(profile.joinedAt) : ""}
                  </p>
                </div>

                {/* Action Buttons (Desktop) */}
                <div className="hidden sm:flex flex-col gap-2">
                  <Link
                    href="/settings"
                    className={cn(
                      "inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl",
                      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                      "text-white shadow-lg shadow-blue-500/25",
                      "hover:-translate-y-0.5 transition-all duration-200"
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
                  {profile?.username && (
                    <Link
                      href={`/users/${profile.username}`}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl",
                        "bg-gray-100 dark:bg-[#1a1a1a]",
                        "text-gray-700 dark:text-gray-300",
                        "border border-gray-200 dark:border-[#262626]",
                        "hover:bg-gray-200 dark:hover:bg-[#262626]",
                        "transition-all duration-200"
                      )}
                    >
                      View Public Profile
                    </Link>
                  )}
                  <button
                    onClick={handleShare}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl",
                      "text-gray-500 dark:text-gray-400",
                      "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                      "transition-all duration-200"
                    )}
                  >
                    <ShareIcon className="w-4 h-4" />
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>
              </div>

              {/* Action Buttons (Mobile) */}
              <div className="flex sm:hidden gap-2 mt-6">
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
            </div>

            {/* Stats Bar */}
            <div className="border-t border-gray-200 dark:border-[#262626] px-6 sm:px-8 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                <Link href={`/users/${profile?.username}/followers`} className="group">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {profile?.followersCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
                </Link>
                <Link href={`/users/${profile?.username}/following`} className="group">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {profile?.followingCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
                </Link>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {profile?.stats.favorites || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {profile?.stats.collections || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Collections</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {(profile?.achievements || []).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Achievements</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {profile?.achievementPoints || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Section (if any) */}
          {featuredAchievements.length > 0 && (
            <section
              className={cn(
                "bg-white dark:bg-[#111111] rounded-2xl",
                "border border-gray-200 dark:border-[#262626]",
                "overflow-hidden mb-6"
              )}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  Achievements
                </h2>
                <Link
                  href="/profile/achievements"
                  className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  View all
                </Link>
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
                            <Icon className={cn("w-5 h-5", rarityConfig.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-sm truncate", rarityConfig.color)}>
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

          {/* Content Tabs */}
          <div
            className={cn(
              "bg-white dark:bg-[#111111] rounded-2xl",
              "border border-gray-200 dark:border-[#262626]",
              "overflow-hidden mb-12"
            )}
          >
            {/* Tabs Header */}
            <div className="flex gap-2 px-6 pt-4 border-b border-gray-200 dark:border-[#262626]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors relative",
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-cyan-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        "ml-2 px-2 py-0.5 text-xs rounded-full",
                        activeTab === tab.id
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400"
                          : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-500"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "favorites" && (
                <FavoritesTab favorites={favorites} formatDate={formatDate} />
              )}
              {activeTab === "ratings" && (
                <RatingsTab ratings={ratings} formatDate={formatDate} />
              )}
              {activeTab === "collections" && (
                <CollectionsTab collections={collections} formatDate={formatDate} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Favorites Tab Component
function FavoritesTab({
  favorites,
  formatDate,
}: {
  favorites: FavoriteWithResource[];
  formatDate: (date: string) => string;
}) {
  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        }
        title="No favorites yet"
        description="Browse resources and click the heart icon to save your favorites"
        actionLabel="Browse Resources"
        actionHref="/resources"
      />
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((fav) => (
        <div
          key={fav.id}
          className={cn(
            "p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 transition-colors"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {fav.resourceType === "resource" ? "Resource" : "Doc"}: {fav.resourceId}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Added {formatDate(fav.createdAt)}
              </p>
            </div>
            <Link
              href={
                fav.resourceType === "resource"
                  ? `/resources#${fav.resourceId}`
                  : `/docs/${fav.resourceId}`
              }
              className="text-blue-600 dark:text-cyan-400 hover:underline text-sm"
            >
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// Ratings Tab Component
function RatingsTab({
  ratings,
  formatDate,
}: {
  ratings: RatingWithResource[];
  formatDate: (date: string) => string;
}) {
  if (ratings.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        }
        title="No ratings yet"
        description="Rate resources to help others find the best content"
        actionLabel="Browse Resources"
        actionHref="/resources"
      />
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((rating) => (
        <div
          key={rating.id}
          className={cn(
            "p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 transition-colors"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {rating.resourceType === "resource" ? "Resource" : "Doc"}: {rating.resourceId}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= rating.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      )}
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(rating.createdAt)}
                </span>
              </div>
            </div>
            <Link
              href={
                rating.resourceType === "resource"
                  ? `/resources#${rating.resourceId}`
                  : `/docs/${rating.resourceId}`
              }
              className="text-blue-600 dark:text-cyan-400 hover:underline text-sm"
            >
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// Collections Tab Component
function CollectionsTab({
  collections,
  formatDate,
}: {
  collections: CollectionWithItems[];
  formatDate: (date: string) => string;
}) {
  if (collections.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        title="No collections yet"
        description="Create collections to organize your favorite resources"
        actionLabel="Browse Resources"
        actionHref="/resources"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className={cn(
            "p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 transition-colors"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">{collection.name}</h3>
            <div className="flex items-center gap-2">
              {collection.isPublic ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Public
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400">
                  Private
                </span>
              )}
            </div>
          </div>

          {collection.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {collection.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {collection.itemCount} item{collection.itemCount !== 1 ? "s" : ""}
            </span>
            <span className="text-gray-400 text-xs">Updated {formatDate(collection.updatedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      <Link
        href={actionHref}
        className={cn(
          "inline-flex px-4 py-2 text-sm font-medium rounded-lg",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white shadow-sm",
          "hover:shadow-md hover:-translate-y-0.5",
          "transition-all duration-200"
        )}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
