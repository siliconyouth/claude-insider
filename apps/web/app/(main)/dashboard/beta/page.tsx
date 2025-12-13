"use client";

/**
 * Beta Applications Review Page
 *
 * Moderators and admins can review, approve, or reject beta applications.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import type { AdminBetaApplication, PaginatedResponse } from "@/types/admin";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function BetaApplicationsPage() {
  const toast = useToast();
  const [applications, setApplications] = useState<AdminBetaApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedApp, setSelectedApp] = useState<AdminBetaApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        page: page.toString(),
        limit: "20",
      });
      const response = await fetch(`/api/dashboard/beta?${params}`);
      if (response.ok) {
        const data: PaginatedResponse<AdminBetaApplication> = await response.json();
        setApplications(data.items);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedApp) return;

    setIsReviewing(true);
    try {
      const response = await fetch(`/api/dashboard/beta/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes }),
      });

      if (response.ok) {
        toast.success(
          status === "approved"
            ? "Application approved! User is now a beta tester."
            : "Application rejected."
        );
        setSelectedApp(null);
        setReviewNotes("");
        fetchApplications();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to review application");
      }
    } catch (error) {
      toast.error("Failed to review application");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Beta Applications</h2>
          <p className="mt-1 text-sm text-gray-400">
            Review and manage beta tester applications
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === status
                ? "bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 text-white border border-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {filter !== "all" ? filter : ""} applications found
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {applications.map((app) => (
              <div
                key={app.id}
                className={cn(
                  "p-4 hover:bg-gray-800/50 transition-colors cursor-pointer",
                  selectedApp?.id === app.id && "bg-gray-800/50"
                )}
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {app.userName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-white truncate">
                        {app.userName || "Unknown"}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{app.userEmail}</p>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{app.motivation}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {app.experienceLevel && (
                        <span className="px-2 py-0.5 bg-gray-800 rounded">
                          {app.experienceLevel}
                        </span>
                      )}
                      <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
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

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedApp(null)}
          />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Review Application</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xl font-semibold">
                  {selectedApp.userName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white">{selectedApp.userName}</h4>
                  <p className="text-sm text-gray-400">{selectedApp.userEmail}</p>
                  <StatusBadge status={selectedApp.status} />
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Motivation</label>
                  <p className="mt-1 text-white whitespace-pre-wrap">{selectedApp.motivation}</p>
                </div>

                {selectedApp.experienceLevel && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Experience Level</label>
                    <p className="mt-1 text-white capitalize">{selectedApp.experienceLevel}</p>
                  </div>
                )}

                {selectedApp.useCase && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Use Case</label>
                    <p className="mt-1 text-white whitespace-pre-wrap">{selectedApp.useCase}</p>
                  </div>
                )}

                <div className="flex gap-4 text-sm text-gray-400">
                  <span>Applied: {new Date(selectedApp.createdAt).toLocaleString()}</span>
                  {selectedApp.reviewedAt && (
                    <span>Reviewed: {new Date(selectedApp.reviewedAt).toLocaleString()}</span>
                  )}
                </div>

                {selectedApp.reviewNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Previous Review Notes</label>
                    <p className="mt-1 text-white whitespace-pre-wrap">{selectedApp.reviewNotes}</p>
                  </div>
                )}
              </div>

              {/* Review Actions (only for pending) */}
              {selectedApp.status === "pending" && (
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Review Notes (optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add notes about your decision..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReview("approved")}
                      disabled={isReviewing}
                      className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isReviewing ? "Processing..." : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => handleReview("rejected")}
                      disabled={isReviewing}
                      className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isReviewing ? "Processing..." : "✕ Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-900/30 text-yellow-400",
    approved: "bg-emerald-900/30 text-emerald-400",
    rejected: "bg-red-900/30 text-red-400",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[status] || styles.pending)}>
      {status}
    </span>
  );
}
