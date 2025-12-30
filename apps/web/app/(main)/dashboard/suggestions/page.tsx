"use client";

/**
 * Admin Suggestions Review Page
 *
 * Moderators and admins can review, approve, or reject edit suggestions.
 *
 * Migrated to TanStack Query for:
 * - Automatic caching with stale-while-revalidate
 * - Optimistic UI updates on mutations
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { MODERATION_STATUS } from "@/lib/dashboard";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dashboard/shared";
import {
  useSuggestionsList,
  useReviewSuggestion,
  type SuggestionStatus,
  type SuggestionWithUser,
} from "@/lib/query/hooks";

// Extended status config for suggestions (includes "merged")
const SUGGESTION_STATUS = {
  ...MODERATION_STATUS,
  merged: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Merged",
    border: "border-blue-300 dark:border-blue-500/30",
  },
};

const TYPE_LABELS: Record<string, string> = {
  content: "Content",
  metadata: "Metadata",
  typo: "Typo",
  other: "Other",
};

export default function AdminSuggestionsPage() {
  // Filter state (local)
  const [filter, setFilter] = useState<SuggestionStatus>("pending");

  // Modal state (local)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // TanStack Query hooks
  const suggestionsQuery = useSuggestionsList({
    status: filter,
  });

  const reviewMutation = useReviewSuggestion();

  // Derived data
  const suggestions = suggestionsQuery.data?.suggestions || [];
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  const handleReview = (suggestionId: string, status: "approved" | "rejected" | "merged") => {
    reviewMutation.mutate(
      { suggestionId, status, reviewerNotes: reviewNotes },
      {
        onSuccess: () => {
          setSelectedId(null);
          setReviewNotes("");
        },
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Edit Suggestions"
        description="Review and manage user-submitted content suggestions"
        badge={
          pendingCount > 0 ? (
            <span className="px-3 py-1 text-sm font-medium rounded-full ui-badge-pending">
              {pendingCount} pending
            </span>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "pending", "approved", "rejected", "merged"] as SuggestionStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === status
                ? "bg-blue-600 text-white"
                : "ui-bg-card ui-text-secondary hover:ui-bg-card-hover"
            )}
          >
            {status === "all" ? "All" : SUGGESTION_STATUS[status as keyof typeof SUGGESTION_STATUS]?.label || status}
          </button>
        ))}
      </div>

      {/* Suggestions List */}
      {suggestionsQuery.isPending ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl ui-bg-card border ui-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-5 ui-bg-skeleton rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 ui-bg-skeleton rounded animate-pulse" />
                  <div className="h-4 w-32 ui-bg-skeleton rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={<CheckIcon />}
          message={`No ${filter !== "all" ? filter : ""} suggestions`}
          description={
            filter === "pending"
              ? "All caught up! No suggestions awaiting review."
              : "Try a different filter to see other suggestions."
          }
        />
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              isSelected={selectedId === suggestion.id}
              onToggle={() => setSelectedId(selectedId === suggestion.id ? null : suggestion.id)}
              reviewNotes={reviewNotes}
              onNotesChange={setReviewNotes}
              onReview={handleReview}
              isSubmitting={reviewMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Suggestion row component
function SuggestionRow({
  suggestion,
  isSelected,
  onToggle,
  reviewNotes,
  onNotesChange,
  onReview,
  isSubmitting,
}: {
  suggestion: SuggestionWithUser;
  isSelected: boolean;
  onToggle: () => void;
  reviewNotes: string;
  onNotesChange: (notes: string) => void;
  onReview: (id: string, status: "approved" | "rejected" | "merged") => void;
  isSubmitting: boolean;
}) {
  const statusStyle = SUGGESTION_STATUS[suggestion.status as keyof typeof SUGGESTION_STATUS] || SUGGESTION_STATUS.pending;

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden ui-bg-card border transition-all",
        isSelected ? "border-blue-500 shadow-lg" : "ui-border"
      )}
    >
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-4">
          <StatusBadge style={statusStyle} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium ui-text-heading truncate">{suggestion.title}</h3>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded ui-bg-skeleton ui-text-secondary">
                {TYPE_LABELS[suggestion.suggestion_type]}
              </span>
            </div>
            <p className="mt-1 text-sm ui-text-secondary truncate">{suggestion.description}</p>
            <div className="mt-2 flex items-center gap-3 text-xs ui-text-secondary">
              <span>
                by{" "}
                {suggestion.user_username ? (
                  <Link
                    href={`/users/${suggestion.user_username}`}
                    className="ui-text-body hover:text-cyan-400 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {suggestion.user_name || suggestion.user_email || "Unknown"}
                  </Link>
                ) : (
                  <span className="ui-text-body">
                    {suggestion.user_name || suggestion.user_email || "Unknown"}
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="capitalize">{suggestion.resource_type}</span>
              <span>•</span>
              <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <ChevronIcon isOpen={isSelected} />
        </div>
      </div>

      {/* Expanded Panel */}
      {isSelected && (
        <ExpandedPanel
          suggestion={suggestion}
          reviewNotes={reviewNotes}
          onNotesChange={onNotesChange}
          onReview={onReview}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Expanded panel component
function ExpandedPanel({
  suggestion,
  reviewNotes,
  onNotesChange,
  onReview,
  isSubmitting,
}: {
  suggestion: SuggestionWithUser;
  reviewNotes: string;
  onNotesChange: (notes: string) => void;
  onReview: (id: string, status: "approved" | "rejected" | "merged") => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="px-4 pb-4 border-t ui-border">
      <div className="pt-4 space-y-4">
        {/* Full Description */}
        <div>
          <h4 className="text-sm font-medium ui-text-body mb-1">Description</h4>
          <p className="text-sm ui-text-secondary whitespace-pre-wrap">{suggestion.description}</p>
        </div>

        {/* Suggested Changes */}
        {suggestion.suggested_changes && (
          <div>
            <h4 className="text-sm font-medium ui-text-body mb-1">Suggested Text</h4>
            <pre className="p-3 rounded-lg ui-bg-input text-sm ui-text-secondary overflow-x-auto font-mono whitespace-pre-wrap border ui-border">
              {suggestion.suggested_changes}
            </pre>
          </div>
        )}

        {/* Resource Link */}
        <div>
          <Link
            href={
              suggestion.resource_type === "doc"
                ? `/docs/${suggestion.resource_id}`
                : `/resources?highlight=${suggestion.resource_id}`
            }
            target="_blank"
            className="text-sm text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            View {suggestion.resource_type === "doc" ? "documentation page" : "resource"}
            <ExternalLinkIcon />
          </Link>
        </div>

        {/* Review Actions */}
        {suggestion.status === "pending" && (
          <div className="pt-4 border-t ui-border">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium ui-text-body mb-1">
                  Review Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Add notes for the submitter..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none ui-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <ActionButton onClick={() => onReview(suggestion.id, "approved")} disabled={isSubmitting} variant="success">
                  Approve
                </ActionButton>
                <ActionButton onClick={() => onReview(suggestion.id, "rejected")} disabled={isSubmitting} variant="danger">
                  Reject
                </ActionButton>
                <ActionButton onClick={() => onReview(suggestion.id, "merged")} disabled={isSubmitting} variant="primary">
                  Mark as Merged
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* Existing Review Notes */}
        {suggestion.reviewer_notes && suggestion.status !== "pending" && (
          <div className="pt-4 border-t ui-border">
            <h4 className="text-sm font-medium ui-text-body mb-1">Review Notes</h4>
            <p className="text-sm ui-text-secondary p-3 rounded-lg ui-card-info">
              {suggestion.reviewer_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Action button component
function ActionButton({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: "success" | "danger" | "primary";
  children: React.ReactNode;
}) {
  const variantStyles = {
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        variantStyles[variant],
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// Icons
function CheckIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={cn("w-5 h-5 ui-text-secondary transition-transform shrink-0", isOpen && "rotate-180")}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
