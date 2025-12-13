"use client";

/**
 * Feedback Management Page
 *
 * Moderators and admins can view and manage feedback from beta testers.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import type { AdminFeedback, PaginatedResponse } from "@/types/admin";

type FilterStatus = "all" | "open" | "in_progress" | "resolved" | "closed" | "wont_fix";
type FilterType = "all" | "bug" | "feature" | "general";

export default function FeedbackPage() {
  const toast = useToast();
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("open");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<AdminFeedback | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        feedbackType: typeFilter,
        page: page.toString(),
        limit: "20",
      });
      const response = await fetch(`/api/dashboard/feedback?${params}`);
      if (response.ok) {
        const data: PaginatedResponse<AdminFeedback> = await response.json();
        setFeedback(data.items);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, page, toast]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedItem) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/dashboard/feedback/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        setSelectedItem({ ...selectedItem, status: newStatus as AdminFeedback["status"] });
        fetchFeedback();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Feedback</h2>
        <p className="mt-1 text-sm text-gray-400">
          Manage bug reports, feature requests, and general feedback
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "resolved", "closed"] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                statusFilter === status
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {(["all", "bug", "feature", "general"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setTypeFilter(type);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                typeFilter === type
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {type === "bug" && "🐛 "}
              {type === "feature" && "💡 "}
              {type === "general" && "💬 "}
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No feedback found</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {feedback.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-4 hover:bg-gray-800/50 transition-colors cursor-pointer",
                  selectedItem?.id === item.id && "bg-gray-800/50"
                )}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start gap-4">
                  <FeedbackTypeIcon type={item.feedbackType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-white">{item.title}</h3>
                      <StatusBadge status={item.status} />
                      {item.severity && <SeverityBadge severity={item.severity} />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      by {item.userName || item.userEmail}
                    </p>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FeedbackTypeIcon type={selectedItem.feedbackType} />
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedItem.title}</h3>
                  <p className="text-xs text-gray-400">
                    by {selectedItem.userName} • {new Date(selectedItem.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedItem.status} />
                {selectedItem.severity && <SeverityBadge severity={selectedItem.severity} />}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-400">Description</label>
                <p className="mt-2 text-white whitespace-pre-wrap">{selectedItem.description}</p>
              </div>

              {/* Page URL */}
              {selectedItem.pageUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Page URL</label>
                  <a
                    href={selectedItem.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-cyan-400 hover:text-cyan-300 text-sm truncate"
                  >
                    {selectedItem.pageUrl}
                  </a>
                </div>
              )}

              {/* User Agent */}
              {selectedItem.userAgent && (
                <div>
                  <label className="text-sm font-medium text-gray-400">User Agent</label>
                  <p className="mt-1 text-xs text-gray-500 break-all">{selectedItem.userAgent}</p>
                </div>
              )}

              {/* Status Update */}
              <div className="pt-4 border-t border-gray-800">
                <label className="block text-sm font-medium text-gray-400 mb-3">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {["open", "in_progress", "resolved", "closed", "wont_fix"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isUpdating || selectedItem.status === status}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        selectedItem.status === status
                          ? "bg-blue-600 text-white cursor-default"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
                      )}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    bug: (
      <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">🐛</span>
      </div>
    ),
    feature: (
      <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">💡</span>
      </div>
    ),
    general: (
      <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">💬</span>
      </div>
    ),
  };
  return icons[type] || icons.general;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-yellow-900/30 text-yellow-400",
    in_progress: "bg-blue-900/30 text-blue-400",
    resolved: "bg-emerald-900/30 text-emerald-400",
    closed: "bg-gray-800 text-gray-400",
    wont_fix: "bg-gray-800 text-gray-500",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[status] || styles.open)}>
      {status.replace("_", " ")}
    </span>
  );
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
