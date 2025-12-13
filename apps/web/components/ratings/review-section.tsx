"use client";

/**
 * Review Section Component
 *
 * Complete reviews section with stats, form, and list.
 */

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import {
  getReviews,
  getRatingStats,
  getUserReview,
  deleteReview,
  type Review,
  type RatingStats,
} from "@/app/actions/ratings";
import { useToast } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { StarDisplay } from "./star-rating";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";

interface ReviewSectionProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  resourceTitle?: string;
  className?: string;
}

export function ReviewSection({
  resourceType,
  resourceId,
  resourceTitle,
  className,
}: ReviewSectionProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview] = useState<{
    id: string;
    rating: number;
    title: string | null;
    content: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "highest" | "lowest">("recent");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  // Load data
  useEffect(() => {
    loadData();
  }, [resourceType, resourceId, sortBy]);

  const loadData = async () => {
    setIsLoading(true);

    const [statsResult, reviewsResult, userReviewResult] = await Promise.all([
      getRatingStats(resourceType, resourceId),
      getReviews(resourceType, resourceId, { sortBy, limit: 10 }),
      getUserReview(resourceType, resourceId),
    ]);

    if (statsResult) setStats(statsResult);
    if (reviewsResult.reviews) {
      setReviews(reviewsResult.reviews);
      setTotalReviews(reviewsResult.total || 0);
    }
    if (userReviewResult.review) {
      setUserReview(userReviewResult.review);
    }

    setIsLoading(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Review deleted");
        setUserReview(null);
        loadData();
      }
    });
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    loadData();
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Stats skeleton */}
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-[#262626] rounded mb-4" />
          <div className="flex gap-8">
            <div className="h-16 w-24 bg-gray-200 dark:bg-[#262626] rounded" />
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((i) => (
                <div
                  key={i}
                  className="h-3 bg-gray-200 dark:bg-[#262626] rounded"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reviews {totalReviews > 0 && `(${totalReviews})`}
        </h2>

        {isAuthenticated && !userReview && (
          <button
            onClick={() => setShowForm(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-sm shadow-blue-500/25",
              "hover:shadow-md hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && stats.totalRatings > 0 && (
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="flex gap-8">
            {/* Average */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarDisplay rating={stats.averageRating} size="md" className="justify-center mt-1" />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalRatings} rating{stats.totalRatings !== 1 && "s"}
              </div>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5];
                const percentage = stats.totalRatings > 0
                  ? (count / stats.totalRatings) * 100
                  : 0;

                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-sm text-gray-600 dark:text-gray-400">
                      {star}
                    </span>
                    <svg
                      className="w-4 h-4 text-yellow-500 fill-yellow-500"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs text-gray-500 dark:text-gray-400 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* User's existing review */}
      {userReview && !showForm && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Review
            </h3>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Edit
            </button>
          </div>
          <ReviewCard
            review={{
              id: userReview.id,
              userId: "",
              userName: "You",
              userUsername: null,
              userImage: null,
              rating: userReview.rating,
              title: userReview.title,
              content: userReview.content,
              helpfulCount: 0,
              hasVotedHelpful: false,
              isOwn: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            onDelete={() => handleDeleteReview(userReview.id)}
          />
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <ReviewForm
          resourceType={resourceType}
          resourceId={resourceId}
          existingReview={userReview || undefined}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {/* Sort options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
            <div className="flex gap-1">
              {(["recent", "helpful", "highest", "lowest"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-lg transition-colors",
                    sortBy === option
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            {reviews
              .filter((r) => r.id !== userReview?.id) // Don't show user's review twice
              .map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onDelete={
                    review.isOwn ? () => handleDeleteReview(review.id) : undefined
                  }
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reviews.length === 0 && !userReview && (
        <div
          className={cn(
            "p-8 rounded-xl text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No reviews yet for {resourceTitle || "this resource"}
          </p>
          {isAuthenticated ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Be the first to write a review
            </button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Sign in to write a review
            </p>
          )}
        </div>
      )}
    </div>
  );
}
