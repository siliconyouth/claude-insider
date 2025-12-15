/**
 * Visitor Management Page
 *
 * List, view, block, and manage visitor fingerprints.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { TrustScoreBadge, TrustScoreBar } from "@/components/dashboard/security";
import { format } from "date-fns";
import type { VisitorFingerprint } from "@/lib/fingerprint";
import type { TrustLevel } from "@/lib/trust-score";
import {
  UserGroupIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  XMarkIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 25;

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<VisitorFingerprint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisitor, setSelectedVisitor] =
    useState<VisitorFingerprint | null>(null);

  // Filters
  const [filterBlocked, setFilterBlocked] = useState<boolean | undefined>();
  const [filterTrust, setFilterTrust] = useState<TrustLevel | undefined>();

  const fetchVisitors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        sortBy: "last_seen",
        sortOrder: "desc",
      });

      if (filterBlocked !== undefined)
        params.set("isBlocked", String(filterBlocked));
      if (filterTrust) params.set("trustLevel", filterTrust);

      const response = await fetch(`/api/dashboard/security/visitors?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch visitors");
      }

      setVisitors(data.visitors);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch visitors");
    } finally {
      setIsLoading(false);
    }
  }, [page, filterBlocked, filterTrust]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleAction = async (
    visitorId: string,
    action: "block" | "unblock",
    reason?: string
  ) => {
    try {
      const response = await fetch("/api/dashboard/security/visitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, action, reason }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Action failed");
      }

      // Refresh list
      fetchVisitors();
      setSelectedVisitor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

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
              <UserGroupIcon className="h-8 w-8 text-emerald-500" />
              Visitor Management
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage visitor fingerprints and trust scores
            </p>
          </div>
        </div>
        <button
          onClick={fetchVisitors}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-emerald-500 text-white",
            "hover:bg-emerald-600 transition-colors",
            "disabled:opacity-50"
          )}
        >
          <ArrowPathIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#111111]"
          value={filterBlocked === undefined ? "" : String(filterBlocked)}
          onChange={(e) => {
            setFilterBlocked(
              e.target.value === "" ? undefined : e.target.value === "true"
            );
            setPage(1);
          }}
        >
          <option value="">All Visitors</option>
          <option value="true">Blocked Only</option>
          <option value="false">Active Only</option>
        </select>

        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#111111]"
          value={filterTrust || ""}
          onChange={(e) => {
            setFilterTrust((e.target.value as TrustLevel) || undefined);
            setPage(1);
          }}
        >
          <option value="">All Trust Levels</option>
          <option value="trusted">Trusted</option>
          <option value="neutral">Neutral</option>
          <option value="suspicious">Suspicious</option>
          <option value="untrusted">Untrusted</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Visitors List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-[#111111]">
            <p className="text-gray-500">Loading visitors...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-[#111111]">
            <p className="text-gray-500">No visitors found</p>
          </div>
        ) : (
          visitors.map((visitor) => (
            <div
              key={visitor.id}
              className={cn(
                "rounded-xl p-4",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                visitor.isBlocked && "border-red-500/50 bg-red-500/5"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-gray-600 dark:text-gray-300">
                      {visitor.visitorId.substring(0, 16)}...
                    </code>
                    <TrustScoreBadge
                      score={visitor.trustScore}
                      level={visitor.trustLevel as TrustLevel}
                      size="sm"
                    />
                    {visitor.isBlocked && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                        Blocked
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>
                      Last seen:{" "}
                      {format(new Date(visitor.lastSeenAt), "MMM d, HH:mm")}
                    </span>
                    <span>{visitor.totalRequests} requests</span>
                    {visitor.botRequests > 0 && (
                      <span className="text-amber-500">
                        {visitor.botRequests} bot detections
                      </span>
                    )}
                    {visitor.honeypotTriggers > 0 && (
                      <span className="text-purple-500">
                        {visitor.honeypotTriggers} honeypot triggers
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedVisitor(visitor)}
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  {visitor.isBlocked ? (
                    <button
                      onClick={() => handleAction(visitor.visitorId, "unblock")}
                      className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-500/10"
                      title="Unblock"
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleAction(visitor.visitorId, "block", "Manual block")
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                      title="Block"
                    >
                      <ShieldExclamationIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              <TrustScoreBar score={visitor.trustScore} className="mt-3" />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, total)} of {total} visitors
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50 dark:border-[#262626]"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50 dark:border-[#262626]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Visitor Details</h2>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-gray-500">Visitor ID</label>
                <p className="font-mono text-sm">{selectedVisitor.visitorId}</p>
              </div>
              <TrustScoreBar score={selectedVisitor.trustScore} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">First Seen</label>
                  <p className="text-sm">
                    {format(new Date(selectedVisitor.firstSeenAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Seen</label>
                  <p className="text-sm">
                    {format(new Date(selectedVisitor.lastSeenAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Total Requests</label>
                  <p className="text-sm">{selectedVisitor.totalRequests}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Bot Detections</label>
                  <p className="text-sm">{selectedVisitor.botRequests}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Honeypot Triggers
                  </label>
                  <p className="text-sm">{selectedVisitor.honeypotTriggers}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last IP</label>
                  <p className="font-mono text-sm">
                    {selectedVisitor.lastIp || "Unknown"}
                  </p>
                </div>
              </div>
              {selectedVisitor.blockReason && (
                <div>
                  <label className="text-sm text-gray-500">Block Reason</label>
                  <p className="text-sm text-red-500">
                    {selectedVisitor.blockReason}
                  </p>
                </div>
              )}
              {selectedVisitor.notes && (
                <div>
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedVisitor.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
