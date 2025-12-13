"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { getComments, type Comment } from "@/app/actions/comments";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

interface CommentSectionProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  title?: string;
}

export function CommentSection({
  resourceType,
  resourceId,
  title = "Comments",
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getComments(resourceType, resourceId);

    if (result.error) {
      setError(result.error);
    } else {
      setComments(result.data || []);
    }

    setIsLoading(false);
  }, [resourceType, resourceId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const commentCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {commentCount > 0 && (
          <span className="px-2 py-0.5 text-sm font-medium rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400">
            {commentCount}
          </span>
        )}
      </div>

      {/* Comment form */}
      <div className="mb-8">
        <CommentForm
          resourceType={resourceType}
          resourceId={resourceId}
          onSuccess={loadComments}
        />
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#1a1a1a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadComments}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              resourceType={resourceType}
              resourceId={resourceId}
              onRefresh={loadComments}
            />
          ))
        )}
      </div>
    </section>
  );
}
