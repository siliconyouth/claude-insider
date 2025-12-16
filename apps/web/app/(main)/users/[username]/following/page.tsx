"use client";

/**
 * User Following Page
 *
 * Displays list of users that a profile is following.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { FollowButton } from "@/components/users/follow-button";
import { ProfileHoverCard } from "@/components/users/profile-hover-card";

interface FollowingUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export default function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchFollowing() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/${username}/following`);
        const data = await res.json();

        if (res.ok) {
          setFollowing(data.following || []);
          setUserName(data.userName || username);
        }
      } catch (error) {
        console.error("Failed to load following:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFollowing();
  }, [username]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/users/${username}`}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Following
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          People {userName || `@${username}`} is following
        </p>
      </div>

      {/* Following List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl animate-pulse",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#1a1a1a]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : following.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Not following anyone yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            When this user follows someone, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {following.map((user) => {
            // Build user data for hover card
            const followingUser = {
              id: user.id,
              name: user.name,
              username: user.username,
              image: user.image,
              bio: user.bio,
              isFollowing: user.isFollowing,
            };

            // Render avatar for reuse
            const renderAvatar = () => (
              user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer"
                />
              ) : (
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer",
                    "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white"
                  )}
                >
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )
            );

            return (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/30 transition-colors"
                )}
              >
                {/* Avatar with hover card */}
                <ProfileHoverCard user={followingUser} side="bottom">
                  {renderAvatar()}
                </ProfileHoverCard>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <ProfileHoverCard user={followingUser} side="bottom">
                    <span className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer">
                      {user.name}
                    </span>
                  </ProfileHoverCard>
                  {user.username && (
                    <ProfileHoverCard user={followingUser} side="bottom">
                      <p className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400">
                        @{user.username}
                      </p>
                    </ProfileHoverCard>
                  )}
                  {user.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <FollowButton
                  userId={user.id}
                  isFollowing={user.isFollowing}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
