"use client";

/**
 * User Directory Page
 *
 * Public user directory with multiple lists:
 * - Featured users (verified, staff, beta testers)
 * - New users (recently joined)
 * - Most active users
 * - High achievers (most achievement points)
 * - Biggest donors (with consent)
 * - Following/Followers (authenticated only)
 *
 * Includes search with filters for role and donor status.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileHoverCard, type ProfileHoverCardUser } from "@/components/users/profile-hover-card";
import { FollowButton } from "@/components/users/follow-button";
import { VirtualizedUserGrid } from "@/components/users/virtualized-user-grid";
import { UserDirectoryInsights } from "@/components/users/user-directory-insights";
import type { UserRole } from "@/lib/roles";

// ============================================================================
// Types
// ============================================================================

interface DirectoryUser {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  role: string;
  isBetaTester: boolean;
  isVerified: boolean;
  joinedAt: string;
  achievementPoints: number;
  followersCount: number;
  followingCount: number;
  donorTier: "platinum" | "gold" | "silver" | "bronze" | null;
  totalDonated?: number;
  isOnline: boolean;
  lastSeen: string | null;
  isFollowing?: boolean;
}

type ListType =
  | "featured"
  | "new"
  | "active"
  | "achievers"
  | "donors"
  | "following"
  | "followers"
  | "search";

interface ListConfig {
  id: ListType;
  label: string;
  icon: React.ReactNode;
  description: string;
  requiresAuth?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const LIST_CONFIGS: ListConfig[] = [
  {
    id: "featured",
    label: "Featured",
    icon: <StarIcon className="w-4 h-4" />,
    description: "Verified users and notable community members",
  },
  {
    id: "new",
    label: "New Users",
    icon: <SparklesIcon className="w-4 h-4" />,
    description: "Recently joined members",
  },
  {
    id: "active",
    label: "Most Active",
    icon: <ActivityIcon className="w-4 h-4" />,
    description: "Users with recent activity",
  },
  {
    id: "achievers",
    label: "High Achievers",
    icon: <TrophyIcon className="w-4 h-4" />,
    description: "Top contributors by achievement points",
  },
  {
    id: "donors",
    label: "Supporters",
    icon: <HeartIcon className="w-4 h-4" />,
    description: "Generous community supporters",
  },
];

const AUTH_LIST_CONFIGS: ListConfig[] = [
  {
    id: "following",
    label: "Following",
    icon: <UsersIcon className="w-4 h-4" />,
    description: "Users you follow",
    requiresAuth: true,
  },
  {
    id: "followers",
    label: "Followers",
    icon: <UserPlusIcon className="w-4 h-4" />,
    description: "Users following you",
    requiresAuth: true,
  },
];

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  superadmin: {
    label: "Super Admin",
    color: "bg-gradient-to-r from-violet-600 to-blue-600 text-white",
  },
  admin: {
    label: "Admin",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
  moderator: {
    label: "Mod",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  },
  editor: {
    label: "Editor",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
};

const DONOR_TIER_CONFIG = {
  bronze: {
    label: "Bronze",
    color: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  silver: {
    label: "Silver",
    color: "text-gray-500 dark:text-gray-300",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  platinum: {
    label: "Platinum",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
};

// ============================================================================
// Icons
// ============================================================================

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12V4m8 8V4M4 8h4m8 0h4M9 20h6M12 16v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8a2 2 0 01-2-2V4h4M18 8a2 2 0 002-2V4h-4" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function _formatLastSeen(dateString: string | null): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// Components
// ============================================================================

interface UserCardProps {
  user: DirectoryUser;
  showDonation?: boolean;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

function UserCard({ user, showDonation, onFollowChange }: UserCardProps) {
  const hoverCardUser: ProfileHoverCardUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.avatar,
    bio: user.bio,
    isFollowing: user.isFollowing,
    donorTier: user.donorTier,
    achievementPoints: user.achievementPoints,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen || undefined,
    joinedAt: user.joinedAt,
    role: user.role as UserRole,
    stats: {
      followers: user.followersCount,
      following: user.followingCount,
    },
  };

  return (
    <div
      className={cn(
        "group relative p-4 rounded-xl bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with hover card */}
        <ProfileHoverCard user={hoverCardUser} side="bottom">
          <Link href={`/users/${user.username}`} className="flex-shrink-0">
            <div className="relative">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111111]" />
              )}
            </div>
          </Link>
        </ProfileHoverCard>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ProfileHoverCard user={hoverCardUser} side="top">
              <Link
                href={`/users/${user.username}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors truncate"
              >
                {user.name}
              </Link>
            </ProfileHoverCard>

            {/* Verified badge */}
            {user.isVerified && (
              <VerifiedIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}

            {/* Role badge */}
            {user.role && ROLE_BADGES[user.role] && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium",
                  ROLE_BADGES[user.role]?.color
                )}
              >
                {ROLE_BADGES[user.role]?.label}
              </span>
            )}

            {/* Beta tester badge */}
            {user.isBetaTester && (!user.role || !ROLE_BADGES[user.role]) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                Beta
              </span>
            )}

            {/* Donor badge */}
            {user.donorTier && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium",
                  DONOR_TIER_CONFIG[user.donorTier].bg,
                  DONOR_TIER_CONFIG[user.donorTier].color
                )}
              >
                {DONOR_TIER_CONFIG[user.donorTier].label}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{user.username}
          </p>

          {user.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{user.followersCount.toLocaleString()} followers</span>
            <span>{user.achievementPoints.toLocaleString()} pts</span>
            {showDonation && user.totalDonated && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ${user.totalDonated.toLocaleString()} donated
              </span>
            )}
            <span>Joined {formatJoinDate(user.joinedAt)}</span>
          </div>
        </div>

        {/* Follow button */}
        <div className="flex-shrink-0">
          <FollowButton
            userId={user.id}
            isFollowing={user.isFollowing || false}
            size="sm"
            onFollowChange={(isFollowing) => onFollowChange?.(user.id, isFollowing)}
          />
        </div>
      </div>
    </div>
  );
}

interface UserListSectionProps {
  config: ListConfig;
  users: DirectoryUser[];
  isLoading: boolean;
  total: number;
  onViewMore: () => void;
  onFollowChange: (userId: string, isFollowing: boolean) => void;
  showDonation?: boolean;
}

function UserListSection({
  config,
  users,
  isLoading,
  total,
  onViewMore,
  onFollowChange,
  showDonation,
}: UserListSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 text-blue-600 dark:text-cyan-400">
            {config.icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.label}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>
        {total > 6 && (
          <button
            onClick={onViewMore}
            className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            View all {total.toLocaleString()}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#262626]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-[#262626] rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-[#262626] rounded" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-[#262626] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No users found in this category
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              showDonation={showDonation}
              onFollowChange={onFollowChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function UsersDirectoryPage() {
  const { isAuthenticated, user: currentUser } = useAuth();

  // State for each list
  const [lists, setLists] = useState<Record<ListType, { users: DirectoryUser[]; total: number; isLoading: boolean }>>({
    featured: { users: [], total: 0, isLoading: true },
    new: { users: [], total: 0, isLoading: true },
    active: { users: [], total: 0, isLoading: true },
    achievers: { users: [], total: 0, isLoading: true },
    donors: { users: [], total: 0, isLoading: true },
    following: { users: [], total: 0, isLoading: false },
    followers: { users: [], total: 0, isLoading: false },
    search: { users: [], total: 0, isLoading: false },
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [donorFilter, setDonorFilter] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "search">("browse");

  // Expanded list modal
  const [expandedList, setExpandedList] = useState<ListType | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<DirectoryUser[]>([]);
  const [expandedPage, setExpandedPage] = useState(1);
  const [expandedTotal, setExpandedTotal] = useState(0);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Fetch a specific list
  const fetchList = useCallback(async (listType: ListType, limit: number = 6) => {
    setLists((prev) => ({
      ...prev,
      [listType]: { ...prev[listType], isLoading: true },
    }));

    try {
      const res = await fetch(`/api/users?list=${listType}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setLists((prev) => ({
        ...prev,
        [listType]: {
          users: data.users || [],
          total: data.total || 0,
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error(`[UsersDirectory] Error fetching ${listType}:`, error);
      setLists((prev) => ({
        ...prev,
        [listType]: { users: [], total: 0, isLoading: false },
      }));
    }
  }, []);

  // Fetch all public lists on mount
  useEffect(() => {
    fetchList("featured");
    fetchList("new");
    fetchList("active");
    fetchList("achievers");
    fetchList("donors");
  }, [fetchList]);

  // Fetch authenticated lists when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLists((prev) => ({
        ...prev,
        following: { ...prev.following, isLoading: true },
        followers: { ...prev.followers, isLoading: true },
      }));
      fetchList("following");
      fetchList("followers");
    }
  }, [isAuthenticated, fetchList]);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && !roleFilter && !donorFilter) {
      setLists((prev) => ({
        ...prev,
        search: { users: [], total: 0, isLoading: false },
      }));
      return;
    }

    setIsSearching(true);
    setLists((prev) => ({
      ...prev,
      search: { ...prev.search, isLoading: true },
    }));

    try {
      const params = new URLSearchParams({ list: "search", limit: "20" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (donorFilter) params.set("donor", donorFilter);

      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      setLists((prev) => ({
        ...prev,
        search: {
          users: data.users || [],
          total: data.total || 0,
          isLoading: false,
        },
      }));
      setActiveTab("search");
    } catch (error) {
      console.error("[UsersDirectory] Search error:", error);
      setLists((prev) => ({
        ...prev,
        search: { users: [], total: 0, isLoading: false },
      }));
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, roleFilter, donorFilter]);

  // Expanded list fetch
  const fetchExpandedList = useCallback(async (listType: ListType, page: number) => {
    setExpandedLoading(true);
    try {
      const res = await fetch(`/api/users?list=${listType}&page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (page === 1) {
        setExpandedUsers(data.users || []);
      } else {
        setExpandedUsers((prev) => [...prev, ...(data.users || [])]);
      }
      setExpandedTotal(data.total || 0);
    } catch (error) {
      console.error(`[UsersDirectory] Error fetching expanded ${listType}:`, error);
    } finally {
      setExpandedLoading(false);
    }
  }, []);

  // Handle view more
  const handleViewMore = (listType: ListType) => {
    setExpandedList(listType);
    setExpandedPage(1);
    setExpandedUsers([]);
    fetchExpandedList(listType, 1);
  };

  // Handle follow change (optimistic update)
  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    const updateUsers = (users: DirectoryUser[]) =>
      users.map((u) => (u.id === userId ? { ...u, isFollowing } : u));

    setLists((prev) => ({
      ...prev,
      featured: { ...prev.featured, users: updateUsers(prev.featured.users) },
      new: { ...prev.new, users: updateUsers(prev.new.users) },
      active: { ...prev.active, users: updateUsers(prev.active.users) },
      achievers: { ...prev.achievers, users: updateUsers(prev.achievers.users) },
      donors: { ...prev.donors, users: updateUsers(prev.donors.users) },
      following: { ...prev.following, users: updateUsers(prev.following.users) },
      followers: { ...prev.followers, users: updateUsers(prev.followers.users) },
      search: { ...prev.search, users: updateUsers(prev.search.users) },
    }));

    setExpandedUsers((prev) => updateUsers(prev));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
      <Header activePage="community" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Directory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and connect with community members
          </p>
        </div>

        {/* Community Insights Charts */}
        <UserDirectoryInsights
          lists={lists}
          isAuthenticated={isAuthenticated}
          className="mb-8"
        />

        {/* Search & Filters */}
        <div className="mb-8 p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={cn(
                  "px-3 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                <option value="">All Roles</option>
                <option value="verified">Verified</option>
                <option value="betaTester">Beta Testers</option>
                <option value="staff">Staff</option>
              </select>

              <select
                value={donorFilter}
                onChange={(e) => setDonorFilter(e.target.value)}
                className={cn(
                  "px-3 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                <option value="">All Supporters</option>
                <option value="bronze">Bronze+</option>
                <option value="silver">Silver+</option>
                <option value="gold">Gold+</option>
                <option value="platinum">Platinum</option>
              </select>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-medium text-sm",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-lg shadow-blue-500/25",
                  "hover:shadow-xl hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200"
                )}
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Active filters display */}
          {(searchQuery || roleFilter || donorFilter) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-[#262626]">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  &quot;{searchQuery}&quot;
                </span>
              )}
              {roleFilter && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {roleFilter}
                </span>
              )}
              {donorFilter && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  {donorFilter}+
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("");
                  setDonorFilter("");
                  setActiveTab("browse");
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        {lists.search.users.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("browse")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === "browse"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#262626]"
              )}
            >
              Browse
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === "search"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#262626]"
              )}
            >
              Search Results ({lists.search.total})
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === "search" && lists.search.users.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Search Results ({lists.search.total.toLocaleString()} users)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.search.users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onFollowChange={handleFollowChange}
                />
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* Authenticated user lists */}
            {isAuthenticated && currentUser && (
              <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {AUTH_LIST_CONFIGS.map((config) => (
                  <div
                    key={config.id}
                    className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 text-blue-600 dark:text-cyan-400">
                          {config.icon}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {config.label}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({lists[config.id].total})
                        </span>
                      </div>
                      {lists[config.id].total > 3 && (
                        <button
                          onClick={() => handleViewMore(config.id)}
                          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
                        >
                          View all
                        </button>
                      )}
                    </div>

                    {lists[config.id].isLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]" />
                            <div className="flex-1 space-y-1">
                              <div className="h-3 w-20 bg-gray-200 dark:bg-[#262626] rounded" />
                              <div className="h-2 w-14 bg-gray-200 dark:bg-[#262626] rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : lists[config.id].users.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {config.id === "following" ? "You're not following anyone yet" : "No followers yet"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {lists[config.id].users.slice(0, 3).map((user) => (
                          <div key={user.id} className="flex items-center gap-3">
                            <ProfileHoverCard
                              user={{
                                id: user.id,
                                name: user.name,
                                username: user.username,
                                image: user.avatar,
                                bio: user.bio,
                                isFollowing: user.isFollowing,
                              }}
                              side="bottom"
                            >
                              <Link href={`/users/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                                {user.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    @{user.username}
                                  </p>
                                </div>
                              </Link>
                            </ProfileHoverCard>
                            <FollowButton
                              userId={user.id}
                              isFollowing={user.isFollowing || false}
                              size="sm"
                              onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Public lists */}
            {LIST_CONFIGS.map((config) => (
              <UserListSection
                key={config.id}
                config={config}
                users={lists[config.id].users}
                isLoading={lists[config.id].isLoading}
                total={lists[config.id].total}
                onViewMore={() => handleViewMore(config.id)}
                onFollowChange={handleFollowChange}
                showDonation={config.id === "donors"}
              />
            ))}
          </>
        )}
      </main>

      {/* Expanded list modal */}
      {expandedList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setExpandedList(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[80vh] bg-white dark:bg-[#111111] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#262626]">
              <div className="flex items-center gap-3">
                {LIST_CONFIGS.find((c) => c.id === expandedList)?.icon ||
                  AUTH_LIST_CONFIGS.find((c) => c.id === expandedList)?.icon}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {LIST_CONFIGS.find((c) => c.id === expandedList)?.label ||
                      AUTH_LIST_CONFIGS.find((c) => c.id === expandedList)?.label}
                  </h2>
                  <p className="text-sm text-gray-500">{expandedTotal.toLocaleString()} users</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedList(null)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal content - Virtualized for performance */}
            <div className="p-4">
              <VirtualizedUserGrid
                items={expandedUsers}
                keyExtractor={(user) => user.id}
                renderItem={(user) => (
                  <UserCard
                    user={user}
                    showDonation={expandedList === "donors"}
                    onFollowChange={handleFollowChange}
                  />
                )}
                height="calc(80vh - 180px)"
                columns={2}
                isLoading={expandedLoading && expandedUsers.length === 0}
                emptyState={
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">No users found</p>
                  </div>
                }
              />

              {/* Load more */}
              {expandedUsers.length < expandedTotal && (
                <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-[#262626]">
                  <button
                    onClick={() => {
                      const nextPage = expandedPage + 1;
                      setExpandedPage(nextPage);
                      fetchExpandedList(expandedList, nextPage);
                    }}
                    disabled={expandedLoading}
                    className={cn(
                      "px-6 py-2 rounded-lg font-medium",
                      "bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white",
                      "hover:bg-gray-200 dark:hover:bg-[#262626]",
                      "disabled:opacity-50",
                      "transition-colors"
                    )}
                  >
                    {expandedLoading ? "Loading..." : `Load more (${expandedUsers.length} of ${expandedTotal})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
