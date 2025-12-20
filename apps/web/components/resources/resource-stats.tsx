"use client";

/**
 * Resource Stats Component
 *
 * Horizontal stats bar showing GitHub, npm/PyPI stats, platforms,
 * pricing, and other metadata.
 */

import { cn } from "@/lib/design-system";
import type { ResourceWithDetails } from "@/lib/resources/queries";

// Icons
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ForkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
  </svg>
);

const IssueIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

interface ResourceStatsProps {
  resource: ResourceWithDetails;
}

export function ResourceStats({ resource }: ResourceStatsProps) {
  // Format numbers with K/M suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  // Format relative time for last commit
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Get pricing badge config
  const getPricingBadge = () => {
    switch (resource.pricing) {
      case "free":
        return {
          label: "Free",
          className:
            "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        };
      case "open-source":
        return {
          label: "Open Source",
          className:
            "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
        };
      case "freemium":
        return {
          label: "Freemium",
          className:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        };
      case "paid":
        return {
          label: "Paid",
          className:
            "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        };
      default:
        return null;
    }
  };

  // Get difficulty badge config
  const getDifficultyBadge = () => {
    switch (resource.difficulty) {
      case "beginner":
        return {
          label: "Beginner",
          className:
            "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        };
      case "intermediate":
        return {
          label: "Intermediate",
          className:
            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        };
      case "advanced":
        return {
          label: "Advanced",
          className:
            "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        };
      default:
        return null;
    }
  };

  // Platform icons mapping
  const platformIcons: Record<string, string> = {
    macos: "🍎",
    windows: "🪟",
    linux: "🐧",
    web: "🌐",
    ios: "📱",
    android: "🤖",
    cli: "⌨️",
    api: "🔌",
  };

  const pricingBadge = getPricingBadge();
  const difficultyBadge = getDifficultyBadge();
  const lastCommit = formatRelativeTime(resource.github_last_commit);

  const hasGitHubStats =
    resource.github_stars > 0 ||
    resource.github_forks > 0 ||
    resource.github_issues > 0;
  const hasDownloadStats =
    resource.npm_downloads_weekly > 0 || resource.pypi_downloads_monthly > 0;

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#262626]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* GitHub Stats */}
          {hasGitHubStats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <GitHubIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">GitHub</span>
              </div>

              {resource.github_stars > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(resource.github_stars)}
                  </span>
                </div>
              )}

              {resource.github_forks > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <ForkIcon className="w-4 h-4" />
                  <span>{formatNumber(resource.github_forks)}</span>
                </div>
              )}

              {resource.github_issues > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <IssueIcon className="w-4 h-4" />
                  <span>{formatNumber(resource.github_issues)}</span>
                </div>
              )}

              {resource.github_contributors > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <UsersIcon className="w-4 h-4" />
                  <span>{resource.github_contributors}</span>
                </div>
              )}

              {lastCommit && (
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  <span>Updated {lastCommit}</span>
                </div>
              )}
            </div>
          )}

          {/* Separator */}
          {hasGitHubStats && hasDownloadStats && (
            <div className="h-4 w-px bg-gray-300 dark:bg-[#333333]" />
          )}

          {/* npm/PyPI Downloads */}
          {hasDownloadStats && (
            <div className="flex items-center gap-4">
              {resource.npm_downloads_weekly > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <DownloadIcon className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(resource.npm_downloads_weekly)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/week</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    npm
                  </span>
                </div>
              )}

              {resource.pypi_downloads_monthly > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <DownloadIcon className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(resource.pypi_downloads_monthly)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    PyPI
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Separator */}
          {(hasGitHubStats || hasDownloadStats) &&
            (pricingBadge ||
              difficultyBadge ||
              resource.platforms?.length > 0 ||
              resource.license ||
              resource.version) && (
              <div className="h-4 w-px bg-gray-300 dark:bg-[#333333]" />
            )}

          {/* Pricing Badge */}
          {pricingBadge && (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                pricingBadge.className
              )}
            >
              {pricingBadge.label}
            </span>
          )}

          {/* Difficulty Badge */}
          {difficultyBadge && (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                difficultyBadge.className
              )}
            >
              {difficultyBadge.label}
            </span>
          )}

          {/* Platforms */}
          {resource.platforms && resource.platforms.length > 0 && (
            <div className="flex items-center gap-1.5">
              {resource.platforms.map((platform) => (
                <span
                  key={platform}
                  title={platform}
                  className="text-base"
                  role="img"
                  aria-label={platform}
                >
                  {platformIcons[platform.toLowerCase()] || "💻"}
                </span>
              ))}
            </div>
          )}

          {/* License */}
          {resource.license && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <TagIcon className="w-4 h-4" />
              <span>{resource.license}</span>
            </div>
          )}

          {/* Version */}
          {resource.version && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#333333]">
              v{resource.version}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
