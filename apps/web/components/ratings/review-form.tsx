"use client";

/**
 * Review Form Component
 *
 * Form to submit or edit a review.
 */

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { submitReview } from "@/app/actions/ratings";
import { useToast } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";

interface ReviewFormProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    content: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  resourceType,
  resourceId,
  existingReview,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [content, setContent] = useState(existingReview?.content || "");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const { isAuthenticated, showSignIn } = useAuth();

  const isEditing = !!existingReview;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showSignIn();
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (content.length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    startTransition(async () => {
      const result = await submitReview(resourceType, resourceId, {
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Review updated!" : "Review submitted!");
        onSuccess?.();
        if (!isEditing) {
          setRating(0);
          setTitle("");
          setContent("");
        }
      }
    });
  };

  const displayRating = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "p-6 rounded-xl",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Rating *
        </label>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg
                className={cn(
                  "w-8 h-8 transition-colors",
                  value <= displayRating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300 dark:text-gray-600"
                )}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </span>
          )}
        </div>
      </div>

      {/* Title (optional) */}
      <div className="mb-4">
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review"
          maxLength={100}
          className={cn(
            "w-full px-4 py-2 rounded-lg",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors"
          )}
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Your Review *
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this resource..."
          rows={4}
          minLength={10}
          maxLength={2000}
          className={cn(
            "w-full px-4 py-3 rounded-lg resize-none",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors"
          )}
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {content.length}/2000
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || rating === 0 || content.length < 10}
          className={cn(
            "px-6 py-2 text-sm font-medium rounded-lg",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-sm shadow-blue-500/25",
            "hover:shadow-md hover:-translate-y-0.5",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
            "transition-all duration-200"
          )}
        >
          {isPending
            ? "Submitting..."
            : isEditing
            ? "Update Review"
            : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
