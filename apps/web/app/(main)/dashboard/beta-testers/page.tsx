"use client";

/**
 * Beta Testers Management Page
 *
 * Admins can view, search, revoke, and manage beta tester status.
 * Shows all approved beta testers with their application details and feedback stats.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";

interface BetaTester {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isBetaTester: boolean;
  betaApprovedAt: string | null;
  createdAt: string;
  // Stats
  feedbackCount: number;
  lastFeedbackAt: string | null;
  // Application info
  applicationId: string | null;
  experienceLevel: string | null;
  motivation: string | null;
}

interface BetaTesterStats {
  totalTesters: number;
  activeThisMonth: number;
  totalFeedback: number;
}

export default function BetaTestersPage() {
  const toast = useToast();
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [stats, setStats] = useState<BetaTesterStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTester, setSelectedTester] = useState<BetaTester | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const fetchTesters = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);

      const response = await fetch(`/api/dashboard/beta-testers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTesters(data.items);
        setTotalPages(data.totalPages);
        setStats(data.stats);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to load beta testers");
      }
    } catch (error) {
      console.error("Failed to fetch beta testers:", error);
      toast.error("Failed to load beta testers");
    } finally {
      setIsLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => {
    const debounce = setTimeout(fetchTesters, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [fetchTesters, search]);

  const handleRevokeBetaStatus = async () => {
    if (!selectedTester) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/dashboard/beta-testers/${selectedTester.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`Beta tester status revoked for ${selectedTester.name}`);
        setSelectedTester(null);
        setShowRevokeConfirm(false);
        fetchTesters();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to revoke beta status");
      }
    } catch {
      toast.error("Failed to revoke beta status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Beta Testers</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage approved beta testers and their access
          </p>
        </div>
        <a
          href="/dashboard/beta"
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium",
            "bg-violet-600/20 text-violet-400 border border-violet-500/30",
            "hover:bg-violet-600/30 transition-all"
          )}
        >
          View Applications
        </a>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTesters}</p>
                <p className="text-xs text-gray-400">Total Beta Testers</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.activeThisMonth}</p>
                <p className="text-xs text-gray-400">Active This Month</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-600/20">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalFeedback}</p>
                <p className="text-xs text-gray-400">Total Feedback</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="w-full px-4 py-2.5 pl-10 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Testers List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : testers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? "No beta testers found matching your search" : "No beta testers yet"}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {testers.map((tester) => (
              <div
                key={tester.id}
                className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTester(tester)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                    {tester.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tester.avatarUrl}
                        alt={tester.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      tester.name?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-white truncate">
                        {tester.name || "Unknown"}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400">
                        Beta Tester
                      </span>
                      {tester.experienceLevel && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                          {tester.experienceLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tester.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-white">
                      {tester.feedbackCount} feedback
                    </p>
                    <p className="text-xs text-gray-500">
                      {tester.betaApprovedAt
                        ? `Since ${new Date(tester.betaApprovedAt).toLocaleDateString()}`
                        : `Joined ${new Date(tester.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Revoke Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTester(tester);
                      setShowRevokeConfirm(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    Revoke
                  </button>
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

      {/* Beta Tester Detail Modal */}
      {selectedTester && !showRevokeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTester(null)}
          />
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Beta Tester Details</h3>
              <button
                onClick={() => setSelectedTester(null)}
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                  {selectedTester.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedTester.avatarUrl}
                      alt={selectedTester.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedTester.name?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white">{selectedTester.name}</h4>
                  <p className="text-sm text-gray-400">{selectedTester.email}</p>
                  {selectedTester.experienceLevel && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                      {selectedTester.experienceLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-800/50">
                  <p className="text-2xl font-bold text-white">{selectedTester.feedbackCount}</p>
                  <p className="text-xs text-gray-400">Feedback Submitted</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800/50">
                  <p className="text-sm font-medium text-white">
                    {selectedTester.lastFeedbackAt
                      ? new Date(selectedTester.lastFeedbackAt).toLocaleDateString()
                      : "Never"}
                  </p>
                  <p className="text-xs text-gray-400">Last Feedback</p>
                </div>
              </div>

              {/* Application Info */}
              {selectedTester.motivation && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Motivation</label>
                  <p className="mt-1 text-sm text-white whitespace-pre-wrap line-clamp-4">
                    {selectedTester.motivation}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="flex gap-4 text-sm text-gray-400">
                <span>
                  Beta since: {selectedTester.betaApprovedAt
                    ? new Date(selectedTester.betaApprovedAt).toLocaleDateString()
                    : "N/A"}
                </span>
                <span>
                  Joined: {new Date(selectedTester.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <a
                  href={`/dashboard/feedback?user=${selectedTester.id}`}
                  className="flex-1 py-2 rounded-lg text-center text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                >
                  View Feedback
                </a>
                <button
                  onClick={() => setShowRevokeConfirm(true)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all"
                >
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && selectedTester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowRevokeConfirm(false);
              setSelectedTester(null);
            }}
          />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Revoke Beta Access
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to revoke beta tester access for{" "}
                <span className="text-white font-medium">{selectedTester.name}</span>?
                They will lose access to beta features.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRevokeConfirm(false);
                    setSelectedTester(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeBetaStatus}
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? "Revoking..." : "Revoke Access"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
