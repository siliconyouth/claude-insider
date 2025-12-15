/**
 * Bot Analytics Page
 *
 * Charts and statistics for bot detection and security trends.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import type { SecurityStatsData } from "@/components/dashboard/security";
import {
  ChartBarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SecurityStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/security/stats");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stats");
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Calculate percentages for display
  const botPercentage =
    stats && stats.security.logs24h > 0
      ? ((stats.security.bots24h / stats.security.logs24h) * 100).toFixed(1)
      : "0";

  const verifiedBotPercentage =
    stats && stats.security.totalBotDetections > 0
      ? (
          (stats.security.verifiedBots / stats.security.totalBotDetections) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/security"
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
              Bot Analytics
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Bot detection trends and security statistics
            </p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-blue-500 text-white",
            "hover:bg-blue-600 transition-colors",
            "disabled:opacity-50"
          )}
        >
          <ArrowPathIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !stats && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-[#111111]">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      )}

      {/* Analytics Content */}
      {stats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
              <h3 className="text-sm font-medium text-gray-500">
                Bot Traffic (24h)
              </h3>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold text-amber-500">
                  {botPercentage}%
                </span>
                <span className="mb-1 text-sm text-gray-400">
                  ({stats.security.bots24h} / {stats.security.logs24h})
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
              <h3 className="text-sm font-medium text-gray-500">Verified Bots</h3>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold text-emerald-500">
                  {verifiedBotPercentage}%
                </span>
                <span className="mb-1 text-sm text-gray-400">
                  ({stats.security.verifiedBots} /{" "}
                  {stats.security.totalBotDetections})
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
              <h3 className="text-sm font-medium text-gray-500">
                Honeypot Effectiveness
              </h3>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold text-purple-500">
                  {stats.security.totalHoneypotTriggers}
                </span>
                <span className="mb-1 text-sm text-gray-400">total triggers</span>
              </div>
            </div>
          </div>

          {/* Detection Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detection Summary
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <div className="text-sm text-gray-500">Total Logs</div>
                <div className="mt-1 text-2xl font-bold">
                  {stats.security.totalLogs.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Bot Detections</div>
                <div className="mt-1 text-2xl font-bold text-amber-500">
                  {stats.security.totalBotDetections.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Honeypot Triggers</div>
                <div className="mt-1 text-2xl font-bold text-purple-500">
                  {stats.security.totalHoneypotTriggers.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Blocked Visitors</div>
                <div className="mt-1 text-2xl font-bold text-red-500">
                  {stats.visitors.blockedVisitors.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Event Severity
            </h2>
            <div className="mt-6">
              <div className="flex h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-[#1a1a1a]">
                {stats.security.criticalEvents > 0 && (
                  <div
                    className="bg-rose-500"
                    style={{
                      width: `${(stats.security.criticalEvents / stats.security.totalLogs) * 100}%`,
                    }}
                    title={`Critical: ${stats.security.criticalEvents}`}
                  />
                )}
                {stats.security.errorEvents > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(stats.security.errorEvents / stats.security.totalLogs) * 100}%`,
                    }}
                    title={`Error: ${stats.security.errorEvents}`}
                  />
                )}
                {stats.security.warningEvents > 0 && (
                  <div
                    className="bg-amber-500"
                    style={{
                      width: `${(stats.security.warningEvents / stats.security.totalLogs) * 100}%`,
                    }}
                    title={`Warning: ${stats.security.warningEvents}`}
                  />
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-gray-500">
                    Critical: {stats.security.criticalEvents}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-500">
                    Error: {stats.security.errorEvents}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-500">
                    Warning: {stats.security.warningEvents}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Visitor Trust Distribution
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {stats.visitors.trustedVisitors}
                </div>
                <div className="mt-1 text-sm text-gray-500">Trusted</div>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {stats.visitors.totalVisitors -
                    stats.visitors.trustedVisitors -
                    stats.visitors.suspiciousVisitors -
                    stats.visitors.untrustedVisitors}
                </div>
                <div className="mt-1 text-sm text-gray-500">Neutral</div>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {stats.visitors.suspiciousVisitors}
                </div>
                <div className="mt-1 text-sm text-gray-500">Suspicious</div>
              </div>
              <div className="rounded-lg bg-red-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {stats.visitors.untrustedVisitors}
                </div>
                <div className="mt-1 text-sm text-gray-500">Untrusted</div>
              </div>
              <div className="rounded-lg bg-gray-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-gray-500">
                  {stats.visitors.blockedVisitors}
                </div>
                <div className="mt-1 text-sm text-gray-500">Blocked</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">
                Average Trust Score:{" "}
                <span className="font-semibold text-blue-500">
                  {stats.visitors.averageTrustScore.toFixed(1)}
                </span>
                /100
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
              <h3 className="text-sm font-medium text-gray-500">
                Visitors with Bot Activity
              </h3>
              <div className="mt-2 text-3xl font-bold">
                {stats.visitors.visitorsWithBotActivity}
              </div>
              <div className="mt-2 text-sm text-gray-400">
                {(
                  (stats.visitors.visitorsWithBotActivity /
                    Math.max(stats.visitors.totalVisitors, 1)) *
                  100
                ).toFixed(1)}
                % of all visitors
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#262626] dark:bg-[#111111]">
              <h3 className="text-sm font-medium text-gray-500">
                Visitors with Accounts
              </h3>
              <div className="mt-2 text-3xl font-bold text-emerald-500">
                {stats.visitors.visitorsWithAccounts}
              </div>
              <div className="mt-2 text-sm text-gray-400">
                {(
                  (stats.visitors.visitorsWithAccounts /
                    Math.max(stats.visitors.totalVisitors, 1)) *
                  100
                ).toFixed(1)}
                % linked to user accounts
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
