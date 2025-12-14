"use client";

/**
 * Queue Management Page
 *
 * Review and manage pending resources in the discovery queue.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";

interface QueueItem {
  id: number;
  title: string;
  description: string;
  url: string;
  status: "pending" | "approved" | "rejected";
  priority: "high" | "normal" | "low";
  suggestedCategory?: string;
  suggestedTags?: string[];
  aiAnalysis?: {
    confidenceScore: number;
    relevanceScore: number;
    qualityScore: number;
    reasoning: string;
    warnings?: string;
  };
  github?: {
    owner: string;
    repo: string;
    stars: number;
  };
  createdAt: string;
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("status", filter);
      }
      params.set("limit", "50");

      const response = await fetch(`/api/admin/resources/queue?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleApprove = async (id: number) => {
    setProcessingIds((prev) => new Set([...prev, id]));
    try {
      const response = await fetch(`/api/admin/resources/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (response.ok) {
        await fetchQueue();
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: number) => {
    setProcessingIds((prev) => new Set([...prev, id]));
    try {
      const response = await fetch(`/api/admin/resources/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: "Did not meet quality standards",
        }),
      });

      if (response.ok) {
        await fetchQueue();
      }
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;

    const ids = Array.from(selectedItems);
    setProcessingIds(new Set(ids));

    try {
      const response = await fetch("/api/admin/resources/queue/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ids }),
      });

      if (response.ok) {
        setSelectedItems(new Set());
        await fetchQueue();
      }
    } catch (error) {
      console.error("Failed to bulk approve:", error);
    } finally {
      setProcessingIds(new Set());
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.size === 0) return;

    const ids = Array.from(selectedItems);
    setProcessingIds(new Set(ids));

    try {
      const response = await fetch("/api/admin/resources/queue/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          ids,
          data: { rejectionReason: "Bulk rejected - did not meet standards" },
        }),
      });

      if (response.ok) {
        setSelectedItems(new Set());
        await fetchQueue();
      }
    } catch (error) {
      console.error("Failed to bulk reject:", error);
    } finally {
      setProcessingIds(new Set());
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

  return (
    <div className="space-y-6 lg:ml-64">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Discovery Queue
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review AI-discovered resources before publishing
          </p>
        </div>
        <Link
          href="/dashboard/resources/discover"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2",
            "text-sm font-medium text-white",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
            "transition-all"
          )}
        >
          <SearchIcon className="h-4 w-4" />
          Discover More
        </Link>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-[#111111]">
          {(["pending", "approved", "rejected", "all"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                filter === status
                  ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedItems.size} selected
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={processingIds.size > 0}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md",
                "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                "hover:bg-green-200 dark:hover:bg-green-900/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            >
              Approve All
            </button>
            <button
              onClick={handleBulkReject}
              disabled={processingIds.size > 0}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md",
                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                "hover:bg-red-200 dark:hover:bg-red-900/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            >
              Reject All
            </button>
          </div>
        )}
      </div>

      {/* Queue List */}
      <div
        className={cn(
          "rounded-xl border overflow-hidden",
          "border-gray-200 dark:border-[#262626]",
          "bg-white dark:bg-[#111111]"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#262626]">
          <input
            type="checkbox"
            checked={selectedItems.size === items.length && items.length > 0}
            onChange={selectAll}
            className="h-4 w-4 rounded border-gray-300 dark:border-[#444] text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {items.length} {filter === "all" ? "" : filter} items
          </span>
        </div>

        {/* Items */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <QueueIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No {filter === "all" ? "" : filter} items in queue
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#262626]">
            {items.map((item) => (
              <QueueItemRow
                key={item.id}
                item={item}
                selected={selectedItems.has(item.id)}
                processing={processingIds.has(item.id)}
                onSelect={() => toggleSelection(item.id)}
                onApprove={() => handleApprove(item.id)}
                onReject={() => handleReject(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QueueItemRow({
  item,
  selected,
  processing,
  onSelect,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  selected: boolean;
  processing: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "transition-colors",
        selected && "bg-blue-50 dark:bg-blue-900/10",
        processing && "opacity-50"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          disabled={processing || item.status !== "pending"}
          className="h-4 w-4 rounded border-gray-300 dark:border-[#444] text-blue-600 focus:ring-blue-500"
        />

        {/* Confidence Score */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold flex-shrink-0",
            item.aiAnalysis?.confidenceScore && item.aiAnalysis.confidenceScore >= 80
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : item.aiAnalysis?.confidenceScore && item.aiAnalysis.confidenceScore >= 50
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
              : "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400"
          )}
        >
          {item.aiAnalysis?.confidenceScore || "?"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {item.title}
            </h3>
            {item.priority === "high" && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                High Priority
              </span>
            )}
            {item.status !== "pending" && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  item.status === "approved"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                )}
              >
                {item.status}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
            {item.url}
          </p>
          {item.suggestedCategory && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Category:
              </span>
              <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300">
                {item.suggestedCategory}
              </span>
            </div>
          )}
        </div>

        {/* GitHub Stars */}
        {item.github?.stars && (
          <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <StarIcon className="h-4 w-4" />
            {item.github.stars.toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#262626]"
            )}
          >
            <ChevronIcon className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
          </button>

          {item.status === "pending" && (
            <>
              <button
                onClick={onApprove}
                disabled={processing}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "text-green-600 dark:text-green-400",
                  "hover:bg-green-100 dark:hover:bg-green-900/30",
                  "disabled:opacity-50"
                )}
                title="Approve"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "text-red-600 dark:text-red-400",
                  "hover:bg-red-100 dark:hover:bg-red-900/30",
                  "disabled:opacity-50"
                )}
                title="Reject"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 ml-14">
          <div className="rounded-lg bg-gray-50 dark:bg-[#0a0a0a] p-4 space-y-4">
            {/* Description */}
            {item.description && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Description
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
              </div>
            )}

            {/* AI Analysis */}
            {item.aiAnalysis && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  AI Analysis
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.aiAnalysis.confidenceScore}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.aiAnalysis.relevanceScore}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Relevance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.aiAnalysis.qualityScore}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quality</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.aiAnalysis.reasoning}</p>
                {item.aiAnalysis.warnings && (
                  <div className="mt-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ {item.aiAnalysis.warnings}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {item.suggestedTags && item.suggestedTags.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Suggested Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.suggestedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#262626]">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md",
                  "bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-[#333]",
                  "transition-colors"
                )}
              >
                Visit URL
                <ExternalIcon className="h-3 w-3" />
              </a>
              <Link
                href={`/admin/collections/resource-discovery-queue/${item.id}`}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md",
                  "bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-[#333]",
                  "transition-colors"
                )}
              >
                Edit in Payload
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
