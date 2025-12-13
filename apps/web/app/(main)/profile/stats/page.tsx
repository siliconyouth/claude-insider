"use client";

/**
 * User Stats Page
 *
 * Display personal activity statistics and analytics.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { UserStatsDashboard } from "@/components/analytics/user-stats-dashboard";
import { PopularResources } from "@/components/analytics/popular-resources";

export default function ProfileStatsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Profile
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Activity
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your engagement and reading progress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main stats */}
          <div className="lg:col-span-2">
            <UserStatsDashboard />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending */}
            <div
              className={cn(
                "rounded-xl p-5",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Trending This Week
              </h2>
              <PopularResources type="trending" limit={5} />
            </div>

            {/* Popular */}
            <div
              className={cn(
                "rounded-xl p-5",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Most Viewed
              </h2>
              <PopularResources type="popular" limit={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
