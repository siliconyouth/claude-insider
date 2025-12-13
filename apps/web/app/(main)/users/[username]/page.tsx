"use client";

/**
 * Public User Profile Page
 *
 * Displays a user's public profile with their collections,
 * activity, and stats based on their privacy settings.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { FollowButton } from "@/components/users/follow-button";

interface PublicProfile {
  id: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  email?: string;
  isBetaTester: boolean;
  isVerified: boolean;
  role: string;
  socialLinks: Record<string, string>;
  joinedAt: string;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
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
  admin: { label: "Admin", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  moderator: { label: "Moderator", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  editor: { label: "Editor", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
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

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

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

    if (days < 1) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
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

        {/* Content Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error === "User not found" ? "User Not Found" : "Error Loading Profile"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error === "User not found"
              ? `No user found with username "${username}"`
              : error}
          </p>
          <Link
            href="/"
            className="text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  const roleBadge = profile.role && profile.role !== "user" ? ROLE_BADGES[profile.role] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        {/* Avatar */}
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-[#262626]"
          />
        ) : (
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold",
              "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white"
            )}
          >
            {profile.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {profile.name}
            </h1>
            {profile.isVerified && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Verified
              </span>
            )}
            {profile.isBetaTester && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                Beta Tester
              </span>
            )}
            {roleBadge && (
              <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", roleBadge.color)}>
                {roleBadge.label}
              </span>
            )}
          </div>

          <p className="text-gray-500 dark:text-gray-400 mb-2">
            @{profile.username}
            {profile.email && <span> · {profile.email}</span>}
          </p>

          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex gap-3 mb-3">
              {profile.socialLinks.website && (
                <a
                  href={profile.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 dark:hover:text-cyan-400"
                  title="Website"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
              {profile.socialLinks.github && (
                <a
                  href={`https://github.com/${profile.socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  title="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {profile.socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${profile.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400"
                  title="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Followers/Following Stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Link
              href={`/users/${profile.username}/followers`}
              className="text-sm hover:underline"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {profile.followersCount || 0}
              </span>{" "}
              <span className="text-gray-500 dark:text-gray-400">followers</span>
            </Link>
            <Link
              href={`/users/${profile.username}/following`}
              className="text-sm hover:underline"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {profile.followingCount || 0}
              </span>{" "}
              <span className="text-gray-500 dark:text-gray-400">following</span>
            </Link>
            {profile.stats && (
              <>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.stats.favorites}
                  </span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">favorites</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.stats.collections}
                  </span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">collections</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.stats.comments}
                  </span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">comments</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.stats.suggestions}
                  </span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">suggestions</span>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Joined {formatDate(profile.joinedAt)}
          </p>

          <div className="flex items-center gap-3 mt-4">
            {profile.isOwnProfile ? (
              <Link
                href="/settings"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                  "transition-colors"
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            ) : (
              <FollowButton
                userId={profile.id}
                isFollowing={profile.isFollowing || false}
                size="md"
              />
            )}
          </div>
        </div>
      </div>

      {/* Collections */}
      {profile.collections && profile.collections.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Collections
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {profile.collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/favorites/collections/${collection.slug}`}
                className={cn(
                  "p-4 rounded-xl",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/50 hover:shadow-md",
                  "transition-all duration-200"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                      "bg-gradient-to-br",
                      COLLECTION_COLORS[collection.color || "blue"] || COLLECTION_COLORS.blue
                    )}
                  >
                    {collection.icon === "star" ? "★" : "📁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {collection.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {collection.itemCount} item{collection.itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {collection.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {(profile.recentComments?.length || profile.recentSuggestions?.length) && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {profile.recentComments?.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "p-4 rounded-xl",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Commented on {comment.resourceType}</span>
                      <span>·</span>
                      <span>{formatRelativeDate(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {profile.recentSuggestions?.map((suggestion) => (
              <div
                key={suggestion.id}
                className={cn(
                  "p-4 rounded-xl",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded",
                          suggestion.status === "merged"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : suggestion.status === "approved"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {suggestion.status}
                      </span>
                      <span>·</span>
                      <span>{formatRelativeDate(suggestion.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!profile.collections?.length && !profile.recentComments?.length && !profile.recentSuggestions?.length && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No public activity yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {profile.isOwnProfile
              ? "Start creating collections and engaging with the community!"
              : "This user hasn't shared any public activity yet."}
          </p>
        </div>
      )}
    </div>
  );
}
