"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UserAvatar } from "@/components/users";
import {
  getCompleteProfileData,
  getUserFavoritesWithDetails,
  getUserRatingsWithDetails,
  type UserProfile,
  type FavoriteWithResource,
  type RatingWithResource,
  type CollectionWithItems,
} from "@/app/actions/profile";
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

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteWithResource[]>([]);
  const [ratings, setRatings] = useState<RatingWithResource[]>([]);
  const [collections, setCollections] = useState<CollectionWithItems[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // - 1 session lookup (instead of 4)
      // - 8 parallel DB queries
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Profile Header Skeleton */}
            <div className="flex items-start gap-6 mb-8 animate-pulse">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-[#1a1a1a]" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-28 bg-gray-200 dark:bg-[#1a1a1a] rounded-lg" />
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
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
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
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
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
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

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "favorites", label: "Favorites", count: profile?.stats.favorites || 0 },
    { id: "ratings", label: "Ratings", count: profile?.stats.ratings || 0 },
    { id: "collections", label: "Collections", count: profile?.stats.collections || 0 },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            {/* Avatar */}
            <UserAvatar
              src={profile?.avatarUrl}
              name={profile?.name}
              size="2xl"
            />

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {profile?.name}
              </h1>
              <Link
                href="/settings"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                  "transition-colors"
                )}
              >
                Edit Profile
              </Link>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-3">
              {profile?.email}
            </p>

            {profile?.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {profile.bio}
              </p>
            )}

            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-cyan-400 hover:underline text-sm"
              >
                {profile.website}
              </a>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.stats.favorites}
                </span>{" "}
                <span className="text-gray-500 dark:text-gray-400">favorites</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.stats.ratings}
                </span>{" "}
                <span className="text-gray-500 dark:text-gray-400">ratings</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.stats.collections}
                </span>{" "}
                <span className="text-gray-500 dark:text-gray-400">collections</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.stats.comments}
                </span>{" "}
                <span className="text-gray-500 dark:text-gray-400">comments</span>
              </div>
            </div>

            {profile?.joinedAt && (
              <p className="text-xs text-gray-400 mt-3">
                Joined {formatDate(profile.joinedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#262626]">
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
          <div className="space-y-4">
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
            "bg-gray-50 dark:bg-[#111111]",
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
            "bg-gray-50 dark:bg-[#111111]",
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
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 transition-colors"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {collection.name}
            </h3>
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
            <span className="text-gray-400 text-xs">
              Updated {formatDate(collection.updatedAt)}
            </span>
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
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
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
