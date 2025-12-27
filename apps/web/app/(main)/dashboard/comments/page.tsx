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
import {
  MODERATION_STATUS,
  type ModerationStatus,
  useDashboardAction,
} from "@/lib/dashboard";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/dashboard/shared";

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
  status: ModerationStatus;
  is_edited: boolean;
  upvotes: number;
  downvotes: number;
  moderator_name: string | null;
  moderation_notes: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ModerationStatus | "all">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const toast = useToast();

  // Action hook for moderation
  const { execute, isLoading: isSubmitting } = useDashboardAction({
    onSuccess: () => {
      setSelectedId(null);
      setModerationNotes("");
    },
  });

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
      const result = await execute(`comments/${commentId}`, "PATCH", {
        status,
        moderationNotes,
      });

      if (result.success) {
        toast.success(`Comment ${status}`);
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, status, moderation_notes: moderationNotes }
              : c
          )
        );
      }
    },
    [execute, moderationNotes, toast]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!confirm("Are you sure you want to delete this comment? This cannot be undone.")) {
        return;
      }

      const result = await execute(`comments/${commentId}`, "DELETE");
      if (result.success) {
        toast.success("Comment deleted");
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    },
    [execute, toast]
  );

  const pendingCount = counts.pending || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Comment Moderation"
        description="Review and moderate user comments"
        badge={pendingCount > 0 ? (
          <span className="px-3 py-1 text-sm font-medium rounded-full ui-badge-pending">
            {pendingCount} pending
          </span>
        ) : undefined}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(["pending", "approved", "rejected", "flagged"] as const).map((status) => {
          const style = MODERATION_STATUS[status];
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={cn(
                "p-4 rounded-xl text-center transition-all border ui-bg-card",
                filter === status
                  ? "border-blue-500 shadow-lg"
                  : "ui-border hover:border-blue-500/50"
              )}
            >
              <p className="text-2xl font-bold ui-text-heading tabular-nums">
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
                : "ui-bg-card ui-text-secondary hover:ui-bg-card-hover"
            )}
          >
            {status === "all" ? "All" : MODERATION_STATUS[status].label}
          </button>
        ))}
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl ui-bg-card border ui-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 ui-bg-skeleton rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 ui-bg-skeleton rounded animate-pulse" />
                  <div className="h-4 w-full ui-bg-skeleton rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<CommentIcon />}
          message={`No ${filter !== "all" ? filter : ""} comments`}
          description={
            filter === "pending"
              ? "All caught up! No comments awaiting moderation."
              : "Try a different filter to see other comments."
          }
        />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              isSelected={selectedId === comment.id}
              onToggle={() => setSelectedId(selectedId === comment.id ? null : comment.id)}
              moderationNotes={moderationNotes}
              onNotesChange={setModerationNotes}
              onModerate={handleModerate}
              onDelete={handleDelete}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Comment row component
function CommentRow({
  comment,
  isSelected,
  onToggle,
  moderationNotes,
  onNotesChange,
  onModerate,
  onDelete,
  isSubmitting,
}: {
  comment: CommentWithUser;
  isSelected: boolean;
  onToggle: () => void;
  moderationNotes: string;
  onNotesChange: (notes: string) => void;
  onModerate: (id: string, status: "approved" | "rejected" | "flagged") => void;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
}) {
  const statusStyle = MODERATION_STATUS[comment.status];

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden ui-bg-card border transition-all",
        isSelected ? "border-blue-500 shadow-lg" : "ui-border"
      )}
    >
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 bg-gradient-to-br from-violet-600 to-blue-600 text-white">
            {comment.user_name?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge style={statusStyle} />
              {comment.user_username ? (
                <Link
                  href={`/users/${comment.user_username}`}
                  className="font-medium text-sm ui-text-heading hover:text-cyan-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {comment.user_name || comment.user_email || "Unknown"}
                </Link>
              ) : (
                <span className="font-medium text-sm ui-text-heading">
                  {comment.user_name || comment.user_email || "Unknown"}
                </span>
              )}
              {comment.parent_id && (
                <span className="text-xs ui-text-secondary">(reply)</span>
              )}
            </div>

            <p className="mt-1 text-sm ui-text-body line-clamp-2">
              {comment.content}
            </p>

            <div className="mt-2 flex items-center gap-3 text-xs ui-text-secondary">
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
              "w-5 h-5 ui-text-secondary transition-transform shrink-0",
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
        <ExpandedPanel
          comment={comment}
          moderationNotes={moderationNotes}
          onNotesChange={onNotesChange}
          onModerate={onModerate}
          onDelete={onDelete}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Expanded panel component
function ExpandedPanel({
  comment,
  moderationNotes,
  onNotesChange,
  onModerate,
  onDelete,
  isSubmitting,
}: {
  comment: CommentWithUser;
  moderationNotes: string;
  onNotesChange: (notes: string) => void;
  onModerate: (id: string, status: "approved" | "rejected" | "flagged") => void;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="px-4 pb-4 border-t ui-border">
      <div className="pt-4 space-y-4">
        {/* Full Content */}
        <div>
          <h4 className="text-sm font-medium ui-text-body mb-1">Full Comment</h4>
          <div className="p-3 rounded-lg ui-bg-input border ui-border">
            <p className="text-sm ui-text-secondary whitespace-pre-wrap">{comment.content}</p>
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
            className="text-sm text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            View {comment.resource_type === "doc" ? "documentation page" : "resource"}
            <ExternalLinkIcon />
          </Link>
        </div>

        {/* Previous Moderation */}
        {comment.moderation_notes && comment.status !== "pending" && (
          <div>
            <h4 className="text-sm font-medium ui-text-body mb-1">Moderation Notes</h4>
            <p className="text-sm ui-text-secondary p-3 rounded-lg ui-card-info">
              {comment.moderation_notes}
              {comment.moderator_name && (
                <span className="block mt-1 text-xs ui-text-muted">— {comment.moderator_name}</span>
              )}
            </p>
          </div>
        )}

        {/* Moderation Actions */}
        {comment.status === "pending" || comment.status === "flagged" ? (
          <div className="pt-4 border-t ui-border">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium ui-text-body mb-1">
                  Moderation Notes (optional)
                </label>
                <textarea
                  value={moderationNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none ui-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={() => onModerate(comment.id, "approved")}
                  disabled={isSubmitting}
                  variant="success"
                >
                  Approve
                </ActionButton>
                <ActionButton
                  onClick={() => onModerate(comment.id, "rejected")}
                  disabled={isSubmitting}
                  variant="danger"
                >
                  Reject
                </ActionButton>
                {comment.status !== "flagged" && (
                  <ActionButton
                    onClick={() => onModerate(comment.id, "flagged")}
                    disabled={isSubmitting}
                    variant="warning"
                  >
                    Flag for Review
                  </ActionButton>
                )}
                <ActionButton
                  onClick={() => onDelete(comment.id)}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="ml-auto"
                >
                  Delete
                </ActionButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t ui-border">
            <ActionButton
              onClick={() => onDelete(comment.id)}
              disabled={isSubmitting}
              variant="danger"
            >
              Delete Comment
            </ActionButton>
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
  className,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: "success" | "danger" | "warning" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const variantStyles = {
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    ghost: "bg-gray-700 text-white hover:bg-gray-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        variantStyles[variant],
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

// Icons
function CommentIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
