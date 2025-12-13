"use client";

/**
 * Dashboard Overview Page
 *
 * Main dashboard page showing key statistics and quick actions.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { StatsCards } from "./components/stats-cards";
import type { AdminStats, AdminBetaApplication, AdminFeedback } from "@/types/admin";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBeta, setRecentBeta] = useState<AdminBetaApplication[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<AdminFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, betaRes, feedbackRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/beta?limit=5&status=pending"),
          fetch("/api/dashboard/feedback?limit=5&status=open"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (betaRes.ok) {
          const betaData = await betaRes.json();
          setRecentBeta(betaData.items || []);
        }

        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setRecentFeedback(feedbackData.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-400">
          Monitor activity and manage Claude Insider
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Beta Applications */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pending Beta Applications</h3>
            <Link
              href="/dashboard/beta"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentBeta.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No pending applications
            </p>
          ) : (
            <div className="space-y-3">
              {recentBeta.map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/beta?highlight=${app.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                    {app.userName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {app.userName || app.userEmail}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{app.motivation}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Feedback */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Feedback</h3>
            <Link
              href="/dashboard/feedback"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentFeedback.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No open feedback</p>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map((feedback) => (
                <Link
                  key={feedback.id}
                  href={`/dashboard/feedback?highlight=${feedback.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all"
                >
                  <FeedbackTypeIcon type={feedback.feedbackType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{feedback.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      by {feedback.userName || feedback.userEmail}
                    </p>
                  </div>
                  {feedback.severity && <SeverityBadge severity={feedback.severity} />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role Distribution (if stats available) */}
      {stats && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Roles Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.users.byRole || {}).map(([role, count]) => (
              <div key={role} className="text-center">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-sm text-gray-400 capitalize">{role}s</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackTypeIcon({ type }: { type: "bug" | "feature" | "general" }) {
  const icons = {
    bug: (
      <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
        <span className="text-lg">🐛</span>
      </div>
    ),
    feature: (
      <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
        <span className="text-lg">💡</span>
      </div>
    ),
    general: (
      <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
        <span className="text-lg">💬</span>
      </div>
    ),
  };
  return icons[type] || icons.general;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-gray-800 text-gray-400",
    medium: "bg-yellow-900/30 text-yellow-400",
    high: "bg-orange-900/30 text-orange-400",
    critical: "bg-red-900/30 text-red-400",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[severity] || styles.low)}>
      {severity}
    </span>
  );
}
