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
  type QueueStatus,
  type QueueItem,
  type Source,
  type DiscoveryStats,
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
  const { data: stats } = useDiscoveryStats();

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
        {activeTab === "overview" && <OverviewTab stats={stats} />}
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
function OverviewTab({ stats }: { stats: DiscoveryStats | undefined }) {
  if (!stats) {
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
  // TanStack Query handles caching and loading states
  const { data, isLoading, isFetching } = useDiscoveryQueue({
    status: filter,
    page,
    limit: 20,
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  // Mutation hook for approve/reject actions
  const queueAction = useQueueAction();

  const handleAction = (id: string, action: "approve" | "reject") => {
    queueAction.mutate({ id, action });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
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
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-[#1a1a1a] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
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
 */
function QueueItemCard({
  item,
  onAction,
  isPending,
}: {
  item: QueueItem;
  onAction: (id: string, action: "approve" | "reject") => void;
  isPending?: boolean;
}) {
  const statusConfig = QUEUE_STATUS[item.status];
  const githubData = item.discovered_data?.github as { stars?: number; forks?: number } | undefined;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        "bg-white dark:bg-[#111111]",
        "border-gray-200 dark:border-[#262626]",
        "hover:border-blue-500/30 transition-colors",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-start justify-between gap-4">
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
              disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => onAction(item.id, "approve")}
              disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sources Tab - List of configured discovery sources
 * Uses TanStack Query for automatic caching
 */
function SourcesTab() {
  const { data, isLoading } = useDiscoverySources();
  const sourceToggle = useSourceToggle();

  const sources = data?.sources || [];

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
                isPending={sourceToggle.isPending && sourceToggle.variables?.id === source.id}
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
 */
function SourceCard({
  source,
  onToggle,
  isPending,
}: {
  source: Source;
  onToggle: (id: string, isActive: boolean) => void;
  isPending?: boolean;
}) {
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
