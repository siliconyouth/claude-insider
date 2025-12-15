"use client";

/**
 * Users Management Page
 *
 * Admin-only page for viewing and managing users.
 * Supports editing, banning, and deleting users.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { ROLE_INFO, type UserRole } from "@/lib/roles";
import { banUser, unbanUser } from "@/app/actions/ban-appeals";
import { getAdminUserActivity, getActivityStats, type ActivityItem, type ActivityStats as ActivityStatsType } from "@/app/actions/user-activity";
import { ActivityTimeline, ActivityStats } from "@/components/activity";
import type { AdminUserListItem, AdminUserDetail, PaginatedResponse, UpdateUserRequest } from "@/types/admin";

type FilterRole = "all" | UserRole;
type ModalView = "view" | "edit" | "ban" | "delete";

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalView, setModalView] = useState<ModalView>("view");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [banReason, setBanReason] = useState("");

  // Activity state
  const [userActivity, setUserActivity] = useState<ActivityItem[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStatsType | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const response = await fetch(`/api/dashboard/users?${params}`);
      if (response.ok) {
        const data: PaginatedResponse<AdminUserListItem> = await response.json();
        setUsers(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else if (response.status === 403) {
        toast.error("You don't have permission to view users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, page, toast]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [fetchUsers, search]);

  const loadUserDetail = async (userId: string) => {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`/api/dashboard/users/${userId}`);
      if (response.ok) {
        const data: AdminUserDetail = await response.json();
        setSelectedUser(data);
      } else {
        toast.error("Failed to load user details");
      }
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadUserActivity = async (userId: string) => {
    setIsLoadingActivity(true);
    try {
      const [activityResult, statsResult] = await Promise.all([
        getAdminUserActivity(userId, 50),
        getActivityStats(userId),
      ]);

      if (activityResult.success && activityResult.activities) {
        setUserActivity(activityResult.activities);
      }
      if (statsResult.success && statsResult.stats) {
        setActivityStats(statsResult.stats);
      }
    } catch {
      toast.error("Failed to load user activity");
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/dashboard/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success(`Role updated to ${newRole}`);
        setSelectedUser({ ...selectedUser, role: newRole });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;

    setIsUpdating(true);
    try {
      const result = await banUser(selectedUser.id, banReason.trim());
      if (result.success) {
        toast.success("User banned successfully");
        setSelectedUser({ ...selectedUser, banned: true, banReason: banReason.trim() });
        setBanReason("");
        setModalView("view");
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to ban user");
      }
    } catch {
      toast.error("Failed to ban user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnban = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const result = await unbanUser(selectedUser.id);
      if (result.success) {
        toast.success("User unbanned successfully");
        setSelectedUser({ ...selectedUser, banned: false, banReason: undefined });
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to unban user");
      }
    } catch {
      toast.error("Failed to unban user");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Users</h2>
        <p className="mt-1 text-sm text-gray-400">
          Manage user accounts and roles ({total} total)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex gap-2">
          {(["all", "user", "editor", "moderator", "admin"] as FilterRole[]).map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                roleFilter === role
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {role === "all" ? "All" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? "No users found matching your search" : "No users found"}
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
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => loadUserDetail(user.id)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
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
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {user.banned && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400">
                            Banned
                          </span>
                        )}
                        {user.isBetaTester && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400">
                            Beta
                          </span>
                        )}
                        {user.emailVerified && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* User Detail Modal */}
      {(selectedUser || isLoadingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedUser(null);
              setShowActivity(false);
              setUserActivity([]);
              setActivityStats(null);
            }}
          />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {isLoadingUser ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedUser ? (
              <>
                {/* Modal Header */}
                <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedUser.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedUser.image}
                        alt={selectedUser.name}
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xl font-semibold">
                        {selectedUser.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setShowActivity(false);
                      setUserActivity([]);
                      setActivityStats(null);
                    }}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleBadge role={selectedUser.role} />
                    {selectedUser.banned && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400">
                        Banned
                      </span>
                    )}
                    {selectedUser.isBetaTester && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400">
                        Beta Tester
                      </span>
                    )}
                    {selectedUser.emailVerified && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
                        Email Verified
                      </span>
                    )}
                    {selectedUser.hasPassword && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">
                        Has Password
                      </span>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Joined</label>
                      <p className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    {selectedUser.provider && (
                      <div>
                        <label className="text-gray-500">Auth Provider</label>
                        <p className="text-white capitalize">{selectedUser.provider}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-gray-500">Feedback Submitted</label>
                      <p className="text-white">{selectedUser.feedbackCount}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <label className="text-sm text-gray-500">Bio</label>
                      <p className="mt-1 text-white">{selectedUser.bio}</p>
                    </div>
                  )}

                  {/* Beta Application */}
                  {selectedUser.betaApplication && (
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Beta Application</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Status:</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            selectedUser.betaApplication.status === "approved"
                              ? "bg-emerald-900/30 text-emerald-400"
                              : selectedUser.betaApplication.status === "rejected"
                              ? "bg-red-900/30 text-red-400"
                              : "bg-yellow-900/30 text-yellow-400"
                          )}>
                            {selectedUser.betaApplication.status}
                          </span>
                        </div>
                        <p className="text-gray-400">{selectedUser.betaApplication.motivation}</p>
                      </div>
                    </div>
                  )}

                  {/* Role Management */}
                  <div className="pt-4 border-t border-gray-800">
                    <label className="block text-sm font-medium text-gray-400 mb-3">Change Role</label>
                    <div className="flex flex-wrap gap-2">
                      {(["user", "editor", "moderator"] as UserRole[]).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(role)}
                          disabled={isUpdating || selectedUser.role === role}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            selectedUser.role === role
                              ? "bg-blue-600 text-white cursor-default"
                              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Note: Admin role can only be assigned directly in the database for security.
                    </p>
                  </div>

                  {/* Ban Status & Actions */}
                  <div className="pt-4 border-t border-gray-800">
                    <label className="block text-sm font-medium text-gray-400 mb-3">Ban Management</label>

                    {modalView === "ban" ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                          <p className="text-sm text-red-400 mb-3">
                            You are about to ban <span className="font-semibold">{selectedUser.name || selectedUser.email}</span>.
                            They will be logged out and unable to access their account.
                          </p>
                          <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Enter the reason for banning this user..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleBan}
                            disabled={isUpdating || !banReason.trim()}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? "Banning..." : "Confirm Ban"}
                          </button>
                          <button
                            onClick={() => {
                              setModalView("view");
                              setBanReason("");
                            }}
                            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-medium hover:text-white hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : selectedUser.banned ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                          <p className="text-sm text-red-400">
                            <span className="font-semibold">Ban Reason:</span> {selectedUser.banReason || "No reason provided"}
                          </p>
                        </div>
                        <button
                          onClick={handleUnban}
                          disabled={isUpdating}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isUpdating ? "Unbanning..." : "Unban User"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setModalView("ban")}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium border border-red-500/30 hover:bg-red-600/30 disabled:opacity-50"
                      >
                        Ban User
                      </button>
                    )}
                  </div>

                  {/* Activity Section */}
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-400">Activity & History</label>
                      <button
                        onClick={() => {
                          if (!showActivity && selectedUser) {
                            loadUserActivity(selectedUser.id);
                          }
                          setShowActivity(!showActivity);
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {showActivity ? "Hide" : "Show"}
                      </button>
                    </div>

                    {showActivity && (
                      <div className="space-y-4">
                        {isLoadingActivity ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <>
                            {/* Activity Stats */}
                            {activityStats && (
                              <div className="bg-gray-800/50 rounded-lg p-4">
                                <ActivityStats stats={activityStats} showPrivate={true} />
                              </div>
                            )}

                            {/* Activity Timeline */}
                            <div className="bg-gray-800/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                              <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h4>
                              <ActivityTimeline
                                activities={userActivity}
                                emptyMessage="No activity recorded"
                                compact={true}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const info = ROLE_INFO[role] || ROLE_INFO.user;
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", info.bgColor, info.color)}>
      {info.label}
    </span>
  );
}
