"use client";

/**
 * User Achievements Page
 *
 * View all achievements and manage featured ones.
 * Optimized with combined data endpoint and sessionStorage caching.
 */

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/toast";
import { AchievementBadge } from "@/components/achievements/achievement-badge";
import {
  getCompleteAchievementsData,
  toggleFeaturedAchievement,
  type UserAchievement,
  type Achievement,
  type AchievementProgress,
} from "@/app/actions/achievements";

// Cache key for sessionStorage
const ACHIEVEMENTS_CACHE_KEY = "ci_achievements_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedAchievementsData {
  earned: UserAchievement[];
  all: Achievement[];
  progress: AchievementProgress[];
  stats: { total: number; points: number; rank: string };
  timestamp: number;
}

function getFromCache(): CachedAchievementsData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(ACHIEVEMENTS_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as CachedAchievementsData;
    if (Date.now() - data.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(ACHIEVEMENTS_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setToCache(data: Omit<CachedAchievementsData, "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      ACHIEVEMENTS_CACHE_KEY,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  } catch {
    // Storage full or unavailable
  }
}

type Category = "all" | "contribution" | "engagement" | "milestone" | "special";

export default function AchievementsPage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn } = useAuth();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [all, setAll] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [stats, setStats] = useState({ total: 0, points: 0, rank: "Newcomer" });
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<Category>("all");
  const [view, setView] = useState<"earned" | "all" | "progress">("earned");

  // Prevent duplicate fetches
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showSignIn();
    }
  }, [authLoading, isAuthenticated, showSignIn]);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Try to load from cache first (instant)
    if (!forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        setEarned(cached.earned);
        setAll(cached.all);
        setProgress(cached.progress);
        setStats(cached.stats);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    // Single optimized call that fetches all data at once
    // - 1 session lookup (instead of 4)
    // - 5 parallel DB queries
    const result = await getCompleteAchievementsData();

    if (result.data) {
      setEarned(result.data.earned);
      setAll(result.data.all);
      setProgress(result.data.progress);
      setStats(result.data.stats);

      // Cache for future visits
      setToCache({
        earned: result.data.earned,
        all: result.data.all,
        progress: result.data.progress,
        stats: result.data.stats,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Prevent duplicate fetches on auth state changes
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleToggleFeatured = (achievementId: string) => {
    startTransition(async () => {
      const result = await toggleFeaturedAchievement(achievementId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setEarned((prev) =>
          prev.map((a) =>
            a.id === achievementId ? { ...a, isFeatured: result.isFeatured || false } : a
          )
        );
        toast.success(result.isFeatured ? "Added to profile" : "Removed from profile");
      }
    });
  };

  const earnedSlugs = new Set(earned.map((a) => a.slug));

  const filteredEarned =
    category === "all" ? earned : earned.filter((a) => a.category === category);

  const filteredAll =
    category === "all" ? all : all.filter((a) => a.category === category);

  const featuredCount = earned.filter((a) => a.isFeatured).length;

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
          <div className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/profile"
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
            My Achievements
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Track your progress and showcase your accomplishments
        </p>
      </div>

      {/* Stats Card */}
      <div
        className={cn(
          "p-6 rounded-xl mb-8",
          "bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50",
          "dark:from-violet-900/20 dark:via-blue-900/20 dark:to-cyan-900/20",
          "border border-violet-200 dark:border-violet-800"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Rank</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.rank}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold gradient-text-stripe">{stats.points}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">points earned</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-violet-200 dark:border-violet-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {earned.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {all.length - earned.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {featuredCount}/6
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Featured</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "earned", label: `Earned (${earned.length})` },
            { key: "all", label: "All Achievements" },
            { key: "progress", label: "In Progress" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              view === tab.key
                ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111111]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            { key: "all", label: "All" },
            { key: "contribution", label: "Contribution" },
            { key: "engagement", label: "Engagement" },
            { key: "milestone", label: "Milestone" },
            { key: "special", label: "Special" },
          ] as const
        ).map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              "border",
              category === cat.key
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:border-blue-500/50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Earned Achievements */}
      {view === "earned" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredEarned.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No achievements earned yet in this category
              </p>
            </div>
          ) : (
            filteredEarned.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "p-4 rounded-xl text-center",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/50 transition-colors"
                )}
              >
                <div className="flex justify-center mb-3">
                  <AchievementBadge
                    name={achievement.name}
                    description={achievement.description}
                    icon={achievement.icon}
                    tier={achievement.tier}
                    points={achievement.points}
                    earnedAt={achievement.earnedAt}
                    isFeatured={achievement.isFeatured}
                    size="lg"
                    showTooltip={false}
                  />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {achievement.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {achievement.description}
                </p>
                <button
                  onClick={() => handleToggleFeatured(achievement.id)}
                  disabled={isPending}
                  className={cn(
                    "mt-3 px-3 py-1 text-xs font-medium rounded-full transition-colors",
                    achievement.isFeatured
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                      : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400",
                    "hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400"
                  )}
                >
                  {achievement.isFeatured ? "★ Featured" : "Add to Profile"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Achievements */}
      {view === "all" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredAll.map((achievement) => {
            const isEarned = earnedSlugs.has(achievement.slug);
            return (
              <div
                key={achievement.id}
                className={cn(
                  "p-4 rounded-xl text-center",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  !isEarned && "opacity-50"
                )}
              >
                <div className="flex justify-center mb-3">
                  <AchievementBadge
                    name={achievement.name}
                    description={achievement.description}
                    icon={achievement.icon}
                    tier={achievement.tier}
                    points={achievement.points}
                    size="lg"
                    showTooltip={false}
                  />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {achievement.isHidden && !isEarned ? "???" : achievement.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {achievement.isHidden && !isEarned
                    ? "Hidden achievement"
                    : achievement.description}
                </p>
                <p className="mt-2 text-xs font-medium">
                  {isEarned ? (
                    <span className="text-green-600 dark:text-green-400">✓ Earned</span>
                  ) : (
                    <span className="text-gray-400">+{achievement.points} pts</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress */}
      {view === "progress" && (
        <div className="space-y-3">
          {progress.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No achievements in progress
              </p>
            </div>
          ) : (
            progress.map((p) => {
              const achievement = all.find((a) => a.slug === p.slug);
              if (!achievement) return null;

              return (
                <div
                  key={p.slug}
                  className={cn(
                    "p-4 rounded-xl",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <AchievementBadge
                      name={achievement.name}
                      description={achievement.description}
                      icon={achievement.icon}
                      tier={achievement.tier}
                      points={achievement.points}
                      size="md"
                      showTooltip={false}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {p.currentValue} / {p.requiredValue}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-cyan-400">
                      {p.percentComplete}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 rounded-full transition-all"
                      style={{ width: `${p.percentComplete}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
