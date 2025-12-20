"use client";

/**
 * ReviewForm Component
 *
 * Form for submitting reviews with:
 * - Star rating selection
 * - Optional title
 * - Content (required, min 10 chars)
 * - Pros/cons lists
 * - Submit with moderation notification
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { toast } from "@/components/toast";
import { RatingStars } from "./rating-stars";

interface ReviewFormProps {
  /** Resource slug for API call */
  resourceSlug: string;
  /** Callback when review is successfully submitted */
  onSuccess?: (review: SubmittedReview) => void;
  /** Callback to close/cancel the form */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

interface SubmittedReview {
  id: string;
  status: string;
  createdAt: string;
}

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

export function ReviewForm({
  resourceSlug,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addPro = useCallback(() => {
    const trimmed = newPro.trim();
    if (trimmed && !pros.includes(trimmed)) {
      setPros((prev) => [...prev, trimmed]);
      setNewPro("");
    }
  }, [newPro, pros]);

  const addCon = useCallback(() => {
    const trimmed = newCon.trim();
    if (trimmed && !cons.includes(trimmed)) {
      setCons((prev) => [...prev, trimmed]);
      setNewCon("");
    }
  }, [newCon, cons]);

  const removePro = useCallback((index: number) => {
    setPros((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeCon = useCallback((index: number) => {
    setCons((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (!content.trim()) {
      newErrors.content = "Review content is required";
    } else if (content.trim().length < 10) {
      newErrors.content = "Review must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rating, content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/resources/${resourceSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          content: content.trim(),
          pros: pros.filter(Boolean),
          cons: cons.filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("You have already reviewed this resource");
        } else {
          toast.error(data.error || "Failed to submit review");
        }
        return;
      }

      toast.success("Review submitted for moderation");
      onSuccess?.(data.review);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <RatingStars
          value={rating}
          onChange={setRating}
          size="lg"
          disabled={isSubmitting}
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.rating}
          </p>
        )}
      </div>

      {/* Title (optional) */}
      <div>
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Title <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-2 rounded-lg",
            "bg-white dark:bg-[#1a1a1a]",
            "border border-gray-200 dark:border-[#333333]",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this resource..."
          rows={4}
          maxLength={5000}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-3 rounded-lg resize-none",
            "bg-white dark:bg-[#1a1a1a]",
            "border",
            errors.content
              ? "border-red-300 dark:border-red-800"
              : "border-gray-200 dark:border-[#333333]",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <div className="mt-1 flex justify-between">
          {errors.content ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.content}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">
            {content.length}/5000
          </span>
        </div>
      </div>

      {/* Pros */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-green-500" />
            Pros <span className="text-gray-400 font-normal">(optional)</span>
          </span>
        </label>
        <div className="space-y-2">
          {pros.map((pro, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "bg-green-50 dark:bg-green-900/20",
                "border border-green-200 dark:border-green-800"
              )}
            >
              <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-green-800 dark:text-green-300">
                {pro}
              </span>
              <button
                type="button"
                onClick={() => removePro(index)}
                disabled={isSubmitting}
                className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded"
                aria-label={`Remove pro: ${pro}`}
              >
                <XIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPro}
              onChange={(e) => setNewPro(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPro();
                }
              }}
              placeholder="Add a pro..."
              maxLength={100}
              disabled={isSubmitting || pros.length >= 5}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm",
                "bg-white dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#333333]",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-green-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <button
              type="button"
              onClick={addPro}
              disabled={isSubmitting || !newPro.trim() || pros.length >= 5}
              className={cn(
                "px-3 py-2 rounded-lg",
                "bg-green-100 dark:bg-green-900/30",
                "text-green-700 dark:text-green-400",
                "hover:bg-green-200 dark:hover:bg-green-900/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
              aria-label="Add pro"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cons */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          <span className="flex items-center gap-1.5">
            <MinusIcon className="w-4 h-4 text-red-500" />
            Cons <span className="text-gray-400 font-normal">(optional)</span>
          </span>
        </label>
        <div className="space-y-2">
          {cons.map((con, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "bg-red-50 dark:bg-red-900/20",
                "border border-red-200 dark:border-red-800"
              )}
            >
              <MinusIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-red-800 dark:text-red-300">
                {con}
              </span>
              <button
                type="button"
                onClick={() => removeCon(index)}
                disabled={isSubmitting}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded"
                aria-label={`Remove con: ${con}`}
              >
                <XIcon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCon}
              onChange={(e) => setNewCon(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCon();
                }
              }}
              placeholder="Add a con..."
              maxLength={100}
              disabled={isSubmitting || cons.length >= 5}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm",
                "bg-white dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#333333]",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-red-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <button
              type="button"
              onClick={addCon}
              disabled={isSubmitting || !newCon.trim() || cons.length >= 5}
              className={cn(
                "px-3 py-2 rounded-lg",
                "bg-red-100 dark:bg-red-900/30",
                "text-red-700 dark:text-red-400",
                "hover:bg-red-200 dark:hover:bg-red-900/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
              aria-label="Add con"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info about moderation */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg",
          "bg-blue-50 dark:bg-blue-900/20",
          "border border-blue-200 dark:border-blue-800"
        )}
      >
        <svg
          className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">Reviews are moderated</p>
          <p className="mt-1 opacity-80">
            Your review will be visible after it&apos;s approved by our moderators.
            This usually takes less than 24 hours.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-semibold text-white",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "shadow-lg shadow-blue-500/25",
            "hover:-translate-y-0.5",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
            "transition-all duration-200"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit Review"
          )}
        </button>
      </div>
    </form>
  );
}
