"use client";

/**
 * User Stats Page
 *
 * Enhanced personal activity statistics and analytics dashboard.
 * Features tabbed navigation with overview, history, achievements, and engagement views.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ActivityChart } from "@/components/analytics/activity-chart";
import { PopularResources } from "@/components/analytics/popular-resources";
import {
  PersonalStatsHeader,
  AnalyticsTabs,
  type AnalyticsTab,
  ReadingCategoryChart,
  AchievementProgress,
  ComparisonCard,
  ReadingHistory,
  EngagementStats,
} from "@/components/analytics";
import {
  getPersonalAnalytics,
  getReadingHistory,
  clearReadingHistory,
  type PersonalAnalytics,
  type ViewHistoryItem,
} from "@/app/actions/personal-analytics";
import { RefreshCwIcon, AlertCircleIcon } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function ProfileStatsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [analytics, setAnalytics] = useState<PersonalAnalytics | null>(null);
  const [history, setHistory] = useState<ViewHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getPersonalAnalytics();
      if (result.error) {
        setError(result.error);
      } else if (result.analytics) {
        setAnalytics(result.analytics);
      }
    } catch (err) {
      setError("Failed to load analytics. Please try again.");
      console.error("Error fetching analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch reading history
  const fetchHistory = useCallback(async (page: number) => {
    try {
      setIsLoadingHistory(true);
      const result = await getReadingHistory(page, ITEMS_PER_PAGE);
      if (result.history) {
        setHistory(result.history);
      }
      setHistoryTotal(result.total || 0);
      setHistoryPage(page);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Clear reading history
  const handleClearHistory = async () => {
    try {
      setIsClearing(true);
      await clearReadingHistory();
      setHistory([]);
      setHistoryTotal(0);
      setHistoryPage(1);
    } catch (err) {
      console.error("Error clearing history:", err);
    } finally {
      setIsClearing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === "history" && history.length === 0 && !isLoadingHistory) {
      fetchHistory(1);
    }
  }, [activeTab, history.length, isLoadingHistory, fetchHistory]);

  const totalHistoryPages = Math.ceil(historyTotal / ITEMS_PER_PAGE);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCwIcon className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-500">Loading your analytics...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error || "Please sign in to view your analytics"}
            </h2>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      <Header />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Profile
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Activity Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track your learning journey on Claude Insider
            </p>
          </div>

          {/* Stats Header */}
          <PersonalStatsHeader
            level={analytics.level}
            totalPoints={analytics.totalPoints}
            pointsThisWeek={analytics.pointsThisWeek}
            nextLevelProgress={analytics.nextLevelProgress}
            pointsToNextLevel={analytics.pointsToNextLevel}
            currentStreak={analytics.currentStreak}
            streakActive={analytics.streakActive}
            achievementsUnlocked={analytics.achievementsUnlocked}
            achievementsTotal={analytics.achievementsTotal}
            className="mb-8"
          />

          {/* Tabs */}
          <AnalyticsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-8"
          />

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab analytics={analytics} />
          )}

          {activeTab === "history" && (
            <ReadingHistory
              history={history}
              totalItems={historyTotal}
              currentPage={historyPage}
              totalPages={totalHistoryPages}
              onPageChange={fetchHistory}
              onClearHistory={handleClearHistory}
              isClearing={isClearing}
            />
          )}

          {activeTab === "achievements" && (
            <AchievementProgress
              achievementsUnlocked={analytics.achievementsUnlocked}
              achievementsTotal={analytics.achievementsTotal}
              nextAchievements={analytics.nextAchievements}
            />
          )}

          {activeTab === "engagement" && (
            <EngagementStats
              contributions={analytics.contributions}
              impact={analytics.impact}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

/**
 * Overview Tab Content
 */
function OverviewTab({ analytics }: { analytics: PersonalAnalytics }) {
  return (
    <div className="space-y-8">
      {/* Activity Chart */}
      <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Your Activity (30 days)
          </h3>
          <div className="text-sm text-gray-400">
            Peak day: <span className="text-white">{analytics.peakDay}</span> ·
            Most active: <span className="text-white">{formatHour(analytics.peakHour)}</span>
          </div>
        </div>
        <ActivityChart
          data={analytics.activityChart}
          height={200}
        />
      </div>

      {/* Two column grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reading by Category */}
        <ReadingCategoryChart
          data={analytics.categoryBreakdown.map((c, i) => ({
            ...c,
            color: CHART_COLORS[i % CHART_COLORS.length] ?? "#6b7280",
          }))}
        />

        {/* Comparison Card */}
        <ComparisonCard comparison={analytics.comparison} />
      </div>

      {/* Popular Resources */}
      <div className="grid md:grid-cols-2 gap-6">
        <div
          className={cn(
            "rounded-xl p-6",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trending This Week
          </h3>
          <PopularResources type="trending" limit={5} />
        </div>

        <div
          className={cn(
            "rounded-xl p-6",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Viewed
          </h3>
          <PopularResources type="popular" limit={5} />
        </div>
      </div>
    </div>
  );
}

// Chart colors
const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
];

// Format hour for display
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
