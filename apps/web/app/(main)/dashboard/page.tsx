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
import { getAdminNotifications, type AdminNotification } from "@/app/actions/admin-notifications";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBeta, setRecentBeta] = useState<AdminBetaApplication[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<AdminFeedback[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, betaRes, feedbackRes, notificationsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/beta?limit=5&status=pending"),
          fetch("/api/dashboard/feedback?limit=5&status=open"),
          getAdminNotifications({ limit: 5 }),
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

        if (notificationsRes.data) {
          setRecentNotifications(notificationsRes.data);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Overview */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
            <Link
              href="/dashboard/notifications"
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
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-3">No notifications created yet</p>
              <Link
                href="/dashboard/notifications"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-lg shadow-blue-500/25",
                  "hover:-translate-y-0.5 transition-all"
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Notification
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={`/dashboard/notifications`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all"
                >
                  <NotificationStatusIcon status={notif.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {notif.target_type === "all"
                        ? "All users"
                        : notif.target_type === "role"
                        ? notif.target_roles.join(", ")
                        : `${notif.target_user_ids.length} users`}
                    </p>
                  </div>
                  <NotificationStatusBadge status={notif.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

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

function NotificationStatusIcon({ status }: { status: string }) {
  const icons: Record<string, JSX.Element> = {
    draft: (
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    ),
    scheduled: (
      <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    sending: (
      <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    ),
    sent: (
      <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    failed: (
      <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    cancelled: (
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
    ),
  };
  return icons[status] || icons.draft;
}

function NotificationStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-800 text-gray-400",
    scheduled: "bg-blue-900/30 text-blue-400",
    sending: "bg-yellow-900/30 text-yellow-400",
    sent: "bg-emerald-900/30 text-emerald-400",
    failed: "bg-red-900/30 text-red-400",
    cancelled: "bg-gray-800 text-gray-500",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[status] || styles.draft)}>
      {status}
    </span>
  );
}
