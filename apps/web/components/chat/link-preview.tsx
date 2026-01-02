/**
 * Link Preview Component
 *
 * Displays Open Graph metadata for URLs in chat messages:
 * - Thumbnail image
 * - Title and description
 * - Site name with favicon
 * - Video embed support (YouTube, etc.)
 *
 * Usage:
 * ```tsx
 * <LinkPreview url="https://example.com" />
 * <LinkPreviewCard data={unfurlData} />
 * ```
 */

"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/design-system";
import {
  type UnfurlData,
  getLinkUnfurler,
  getDomainName,
  getYouTubeVideoId,
  isVideoUrl,
} from "@/lib/chat/unfurl";

// ============================================================================
// TYPES
// ============================================================================

export interface LinkPreviewProps {
  /** URL to preview */
  url: string;
  /** Optional pre-fetched data */
  data?: UnfurlData;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show inline (compact) or full card */
  variant?: "inline" | "card";
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

export interface LinkPreviewCardProps {
  /** Unfurl data */
  data: UnfurlData;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    container: "max-w-xs",
    image: "h-24 w-24",
    title: "text-sm font-medium line-clamp-1",
    description: "text-xs line-clamp-2",
    site: "text-xs",
    favicon: "w-3 h-3",
    padding: "p-2",
  },
  md: {
    container: "max-w-sm",
    image: "h-32 w-full",
    title: "text-base font-semibold line-clamp-2",
    description: "text-sm line-clamp-2",
    site: "text-xs",
    favicon: "w-4 h-4",
    padding: "p-3",
  },
  lg: {
    container: "max-w-md",
    image: "h-48 w-full",
    title: "text-lg font-semibold line-clamp-2",
    description: "text-sm line-clamp-3",
    site: "text-sm",
    favicon: "w-4 h-4",
    padding: "p-4",
  },
};

// ============================================================================
// LINK PREVIEW (AUTO-FETCH)
// ============================================================================

export const LinkPreview = memo(function LinkPreview({
  url,
  data: initialData,
  size = "md",
  variant = "card",
  onClick,
  className,
}: LinkPreviewProps) {
  const [data, setData] = useState<UnfurlData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    const unfurler = getLinkUnfurler();
    let cancelled = false;

    async function fetchPreview() {
      try {
        const result = await unfurler.unfurl(url);
        if (cancelled) return;

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setData(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load preview");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [url, initialData]);

  if (loading) {
    return <LinkPreviewSkeleton size={size} className={className} />;
  }

  if (error || !data) {
    // Show minimal inline link on error
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-blue-600 dark:text-cyan-400 hover:underline text-sm",
          className
        )}
      >
        {getDomainName(url)}
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <LinkPreviewInline data={data} size={size} onClick={onClick} className={className} />
    );
  }

  return (
    <LinkPreviewCard data={data} size={size} onClick={onClick} className={className} />
  );
});

// ============================================================================
// LINK PREVIEW CARD
// ============================================================================

export const LinkPreviewCard = memo(function LinkPreviewCard({
  data,
  size = "md",
  onClick,
  className,
}: LinkPreviewCardProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const youtubeId = getYouTubeVideoId(data.url);
  const isVideo = isVideoUrl(data.url);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  }, [onClick, data.url]);

  return (
    <article
      onClick={handleClick}
      className={cn(
        "group rounded-xl overflow-hidden cursor-pointer",
        "border border-gray-200 dark:border-[#262626]",
        "bg-white dark:bg-[#111111]",
        "hover:border-blue-500/50 dark:hover:border-cyan-500/50",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-blue-500/10",
        sizeConfig.container,
        className
      )}
    >
      {/* Image / Video Thumbnail */}
      {(data.image || youtubeId) && (
        <div className={cn("relative overflow-hidden bg-gray-100 dark:bg-gray-800", sizeConfig.image)}>
          {youtubeId ? (
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
              alt={data.title || "Video thumbnail"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : data.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image}
              alt={data.title || "Preview"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}

          {/* Video play button overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <PlayIcon className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={sizeConfig.padding}>
        {/* Site info */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {data.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.favicon}
              alt=""
              className={cn("rounded-sm", sizeConfig.favicon)}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className={cn("ui-text-secondary truncate", sizeConfig.site)}>
            {data.siteName || getDomainName(data.url)}
          </span>
        </div>

        {/* Title */}
        {data.title && (
          <h3 className={cn("ui-text-heading", sizeConfig.title)}>
            {data.title}
          </h3>
        )}

        {/* Description */}
        {data.description && (
          <p className={cn("ui-text-secondary mt-1", sizeConfig.description)}>
            {data.description}
          </p>
        )}
      </div>
    </article>
  );
});

// ============================================================================
// LINK PREVIEW INLINE
// ============================================================================

interface LinkPreviewInlineProps {
  data: UnfurlData;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

const LinkPreviewInline = memo(function LinkPreviewInline({
  data,
  size = "sm",
  onClick,
  className,
}: LinkPreviewInlineProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  }, [onClick, data.url]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-2 text-left",
        "rounded-lg px-2 py-1.5",
        "bg-gray-100/50 dark:bg-gray-800/50",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "transition-colors",
        className
      )}
    >
      {/* Favicon */}
      {data.favicon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.favicon}
          alt=""
          className={cn("rounded-sm shrink-0", sizeConfig.favicon)}
          loading="lazy"
        />
      )}

      {/* Title */}
      <span className={cn("truncate text-blue-600 dark:text-cyan-400", sizeConfig.title)}>
        {data.title || getDomainName(data.url)}
      </span>

      {/* External icon */}
      <ExternalLinkIcon className="w-3 h-3 ui-text-secondary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

interface LinkPreviewSkeletonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LinkPreviewSkeleton = memo(function LinkPreviewSkeleton({
  size = "md",
  className,
}: LinkPreviewSkeletonProps) {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden animate-pulse",
        "border border-gray-200 dark:border-[#262626]",
        sizeConfig.container,
        className
      )}
    >
      {/* Image skeleton */}
      <div className={cn("bg-gray-200 dark:bg-gray-800", sizeConfig.image)} />

      {/* Content skeleton */}
      <div className={sizeConfig.padding}>
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
});

// ============================================================================
// LINK PREVIEW LIST (FOR MULTIPLE LINKS)
// ============================================================================

export interface LinkPreviewListProps {
  urls: string[];
  maxPreviews?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LinkPreviewList = memo(function LinkPreviewList({
  urls,
  maxPreviews = 3,
  size = "sm",
  className,
}: LinkPreviewListProps) {
  const displayUrls = urls.slice(0, maxPreviews);
  const remaining = urls.length - maxPreviews;

  if (displayUrls.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {displayUrls.map((url) => (
        <LinkPreview key={url} url={url} size={size} />
      ))}

      {remaining > 0 && (
        <span className="text-xs ui-text-secondary">
          +{remaining} more link{remaining > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
});

// ============================================================================
// SVG ICONS
// ============================================================================

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { LinkPreviewSkeleton };
