"use client";

/**
 * Resource Hero Component
 *
 * Product Hunt-style hero section with icon, title, description,
 * ratings, and action buttons.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { toast } from "@/components/toast";
import { useResourceFavorite, useResourceView } from "@/hooks/use-resource-interactions";
import type { ResourceWithDetails } from "@/lib/resources/queries";
import type { ResourceCategory } from "@/data/resources/schema";

// Icons
const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const HeartIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

interface ResourceHeroProps {
  resource: ResourceWithDetails;
  category?: ResourceCategory;
}

export function ResourceHero({ resource, category }: ResourceHeroProps) {
  const [isSharing, setIsSharing] = useState(false);

  // Use hooks for favorite and view tracking
  const {
    isFavorited,
    favoritesCount,
    isLoading: isFavoriteLoading,
    toggleFavorite,
  } = useResourceFavorite(resource.slug, false, resource.favorites_count);

  const { viewsCount, trackView } = useResourceView(resource.slug, resource.views_count);

  // Track view on mount
  useEffect(() => {
    trackView();
  }, [trackView]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // User cancelled or error
    } finally {
      setIsSharing(false);
    }
  };

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  // Get featured badge color
  const getFeaturedBadgeColor = () => {
    switch (resource.featured_reason?.toLowerCase()) {
      case "editor's pick":
        return "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400";
      case "most popular":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case "trending":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400";
      case "new":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl",
                "bg-gradient-to-br from-gray-100 to-gray-200",
                "dark:from-[#1a1a1a] dark:to-[#262626]",
                "border border-gray-200 dark:border-[#333333]",
                "shadow-lg"
              )}
            >
              {resource.icon_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={resource.icon_url}
                  alt={resource.title}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                category?.icon || "📦"
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {resource.is_featured && resource.featured_reason && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getFeaturedBadgeColor()
                  )}
                >
                  <StarIcon className="w-3 h-3" filled />
                  {resource.featured_reason}
                </span>
              )}
              {resource.status === "official" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  ✓ Official
                </span>
              )}
              {resource.status === "beta" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  Beta
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {resource.title}
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-3xl">
              {resource.description}
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              {resource.ratings_count > 0 && (
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-500" filled />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {resource.average_rating.toFixed(1)}
                  </span>
                  <span>({resource.ratings_count} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                <span>{formatNumber(viewsCount)} views</span>
              </div>
              <div className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4" />
                <span>{formatNumber(favoritesCount)} saves</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {resource.tags.slice(0, 6).map((tag) => (
                <Link
                  key={tag}
                  href={`/resources?tag=${encodeURIComponent(tag)}`}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium",
                    "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-200 dark:hover:bg-[#262626]",
                    "transition-colors"
                  )}
                >
                  #{tag}
                </Link>
              ))}
              {resource.tags.length > 6 && (
                <span className="px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
                  +{resource.tags.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
            {/* Visit Button */}
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-3",
                "rounded-lg text-sm font-semibold text-white",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "shadow-lg shadow-blue-500/25",
                "hover:-translate-y-0.5 transition-all duration-200"
              )}
            >
              Visit
              <ExternalLinkIcon className="w-4 h-4" />
            </a>

            {/* Save Button */}
            <button
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-3",
                "rounded-lg text-sm font-medium",
                "border transition-all duration-200",
                isFavoriteLoading && "opacity-50 cursor-not-allowed",
                isFavorited
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                  : "bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#444444]"
              )}
            >
              <HeartIcon className="w-4 h-4" filled={isFavorited} />
              {isFavorited ? "Saved" : "Save"}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-3",
                "rounded-lg text-sm font-medium",
                "bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333]",
                "text-gray-700 dark:text-gray-300",
                "hover:border-gray-300 dark:hover:border-[#444444]",
                "transition-all duration-200"
              )}
            >
              <ShareIcon className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Banner Image */}
        {resource.banner_url && (
          <div className="mt-8 rounded-xl overflow-hidden border border-gray-200 dark:border-[#262626]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resource.banner_url}
              alt={`${resource.title} banner`}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
