"use client";

/**
 * Beta Testers Management Page
 *
 * Admins can view, search, revoke, and manage beta tester status.
 * Shows all approved beta testers with their application details and feedback stats.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { usePaginatedList, useEntityAction } from "@/lib/dashboard";
import {
  PageHeader,
  StatCard,
  StatGrid,
  FilterBar,
  ConfirmModal,
  ReviewModal,
  DetailRow,
} from "@/components/dashboard/shared";

interface BetaTester {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isBetaTester: boolean;
  betaApprovedAt: string | null;
  createdAt: string;
  feedbackCount: number;
  lastFeedbackAt: string | null;
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
  const [selectedTester, setSelectedTester] = useState<BetaTester | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  // Fetch testers with pagination
  const {
    items: testers,
    isLoading,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    refetch,
    extra,
  } = usePaginatedList<BetaTester>("beta-testers", { limit: 20 });

  const stats = extra.stats as BetaTesterStats | undefined;

  // Revoke action
  const { remove, isLoading: isUpdating } = useEntityAction("beta-testers", {
    successMessage: "Beta tester access revoked",
    onSuccess: () => {
      setSelectedTester(null);
      setShowRevokeConfirm(false);
      refetch();
    },
  });

  const handleRevoke = useCallback(async () => {
    if (selectedTester) {
      await remove(selectedTester.id);
    }
  }, [selectedTester, remove]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beta Testers"
        description="Manage approved beta testers and their access"
        actions={
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
        }
      />

      {/* Stats */}
      {stats && (
        <StatGrid columns={3}>
          <StatCard
            label="Total Beta Testers"
            value={stats.totalTesters}
            variant="success"
            icon={<UsersIcon />}
          />
          <StatCard
            label="Active This Month"
            value={stats.activeThisMonth}
            variant="info"
            icon={<BoltIcon />}
          />
          <StatCard
            label="Total Feedback"
            value={stats.totalFeedback}
            variant="default"
            icon={<ChatIcon />}
          />
        </StatGrid>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
      />

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
              <TesterRow
                key={tester.id}
                tester={tester}
                onSelect={() => setSelectedTester(tester)}
                onRevoke={() => {
                  setSelectedTester(tester);
                  setShowRevokeConfirm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTester && !showRevokeConfirm && (
        <ReviewModal
          isOpen={true}
          onClose={() => setSelectedTester(null)}
          title="Beta Tester Details"
          size="md"
          primaryAction={{
            label: "View Feedback",
            onClick: () => {
              window.location.href = `/dashboard/feedback?user=${selectedTester.id}`;
            },
          }}
          secondaryAction={{
            label: "Revoke Access",
            onClick: () => setShowRevokeConfirm(true),
            variant: "danger",
          }}
        >
          <TesterDetails tester={selectedTester} />
        </ReviewModal>
      )}

      {/* Revoke Confirmation */}
      <ConfirmModal
        isOpen={showRevokeConfirm && !!selectedTester}
        onClose={() => {
          setShowRevokeConfirm(false);
          setSelectedTester(null);
        }}
        onConfirm={handleRevoke}
        title="Revoke Beta Access"
        message={`Are you sure you want to revoke beta tester access for ${selectedTester?.name}? They will lose access to beta features.`}
        confirmLabel="Revoke Access"
        isLoading={isUpdating}
        variant="danger"
      />
    </div>
  );
}

// Tester row component
function TesterRow({
  tester,
  onSelect,
  onRevoke,
}: {
  tester: BetaTester;
  onSelect: () => void;
  onRevoke: () => void;
}) {
  return (
    <div
      className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        <Avatar name={tester.name} url={tester.avatarUrl} />
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
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-white">{tester.feedbackCount} feedback</p>
          <p className="text-xs text-gray-500">
            {tester.betaApprovedAt
              ? `Since ${new Date(tester.betaApprovedAt).toLocaleDateString()}`
              : `Joined ${new Date(tester.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRevoke();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-900/20 transition-colors"
        >
          Revoke
        </button>
      </div>
    </div>
  );
}

// Tester details for modal
function TesterDetails({ tester }: { tester: BetaTester }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={tester.name} url={tester.avatarUrl} size="lg" />
        <div>
          <h4 className="text-lg font-medium text-white">{tester.name}</h4>
          <p className="text-sm text-gray-400">{tester.email}</p>
          {tester.experienceLevel && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
              {tester.experienceLevel}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gray-800/50">
          <p className="text-2xl font-bold text-white">{tester.feedbackCount}</p>
          <p className="text-xs text-gray-400">Feedback Submitted</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800/50">
          <p className="text-sm font-medium text-white">
            {tester.lastFeedbackAt
              ? new Date(tester.lastFeedbackAt).toLocaleDateString()
              : "Never"}
          </p>
          <p className="text-xs text-gray-400">Last Feedback</p>
        </div>
      </div>

      {tester.motivation && (
        <div>
          <label className="text-sm font-medium text-gray-400">Motivation</label>
          <p className="mt-1 text-sm text-white whitespace-pre-wrap line-clamp-4">
            {tester.motivation}
          </p>
        </div>
      )}

      <div className="flex gap-4 text-sm text-gray-400">
        <span>
          Beta since: {tester.betaApprovedAt
            ? new Date(tester.betaApprovedAt).toLocaleDateString()
            : "N/A"}
        </span>
        <span>Joined: {new Date(tester.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// Avatar component
function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url: string | null;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12";
  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full bg-gradient-to-br from-violet-500 to-cyan-500",
        "flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden"
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        name?.charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}

// Icons
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
