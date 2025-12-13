"use client";

/**
 * User Suggestions Page
 *
 * Shows the user's submitted edit suggestions and their status.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getUserSuggestions, deleteSuggestion, type Suggestion, type SuggestionStatus } from "@/app/actions/suggestions";
import { useToast } from "@/components/toast";

const STATUS_STYLES: Record<SuggestionStatus, { bg: string; text: string; label: string }> = {
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Pending Review",
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
  content: "Content Update",
  metadata: "Metadata",
  typo: "Typo / Grammar",
  other: "Other",
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    async function fetchSuggestions() {
      setIsLoading(true);
      const result = await getUserSuggestions();
      if (result.error) {
        toast.error(result.error);
      } else {
        setSuggestions(result.data || []);
      }
      setIsLoading(false);
    }

    fetchSuggestions();
  }, [toast]);

  const handleDelete = useCallback(
    async (suggestion: Suggestion) => {
      if (!confirm("Delete this suggestion? This cannot be undone.")) return;

      // Optimistic update
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));

      const result = await deleteSuggestion(suggestion.id);
      if (result.error) {
        // Revert
        const refreshed = await getUserSuggestions();
        setSuggestions(refreshed.data || []);
        toast.error(result.error);
      } else {
        toast.success("Suggestion deleted");
      }
    },
    [toast]
  );

  const filteredSuggestions = suggestions.filter(
    (s) => filter === "all" || s.status === filter
  );

  const statusCounts = suggestions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Suggestions
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track the status of your edit suggestions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {(["pending", "approved", "rejected", "merged"] as const).map((status) => {
          const style = STATUS_STYLES[status];
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={cn(
                "p-4 rounded-xl text-center transition-all",
                "border",
                filter === status
                  ? "border-blue-500 shadow-lg"
                  : "border-gray-200 dark:border-[#262626] hover:border-blue-500/50"
              )}
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {statusCounts[status] || 0}
              </p>
              <p className={cn("text-xs font-medium", style.text)}>
                {style.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
          )}
        >
          All ({suggestions.length})
        </button>
        {(["pending", "approved", "rejected", "merged"] as const).map((status) => (
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
            {STATUS_STYLES[status].label}
          </button>
        ))}
      </div>

      {/* Suggestions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-5 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {filter === "all" ? "No suggestions yet" : `No ${filter} suggestions`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === "all"
              ? "Suggest edits on documentation pages to help improve the content!"
              : "Try a different filter to see other suggestions."}
          </p>
          {filter === "all" && (
            <Link
              href="/docs"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:-translate-y-0.5 transition-transform"
              )}
            >
              Browse Documentation
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion) => {
            const isExpanded = expandedId === suggestion.id;
            const statusStyle = STATUS_STYLES[suggestion.status];

            return (
              <div
                key={suggestion.id}
                className={cn(
                  "rounded-xl overflow-hidden",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "transition-all duration-200"
                )}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                  className="w-full p-4 text-left flex items-start gap-4"
                >
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded",
                      statusStyle.bg,
                      statusStyle.text
                    )}
                  >
                    {statusStyle.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {suggestion.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{suggestion.resource_type}</span>
                      <span>•</span>
                      <span>{TYPE_LABELS[suggestion.suggestion_type]}</span>
                      <span>•</span>
                      <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <svg
                    className={cn(
                      "w-5 h-5 text-gray-400 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                    <div className="pt-4 space-y-4">
                      {/* Description */}
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
                          <pre className="p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-sm text-gray-600 dark:text-gray-400 overflow-x-auto font-mono whitespace-pre-wrap">
                            {suggestion.suggested_changes}
                          </pre>
                        </div>
                      )}

                      {/* Reviewer Notes */}
                      {suggestion.reviewer_notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Reviewer Notes
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            {suggestion.reviewer_notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <Link
                          href={
                            suggestion.resource_type === "doc"
                              ? `/docs/${suggestion.resource_id}`
                              : `/resources?highlight=${suggestion.resource_id}`
                          }
                          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
                        >
                          View {suggestion.resource_type === "doc" ? "page" : "resource"}
                        </Link>

                        {suggestion.status === "pending" && (
                          <button
                            onClick={() => handleDelete(suggestion)}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
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
