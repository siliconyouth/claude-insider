"use client";

/**
 * User Followers Page
 *
 * Displays list of users following a profile.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/users/follow-button";
import { ProfileHoverCard } from "@/components/users/profile-hover-card";
import { cn } from "@/lib/design-system";
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface FollowerUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export default function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchFollowers() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/${username}/followers`);
        const data = await res.json();

        if (res.ok) {
          setFollowers(data.followers || []);
          setUserName(data.userName || username);
        }
      } catch (error) {
        console.error("Failed to load followers:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFollowers();
  }, [username]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      <Header />
      <div className="flex-1">
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
            Followers
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          People following {userName || `@${username}`}
        </p>
      </div>

      {/* Followers List */}
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
      ) : followers.length === 0 ? (
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
            No followers yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            When someone follows this user, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {followers.map((follower) => {
            // Build user data for hover card
            const followerUser = {
              id: follower.id,
              name: follower.name,
              username: follower.username,
              image: follower.image,
              bio: follower.bio,
              isFollowing: follower.isFollowing,
            };

            // Render avatar for reuse
            const renderAvatar = () => (
              follower.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={follower.image}
                  alt={follower.name}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer",
                    "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white"
                  )}
                >
                  {follower.name?.[0]?.toUpperCase() || "U"}
                </div>
              )
            );

            return (
              <div
                key={follower.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/30 transition-colors"
                )}
              >
                {/* Avatar with hover card */}
                <ProfileHoverCard user={followerUser} side="bottom">
                  {renderAvatar()}
                </ProfileHoverCard>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <ProfileHoverCard user={followerUser} side="bottom">
                    <span className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer">
                      {follower.name}
                    </span>
                  </ProfileHoverCard>
                  {follower.username && (
                    <ProfileHoverCard user={followerUser} side="bottom">
                      <p className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400">
                        @{follower.username}
                      </p>
                    </ProfileHoverCard>
                  )}
                  {follower.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                      {follower.bio}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <FollowButton
                  userId={follower.id}
                  isFollowing={follower.isFollowing}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
