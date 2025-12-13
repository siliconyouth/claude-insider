"use client";

/**
 * Admin Comments Moderation Page
 *
 * Moderators and admins can review, approve, reject, or flag comments.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";

type CommentStatus = "pending" | "approved" | "rejected" | "flagged";

interface CommentWithUser {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_image: string | null;
  user_username: string | null;
  resource_type: "resource" | "doc";
  resource_id: string;
  parent_id: string | null;
  content: string;
  status: CommentStatus;
  is_edited: boolean;
  upvotes: number;
  downvotes: number;
  moderator_name: string | null;
  moderation_notes: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_STYLES: Record<CommentStatus, { bg: string; text: string; label: string }> = {
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
  flagged: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    label: "Flagged",
  },
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CommentStatus | "all">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("status", filter);
      }
      const res = await fetch(`/api/dashboard/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setComments(data.comments || []);
      setCounts(data.counts || {});
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleModerate = useCallback(
    async (commentId: string, status: "approved" | "rejected" | "flagged") => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/dashboard/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, moderationNotes }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update");
        }

        toast.success(`Comment ${status}`);
        setSelectedId(null);
        setModerationNotes("");

        // Update list
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, status, moderation_notes: moderationNotes }
              : c
          )
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update comment");
      } finally {
        setIsSubmitting(false);
      }
    },
    [moderationNotes, toast]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!confirm("Are you sure you want to delete this comment? This cannot be undone.")) {
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/dashboard/comments/${commentId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to delete");
        }

        toast.success("Comment deleted");
        setSelectedId(null);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete comment");
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const pendingCount = counts.pending || 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comment Moderation
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Review and moderate user comments
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(["pending", "approved", "rejected", "flagged"] as const).map((status) => {
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
                {counts[status] || 0}
              </p>
              <p className={cn("text-xs font-medium", style.text)}>
                {style.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "pending", "approved", "rejected", "flagged"] as const).map((status) => (
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

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-[#262626] rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No {filter !== "all" ? filter : ""} comments
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "pending"
              ? "All caught up! No comments awaiting moderation."
              : "Try a different filter to see other comments."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isSelected = selectedId === comment.id;
            const statusStyle = STATUS_STYLES[comment.status];

            return (
              <div
                key={comment.id}
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
                  onClick={() => setSelectedId(isSelected ? null : comment.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                        "bg-gradient-to-br from-violet-600 to-blue-600 text-white"
                      )}
                    >
                      {comment.user_name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          {statusStyle.label}
                        </span>
                        {comment.user_username ? (
                          <Link
                            href={`/users/${comment.user_username}`}
                            className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {comment.user_name || comment.user_email || "Unknown"}
                          </Link>
                        ) : (
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {comment.user_name || comment.user_email || "Unknown"}
                          </span>
                        )}
                        {comment.parent_id && (
                          <span className="text-xs text-gray-400">
                            (reply)
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {comment.content}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{comment.resource_type}</span>
                        <span>•</span>
                        <span>
                          {comment.upvotes - comment.downvotes > 0 ? "+" : ""}
                          {comment.upvotes - comment.downvotes} votes
                        </span>
                        <span>•</span>
                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        {comment.is_edited && (
                          <>
                            <span>•</span>
                            <span>edited</span>
                          </>
                        )}
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
                      {/* Full Content */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Comment
                        </h4>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>

                      {/* Resource Link */}
                      <div>
                        <Link
                          href={
                            comment.resource_type === "doc"
                              ? `/docs/${comment.resource_id}`
                              : `/resources?highlight=${comment.resource_id}`
                          }
                          target="_blank"
                          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                        >
                          View {comment.resource_type === "doc" ? "documentation page" : "resource"}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>

                      {/* Previous Moderation */}
                      {comment.moderation_notes && comment.status !== "pending" && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Moderation Notes
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            {comment.moderation_notes}
                            {comment.moderator_name && (
                              <span className="block mt-1 text-xs text-gray-500">
                                — {comment.moderator_name}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Moderation Actions */}
                      {comment.status === "pending" || comment.status === "flagged" ? (
                        <div className="pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Moderation Notes (optional)
                              </label>
                              <textarea
                                value={moderationNotes}
                                onChange={(e) => setModerationNotes(e.target.value)}
                                placeholder="Add notes about this decision..."
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
                                onClick={() => handleModerate(comment.id, "approved")}
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
                                onClick={() => handleModerate(comment.id, "rejected")}
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
                              {comment.status !== "flagged" && (
                                <button
                                  onClick={() => handleModerate(comment.id, "flagged")}
                                  disabled={isSubmitting}
                                  className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium",
                                    "bg-orange-600 text-white",
                                    "hover:bg-orange-700",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-colors"
                                  )}
                                >
                                  Flag for Review
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(comment.id)}
                                disabled={isSubmitting}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-sm font-medium",
                                  "bg-gray-600 text-white",
                                  "hover:bg-gray-700",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  "transition-colors ml-auto"
                                )}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={isSubmitting}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium",
                              "bg-red-600 text-white",
                              "hover:bg-red-700",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              "transition-colors"
                            )}
                          >
                            Delete Comment
                          </button>
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
