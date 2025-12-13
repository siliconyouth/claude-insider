"use client";

/**
 * Admin Suggestions Review Page
 *
 * Moderators and admins can review, approve, or reject edit suggestions.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";

type SuggestionStatus = "pending" | "approved" | "rejected" | "merged";

interface SuggestionWithUser {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_username: string | null;
  resource_type: "resource" | "doc";
  resource_id: string;
  suggestion_type: "content" | "metadata" | "typo" | "other";
  title: string;
  description: string;
  suggested_changes: string | null;
  status: SuggestionStatus;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_STYLES: Record<SuggestionStatus, { bg: string; text: string; label: string }> = {
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Pending",
  },
  approved: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Rejected",
  },
  merged: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Merged",
  },
};

const TYPE_LABELS: Record<string, string> = {
  content: "Content",
  metadata: "Metadata",
  typo: "Typo",
  other: "Other",
};

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SuggestionStatus | "all">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Fetch suggestions
  useEffect(() => {
    async function fetchSuggestions() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("status", filter);
        }
        const res = await fetch(`/api/dashboard/suggestions?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        toast.error("Failed to load suggestions");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, [filter, toast]);

  const handleReview = useCallback(
    async (suggestionId: string, status: "approved" | "rejected" | "merged") => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/dashboard/suggestions/${suggestionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reviewerNotes: reviewNotes }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update");
        }

        toast.success(`Suggestion ${status}`);
        setSelectedId(null);
        setReviewNotes("");

        // Refresh list
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId ? { ...s, status, reviewer_notes: reviewNotes } : s
          )
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update suggestion");
      } finally {
        setIsSubmitting(false);
      }
    },
    [reviewNotes, toast]
  );

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Suggestions
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Review and manage user-submitted content suggestions
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "pending", "approved", "rejected", "merged"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            {status === "all" ? "All" : STATUS_STYLES[status].label}
          </button>
        ))}
      </div>

      {/* Suggestions Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-5 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No {filter !== "all" ? filter : ""} suggestions
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "pending"
              ? "All caught up! No suggestions awaiting review."
              : "Try a different filter to see other suggestions."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const isSelected = selectedId === suggestion.id;
            const statusStyle = STATUS_STYLES[suggestion.status];

            return (
              <div
                key={suggestion.id}
                className={cn(
                  "rounded-xl overflow-hidden",
                  "bg-white dark:bg-[#111111]",
                  "border transition-all",
                  isSelected
                    ? "border-blue-500 shadow-lg"
                    : "border-gray-200 dark:border-[#262626]"
                )}
              >
                {/* Row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedId(isSelected ? null : suggestion.id)}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded shrink-0",
                        statusStyle.bg,
                        statusStyle.text
                      )}
                    >
                      {statusStyle.label}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.title}
                        </h3>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium rounded",
                            "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {TYPE_LABELS[suggestion.suggestion_type]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                        {suggestion.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          by{" "}
                          {suggestion.user_username ? (
                            <Link
                              href={`/users/${suggestion.user_username}`}
                              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {suggestion.user_name || suggestion.user_email || "Unknown"}
                            </Link>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
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

                    <svg
                      className={cn(
                        "w-5 h-5 text-gray-400 transition-transform shrink-0",
                        isSelected && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Panel */}
                {isSelected && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                    <div className="pt-4 space-y-4">
                      {/* Full Description */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {suggestion.description}
                        </p>
                      </div>

                      {/* Suggested Changes */}
                      {suggestion.suggested_changes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Suggested Text
                          </h4>
                          <pre className="p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-sm text-gray-600 dark:text-gray-400 overflow-x-auto font-mono whitespace-pre-wrap border border-gray-200 dark:border-[#262626]">
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
                          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                        >
                          View {suggestion.resource_type === "doc" ? "documentation page" : "resource"}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>

                      {/* Review Actions */}
                      {suggestion.status === "pending" && (
                        <div className="pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Review Notes (optional)
                              </label>
                              <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add notes for the submitter..."
                                rows={2}
                                className={cn(
                                  "w-full px-3 py-2 rounded-lg text-sm resize-none",
                                  "bg-gray-50 dark:bg-[#0a0a0a]",
                                  "border border-gray-200 dark:border-[#262626]",
                                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                  "text-gray-900 dark:text-white",
                                  "placeholder-gray-400"
                                )}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReview(suggestion.id, "approved")}
                                disabled={isSubmitting}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-sm font-medium",
                                  "bg-green-600 text-white",
                                  "hover:bg-green-700",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "transition-colors"
                                )}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(suggestion.id, "rejected")}
                                disabled={isSubmitting}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-sm font-medium",
                                  "bg-red-600 text-white",
                                  "hover:bg-red-700",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "transition-colors"
                                )}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleReview(suggestion.id, "merged")}
                                disabled={isSubmitting}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-sm font-medium",
                                  "bg-blue-600 text-white",
                                  "hover:bg-blue-700",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "transition-colors"
                                )}
                              >
                                Mark as Merged
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Existing Review Notes */}
                      {suggestion.reviewer_notes && suggestion.status !== "pending" && (
                        <div className="pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Review Notes
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            {suggestion.reviewer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
