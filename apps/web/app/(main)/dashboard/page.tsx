"use client";

/**
 * Dashboard Overview Page
 *
 * Main dashboard page showing key statistics and quick actions.
 * Powered by TanStack Query for automatic caching and revalidation.
 */

import { type JSX } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { StatsCards } from "./components/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  LazyAreaChartCard,
  LazyDonutChartCard,
  LazyBarChartCard,
  CHART_COLORS,
} from "@/components/dashboard/charts";
import { QueryErrorBoundary } from "@/components/dashboard/query-error-boundary";
import {
  useDashboardOverviewStats,
  useDashboardChartStats,
  useRecentBetaApplications,
  useRecentFeedback,
  useRecentNotifications,
  useDonationOverview,
  type DonationOverviewStats,
} from "@/lib/query/hooks";
import type { AdminBetaApplication, AdminFeedback } from "@/types/admin";
import type { AdminNotification } from "@/app/actions/admin-notifications";

export default function DashboardPage() {
  // All data fetching via TanStack Query
  const { data: stats, isLoading: statsLoading } = useDashboardOverviewStats();
  const { data: chartStats, isLoading: chartsLoading } = useDashboardChartStats();
  const { data: recentBeta = [], isLoading: betaLoading } = useRecentBetaApplications();
  const { data: recentFeedback = [], isLoading: feedbackLoading } = useRecentFeedback();
  const { data: recentNotifications = [], isLoading: notificationsLoading } = useRecentNotifications();

  // Combined loading state for initial skeleton
  const isLoading = statsLoading || chartsLoading;

  return (
    <QueryErrorBoundary>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold ui-text-heading">Dashboard Overview</h2>
          <p className="mt-1 text-sm ui-text-secondary">
            Monitor activity and manage Claude Insider
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats ?? null} isLoading={statsLoading} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          {chartsLoading ? (
            <div className="rounded-xl border ui-border ui-bg-card p-5 h-[280px] animate-pulse" />
          ) : chartStats?.userGrowth && chartStats.userGrowth.length > 0 ? (
            <LazyAreaChartCard
              title="User Growth (Last 30 Days)"
              data={chartStats.userGrowth}
              trend={chartStats.trends?.userGrowth}
              height={200}
              gradientColors={{ start: CHART_COLORS.primary, end: CHART_COLORS.secondary }}
              className="ui-border ui-bg-card"
            />
          ) : null}

          {/* Content Distribution */}
          {chartsLoading ? (
            <div className="rounded-xl border ui-border ui-bg-card p-5 h-[280px] animate-pulse" />
          ) : chartStats?.contentDistribution && chartStats.contentDistribution.length > 0 ? (
            <LazyDonutChartCard
              title="Content Distribution"
              data={chartStats.contentDistribution}
              centerLabel={{
                value: chartStats.contentDistribution.reduce((sum, d) => sum + d.value, 0),
                label: "Total",
              }}
              height={200}
              className="ui-border ui-bg-card"
              colors={[
                CHART_COLORS.primary,
                CHART_COLORS.secondary,
                CHART_COLORS.tertiary,
                CHART_COLORS.success,
              ]}
            />
          ) : null}

          {/* Activity by Type */}
          {chartsLoading ? (
            <div className="rounded-xl border ui-border ui-bg-card p-5 h-[280px] animate-pulse" />
          ) : chartStats?.activityByType && chartStats.activityByType.length > 0 ? (
            <LazyBarChartCard
              title="Activity by Type (Last 7 Days)"
              data={chartStats.activityByType}
              height={200}
              className="ui-border ui-bg-card"
              horizontal
            />
          ) : null}

          {/* Role Distribution */}
          {chartsLoading ? (
            <div className="rounded-xl border ui-border ui-bg-card p-5 h-[280px] animate-pulse" />
          ) : chartStats?.roleDistribution && chartStats.roleDistribution.length > 0 ? (
            <LazyDonutChartCard
              title="User Roles"
              data={chartStats.roleDistribution}
              centerLabel={{
                value: chartStats.roleDistribution.reduce((sum, d) => sum + d.value, 0),
                label: "Users",
              }}
              height={200}
              className="ui-border ui-bg-card"
              colors={[
                CHART_COLORS.success,
                CHART_COLORS.secondary,
                CHART_COLORS.warning,
                CHART_COLORS.primary,
                CHART_COLORS.error,
                CHART_COLORS.tertiary,
              ]}
            />
          ) : null}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications Overview */}
          <NotificationsCard
            notifications={recentNotifications}
            isLoading={notificationsLoading}
          />

          {/* Pending Beta Applications */}
          <BetaApplicationsCard
            applications={recentBeta}
            isLoading={betaLoading}
          />

          {/* Recent Feedback */}
          <FeedbackCard
            feedback={recentFeedback}
            isLoading={feedbackLoading}
          />
        </div>

        {/* Donations Overview */}
        <DonationsOverview />

        {/* Live Activity Feed */}
        <div className="rounded-xl border ui-border ui-bg-card p-6">
          <ActivityFeed
            maxItems={30}
            showFilters={true}
            showSearch={true}
            autoRefresh={true}
            refreshInterval={30000}
            enableRealtime={true}
          />
        </div>
      </div>
    </QueryErrorBoundary>
  );
}

/**
 * Notifications Card Component
 */
function NotificationsCard({
  notifications,
  isLoading,
}: {
  notifications: AdminNotification[];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border ui-border ui-bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold ui-text-heading">Recent Notifications</h3>
        <Link
          href="/dashboard/notifications"
          className="text-sm ui-text-link transition-colors"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 ui-bg-skeleton rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm ui-text-muted mb-3">No notifications created yet</p>
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
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={`/dashboard/notifications`}
              className="flex items-center gap-3 p-3 rounded-lg border ui-border hover:ui-border-hover ui-hover-row transition-all"
            >
              <NotificationStatusIcon status={notif.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium ui-text-heading truncate">{notif.title}</p>
                <p className="text-xs ui-text-muted truncate">
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
  );
}

/**
 * Beta Applications Card Component
 */
function BetaApplicationsCard({
  applications,
  isLoading,
}: {
  applications: AdminBetaApplication[];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border ui-border ui-bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold ui-text-heading">Pending Beta Applications</h3>
        <Link
          href="/dashboard/beta"
          className="text-sm ui-text-link transition-colors"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 ui-bg-skeleton rounded-lg animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <p className="text-sm ui-text-muted py-8 text-center">
          No pending applications
        </p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={`/dashboard/beta?highlight=${app.id}`}
              className="flex items-center gap-4 p-3 rounded-lg border ui-border hover:ui-border-hover ui-hover-row transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                {app.userName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium ui-text-heading truncate">
                  {app.userName || app.userEmail}
                </p>
                <p className="text-xs ui-text-muted truncate">{app.motivation}</p>
              </div>
              <span className="text-xs ui-text-muted">
                {new Date(app.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Feedback Card Component
 */
function FeedbackCard({
  feedback,
  isLoading,
}: {
  feedback: AdminFeedback[];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border ui-border ui-bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold ui-text-heading">Recent Feedback</h3>
        <Link
          href="/dashboard/feedback"
          className="text-sm ui-text-link transition-colors"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 ui-bg-skeleton rounded-lg animate-pulse" />
          ))}
        </div>
      ) : feedback.length === 0 ? (
        <p className="text-sm ui-text-muted py-8 text-center">No open feedback</p>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/feedback?highlight=${item.id}`}
              className="flex items-center gap-4 p-3 rounded-lg border ui-border hover:ui-border-hover ui-hover-row transition-all"
            >
              <FeedbackTypeIcon type={item.feedbackType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium ui-text-heading truncate">{item.title}</p>
                <p className="text-xs ui-text-muted truncate">
                  by {item.userName || item.userEmail}
                </p>
              </div>
              {item.severity && <SeverityBadge severity={item.severity} />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Donations Overview Component - Uses TanStack Query
 */
function DonationsOverview() {
  const { data: stats, isLoading } = useDonationOverview();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-xl border border-pink-200 dark:border-pink-900/30 bg-gradient-to-br from-pink-50 dark:from-pink-900/10 to-rose-50 dark:to-rose-900/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💜</span>
          <h3 className="text-lg font-semibold ui-text-heading">Donations Overview</h3>
        </div>
        <Link
          href="/dashboard/donations"
          className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors"
        >
          View details →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 ui-bg-skeleton rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg ui-bg-card p-4 border ui-border">
              <p className="text-sm ui-text-secondary">Total Raised</p>
              <p className="text-2xl font-bold ui-text-heading">
                {formatAmount(stats?.total_raised || 0)}
              </p>
            </div>
            <div className="rounded-lg ui-bg-card p-4 border ui-border">
              <p className="text-sm ui-text-secondary">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.completed_donations || 0}
              </p>
            </div>
            <div className="rounded-lg ui-bg-card p-4 border ui-border">
              <p className="text-sm ui-text-secondary">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats?.pending_donations || 0}
              </p>
            </div>
            <div className="rounded-lg ui-bg-card p-4 border ui-border">
              <p className="text-sm ui-text-secondary">Unique Donors</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.unique_donors || 0}
              </p>
            </div>
          </div>

          {/* Recent Donations */}
          {stats?.recent_donations && stats.recent_donations.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm ui-text-secondary">Recent Donations</p>
              {stats.recent_donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 rounded-lg ui-bg-card border ui-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <span className="text-sm">💝</span>
                    </div>
                    <span className={cn(
                      "text-sm ui-text-heading",
                      donation.is_anonymous && "italic ui-text-secondary"
                    )}>
                      {donation.donor_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold ui-text-heading">
                      {formatAmount(donation.amount)}
                    </p>
                    <p className="text-xs ui-text-muted">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm ui-text-muted text-center py-4">
              No donations yet. Be the first to support!
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function FeedbackTypeIcon({ type }: { type: "bug" | "feature" | "general" }) {
  const icons = {
    bug: (
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <span className="text-lg">🐛</span>
      </div>
    ),
    feature: (
      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <span className="text-lg">💡</span>
      </div>
    ),
    general: (
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <span className="text-lg">💬</span>
      </div>
    ),
  };
  return icons[type] || icons.general;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    high: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
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
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    ),
    scheduled: (
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    sending: (
      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    ),
    sent: (
      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    failed: (
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    cancelled: (
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
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
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    scheduled: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    sending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    sent: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[status] || styles.draft)}>
      {status}
    </span>
  );
}
