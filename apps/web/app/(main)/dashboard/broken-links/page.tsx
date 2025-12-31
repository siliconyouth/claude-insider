"use client";

/**
 * Broken Links Dashboard
 *
 * Moderators can view and manage resources with broken external links.
 * Actions available:
 * - Fix: Update the resource URL
 * - Hide: Unpublish the resource
 * - Dismiss: Mark as false positive
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dashboard/shared";
import type { StatusStyle } from "@/lib/dashboard/types";
import {
  useBrokenLinksQueue,
  useBrokenLinksStats,
  useFixBrokenLink,
  useHideBrokenLink,
  useDismissBrokenLink,
  useTriggerValidation,
  useBulkBrokenLinkAction,
  useRediscoverBrokenLinks,
  type BrokenLinkStatus,
  type BrokenLinkEntry,
  type RediscoverResponse,
} from "@/lib/query/hooks";

// Status configuration with proper type
const STATUS_CONFIG: Record<string, StatusStyle> = {
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Pending",
    border: "border-yellow-300 dark:border-yellow-500/30",
  },
  reviewing: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Reviewing",
    border: "border-blue-300 dark:border-blue-500/30",
  },
  fixed: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Fixed",
    border: "border-green-300 dark:border-green-500/30",
  },
  hidden: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-400",
    label: "Hidden",
    border: "border-gray-300 dark:border-gray-500/30",
  },
  dismissed: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-500 dark:text-gray-500",
    label: "Dismissed",
    border: "border-gray-300 dark:border-gray-500/30",
  },
};

// Get style with fallback (never returns undefined due to inline default)
function getStatusStyle(status: string): StatusStyle {
  return STATUS_CONFIG[status] ?? {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Pending",
    border: "border-yellow-300 dark:border-yellow-500/30",
  };
}

export default function BrokenLinksPage() {
  // Filter state
  const [filter, setFilter] = useState<BrokenLinkStatus>("pending");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Modal state
  const [selectedEntry, setSelectedEntry] = useState<BrokenLinkEntry | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [actionType, setActionType] = useState<"fix" | "hide" | "dismiss" | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState<"hide-all" | "dismiss-all" | null>(null);
  const [rediscoverResults, setRediscoverResults] = useState<{
    found: number;
    notFound: number;
    errors: number;
    total: number;
  } | null>(null);

  // TanStack Query hooks
  const queueQuery = useBrokenLinksQueue({ status: filter, page, limit });
  const statsQuery = useBrokenLinksStats();
  const fixMutation = useFixBrokenLink();
  const hideMutation = useHideBrokenLink();
  const dismissMutation = useDismissBrokenLink();
  const validateMutation = useTriggerValidation();
  const bulkMutation = useBulkBrokenLinkAction();
  const rediscoverMutation = useRediscoverBrokenLinks();

  // Derived data
  const entries = queueQuery.data?.items || [];
  const total = queueQuery.data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const stats = statsQuery.data;
  const pendingCount = stats?.pendingReview || 0;
  // Use invalid count for bulk actions (all broken links, not just those in queue)
  const invalidCount = stats?.invalid || 0;

  // Reset page when filter changes
  const handleFilterChange = (newFilter: BrokenLinkStatus) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleAction = (entry: BrokenLinkEntry, action: "fix" | "hide" | "dismiss") => {
    setSelectedEntry(entry);
    setActionType(action);
    setNewUrl(entry.suggestedUrl || "");
  };

  const confirmAction = () => {
    if (!selectedEntry || !actionType) return;

    switch (actionType) {
      case "fix":
        if (!newUrl) return;
        fixMutation.mutate(
          { entryId: selectedEntry.id, newUrl },
          { onSuccess: () => closeModal() }
        );
        break;
      case "hide":
        hideMutation.mutate(selectedEntry.id, { onSuccess: () => closeModal() });
        break;
      case "dismiss":
        dismissMutation.mutate(selectedEntry.id, { onSuccess: () => closeModal() });
        break;
    }
  };

  const closeModal = () => {
    setSelectedEntry(null);
    setActionType(null);
    setNewUrl("");
  };

  const isLoading =
    fixMutation.isPending || hideMutation.isPending || dismissMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Broken Links"
        description="Review and fix resources with broken external links"
        badge={
          pendingCount > 0 ? (
            <span className="px-3 py-1 text-sm font-medium rounded-full ui-badge-pending">
              {pendingCount} pending
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-Rediscover - searches GitHub/npm for new URLs */}
            <button
              onClick={() => {
                rediscoverMutation.mutate(
                  { limit: 20 },
                  {
                    onSuccess: (data: RediscoverResponse) => {
                      setRediscoverResults(data.summary);
                    },
                  }
                );
              }}
              disabled={rediscoverMutation.isPending || invalidCount === 0}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white",
                "hover:from-violet-700 hover:via-blue-700 hover:to-cyan-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Search GitHub and npm for updated URLs"
            >
              {rediscoverMutation.isPending ? "Searching..." : "Auto-Rediscover"}
            </button>

            {/* Bulk Actions */}
            <button
              onClick={() => setShowBulkConfirm("hide-all")}
              disabled={bulkMutation.isPending || invalidCount === 0}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gray-600 text-white hover:bg-gray-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Hide all resources with broken links"
            >
              Hide All
            </button>
            <button
              onClick={() => setShowBulkConfirm("dismiss-all")}
              disabled={bulkMutation.isPending || invalidCount === 0}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "ui-bg-card border ui-border ui-text-secondary",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Dismiss all as false positives"
            >
              Dismiss All
            </button>

            {/* Run Validation */}
            <button
              onClick={() => validateMutation.mutate({ limit: 50 })}
              disabled={validateMutation.isPending}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "bg-blue-600 text-white hover:bg-blue-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {validateMutation.isPending ? "Validating..." : "Run Validation"}
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Resources" value={stats.totalResources} />
          <StatCard
            label="Valid Links"
            value={stats.valid}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Invalid Links"
            value={stats.invalid}
            color="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Unchecked"
            value={stats.unchecked}
            color="text-gray-600 dark:text-gray-400"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {(
            ["all", "pending", "fixed", "hidden", "dismissed"] as BrokenLinkStatus[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === status
                  ? "bg-blue-600 text-white"
                  : "ui-bg-card ui-text-secondary hover:ui-bg-card-hover"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {total > 0 && (
          <span className="text-sm ui-text-secondary">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </span>
        )}
      </div>

      {/* Queue List */}
      {queueQuery.isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 ui-bg-card rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : queueQuery.isError ? (
        <EmptyState
          message="Error loading broken links"
          description={queueQuery.error instanceof Error ? queueQuery.error.message : "Failed to fetch data"}
          icon={
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState
          message="No broken links"
          description={
            filter === "pending"
              ? "All resource links are working correctly"
              : `No ${filter} entries found`
          }
          icon={
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="ui-bg-card border ui-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/resources/${entry.resourceSlug}`}
                      className="font-medium ui-text-heading hover:text-blue-600 dark:hover:text-cyan-400 truncate"
                    >
                      {entry.resourceTitle}
                    </Link>
                    <StatusBadge style={getStatusStyle(entry.status)} />
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="ui-text-secondary">URL:</span>
                      <a
                        href={entry.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-cyan-400 hover:underline truncate max-w-md"
                      >
                        {entry.originalUrl}
                      </a>
                    </div>
                    {entry.errorMessage && (
                      <div className="flex items-center gap-2">
                        <span className="ui-text-secondary">Error:</span>
                        <span className="text-red-600 dark:text-red-400">
                          {entry.statusCode && `HTTP ${entry.statusCode} - `}
                          {entry.errorMessage}
                        </span>
                      </div>
                    )}
                    {entry.suggestedUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">✓ Suggested:</span>
                        <a
                          href={entry.suggestedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 hover:underline truncate max-w-md"
                        >
                          {entry.suggestedUrl}
                        </a>
                      </div>
                    )}
                    <div className="ui-text-secondary">
                      Detected:{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {entry.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(entry, "fix")}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                    >
                      Fix
                    </button>
                    <button
                      onClick={() => handleAction(entry, "hide")}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleAction(entry, "dismiss")}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium ui-bg-card ui-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  "ui-bg-card border ui-border",
                  page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                First
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  "ui-bg-card border ui-border",
                  page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                Previous
              </button>

              <span className="px-4 py-1.5 text-sm ui-text-secondary">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  "ui-bg-card border ui-border",
                  page === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  "ui-bg-card border ui-border",
                  page === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                Last
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {selectedEntry && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="ui-bg-modal rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold ui-text-heading mb-4">
              {actionType === "fix" && "Fix Broken Link"}
              {actionType === "hide" && "Hide Resource"}
              {actionType === "dismiss" && "Dismiss Entry"}
            </h3>

            <div className="mb-4">
              <p className="ui-text-secondary mb-2">
                Resource: <strong>{selectedEntry.resourceTitle}</strong>
              </p>
              <p className="ui-text-secondary text-sm break-all">
                Current URL: {selectedEntry.originalUrl}
              </p>
            </div>

            {actionType === "fix" && (
              <div className="mb-4">
                <label className="block text-sm font-medium ui-text-body mb-2">
                  New URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full ui-input"
                />
              </div>
            )}

            {actionType === "hide" && (
              <p className="ui-text-secondary mb-4">
                This will unpublish the resource. It can be republished later
                from the resources admin page.
              </p>
            )}

            {actionType === "dismiss" && (
              <p className="ui-text-secondary mb-4">
                This will mark the entry as a false positive. The resource will
                remain published.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium ui-btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isLoading || (actionType === "fix" && !newUrl)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium text-white",
                  actionType === "fix" && "bg-green-600 hover:bg-green-700",
                  actionType === "hide" && "bg-gray-600 hover:bg-gray-700",
                  actionType === "dismiss" && "bg-blue-600 hover:bg-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="ui-bg-modal rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold ui-text-heading mb-4">
              {showBulkConfirm === "hide-all"
                ? "Hide All Resources with Broken Links?"
                : "Dismiss All Broken Link Entries?"}
            </h3>

            <div className="mb-6">
              {showBulkConfirm === "hide-all" ? (
                <p className="ui-text-secondary">
                  This will unpublish <strong>{invalidCount} resources</strong>{" "}
                  with broken links. They can be republished later from the
                  resources admin page.
                </p>
              ) : (
                <p className="ui-text-secondary">
                  This will mark <strong>{invalidCount} entries</strong> as
                  false positives. The resources will remain published with
                  their current URLs.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium ui-btn-secondary"
                disabled={bulkMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  bulkMutation.mutate(showBulkConfirm, {
                    onSuccess: () => setShowBulkConfirm(null),
                  });
                }}
                disabled={bulkMutation.isPending}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium text-white",
                  showBulkConfirm === "hide-all"
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-blue-600 hover:bg-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {bulkMutation.isPending
                  ? "Processing..."
                  : showBulkConfirm === "hide-all"
                    ? "Hide All"
                    : "Dismiss All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rediscover Results Modal */}
      {rediscoverResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="ui-bg-modal rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold ui-text-heading mb-4">
              Auto-Rediscover Results
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="ui-bg-card border ui-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {rediscoverResults.found}
                  </div>
                  <div className="text-sm ui-text-secondary">Found</div>
                </div>
                <div className="ui-bg-card border ui-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {rediscoverResults.notFound}
                  </div>
                  <div className="text-sm ui-text-secondary">Not Found</div>
                </div>
              </div>

              {rediscoverResults.found > 0 ? (
                <p className="ui-text-secondary">
                  Found <strong>{rediscoverResults.found}</strong> potential
                  replacement URLs from GitHub and npm. These have been saved as
                  suggestions - you can apply them using the &quot;Fix&quot; button on
                  each entry.
                </p>
              ) : (
                <p className="ui-text-secondary">
                  No replacement URLs could be found automatically. You may need
                  to search manually or consider hiding/dismissing these
                  resources.
                </p>
              )}

              {rediscoverResults.errors > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {rediscoverResults.errors} entries encountered errors during
                  search.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setRediscoverResults(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for stats cards
function StatCard({
  label,
  value,
  color = "ui-text-heading",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="ui-bg-card border ui-border rounded-lg p-4">
      <div className="text-sm ui-text-secondary">{label}</div>
      <div className={cn("text-2xl font-bold", color)}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
