"use client";

/**
 * Banned Users Management Page
 *
 * Admin page for managing banned users and reviewing ban appeals.
 * Supports viewing banned users, reviewing appeals, and unbanning users.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  getBannedUsers,
  getBanAppeals,
  reviewBanAppeal,
  unbanUser,
  type BannedUser,
  type BanAppeal,
} from "@/app/actions/ban-appeals";

type TabView = "banned" | "appeals";
type AppealFilter = "all" | "pending" | "approved" | "rejected";

export default function BannedUsersPage() {
  const toast = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabView>("appeals");

  // Banned users state
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [bannedUsersLoading, setBannedUsersLoading] = useState(true);
  const [bannedUsersTotal, setBannedUsersTotal] = useState(0);

  // Appeals state
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(true);
  const [appealsTotal, setAppealsTotal] = useState(0);
  const [appealFilter, setAppealFilter] = useState<AppealFilter>("pending");

  // Modal state
  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Unban modal
  const [unbanTarget, setUnbanTarget] = useState<BannedUser | null>(null);
  const [isUnbanning, setIsUnbanning] = useState(false);

  const loadBannedUsers = useCallback(async () => {
    setBannedUsersLoading(true);
    const result = await getBannedUsers();
    if (!result.error && result.users) {
      setBannedUsers(result.users);
      setBannedUsersTotal(result.total || 0);
    }
    setBannedUsersLoading(false);
  }, []);

  const loadAppeals = useCallback(async () => {
    setAppealsLoading(true);
    const result = await getBanAppeals({
      status: appealFilter === "all" ? "all" : appealFilter,
    });
    if (!result.error && result.appeals) {
      setAppeals(result.appeals);
      setAppealsTotal(result.total || 0);
    }
    setAppealsLoading(false);
  }, [appealFilter]);

  useEffect(() => {
    if (activeTab === "banned") {
      loadBannedUsers();
    } else {
      loadAppeals();
    }
  }, [activeTab, loadBannedUsers, loadAppeals]);

  const handleReviewAppeal = async (decision: "approved" | "rejected") => {
    if (!selectedAppeal) return;

    setIsReviewing(true);
    const result = await reviewBanAppeal(selectedAppeal.id, decision, {
      reviewNotes: reviewNotes.trim() || undefined,
      responseMessage: responseMessage.trim() || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(decision === "approved" ? "Appeal approved! User has been unbanned." : "Appeal rejected.");
      setSelectedAppeal(null);
      setReviewNotes("");
      setResponseMessage("");
      loadAppeals();
      loadBannedUsers();
    }
    setIsReviewing(false);
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;

    setIsUnbanning(true);
    const result = await unbanUser(unbanTarget.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User has been unbanned.");
      setUnbanTarget(null);
      loadBannedUsers();
    }
    setIsUnbanning(false);
  };

  // Count pending appeals for badge
  const pendingCount = appeals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Banned Users & Appeals</h2>
        <p className="mt-1 text-sm text-gray-400">
          Manage banned users and review ban appeals
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("appeals")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "appeals"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-white"
          )}
        >
          Appeals
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("banned")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "banned"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-white"
          )}
        >
          Banned Users ({bannedUsersTotal})
        </button>
      </div>

      {/* Appeals Tab */}
      {activeTab === "appeals" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {(["pending", "approved", "rejected", "all"] as AppealFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setAppealFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  appealFilter === filter
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Appeals List */}
          <div className="space-y-3">
            {appealsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : appeals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No {appealFilter !== "all" ? appealFilter : ""} appeals found
              </div>
            ) : (
              appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className={cn(
                    "p-4 rounded-xl",
                    "bg-gray-900/50 border border-gray-800",
                    "hover:border-gray-700 transition-colors"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    {appeal.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={appeal.user.image}
                        alt={appeal.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                        {appeal.user?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {appeal.user?.name || "Unknown User"}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            appeal.status === "pending" && "bg-yellow-900/30 text-yellow-400",
                            appeal.status === "approved" && "bg-green-900/30 text-green-400",
                            appeal.status === "rejected" && "bg-red-900/30 text-red-400"
                          )}
                        >
                          {appeal.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{appeal.user?.email}</p>

                      {/* Ban Reason */}
                      {appeal.user?.banReason && (
                        <div className="text-xs text-gray-500 mb-2">
                          <span className="font-medium">Ban reason:</span> {appeal.user.banReason}
                        </div>
                      )}

                      {/* Appeal Reason */}
                      <div className="p-3 rounded-lg bg-gray-800/50 mb-2">
                        <p className="text-sm text-gray-300">{appeal.reason}</p>
                        {appeal.additionalContext && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-500 mb-1">Additional context:</p>
                            <p className="text-sm text-gray-400">{appeal.additionalContext}</p>
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Submitted {new Date(appeal.createdAt).toLocaleDateString()}</span>
                        {appeal.reviewedAt && (
                          <span>Reviewed {new Date(appeal.reviewedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {appeal.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedAppeal(appeal);
                          setReviewNotes("");
                          setResponseMessage("");
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium",
                          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                          "text-white",
                          "hover:shadow-lg hover:-translate-y-0.5",
                          "transition-all duration-200"
                        )}
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Banned Users Tab */}
      {activeTab === "banned" && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {bannedUsersLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : bannedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No banned users
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ban Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Banned
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Appeals
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {bannedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{user.name || "—"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-400 line-clamp-2 max-w-xs">
                          {user.banReason || "No reason provided"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : "—"}
                        {user.bannedByName && (
                          <p className="text-xs text-gray-500">by {user.bannedByName}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{user.appealCount}</span>
                          {user.latestAppealStatus === "pending" && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-900/30 text-yellow-400">
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setUnbanTarget(user)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium",
                            "bg-green-600/20 text-green-400",
                            "hover:bg-green-600/30",
                            "transition-colors"
                          )}
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Appeal Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAppeal(null)}
          />
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Review Appeal</h3>
              <p className="text-sm text-gray-400">
                {selectedAppeal.user?.name} • {selectedAppeal.user?.email}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Appeal Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Appeal Reason
                </label>
                <div className="p-3 rounded-lg bg-gray-800/50 text-sm text-gray-300">
                  {selectedAppeal.reason}
                </div>
              </div>

              {/* Review Notes (Internal) */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Internal Notes (not shared with user)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add internal notes for other admins..."
                  rows={2}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg text-sm",
                    "bg-gray-800 border border-gray-700",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "resize-none"
                  )}
                />
              </div>

              {/* Response Message */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Response to User (optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Message that will be sent to the user..."
                  rows={2}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg text-sm",
                    "bg-gray-800 border border-gray-700",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "resize-none"
                  )}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setSelectedAppeal(null)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                  "border border-gray-700",
                  "text-gray-300 hover:bg-gray-800"
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewAppeal("rejected")}
                disabled={isReviewing}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-red-600 text-white",
                  "hover:bg-red-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isReviewing ? "..." : "Reject"}
              </button>
              <button
                onClick={() => handleReviewAppeal("approved")}
                disabled={isReviewing}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-green-600 text-white",
                  "hover:bg-green-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isReviewing ? "..." : "Approve & Unban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {unbanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setUnbanTarget(null)}
          />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Unban User</h3>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to unban <strong>{unbanTarget.name}</strong>? They will regain full access to their account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setUnbanTarget(null)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                  "border border-gray-700",
                  "text-gray-300 hover:bg-gray-800"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleUnban}
                disabled={isUnbanning}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-green-600 text-white",
                  "hover:bg-green-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isUnbanning ? "..." : "Confirm Unban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
