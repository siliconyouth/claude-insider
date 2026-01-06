"use client";

/**
 * Sentry Error Monitoring Dashboard
 *
 * Admin-only dashboard for monitoring and managing Sentry errors.
 * Features:
 * - Real-time issue statistics
 * - Filterable issues list (status, level, timeframe)
 * - Issue detail modal with stack traces
 * - Bulk actions (resolve, ignore)
 * - View in Sentry links
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { PageHeader, EmptyState } from "@/components/dashboard/shared";
import {
  useSentryIssues,
  useSentryIssueDetail,
  useUpdateSentryIssue,
  useBulkUpdateSentryIssues,
  type SentryIssuesFilters,
  type SentryIssue,
  type SentryIssueStatus,
} from "@/lib/query/hooks/use-sentry-query";
import { formatIssueLevel, formatIssueStatus } from "@/lib/sentry-api";

// Level badge colors
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  fatal: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  error: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  warning: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  info: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  debug: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
};

export default function SentryDashboardPage() {
  // Filter state
  const [filters, setFilters] = useState<SentryIssuesFilters>({
    status: "unresolved",
    statsPeriod: "24h",
    sort: "date",
    limit: 25,
  });

  // Selection state for bulk actions
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());

  // Modal state
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Query hooks
  const issuesQuery = useSentryIssues(filters);
  const issueDetailQuery = useSentryIssueDetail(selectedIssueId);
  const updateMutation = useUpdateSentryIssue();
  const bulkUpdateMutation = useBulkUpdateSentryIssues();

  // Derived data
  const issues = issuesQuery.data?.issues || [];
  const stats = issuesQuery.data?.stats;
  const nextCursor = issuesQuery.data?.nextCursor;
  const prevCursor = issuesQuery.data?.prevCursor;

  // Handle filter changes
  const updateFilter = <K extends keyof SentryIssuesFilters>(
    key: K,
    value: SentryIssuesFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, cursor: undefined }));
    setSelectedIssues(new Set());
  };

  // Toggle issue selection
  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  // Select all visible issues
  const toggleSelectAll = () => {
    if (selectedIssues.size === issues.length) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(issues.map((i) => i.id)));
    }
  };

  // Handle bulk action
  const handleBulkAction = (status: SentryIssueStatus) => {
    if (selectedIssues.size === 0) return;
    bulkUpdateMutation.mutate(
      { issueIds: Array.from(selectedIssues), status },
      { onSuccess: () => setSelectedIssues(new Set()) }
    );
  };

  // Handle pagination
  const goToPage = (cursor: string | null | undefined, direction: "next" | "prev") => {
    if (!cursor) return;
    setFilters((prev) => ({ ...prev, cursor }));
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Sentry Errors"
        description="Monitor and manage application errors from Sentry"
        badge={
          stats && stats.unresolvedCount > 0 ? (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              {stats.unresolvedCount} unresolved
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {selectedIssues.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction("resolved")}
                  disabled={bulkUpdateMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-green-600 text-white hover:bg-green-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Resolve ({selectedIssues.size})
                </button>
                <button
                  onClick={() => handleBulkAction("ignored")}
                  disabled={bulkUpdateMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-gray-600 text-white hover:bg-gray-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Ignore ({selectedIssues.size})
                </button>
              </>
            )}
            <button
              onClick={() => issuesQuery.refetch()}
              disabled={issuesQuery.isRefetching}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "ui-bg-card border ui-border ui-text-secondary",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {issuesQuery.isRefetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Issues" value={stats.totalIssues} />
          <StatCard
            label="Fatal"
            value={stats.fatalCount}
            color="text-red-700 dark:text-red-400"
            icon="💀"
          />
          <StatCard
            label="Errors"
            value={stats.errorCount}
            color="text-red-600 dark:text-red-400"
            icon="🔴"
          />
          <StatCard
            label="Warnings"
            value={stats.warningCount}
            color="text-yellow-600 dark:text-yellow-400"
            icon="🟡"
          />
          <StatCard
            label="Affected Users"
            value={stats.affectedUsers}
            color="text-blue-600 dark:text-cyan-400"
            icon="👥"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm ui-text-secondary">Status:</span>
          <div className="flex gap-1">
            {(["unresolved", "resolved", "ignored"] as const).map((status) => (
              <button
                key={status}
                onClick={() => updateFilter("status", status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  filters.status === status
                    ? "bg-blue-600 text-white"
                    : "ui-bg-card ui-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm ui-text-secondary">Level:</span>
          <select
            value={filters.level || ""}
            onChange={(e) =>
              updateFilter("level", e.target.value as SentryIssuesFilters["level"] || undefined)
            }
            className="px-3 py-1.5 rounded-lg text-sm ui-input"
          >
            <option value="">All Levels</option>
            <option value="fatal">Fatal</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm ui-text-secondary">Period:</span>
          <select
            value={filters.statsPeriod || "24h"}
            onChange={(e) =>
              updateFilter("statsPeriod", e.target.value as SentryIssuesFilters["statsPeriod"])
            }
            className="px-3 py-1.5 rounded-lg text-sm ui-input"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm ui-text-secondary">Sort:</span>
          <select
            value={filters.sort || "date"}
            onChange={(e) =>
              updateFilter("sort", e.target.value as SentryIssuesFilters["sort"])
            }
            className="px-3 py-1.5 rounded-lg text-sm ui-input"
          >
            <option value="date">Last Seen</option>
            <option value="new">First Seen</option>
            <option value="freq">Frequency</option>
            <option value="user">Users Affected</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      {issuesQuery.isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 ui-bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      ) : issuesQuery.isError ? (
        <EmptyState
          message="Error loading Sentry issues"
          description={
            issuesQuery.error instanceof Error
              ? issuesQuery.error.message
              : "Failed to connect to Sentry API"
          }
          icon={
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      ) : issues.length === 0 ? (
        <EmptyState
          message="No issues found"
          description={
            filters.status === "unresolved"
              ? "All caught up! No unresolved errors."
              : `No ${filters.status} issues in the selected time period.`
          }
          icon={
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-3 px-4">
            <input
              type="checkbox"
              checked={selectedIssues.size === issues.length && issues.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm ui-text-secondary">
              {selectedIssues.size > 0
                ? `${selectedIssues.size} selected`
                : "Select all"}
            </span>
          </div>

          {/* Issues */}
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              isSelected={selectedIssues.has(issue.id)}
              onToggleSelect={() => toggleIssueSelection(issue.id)}
              onViewDetail={() => setSelectedIssueId(issue.id)}
              onUpdateStatus={(status) =>
                updateMutation.mutate({ issueId: issue.id, status })
              }
              formatRelativeTime={formatRelativeTime}
            />
          ))}

          {/* Pagination */}
          {(nextCursor || prevCursor) && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => goToPage(prevCursor, "prev")}
                disabled={!prevCursor}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "ui-bg-card border ui-border",
                  !prevCursor
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                ← Previous
              </button>
              <button
                onClick={() => goToPage(nextCursor, "next")}
                disabled={!nextCursor}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "ui-bg-card border ui-border",
                  !nextCursor
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssueId && (
        <IssueDetailModal
          issueId={selectedIssueId}
          onClose={() => setSelectedIssueId(null)}
          issueDetailQuery={issueDetailQuery}
          onUpdateStatus={(status) =>
            updateMutation.mutate({ issueId: selectedIssueId, status })
          }
        />
      )}
    </div>
  );
}

// ============================================
// Components
// ============================================

function StatCard({
  label,
  value,
  color = "ui-text-heading",
  icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="ui-bg-card border ui-border rounded-lg p-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm ui-text-secondary">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold mt-1", color)}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function IssueRow({
  issue,
  isSelected,
  onToggleSelect,
  onViewDetail,
  onUpdateStatus,
  formatRelativeTime,
}: {
  issue: SentryIssue;
  isSelected: boolean;
  onToggleSelect: () => void;
  onViewDetail: () => void;
  onUpdateStatus: (status: SentryIssueStatus) => void;
  formatRelativeTime: (date: string) => string;
}) {
  const levelInfo = formatIssueLevel(issue.level);
  const statusInfo = formatIssueStatus(issue.status);
  const levelStyle = LEVEL_COLORS[issue.level] ?? LEVEL_COLORS.error;

  return (
    <div className={cn(
      "ui-bg-card border ui-border rounded-lg p-4",
      "hover:border-blue-500/30 transition-colors"
    )}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Level Badge */}
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              levelStyle?.bg ?? "bg-red-100 dark:bg-red-900/30",
              levelStyle?.text ?? "text-red-600 dark:text-red-400"
            )}>
              {levelInfo.emoji} {levelInfo.label}
            </span>

            {/* Status Badge */}
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              statusInfo.bgClass,
              statusInfo.textClass
            )}>
              {statusInfo.label}
            </span>

            {/* Short ID */}
            <span className="text-xs ui-text-secondary font-mono">
              {issue.shortId}
            </span>
          </div>

          {/* Title */}
          <button
            onClick={onViewDetail}
            className="text-left font-medium ui-text-heading hover:text-blue-600 dark:hover:text-cyan-400 line-clamp-2"
          >
            {issue.title}
          </button>

          {/* Culprit */}
          {issue.culprit && (
            <p className="text-sm ui-text-secondary mt-1 truncate">
              {issue.culprit}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-2 text-xs ui-text-secondary">
            <span title={`${issue.count} events`}>
              📊 {parseInt(issue.count).toLocaleString()} events
            </span>
            <span title={`${issue.userCount} users affected`}>
              👥 {issue.userCount.toLocaleString()} users
            </span>
            <span title={`First seen: ${new Date(issue.firstSeen).toLocaleString()}`}>
              First: {formatRelativeTime(issue.firstSeen)}
            </span>
            <span title={`Last seen: ${new Date(issue.lastSeen).toLocaleString()}`}>
              Last: {formatRelativeTime(issue.lastSeen)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {issue.status === "unresolved" && (
            <>
              <button
                onClick={() => onUpdateStatus("resolved")}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                title="Mark as resolved"
              >
                Resolve
              </button>
              <button
                onClick={() => onUpdateStatus("ignored")}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700"
                title="Ignore this issue"
              >
                Ignore
              </button>
            </>
          )}
          {issue.status === "resolved" && (
            <button
              onClick={() => onUpdateStatus("unresolved")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium ui-bg-card border ui-border hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Reopen issue"
            >
              Unresolve
            </button>
          )}
          {issue.status === "ignored" && (
            <button
              onClick={() => onUpdateStatus("unresolved")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium ui-bg-card border ui-border hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Reopen issue"
            >
              Unignore
            </button>
          )}
          <a
            href={issue.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm font-medium ui-bg-card border ui-border ui-text-link hover:bg-gray-100 dark:hover:bg-gray-800"
            title="View in Sentry"
          >
            View ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function IssueDetailModal({
  issueId,
  onClose,
  issueDetailQuery,
  onUpdateStatus,
}: {
  issueId: string;
  onClose: () => void;
  issueDetailQuery: ReturnType<typeof useSentryIssueDetail>;
  onUpdateStatus: (status: SentryIssueStatus) => void;
}) {
  const { data, isLoading, isError, error } = issueDetailQuery;
  const issue = data?.issue;
  const latestEvent = data?.latestEvent;

  // Extract stack trace from event
  const stackTrace = latestEvent?.entries?.find(
    (e) => e.type === "exception" || e.type === "stacktrace"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="ui-bg-modal rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b ui-border">
          <h3 className="text-lg font-semibold ui-text-heading truncate flex-1 mr-4">
            {isLoading ? "Loading..." : issue?.title || "Issue Details"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg ui-bg-card hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 ui-bg-card rounded-lg animate-pulse" />
              <div className="h-60 ui-bg-card rounded-lg animate-pulse" />
            </div>
          ) : isError ? (
            <EmptyState
              message="Error loading issue"
              description={error instanceof Error ? error.message : "Failed to fetch"}
              icon={
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          ) : issue ? (
            <div className="space-y-6">
              {/* Issue Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="ui-bg-card border ui-border rounded-lg p-3">
                  <div className="text-xs ui-text-secondary">Level</div>
                  <div className="font-medium">
                    {formatIssueLevel(issue.level).emoji} {formatIssueLevel(issue.level).label}
                  </div>
                </div>
                <div className="ui-bg-card border ui-border rounded-lg p-3">
                  <div className="text-xs ui-text-secondary">Events</div>
                  <div className="font-medium">{parseInt(issue.count).toLocaleString()}</div>
                </div>
                <div className="ui-bg-card border ui-border rounded-lg p-3">
                  <div className="text-xs ui-text-secondary">Users</div>
                  <div className="font-medium">{issue.userCount.toLocaleString()}</div>
                </div>
                <div className="ui-bg-card border ui-border rounded-lg p-3">
                  <div className="text-xs ui-text-secondary">Platform</div>
                  <div className="font-medium">{issue.platform}</div>
                </div>
              </div>

              {/* Culprit */}
              {issue.culprit && (
                <div>
                  <h4 className="text-sm font-medium ui-text-heading mb-2">Location</h4>
                  <p className="text-sm ui-text-secondary font-mono bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    {issue.culprit}
                  </p>
                </div>
              )}

              {/* Stack Trace */}
              {stackTrace && (
                <div>
                  <h4 className="text-sm font-medium ui-text-heading mb-2">Stack Trace</h4>
                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto max-h-80">
                    {JSON.stringify(stackTrace.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Tags */}
              {latestEvent?.tags && latestEvent.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium ui-text-heading mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {latestEvent.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded ui-bg-card border ui-border font-mono"
                      >
                        {tag.key}: {tag.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity */}
              {issue.activity && issue.activity.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium ui-text-heading mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {issue.activity.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="text-sm ui-text-secondary flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{activity.type}</span>
                        <span className="text-xs">
                          {new Date(activity.dateCreated).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {issue && (
          <div className="flex items-center justify-between p-4 border-t ui-border">
            <div className="flex gap-2">
              {issue.status === "unresolved" && (
                <>
                  <button
                    onClick={() => onUpdateStatus("resolved")}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => onUpdateStatus("ignored")}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Ignore
                  </button>
                </>
              )}
              {issue.status !== "unresolved" && (
                <button
                  onClick={() => onUpdateStatus("unresolved")}
                  className="px-4 py-2 rounded-lg text-sm font-medium ui-bg-card border ui-border hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Unresolve
                </button>
              )}
            </div>
            <a
              href={issue.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:from-violet-700 hover:via-blue-700 hover:to-cyan-700"
            >
              View in Sentry ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
