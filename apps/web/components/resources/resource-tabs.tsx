"use client";

/**
 * Resource Tabs Component
 *
 * Tabbed content area for Overview, Reviews, Comments, and Alternatives.
 * Uses client-side state for tab switching with URL hash support.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { toast } from "@/components/toast";
import { RatingStars } from "./rating-stars";
import { ReviewForm } from "./review-form";
import { ScreenshotGallery } from "./screenshot-gallery";
import { ResourceAuthors } from "./resource-authors";
import type { ResourceWithDetails } from "@/lib/resources/queries";

// Icons
const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const ThumbsUpIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
  </svg>
);

const ThumbsDownIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
  </svg>
);

const HeartIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ReplyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
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

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Types for API responses
interface ReviewUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface Review {
  id: string;
  title: string | null;
  content: string;
  pros: string[];
  cons: string[];
  rating: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  userVote: boolean | null;
  status?: string;
}

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  isLiked: boolean;
  replies?: Comment[];
}

type TabId = "overview" | "reviews" | "comments" | "alternatives";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface ResourceTabsProps {
  resource: ResourceWithDetails;
}

export function ResourceTabs({ resource }: ResourceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabId;
    if (["overview", "reviews", "comments", "alternatives"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, "", `#${tabId}`);
  };

  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <DocumentIcon className="w-4 h-4" />,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <StarIcon className="w-4 h-4" />,
      count: resource.reviews_count,
    },
    {
      id: "comments",
      label: "Comments",
      icon: <ChatIcon className="w-4 h-4" />,
      count: resource.comments_count,
    },
    {
      id: "alternatives",
      label: "Alternatives",
      icon: <GridIcon className="w-4 h-4" />,
      count: resource.alternatives.length,
    },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-[#262626]">
        <nav className="flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-cyan-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium",
                    activeTab === tab.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400"
                      : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "overview" && <OverviewTab resource={resource} />}
        {activeTab === "reviews" && <ReviewsTab resource={resource} />}
        {activeTab === "comments" && <CommentsTab resource={resource} />}
        {activeTab === "alternatives" && <AlternativesTab resource={resource} />}
      </div>
    </div>
  );
}

// =============================================================================
// TAB CONTENT COMPONENTS
// =============================================================================

function OverviewTab({ resource }: { resource: ResourceWithDetails }) {
  // Check if we have AI-enhanced data
  const hasEnhancedData = resource.ai_overview ||
    (resource.key_features && resource.key_features.length > 0) ||
    (resource.use_cases && resource.use_cases.length > 0) ||
    (resource.pros && resource.pros.length > 0) ||
    (resource.cons && resource.cons.length > 0);

  return (
    <div className="space-y-8">
      {/* Authors Section */}
      {resource.authors && resource.authors.length > 0 && (
        <ResourceAuthors authors={resource.authors} />
      )}

      {/* AI Overview - enhanced description */}
      {resource.ai_overview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Overview
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              AI Enhanced
            </span>
          </div>
          <div className="prose dark:prose-invert prose-blue dark:prose-cyan max-w-none prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300">
            <p className="whitespace-pre-wrap">{resource.ai_overview}</p>
          </div>
        </div>
      )}

      {/* Key Features */}
      {resource.key_features && resource.key_features.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ✨ Key Features
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resource.key_features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <CheckIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pros & Cons */}
      {((resource.pros && resource.pros.length > 0) || (resource.cons && resource.cons.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {resource.pros && resource.pros.length > 0 && (
            <div className={cn(
              "p-4 rounded-xl",
              "bg-green-50 dark:bg-green-900/10",
              "border border-green-200 dark:border-green-800/30"
            )}>
              <h4 className="font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                <CheckIcon className="w-5 h-5" />
                Pros
              </h4>
              <ul className="space-y-2">
                {resource.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                    <span className="text-green-500 mt-1">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resource.cons && resource.cons.length > 0 && (
            <div className={cn(
              "p-4 rounded-xl",
              "bg-red-50 dark:bg-red-900/10",
              "border border-red-200 dark:border-red-800/30"
            )}>
              <h4 className="font-semibold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
                <MinusIcon className="w-5 h-5" />
                Cons
              </h4>
              <ul className="space-y-2">
                {resource.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                    <span className="text-red-500 mt-1">−</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Use Cases */}
      {resource.use_cases && resource.use_cases.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🎯 Use Cases
          </h3>
          <div className="flex flex-wrap gap-2">
            {resource.use_cases.map((useCase, i) => (
              <span
                key={i}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm",
                  "bg-blue-50 dark:bg-blue-900/20",
                  "text-blue-700 dark:text-blue-300",
                  "border border-blue-200 dark:border-blue-800/30"
                )}
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Target Audience & Prerequisites */}
      {((resource.target_audience && resource.target_audience.length > 0) ||
        (resource.prerequisites && resource.prerequisites.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {resource.target_audience && resource.target_audience.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                👥 Who is this for?
              </h4>
              <ul className="space-y-1.5">
                {resource.target_audience.map((audience, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-violet-500">•</span>
                    {audience}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resource.prerequisites && resource.prerequisites.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                📋 Prerequisites
              </h4>
              <ul className="space-y-1.5">
                {resource.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-cyan-500">•</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Long Description - fallback if no AI overview */}
      {resource.long_description && !resource.ai_overview && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            About
          </h3>
          <div className="prose dark:prose-invert prose-blue dark:prose-cyan max-w-none prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300">
            <div
              dangerouslySetInnerHTML={{ __html: resource.long_description }}
            />
          </div>
        </div>
      )}

      {/* Video */}
      {resource.video_url && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Video
          </h3>
          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
            {resource.video_url.includes("youtube.com") ||
            resource.video_url.includes("youtu.be") ? (
              <iframe
                src={resource.video_url.replace("watch?v=", "embed/")}
                title={`${resource.title} video`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a
                href={resource.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <PlayIcon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white text-sm">Watch Video</span>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Screenshots Gallery */}
      <ScreenshotGallery
        screenshots={resource.screenshots || []}
        title={resource.title}
      />

      {/* Links Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Links
        </h3>
        <div className="flex flex-wrap gap-3">
          {resource.website_url && (
            <a
              href={resource.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              🌐 Website
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.docs_url && (
            <a
              href={resource.docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              📚 Documentation
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.github_owner && resource.github_repo && (
            <a
              href={`https://github.com/${resource.github_owner}/${resource.github_repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              🐙 GitHub
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.npm_package && (
            <a
              href={`https://www.npmjs.com/package/${resource.npm_package}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              📦 npm
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.pypi_package && (
            <a
              href={`https://pypi.org/project/${resource.pypi_package}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              🐍 PyPI
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.changelog_url && (
            <a
              href={resource.changelog_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              📝 Changelog
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.discord_url && (
            <a
              href={resource.discord_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              💬 Discord
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
          {resource.twitter_url && (
            <a
              href={resource.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-[#333333]",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              𝕏 Twitter
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({ resource }: { resource: ResourceWithDetails }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sort, setSort] = useState<"helpful" | "recent" | "rating">("helpful");

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/resources/${resource.slug}/reviews?sort=${sort}`
      );
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
        setUserReview(data.userReview || null);
      }
    } catch {
      // Silent fail, show empty state
    } finally {
      setIsLoading(false);
    }
  }, [resource.slug, sort]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle vote
  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    // Optimistic update
    const previousVote = review.userVote;
    const newVote = previousVote === isHelpful ? null : isHelpful;

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        let helpfulCount = r.helpfulCount;
        let notHelpfulCount = r.notHelpfulCount;

        // Remove previous vote
        if (previousVote === true) helpfulCount--;
        if (previousVote === false) notHelpfulCount--;

        // Add new vote
        if (newVote === true) helpfulCount++;
        if (newVote === false) notHelpfulCount++;

        return { ...r, userVote: newVote, helpfulCount, notHelpfulCount };
      })
    );

    try {
      if (newVote === null) {
        await fetch(`/api/resources/${resource.slug}/reviews/${reviewId}/vote`, {
          method: "DELETE",
        });
      } else {
        await fetch(`/api/resources/${resource.slug}/reviews/${reviewId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isHelpful: newVote }),
        });
      }
    } catch {
      // Rollback on error
      fetchReviews();
      toast.error("Failed to vote");
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchReviews();
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626] animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626] animate-pulse"
          >
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gray-50 dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {Number(resource.average_rating || 0).toFixed(1)}
            </div>
            <RatingStars value={Number(resource.average_rating || 0)} size="md" className="mt-1" />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {resource.ratings_count} {resource.ratings_count === 1 ? "rating" : "ratings"}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm",
                "bg-white dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#333333]",
                "text-gray-700 dark:text-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="helpful">Most Helpful</option>
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* User's Pending Review */}
      {userReview && userReview.status === "pending" && (
        <div
          className={cn(
            "rounded-xl p-4 border",
            "bg-yellow-50 dark:bg-yellow-900/20",
            "border-yellow-200 dark:border-yellow-800"
          )}
        >
          <div className="flex items-start gap-3">
            <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                Your review is pending moderation
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                It will be visible once approved by our moderators.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Section */}
      {!userReview && (
        <div>
          {showReviewForm ? (
            <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Write a Review
              </h3>
              <ReviewForm
                resourceSlug={resource.slug}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-[#333333] rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Share your experience
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Help others by writing a review
              </p>
              <button
                onClick={() => setShowReviewForm(true)}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "hover:-translate-y-0.5 transition-all duration-200"
                )}
              >
                <StarIcon className="w-4 h-4" />
                Write a Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={handleVote}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            No reviews yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Be the first to review this resource
          </p>
        </div>
      )}
    </div>
  );
}

// Review Card Component
function ReviewCard({
  review,
  onVote,
  formatDate,
}: {
  review: Review;
  onVote: (reviewId: string, isHelpful: boolean) => void;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {review.user.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={review.user.image}
              alt={review.user.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-medium">
              {review.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {review.user.name}
            </span>
            {review.user.username && (
              <Link
                href={`/u/${review.user.username}`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400"
              >
                @{review.user.username}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars value={review.rating} size="sm" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 dark:text-white mt-4">
          {review.title}
        </h4>
      )}

      {/* Content */}
      <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">
        {review.content}
      </p>

      {/* Pros & Cons */}
      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {review.pros.length > 0 && (
            <div className="space-y-2">
              {review.pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-green-700 dark:text-green-400">{pro}</span>
                </div>
              ))}
            </div>
          )}
          {review.cons.length > 0 && (
            <div className="space-y-2">
              {review.cons.map((con, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <MinusIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700 dark:text-red-400">{con}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-[#262626]">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Was this helpful?
        </span>
        <button
          onClick={() => onVote(review.id, true)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors",
            review.userVote === true
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
          )}
        >
          <ThumbsUpIcon className="w-3.5 h-3.5" filled={review.userVote === true} />
          {review.helpfulCount > 0 && review.helpfulCount}
        </button>
        <button
          onClick={() => onVote(review.id, false)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors",
            review.userVote === false
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
          )}
        >
          <ThumbsDownIcon className="w-3.5 h-3.5" filled={review.userVote === false} />
          {review.notHelpfulCount > 0 && review.notHelpfulCount}
        </button>
      </div>
    </div>
  );
}

function CommentsTab({ resource }: { resource: ResourceWithDetails }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/resources/${resource.slug}/comments?sort=${sort}`
      );
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [resource.slug, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/resources/${resource.slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
        toast.success("Comment posted!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to post comment");
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit reply
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/resources/${resource.slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), data.comment] }
              : c
          )
        );
        setReplyContent("");
        setReplyingTo(null);
        toast.success("Reply posted!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to post reply");
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like/unlike comment
  const handleLike = async (commentId: string, parentId?: string | null) => {
    // Find the comment
    let comment: Comment | undefined;
    if (parentId) {
      const parent = comments.find((c) => c.id === parentId);
      comment = parent?.replies?.find((r) => r.id === commentId);
    } else {
      comment = comments.find((c) => c.id === commentId);
    }
    if (!comment) return;

    // Optimistic update
    const newIsLiked = !comment.isLiked;
    const updateComment = (c: Comment): Comment => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: newIsLiked,
          likesCount: newIsLiked ? c.likesCount + 1 : c.likesCount - 1,
        };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateComment) };
      }
      return c;
    };
    setComments((prev) => prev.map(updateComment));

    try {
      await fetch(
        `/api/resources/${resource.slug}/comments/${commentId}/like`,
        { method: "POST" }
      );
    } catch {
      // Rollback on error
      fetchComments();
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626] animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] rounded-xl p-4 border border-gray-200 dark:border-[#262626] animate-pulse"
          >
            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Comment */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#262626]"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Join the discussion
        </h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts, ask questions, or provide tips..."
          rows={3}
          maxLength={5000}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-3 rounded-lg text-sm",
            "bg-white dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#333333]",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "resize-none disabled:opacity-50"
          )}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">
            {newComment.length}/5000
          </span>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "hover:-translate-y-0.5 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Posting...
              </>
            ) : (
              <>
                <ChatIcon className="w-4 h-4" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sort */}
      {comments.length > 0 && (
        <div className="flex justify-end">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm",
              "bg-white dark:bg-[#1a1a1a]",
              "border border-gray-200 dark:border-[#333333]",
              "text-gray-700 dark:text-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                onLike={(id) => handleLike(id)}
                onReply={(id) => {
                  setReplyingTo(replyingTo === id ? null : id);
                  setReplyContent("");
                }}
                formatDate={formatDate}
                isReplyOpen={replyingTo === comment.id}
              />

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-12 mt-2 p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user.name}...`}
                    rows={2}
                    maxLength={5000}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm",
                      "bg-white dark:bg-[#111111]",
                      "border border-gray-200 dark:border-[#333333]",
                      "text-gray-900 dark:text-white",
                      "placeholder:text-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "resize-none disabled:opacity-50"
                    )}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium text-white",
                        "bg-blue-600 hover:bg-blue-700",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-12 mt-2 space-y-2">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      onLike={(id) => handleLike(id, comment.id)}
                      formatDate={formatDate}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            No comments yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start the conversation!
          </p>
        </div>
      )}
    </div>
  );
}

// Comment Card Component
function CommentCard({
  comment,
  onLike,
  onReply,
  formatDate,
  isReply = false,
  isReplyOpen = false,
}: {
  comment: Comment;
  onLike: (id: string) => void;
  onReply?: (id: string) => void;
  formatDate: (date: string) => string;
  isReply?: boolean;
  isReplyOpen?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg",
        isReply
          ? "bg-gray-50 dark:bg-[#0a0a0a]"
          : "bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {comment.user.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={comment.user.image}
              alt={comment.user.name}
              className={cn(
                "rounded-full object-cover",
                isReply ? "w-7 h-7" : "w-9 h-9"
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-medium",
                isReply ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
              )}
            >
              {comment.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "font-medium text-gray-900 dark:text-white",
                isReply ? "text-sm" : "text-base"
              )}
            >
              {comment.user.name}
            </span>
            {comment.user.username && (
              <Link
                href={`/u/${comment.user.username}`}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400"
              >
                @{comment.user.username}
              </Link>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              "text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap",
              isReply ? "text-sm" : "text-base"
            )}
          >
            {comment.content}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs transition-colors",
                comment.isLiked
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-red-500"
              )}
            >
              <HeartIcon className="w-4 h-4" filled={comment.isLiked} />
              {comment.likesCount > 0 && comment.likesCount}
            </button>
            {onReply && !isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs transition-colors",
                  isReplyOpen
                    ? "text-blue-600 dark:text-cyan-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                <ReplyIcon className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlternativesTab({ resource }: { resource: ResourceWithDetails }) {
  if (resource.alternatives.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          No alternatives listed
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Know a similar tool? Suggest one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Similar tools and alternatives to {resource.title}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {resource.alternatives.map((alt) => (
          <Link
            key={alt.id}
            href={`/resources/${alt.slug}`}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]",
              "hover:border-blue-500/50 hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                "bg-gradient-to-br from-gray-100 to-gray-200",
                "dark:from-[#1a1a1a] dark:to-[#262626]",
                "border border-gray-200 dark:border-[#333333]"
              )}
            >
              {alt.icon_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={alt.icon_url}
                  alt={alt.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                "📦"
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {alt.title}
                </h4>
                {alt.relationship === "official-alternative" && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                    Official
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {alt.description}
              </p>
              {alt.github_stars > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
                  <StarIcon className="w-3 h-3 text-yellow-500" filled />
                  <span>{alt.github_stars.toLocaleString()}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
