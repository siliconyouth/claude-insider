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
import {
  PageHeader,
  EmptyState,
  ReviewModal,
  ConfirmModal,
  NotesField,
} from "@/components/dashboard/shared";

type TabView = "banned" | "appeals";
type AppealFilter = "all" | "pending" | "approved" | "rejected";

// Status styles for appeals (with light mode support)
const APPEAL_STATUS = {
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Pending" },
  approved: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Approved" },
  rejected: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Rejected" },
};

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

  const pendingCount = appeals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banned Users & Appeals"
        description="Manage banned users and review ban appeals"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b ui-border">
        <TabButton
          active={activeTab === "appeals"}
          onClick={() => setActiveTab("appeals")}
          badge={pendingCount > 0 ? pendingCount : undefined}
        >
          Appeals
        </TabButton>
        <TabButton
          active={activeTab === "banned"}
          onClick={() => setActiveTab("banned")}
        >
          Banned Users ({bannedUsersTotal})
        </TabButton>
      </div>

      {/* Appeals Tab */}
      {activeTab === "appeals" && (
        <AppealsTab
          appeals={appeals}
          isLoading={appealsLoading}
          filter={appealFilter}
          onFilterChange={setAppealFilter}
          onReview={(appeal) => {
            setSelectedAppeal(appeal);
            setReviewNotes("");
            setResponseMessage("");
          }}
        />
      )}

      {/* Banned Users Tab */}
      {activeTab === "banned" && (
        <BannedUsersTab
          users={bannedUsers}
          isLoading={bannedUsersLoading}
          onUnban={setUnbanTarget}
        />
      )}

      {/* Review Appeal Modal */}
      {selectedAppeal && (
        <ReviewModal
          isOpen={true}
          onClose={() => setSelectedAppeal(null)}
          title="Review Appeal"
          size="md"
          isLoading={isReviewing}
          primaryAction={{
            label: "Approve & Unban",
            onClick: () => handleReviewAppeal("approved"),
            variant: "success",
          }}
          secondaryAction={{
            label: "Reject",
            onClick: () => handleReviewAppeal("rejected"),
            variant: "danger",
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {selectedAppeal.user?.name} • {selectedAppeal.user?.email}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Appeal Reason</label>
              <div className="p-3 rounded-lg bg-gray-800/50 text-sm text-gray-300">
                {selectedAppeal.reason}
              </div>
            </div>
            <NotesField
              label="Internal Notes (not shared with user)"
              value={reviewNotes}
              onChange={setReviewNotes}
              placeholder="Add internal notes for other admins..."
              rows={2}
            />
            <NotesField
              label="Response to User (optional)"
              value={responseMessage}
              onChange={setResponseMessage}
              placeholder="Message that will be sent to the user..."
              rows={2}
            />
          </div>
        </ReviewModal>
      )}

      {/* Unban Confirmation Modal */}
      <ConfirmModal
        isOpen={!!unbanTarget}
        onClose={() => setUnbanTarget(null)}
        onConfirm={handleUnban}
        title="Unban User"
        message={`Are you sure you want to unban ${unbanTarget?.name}? They will regain full access to their account.`}
        confirmLabel="Confirm Unban"
        isLoading={isUnbanning}
        variant="warning"
      />
    </div>
  );
}

// Tab button component
function TabButton({
  active,
  onClick,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-blue-500 text-blue-600 dark:text-blue-400"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          {badge}
        </span>
      )}
    </button>
  );
}

// Appeals tab component
function AppealsTab({
  appeals,
  isLoading,
  filter,
  onFilterChange,
  onReview,
}: {
  appeals: BanAppeal[];
  isLoading: boolean;
  filter: AppealFilter;
  onFilterChange: (filter: AppealFilter) => void;
  onReview: (appeal: BanAppeal) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as AppealFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === f
                ? "ui-filter-active border"
                : "ui-filter-inactive"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Appeals List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 ui-bg-skeleton rounded-xl animate-pulse" />
            ))}
          </div>
        ) : appeals.length === 0 ? (
          <EmptyState
            icon={<AppealIcon />}
            message={`No ${filter !== "all" ? filter : ""} appeals found`}
          />
        ) : (
          appeals.map((appeal) => (
            <AppealCard key={appeal.id} appeal={appeal} onReview={() => onReview(appeal)} />
          ))
        )}
      </div>
    </div>
  );
}

// Appeal card component
function AppealCard({ appeal, onReview }: { appeal: BanAppeal; onReview: () => void }) {
  const status = APPEAL_STATUS[appeal.status as keyof typeof APPEAL_STATUS] || APPEAL_STATUS.pending;

  return (
    <div className={cn("p-4 rounded-xl", "ui-bg-card border ui-border", "hover:border-gray-300 dark:hover:border-gray-700 transition-colors")}>
      <div className="flex items-start gap-4">
        <UserAvatar user={appeal.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium ui-text-heading">{appeal.user?.name || "Unknown User"}</span>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", status.bg, status.text)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm ui-text-secondary mb-1">{appeal.user?.email}</p>

          {appeal.user?.banReason && (
            <div className="text-xs ui-text-muted mb-2">
              <span className="font-medium">Ban reason:</span> {appeal.user.banReason}
            </div>
          )}

          <div className="p-3 rounded-lg ui-bg-skeleton mb-2">
            <p className="text-sm ui-text-body">{appeal.reason}</p>
            {appeal.additionalContext && (
              <div className="mt-2 pt-2 border-t ui-border">
                <p className="text-xs ui-text-muted mb-1">Additional context:</p>
                <p className="text-sm ui-text-secondary">{appeal.additionalContext}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs ui-text-muted">
            <span>Submitted {new Date(appeal.createdAt).toLocaleDateString()}</span>
            {appeal.reviewedAt && <span>Reviewed {new Date(appeal.reviewedAt).toLocaleDateString()}</span>}
          </div>
        </div>

        {appeal.status === "pending" && (
          <button
            onClick={onReview}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            Review
          </button>
        )}
      </div>
    </div>
  );
}

// Banned users tab component
function BannedUsersTab({
  users,
  isLoading,
  onUnban,
}: {
  users: BannedUser[];
  isLoading: boolean;
  onUnban: (user: BannedUser) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border ui-border ui-bg-card p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 ui-bg-skeleton rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border ui-border ui-bg-card">
        <EmptyState icon={<BannedIcon />} message="No banned users" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border ui-border ui-bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="ui-bg-skeleton">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium ui-text-secondary uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium ui-text-secondary uppercase tracking-wider">Ban Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium ui-text-secondary uppercase tracking-wider">Banned</th>
              <th className="px-4 py-3 text-left text-xs font-medium ui-text-secondary uppercase tracking-wider">Appeals</th>
              <th className="px-4 py-3 text-right text-xs font-medium ui-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="ui-divide divide-y">
            {users.map((user) => (
              <BannedUserRow key={user.id} user={user} onUnban={() => onUnban(user)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Banned user row component
function BannedUserRow({ user, onUnban }: { user: BannedUser; onUnban: () => void }) {
  return (
    <tr className="ui-hover-row transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div>
            <p className="text-sm font-medium ui-text-heading">{user.name || "—"}</p>
            <p className="text-xs ui-text-muted">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm ui-text-secondary line-clamp-2 max-w-xs">{user.banReason || "No reason provided"}</p>
      </td>
      <td className="px-4 py-4 text-sm ui-text-secondary">
        {user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : "—"}
        {user.bannedByName && <p className="text-xs ui-text-muted">by {user.bannedByName}</p>}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm ui-text-secondary">{user.appealCount}</span>
          {user.latestAppealStatus === "pending" && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Pending</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          onClick={onUnban}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium",
            "bg-emerald-100 dark:bg-green-600/20 text-emerald-700 dark:text-green-400 hover:bg-emerald-200 dark:hover:bg-green-600/30 transition-colors"
          )}
        >
          Unban
        </button>
      </td>
    </tr>
  );
}

// User avatar component
function UserAvatar({ user }: { user: { name?: string; image?: string | null } | null | undefined }) {
  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.image} alt={user.name || ""} className="w-10 h-10 rounded-full" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-medium">
      {user?.name?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// Icons
function AppealIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BannedIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}
