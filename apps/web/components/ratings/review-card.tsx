"use client";

/**
 * Review Card Component
 *
 * Display a single review with helpful voting.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { voteHelpful, reportReview, type Review } from "@/app/actions/ratings";
import { useToast } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { StarDisplay } from "./star-rating";

interface ReviewCardProps {
  review: Review;
  onDelete?: () => void;
  className?: string;
}

export function ReviewCard({ review, onDelete, className }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [hasVoted, setHasVoted] = useState(review.hasVotedHelpful);
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const { isAuthenticated, showSignIn } = useAuth();

  const handleVoteHelpful = () => {
    if (!isAuthenticated) {
      showSignIn();
      return;
    }

    // Optimistic update
    const newVoted = !hasVoted;
    setHasVoted(newVoted);
    setHelpfulCount((prev) => prev + (newVoted ? 1 : -1));

    startTransition(async () => {
      const result = await voteHelpful(review.id);
      if (result.error) {
        // Revert on error
        setHasVoted(!newVoted);
        setHelpfulCount((prev) => prev + (newVoted ? -1 : 1));
        toast.error(result.error);
      }
    });
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      showSignIn();
      return;
    }

    startTransition(async () => {
      const result = await reportReview(review.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Review reported for moderation");
      }
      setShowMenu(false);
    });
  };

  const timeAgo = getTimeAgo(new Date(review.createdAt));

  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Link
            href={review.userUsername ? `/users/${review.userUsername}` : "#"}
            className="flex-shrink-0"
          >
            {review.userImage ? (
              <img
                src={review.userImage}
                alt={review.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                {review.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>

          {/* User info */}
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={review.userUsername ? `/users/${review.userUsername}` : "#"}
                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400"
              >
                {review.userName}
              </Link>
              {review.isOwn && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarDisplay rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div
                className={cn(
                  "absolute right-0 top-full mt-1 z-20 py-1 rounded-lg min-w-32",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "shadow-lg"
                )}
              >
                {review.isOwn && onDelete && (
                  <button
                    onClick={onDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-[#262626]"
                  >
                    Delete
                  </button>
                )}
                {!review.isOwn && (
                  <button
                    onClick={handleReport}
                    disabled={isPending}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#262626]"
                  >
                    Report
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          {review.title}
        </h4>
      )}

      {/* Content */}
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
        {review.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262626]">
        <button
          onClick={handleVoteHelpful}
          disabled={isPending}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            hasVoted
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          )}
        >
          <svg
            className="w-4 h-4"
            fill={hasVoted ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          <span>Helpful ({helpfulCount})</span>
        </button>

        {review.updatedAt !== review.createdAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Edited
          </span>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
