"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { voteComment, deleteComment, type Comment } from "@/app/actions/comments";
import { useToast } from "@/components/toast";
import { CommentForm } from "./comment-form";
import Link from "next/link";

interface CommentItemProps {
  comment: Comment;
  resourceType: "resource" | "doc";
  resourceId: string;
  onRefresh?: () => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  resourceType,
  resourceId,
  onRefresh,
  isReply = false,
}: CommentItemProps) {
  const { user, isAuthenticated, showSignIn } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localVote, setLocalVote] = useState(comment.user_vote);
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(comment.downvotes);
  const toast = useToast();

  const isOwner = user?.id === comment.user_id;
  const isPending2 = comment.status === "pending";

  const handleVote = (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      toast.info("Sign in to vote");
      showSignIn();
      return;
    }

    // Optimistic update
    const previousVote = localVote;
    const previousUp = localUpvotes;
    const previousDown = localDownvotes;

    if (localVote === voteType) {
      // Remove vote
      setLocalVote(null);
      if (voteType === "up") setLocalUpvotes((v) => v - 1);
      else setLocalDownvotes((v) => v - 1);
    } else {
      // Change or add vote
      if (localVote === "up") setLocalUpvotes((v) => v - 1);
      if (localVote === "down") setLocalDownvotes((v) => v - 1);
      setLocalVote(voteType);
      if (voteType === "up") setLocalUpvotes((v) => v + 1);
      else setLocalDownvotes((v) => v + 1);
    }

    startTransition(async () => {
      const result = await voteComment(comment.id, voteType);
      if (result.error) {
        // Revert on error
        setLocalVote(previousVote);
        setLocalUpvotes(previousUp);
        setLocalDownvotes(previousDown);
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Comment deleted");
        onRefresh?.();
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "group",
        isReply && "ml-8 pl-4 border-l-2 border-gray-200 dark:border-[#262626]"
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              "bg-gradient-to-br from-violet-600 to-blue-600 text-white"
            )}
          >
            {comment.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            {comment.user?.username ? (
              <Link
                href={`/users/${comment.user.username}`}
                className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              >
                {comment.user.name || "Anonymous"}
              </Link>
            ) : (
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {comment.user?.name || "Anonymous"}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatDate(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            {isPending2 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                Pending review
              </span>
            )}
          </div>

          {/* Comment text */}
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-4">
            {/* Votes */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote("up")}
                disabled={isPending}
                className={cn(
                  "p-1 rounded transition-colors",
                  localVote === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                )}
                aria-label="Upvote"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span
                className={cn(
                  "text-xs font-medium min-w-[1.5rem] text-center",
                  localUpvotes - localDownvotes > 0
                    ? "text-green-600 dark:text-green-400"
                    : localUpvotes - localDownvotes < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-400"
                )}
              >
                {localUpvotes - localDownvotes}
              </span>
              <button
                onClick={() => handleVote("down")}
                disabled={isPending}
                className={cn(
                  "p-1 rounded transition-colors",
                  localVote === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                )}
                aria-label="Downvote"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Reply button (only for top-level comments) */}
            {!isReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              >
                Reply
              </button>
            )}

            {/* Owner actions */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                resourceType={resourceType}
                resourceId={resourceId}
                parentId={comment.id}
                placeholder="Write a reply..."
                autoFocus
                onSuccess={() => {
                  setShowReplyForm(false);
                  onRefresh?.();
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  resourceType={resourceType}
                  resourceId={resourceId}
                  onRefresh={onRefresh}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
