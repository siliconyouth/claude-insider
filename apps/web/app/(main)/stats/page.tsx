"use client";

/**
 * Community Statistics Page
 *
 * Public page showing community-wide metrics, leaderboard,
 * popular content, and recent achievements.
 */

import { useEffect, useState } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Leaderboard } from "@/components/gamification/leaderboard";
import { ActivityChart } from "@/components/analytics/activity-chart";
import {
  CommunityHero,
  StatsGrid,
  RecentAchievements,
  CategoryBreakdown,
  PopularContent,
} from "@/components/stats";
import {
  getCommunityStats,
  type CommunityStats,
} from "@/app/actions/community-stats";
import { cn } from "@/lib/design-system";

export default function StatsPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getCommunityStats();
        if (result.error) {
          setError(result.error);
        } else if (result.stats) {
          setStats(result.stats);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load community statistics");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <StatsPageSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : stats ? (
            <StatsContent stats={stats} />
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatsContent({ stats }: { stats: CommunityStats }) {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <CommunityHero totalUsers={stats.totalUsers} />

      {/* Stats grid */}
      <StatsGrid
        stats={{
          totalUsers: stats.totalUsers,
          totalResources: stats.totalResources,
          totalAchievements: stats.totalAchievements,
          viewsThisMonth: stats.viewsThisMonth,
          newUsersThisWeek: stats.newUsersThisWeek,
          newUsersThisMonth: stats.newUsersThisMonth,
        }}
      />

      {/* Two-column: Leaderboard + Activity Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
          <h2 className="text-lg font-semibold text-white mb-4">
            Top Contributors
          </h2>
          <Leaderboard entries={stats.topContributors} variant="compact" />
        </div>

        {/* Activity chart */}
        <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
          <ActivityChart
            data={stats.dailyActiveUsers}
            label="Daily Active Users (30 days)"
            color="#8b5cf6"
            height={200}
          />
        </div>
      </div>

      {/* Three-column: Popular Docs, Resources, Achievements */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Popular content (2 columns) */}
        <div className="lg:col-span-2">
          <PopularContent
            docs={stats.popularDocs}
            resources={stats.popularResources}
          />
        </div>

        {/* Recent achievements */}
        <RecentAchievements achievements={stats.recentAchievements} />
      </div>

      {/* Category breakdown */}
      <CategoryBreakdown
        data={stats.categoryBreakdown}
        title="Community Reading Activity"
      />
    </div>
  );
}

function StatsPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600/10 via-blue-600/10 to-cyan-600/10 border border-[#262626] p-8 md:p-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 mx-auto" />
          <div className="h-8 w-64 bg-gray-800 rounded mx-auto" />
          <div className="h-6 w-48 bg-gray-800 rounded mx-auto" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-[#111111] border border-[#262626]"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-800 mb-3" />
            <div className="h-8 w-20 bg-gray-800 rounded mb-2" />
            <div className="h-4 w-16 bg-gray-800 rounded" />
          </div>
        ))}
      </div>

      {/* Two-column skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-64" />
        <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-64" />
      </div>

      {/* Three-column skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-48" />
          <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-48" />
        </div>
        <div className="rounded-xl p-6 bg-[#111111] border border-[#262626] h-48" />
      </div>

      {/* Category skeleton */}
      <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
        <div className="h-6 w-48 bg-gray-800 rounded mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-gray-800 rounded" />
                <div className="h-4 w-16 bg-gray-800 rounded" />
              </div>
              <div className="h-2 bg-gray-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Unable to Load Statistics
      </h2>
      <p className="text-gray-400 mb-4">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white hover:opacity-90 transition-opacity"
        )}
      >
        Try Again
      </button>
    </div>
  );
}
