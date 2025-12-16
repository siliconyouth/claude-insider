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
import { ROLE_INFO, getAssignableRoles, type UserRole } from "@/lib/roles";
import { useAuth } from "@/components/providers/auth-provider";
import { banUser, unbanUser } from "@/app/actions/ban-appeals";
import { getAdminUserActivity, getActivityStats, type ActivityItem, type ActivityStats as ActivityStatsType } from "@/app/actions/user-activity";
import { ActivityTimeline, ActivityStats } from "@/components/activity";
import { PageHeader, EmptyState } from "@/components/dashboard/shared";
import type { AdminUserListItem, AdminUserDetail, PaginatedResponse } from "@/types/admin";

type FilterRole = "all" | UserRole;
type ModalView = "view" | "ban";

export default function UsersPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [betaFilter, setBetaFilter] = useState<"all" | "yes" | "no">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalView, setModalView] = useState<ModalView>("view");
  const [banReason, setBanReason] = useState("");

  // Activity state
  const [userActivity, setUserActivity] = useState<ActivityItem[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStatsType | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (betaFilter !== "all") params.set("isBetaTester", betaFilter === "yes" ? "true" : "false");

      const response = await fetch(`/api/dashboard/users?${params}`);
      if (response.ok) {
        const data: PaginatedResponse<AdminUserListItem> = await response.json();
        setUsers(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else if (response.status === 401) {
        toast.error("Please sign in to view users");
      } else if (response.status === 403) {
        toast.error("You don't have permission to view users");
      } else {
        toast.error("Failed to load users");
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, betaFilter, page, toast]);

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
      if (activityResult.success && activityResult.activities) setUserActivity(activityResult.activities);
      if (statsResult.success && statsResult.stats) setActivityStats(statsResult.stats);
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

  const closeModal = () => {
    setSelectedUser(null);
    setShowActivity(false);
    setUserActivity([]);
    setActivityStats(null);
    setModalView("view");
    setBanReason("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`Manage user accounts and roles (${total} total)`}
      />

      {/* Search and Filters */}
      <UsersFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        roleFilter={roleFilter}
        onRoleChange={(v) => { setRoleFilter(v); setPage(1); }}
        betaFilter={betaFilter}
        onBetaChange={(v) => { setBetaFilter(v); setPage(1); }}
      />

      {/* Users Table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        search={search}
        onSelectUser={loadUserDetail}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* User Detail Modal */}
      {(selectedUser || isLoadingUser) && (
        <UserDetailModal
          user={selectedUser}
          isLoading={isLoadingUser}
          isUpdating={isUpdating}
          currentUserRole={currentUser?.role as UserRole}
          modalView={modalView}
          banReason={banReason}
          showActivity={showActivity}
          isLoadingActivity={isLoadingActivity}
          userActivity={userActivity}
          activityStats={activityStats}
          onClose={closeModal}
          onRoleChange={handleRoleChange}
          onBanReasonChange={setBanReason}
          onBan={handleBan}
          onUnban={handleUnban}
          onSetModalView={setModalView}
          onToggleActivity={() => {
            if (!showActivity && selectedUser) loadUserActivity(selectedUser.id);
            setShowActivity(!showActivity);
          }}
        />
      )}
    </div>
  );
}

// Filters component
function UsersFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  betaFilter,
  onBetaChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  roleFilter: FilterRole;
  onRoleChange: (v: FilterRole) => void;
  betaFilter: "all" | "yes" | "no";
  onBetaChange: (v: "all" | "yes" | "no") => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "user", "editor", "moderator", "admin", "superadmin"] as FilterRole[]).map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              roleFilter === role
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
          >
            {role === "all" ? "All Roles" : role === "superadmin" ? "Super Admin" : role}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Beta:</span>
        <div className="flex gap-1">
          {(["all", "yes", "no"] as const).map((value) => (
            <button
              key={value}
              onClick={() => onBetaChange(value)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                betaFilter === value
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {value === "all" ? "All" : value === "yes" ? "✓ Beta" : "No Beta"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Users table component
function UsersTable({
  users,
  isLoading,
  search,
  onSelectUser,
}: {
  users: AdminUserListItem[];
  isLoading: boolean;
  search: string;
  onSelectUser: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50">
        <EmptyState
          icon={<UserIcon />}
          message={search ? "No users found matching your search" : "No users found"}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <UserRow key={user.id} user={user} onClick={() => onSelectUser(user.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// User row component
function UserRow({ user, onClick }: { user: AdminUserListItem; onClick: () => void }) {
  return (
    <tr className="hover:bg-gray-800/50 cursor-pointer transition-colors" onClick={onClick}>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
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
          {user.banned && <StatusBadge color="red">Banned</StatusBadge>}
          {user.isBetaTester && <StatusBadge color="emerald">Beta</StatusBadge>}
          {user.emailVerified && <StatusBadge color="blue">Verified</StatusBadge>}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

// User detail modal
function UserDetailModal({
  user,
  isLoading,
  isUpdating,
  currentUserRole,
  modalView,
  banReason,
  showActivity,
  isLoadingActivity,
  userActivity,
  activityStats,
  onClose,
  onRoleChange,
  onBanReasonChange,
  onBan,
  onUnban,
  onSetModalView,
  onToggleActivity,
}: {
  user: AdminUserDetail | null;
  isLoading: boolean;
  isUpdating: boolean;
  currentUserRole: UserRole;
  modalView: ModalView;
  banReason: string;
  showActivity: boolean;
  isLoadingActivity: boolean;
  userActivity: ActivityItem[];
  activityStats: ActivityStatsType | null;
  onClose: () => void;
  onRoleChange: (role: UserRole) => void;
  onBanReasonChange: (reason: string) => void;
  onBan: () => void;
  onUnban: () => void;
  onSetModalView: (view: ModalView) => void;
  onToggleActivity: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar user={user} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={user.role} />
                {user.banned && <StatusBadge color="red">Banned</StatusBadge>}
                {user.isBetaTester && <StatusBadge color="emerald">Beta Tester</StatusBadge>}
                {user.emailVerified && <StatusBadge color="blue">Email Verified</StatusBadge>}
                {user.hasPassword && <StatusBadge color="gray">Has Password</StatusBadge>}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
                {user.provider && <InfoField label="Auth Provider" value={user.provider} />}
                <InfoField label="Feedback Submitted" value={user.feedbackCount.toString()} />
              </div>

              {user.bio && <InfoField label="Bio" value={user.bio} />}

              {user.betaApplication && <BetaApplicationCard application={user.betaApplication} />}

              {/* Role Management */}
              <RoleSection
                selectedRole={user.role}
                currentUserRole={currentUserRole}
                isUpdating={isUpdating}
                onRoleChange={onRoleChange}
              />

              {/* Ban Management */}
              <BanSection
                user={user}
                modalView={modalView}
                banReason={banReason}
                isUpdating={isUpdating}
                onBanReasonChange={onBanReasonChange}
                onBan={onBan}
                onUnban={onUnban}
                onSetModalView={onSetModalView}
              />

              {/* Activity Section */}
              <ActivitySection
                showActivity={showActivity}
                isLoading={isLoadingActivity}
                stats={activityStats}
                activities={userActivity}
                onToggle={onToggleActivity}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// Role section component
function RoleSection({
  selectedRole,
  currentUserRole,
  isUpdating,
  onRoleChange,
}: {
  selectedRole: UserRole;
  currentUserRole: UserRole;
  isUpdating: boolean;
  onRoleChange: (role: UserRole) => void;
}) {
  return (
    <div className="pt-4 border-t border-gray-800">
      <label className="block text-sm font-medium text-gray-400 mb-3">Change Role</label>
      <div className="flex flex-wrap gap-2">
        {getAssignableRoles(currentUserRole).map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            disabled={isUpdating || selectedRole === role}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              selectedRole === role
                ? "bg-blue-600 text-white cursor-default"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
            )}
          >
            {ROLE_INFO[role]?.label || role}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {currentUserRole === "superadmin"
          ? "Super Admins can assign roles up to Admin level."
          : "Admins can assign roles up to Moderator level."}
      </p>
    </div>
  );
}

// Ban section component
function BanSection({
  user,
  modalView,
  banReason,
  isUpdating,
  onBanReasonChange,
  onBan,
  onUnban,
  onSetModalView,
}: {
  user: AdminUserDetail;
  modalView: ModalView;
  banReason: string;
  isUpdating: boolean;
  onBanReasonChange: (reason: string) => void;
  onBan: () => void;
  onUnban: () => void;
  onSetModalView: (view: ModalView) => void;
}) {
  return (
    <div className="pt-4 border-t border-gray-800">
      <label className="block text-sm font-medium text-gray-400 mb-3">Ban Management</label>

      {modalView === "ban" ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <p className="text-sm text-red-400 mb-3">
              You are about to ban <span className="font-semibold">{user.name || user.email}</span>.
              They will be logged out and unable to access their account.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => onBanReasonChange(e.target.value)}
              placeholder="Enter the reason for banning this user..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBan}
              disabled={isUpdating || !banReason.trim()}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Banning..." : "Confirm Ban"}
            </button>
            <button
              onClick={() => { onSetModalView("view"); onBanReasonChange(""); }}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-medium hover:text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : user.banned ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
            <p className="text-sm text-red-400">
              <span className="font-semibold">Ban Reason:</span> {user.banReason || "No reason provided"}
            </p>
          </div>
          <button
            onClick={onUnban}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {isUpdating ? "Unbanning..." : "Unban User"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => onSetModalView("ban")}
          disabled={isUpdating}
          className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium border border-red-500/30 hover:bg-red-600/30 disabled:opacity-50"
        >
          Ban User
        </button>
      )}
    </div>
  );
}

// Activity section component
function ActivitySection({
  showActivity,
  isLoading,
  stats,
  activities,
  onToggle,
}: {
  showActivity: boolean;
  isLoading: boolean;
  stats: ActivityStatsType | null;
  activities: ActivityItem[];
  onToggle: () => void;
}) {
  return (
    <div className="pt-4 border-t border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-400">Activity & History</label>
        <button onClick={onToggle} className="text-sm text-blue-400 hover:text-blue-300">
          {showActivity ? "Hide" : "Show"}
        </button>
      </div>

      {showActivity && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {stats && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <ActivityStats stats={stats} showPrivate={true} />
                </div>
              )}
              <div className="bg-gray-800/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h4>
                <ActivityTimeline activities={activities} emptyMessage="No activity recorded" compact={true} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Pagination component
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

// Beta application card
function BetaApplicationCard({ application }: { application: { status: string; motivation: string } }) {
  return (
    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
      <h4 className="text-sm font-medium text-gray-400 mb-2">Beta Application</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Status:</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            application.status === "approved" ? "bg-emerald-900/30 text-emerald-400" :
            application.status === "rejected" ? "bg-red-900/30 text-red-400" :
            "bg-yellow-900/30 text-yellow-400"
          )}>
            {application.status}
          </span>
        </div>
        <p className="text-gray-400">{application.motivation}</p>
      </div>
    </div>
  );
}

// Helper components
function UserAvatar({ user, size = "md" }: { user: { name?: string | null; image?: string | null }; size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10";
  if (user.image) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={user.image} alt={user.name || ""} className={cn(sizeClass, "rounded-full")} />
    );
  }
  return (
    <div className={cn(sizeClass, "rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold")}>
      {user.name?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const info = ROLE_INFO[role] || ROLE_INFO.user;
  return <span className={cn("px-2 py-0.5 rounded text-xs font-medium", info.bgColor, info.color)}>{info.label}</span>;
}

function StatusBadge({ color, children }: { color: "red" | "emerald" | "blue" | "gray"; children: React.ReactNode }) {
  const colors = {
    red: "bg-red-900/30 text-red-400",
    emerald: "bg-emerald-900/30 text-emerald-400",
    blue: "bg-blue-900/30 text-blue-400",
    gray: "bg-gray-800 text-gray-400",
  };
  return <span className={cn("px-2 py-0.5 rounded text-xs font-medium", colors[color])}>{children}</span>;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-gray-500">{label}</label>
      <p className="text-white capitalize">{value}</p>
    </div>
  );
}

// Icons
function UserIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
