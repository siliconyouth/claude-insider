"use client";

/**
 * Resource Discovery Dashboard
 *
 * Admin page for managing resource discovery sources and reviewing
 * discovered resources. Now powered by TanStack Query for caching
 * and automatic revalidation.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { PageHeader, StatusBadge, EmptyState, StatCard, StatGrid } from "@/components/dashboard/shared";
import {
  useDiscoveryStats,
  useDiscoveryQueue,
  useDiscoverySources,
  useQueueAction,
  useSourceToggle,
  useTriggerScan,
  useTriggerAllScans,
  useBulkQueueAction,
  type QueueStatus,
  type QueueItem,
  type Source,
  type DiscoveryStats,
  type DiscoveryScanResponse,
} from "@/lib/query/hooks";
import { QueryErrorBoundary } from "@/components/dashboard/query-error-boundary";

// Queue status configuration
const QUEUE_STATUS = {
  pending: { label: "Pending", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  reviewing: { label: "Reviewing", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  approved: { label: "Approved", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  rejected: { label: "Rejected", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
} as const;

// Source type icons
const SOURCE_TYPE_ICONS: Record<string, string> = {
  awesome_list: "📋",
  github_repo: "🐙",
  github_search: "🔍",
  npm: "📦",
  pypi: "🐍",
  website: "🌐",
};

type Tab = "overview" | "queue" | "sources";

export default function DiscoveryDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [queueFilter, setQueueFilter] = useState<QueueStatus | "all">("pending");
  const [queuePage, setQueuePage] = useState(1);

  // Use TanStack Query for stats (auto-refreshes every 30s)
  const { data: stats, isLoading, isError, error, refetch } = useDiscoveryStats();

  // Handle error state
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Resource Discovery"
          description="Manage discovery sources and review discovered resources"
        />
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 p-3">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                Failed to load discovery stats
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error?.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Resource Discovery"
          description="Manage discovery sources and review discovered resources"
          badge={stats?.queue.pending || undefined}
        />

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#262626]">
          {(["overview", "queue", "sources"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-cyan-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "queue" && stats?.queue.pending ? (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  {stats.queue.pending}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab stats={stats} isLoading={isLoading} />}
        {activeTab === "queue" && (
          <QueueTab
            filter={queueFilter}
            onFilterChange={(f) => {
              setQueueFilter(f);
              setQueuePage(1);
            }}
            page={queuePage}
            onPageChange={setQueuePage}
          />
        )}
        {activeTab === "sources" && <SourcesTab />}
      </div>
    </QueryErrorBoundary>
  );
}

/**
 * Overview Tab - Stats and recent activity
 */
function OverviewTab({ stats, isLoading }: { stats: DiscoveryStats | undefined; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Discovery Queue</h3>
        <StatGrid>
          <StatCard
            label="Pending Review"
            value={stats.queue.pending}
            variant="warning"
            icon={<ClockIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Approved"
            value={stats.queue.approved}
            variant="success"
            icon={<CheckIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Rejected"
            value={stats.queue.rejected}
            variant="danger"
            icon={<XIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Total Discovered"
            value={stats.queue.total}
            variant="info"
            icon={<StackIcon className="w-5 h-5" />}
          />
        </StatGrid>
      </div>

      {/* Sources Stats */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Discovery Sources</h3>
        <StatGrid columns={3}>
          <StatCard
            label="Active Sources"
            value={stats.sources.active}
            variant="success"
            icon={<BoltIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Total Sources"
            value={stats.sources.total}
            variant="info"
            icon={<FolderIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Due for Scan"
            value={stats.sources.dueForScan}
            variant="warning"
            icon={<RefreshIcon className="w-5 h-5" />}
          />
        </StatGrid>
      </div>

      {/* Sources by Type */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Sources by Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats.sources.byType).map(([type, count]) => (
            <div
              key={type}
              className="p-3 rounded-lg bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{SOURCE_TYPE_ICONS[type] || "📄"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{type}</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Scans */}
      {stats.recentScans.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {stats.recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{scan.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {scan.last_scan_at
                      ? new Date(scan.last_scan_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      scan.last_scan_status === "success"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}
                  >
                    {scan.last_scan_status || "unknown"}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {scan.last_scan_count} found
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Queue Tab - List of discovered resources to review
 * Uses TanStack Query with placeholderData for smooth pagination
 * Supports batch selection and bulk approve/reject actions
 */
function QueueTab({
  filter,
  onFilterChange,
  page,
  onPageChange,
}: {
  filter: QueueStatus | "all";
  onFilterChange: (f: QueueStatus | "all") => void;
  page: number;
  onPageChange: (p: number) => void;
}) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // TanStack Query handles caching and loading states
  const { data, isLoading, isFetching } = useDiscoveryQueue({
    status: filter,
    page,
    limit: 20,
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  // Get only pending items (these are the ones that can be selected for bulk actions)
  const pendingItems = items.filter((item) => item.status === "pending");
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every((item) => selectedIds.has(item.id));
  const somePendingSelected = pendingItems.some((item) => selectedIds.has(item.id));

  // Mutation hooks
  const queueAction = useQueueAction();
  const bulkAction = useBulkQueueAction();

  const handleAction = (id: string, action: "approve" | "reject") => {
    queueAction.mutate({ id, action });
  };

  const handleSelectAll = () => {
    if (allPendingSelected) {
      // Deselect all pending items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingItems.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      // Select all pending items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleBulkAction = (action: "approve" | "reject") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    bulkAction.mutate(
      { ids, action },
      {
        onSuccess: () => {
          // Clear selection after successful bulk action
          setSelectedIds(new Set());
        },
      }
    );
  };

  // Clear selection when filter or page changes
  const handleFilterChange = (f: QueueStatus | "all") => {
    setSelectedIds(new Set());
    onFilterChange(f);
  };

  const handlePageChange = (p: number) => {
    setSelectedIds(new Set());
    onPageChange(p);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleFilterChange(status)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            {status === "all" ? "All" : QUEUE_STATUS[status]?.label || status}
          </button>
        ))}

        {/* Loading indicator for background refetch */}
        {isFetching && !isLoading && (
          <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
            Updating...
          </span>
        )}
      </div>

      {/* Batch Actions Bar - Shows when items are selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction("reject")}
              disabled={bulkAction.isPending}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            >
              {bulkAction.isPending && bulkAction.variables?.action === "reject" ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Rejecting...
                </span>
              ) : (
                `Reject ${selectedIds.size}`
              )}
            </button>
            <button
              onClick={() => handleBulkAction("approve")}
              disabled={bulkAction.isPending}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
            >
              {bulkAction.isPending && bulkAction.variables?.action === "approve" ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Approving...
                </span>
              ) : (
                `Approve ${selectedIds.size}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Select All Header - Shows when there are pending items */}
      {!isLoading && pendingItems.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allPendingSelected}
              ref={(el) => {
                if (el) el.indeterminate = somePendingSelected && !allPendingSelected;
              }}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#1a1a1a]"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Select all pending ({pendingItems.length})
            </span>
          </label>
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          message="No resources in queue"
          description={
            filter === "pending"
              ? "No resources are pending review"
              : "No resources match the selected filter"
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onAction={handleAction}
              isPending={queueAction.isPending && queueAction.variables?.id === item.id}
              isSelected={selectedIds.has(item.id)}
              onSelect={handleSelect}
              isBulkPending={bulkAction.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-[#1a1a1a] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-[#1a1a1a] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Queue Item Card
 * Now includes checkbox for batch selection
 */
function QueueItemCard({
  item,
  onAction,
  isPending,
  isSelected,
  onSelect,
  isBulkPending,
}: {
  item: QueueItem;
  onAction: (id: string, action: "approve" | "reject") => void;
  isPending?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  isBulkPending?: boolean;
}) {
  const statusConfig = QUEUE_STATUS[item.status];
  const githubData = item.discovered_data?.github as { stars?: number; forks?: number } | undefined;
  const canSelect = item.status === "pending";
  const isDisabled = isPending || (isBulkPending && isSelected);

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        "bg-white dark:bg-[#111111]",
        "border-gray-200 dark:border-[#262626]",
        "hover:border-blue-500/30 transition-colors",
        isSelected && "ring-2 ring-blue-500 border-blue-500 dark:border-blue-500",
        isDisabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox - Only show for pending items */}
        {canSelect && onSelect && (
          <div className="flex items-center pt-0.5">
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => onSelect(item.id, e.target.checked)}
              disabled={isDisabled}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#1a1a1a]"
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
          {/* Left: Resource info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span>{SOURCE_TYPE_ICONS[item.source_type || ""] || "📄"}</span>
              <a
                href={item.discovered_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors truncate"
              >
                {item.discovered_title || item.discovered_url}
              </a>
              <StatusBadge style={statusConfig} />
            </div>

            {item.discovered_description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {item.discovered_description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>from {item.source_name || "Unknown source"}</span>
              {githubData?.stars !== undefined && (
                <span className="flex items-center gap-1">
                  ⭐ {githubData.stars.toLocaleString()}
                </span>
              )}
              <span>
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          {item.status === "pending" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAction(item.id, "reject")}
                disabled={isDisabled}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => onAction(item.id, "approve")}
                disabled={isDisabled}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Sources Tab - List of configured discovery sources
 * Uses TanStack Query for automatic caching
 * Includes manual scan triggers for individual sources and bulk scanning
 * Shows live scan results after triggering
 */
function SourcesTab() {
  const [scanResults, setScanResults] = useState<DiscoveryScanResponse | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { data, isLoading } = useDiscoverySources();
  const { data: stats } = useDiscoveryStats();
  const sourceToggle = useSourceToggle();
  const triggerScan = useTriggerScan();
  const triggerAllScans = useTriggerAllScans();

  const sources = data?.sources || [];
  const dueForScan = stats?.sources.dueForScan || 0;

  // Group by type
  const groupedSources = sources.reduce<Record<string, Source[]>>(
    (acc, source) => {
      const existing = acc[source.type] ?? [];
      acc[source.type] = [...existing, source];
      return acc;
    },
    {}
  );

  const handleToggle = (id: string, isActive: boolean) => {
    sourceToggle.mutate({ id, isActive });
  };

  const handleTriggerScan = (id: string) => {
    triggerScan.mutate(id);
  };

  const handleTriggerAllScans = () => {
    setScanResults(null);
    setShowResults(true);
    triggerAllScans.mutate(undefined, {
      onSuccess: (data) => {
        setScanResults(data);
      },
      onError: (error) => {
        setScanResults({ success: false, error: error.message });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return <EmptyState message="No sources configured" description="Add sources in the CMS or run seed script" />;
  }

  return (
    <div className="space-y-6">
      {/* Scan All Button */}
      {(dueForScan > 0 || showResults) && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                {triggerAllScans.isPending
                  ? "Scanning sources..."
                  : dueForScan > 0
                    ? `${dueForScan} source${dueForScan !== 1 ? "s" : ""} due for scan`
                    : "All sources up to date"}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                {triggerAllScans.isPending
                  ? "This may take a few minutes. Results will appear below."
                  : "Cron runs every 6 hours. Trigger manually to scan now."}
              </p>
            </div>
            <button
              onClick={handleTriggerAllScans}
              disabled={triggerAllScans.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {triggerAllScans.isPending ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshIcon className="w-4 h-4" />
                  Scan All Due
                </>
              )}
            </button>
          </div>

          {/* Scan Results */}
          {showResults && (
            <div className="border-t border-yellow-200 dark:border-yellow-800">
              {triggerAllScans.isPending ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <SpinnerIcon className="w-5 h-5 animate-spin text-yellow-600" />
                    <span>Processing sources... This can take up to 5 minutes.</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full animate-pulse" style={{ width: "30%" }} />
                  </div>
                </div>
              ) : scanResults?.success ? (
                <div className="p-4 space-y-4">
                  {/* Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="font-medium">{scanResults.summary?.sourcesProcessed || 0} sources processed</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {scanResults.summary?.totalDiscovered || 0} discovered · {scanResults.summary?.totalQueued || 0} queued
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Completed in {scanResults.totalDuration}
                    </div>
                  </div>

                  {/* Results Table */}
                  {scanResults.results && scanResults.results.length > 0 && (
                    <div className="border border-gray-200 dark:border-[#262626] rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Source</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Found</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Queued</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Dupes</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
                          {scanResults.results.map((result, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span>{SOURCE_TYPE_ICONS[result.type] || "📄"}</span>
                                  <span className="truncate max-w-[200px]" title={result.source}>{result.source}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 text-xs rounded-full",
                                    result.status === "success"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      : result.status === "failed"
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  {result.status}
                                </span>
                                {result.error && (
                                  <span className="ml-2 text-xs text-red-500" title={result.error}>⚠</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{result.discovered}</td>
                              <td className="px-3 py-2 text-right">
                                <span className={result.queued > 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400"}>
                                  {result.queued}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-400">{result.duplicates}</td>
                              <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{result.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Hide results
                  </button>
                </div>
              ) : scanResults?.error ? (
                <div className="p-4">
                  <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <XIcon className="w-5 h-5" />
                    <span>Scan failed: {scanResults.error}</span>
                  </div>
                  <button
                    onClick={() => setShowResults(false)}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {Object.entries(groupedSources).map(([type, typeSources]) => (
        <div key={type}>
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            <span>{SOURCE_TYPE_ICONS[type] || "📄"}</span>
            <span className="uppercase">{type.replace(/_/g, " ")}</span>
            <span className="text-xs">({typeSources.length})</span>
          </h3>
          <div className="space-y-2">
            {typeSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onToggle={handleToggle}
                onTriggerScan={handleTriggerScan}
                isTogglePending={sourceToggle.isPending && sourceToggle.variables?.id === source.id}
                isScanPending={triggerScan.isPending && triggerScan.variables === source.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Source Card
 * Includes toggle for active status and manual scan trigger
 */
function SourceCard({
  source,
  onToggle,
  onTriggerScan,
  isTogglePending,
  isScanPending,
}: {
  source: Source;
  onToggle: (id: string, isActive: boolean) => void;
  onTriggerScan: (id: string) => void;
  isTogglePending?: boolean;
  isScanPending?: boolean;
}) {
  const isPending = isTogglePending || isScanPending;

  // Check if source is due for scan
  const isDue = source.is_active && source.next_scan_at && new Date(source.next_scan_at) <= new Date();

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        "bg-white dark:bg-[#111111]",
        "border-gray-200 dark:border-[#262626]",
        !source.is_active && "opacity-60",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">{source.name}</span>
            <span
              className={cn(
                "px-2 py-0.5 text-xs rounded-full",
                source.is_active
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
            >
              {source.is_active ? "Active" : "Inactive"}
            </span>
            {isDue && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                Due
              </span>
            )}
          </div>

          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-cyan-400 hover:underline truncate block mb-2"
          >
            {source.url}
          </a>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>📅 {source.scan_frequency}</span>
            {source.default_category && <span>📁 {source.default_category}</span>}
            {source.last_scan_at && (
              <span>
                Last scan:{" "}
                {new Date(source.last_scan_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {source.queue_counts.pending > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {source.queue_counts.pending} pending
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Scan Now Button - only for active sources */}
          {source.is_active && (
            <button
              onClick={() => onTriggerScan(source.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Queue this source for immediate scan"
            >
              {isScanPending ? (
                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshIcon className="w-3.5 h-3.5" />
              )}
              Scan
            </button>
          )}

          {/* Toggle Active/Inactive */}
          <button
            onClick={() => onToggle(source.id, !source.is_active)}
            disabled={isPending}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
              source.is_active
                ? "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#262626]"
                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
            )}
          >
            {source.is_active ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const StackIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const BoltIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
