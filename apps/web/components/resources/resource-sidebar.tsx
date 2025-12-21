"use client";

/**
 * Resource Sidebar Component
 *
 * Displays authors, metadata, category info, and quick actions.
 * Sticks to the side on desktop for easy access while scrolling.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import type { ResourceWithDetails, ResourceAuthorRow } from "@/lib/resources/queries";
import type { ResourceCategory } from "@/data/resources/schema";

// Icons
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const FlagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface ResourceSidebarProps {
  resource: ResourceWithDetails;
  category?: ResourceCategory;
}

export function ResourceSidebar({ resource, category }: ResourceSidebarProps) {
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get primary author
  const primaryAuthor = resource.authors.find((a) => a.is_primary);
  const otherAuthors = resource.authors.filter((a) => !a.is_primary);

  return (
    <div className="lg:sticky lg:top-8 space-y-6">
      {/* Authors Section */}
      {resource.authors.length > 0 && (
        <div
          className={cn(
            "rounded-xl p-5",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {resource.authors.length === 1 ? "Maintainer" : "Maintainers"}
          </h3>

          <div className="space-y-4">
            {/* Primary Author */}
            {primaryAuthor && (
              <AuthorCard author={primaryAuthor} isPrimary />
            )}

            {/* Other Authors */}
            {otherAuthors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        </div>
      )}

      {/* Resource Details */}
      <div
        className={cn(
          "rounded-xl p-5",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Details
        </h3>

        <dl className="space-y-3">
          {/* Category */}
          {category && (
            <div className="flex items-start justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Category
              </dt>
              <dd>
                <Link
                  href={`/resources?category=${resource.category}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                    "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-200 dark:hover:bg-[#262626] transition-colors"
                  )}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </Link>
              </dd>
            </div>
          )}

          {/* Subcategory */}
          {resource.subcategory && (
            <div className="flex items-start justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Subcategory
              </dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {resource.subcategory}
              </dd>
            </div>
          )}

          {/* Added Date */}
          <div className="flex items-start justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              Added
            </dt>
            <dd className="text-sm text-gray-900 dark:text-white">
              {formatDate(resource.added_at)}
            </dd>
          </div>

          {/* Last Verified */}
          {resource.last_verified_at && (
            <div className="flex items-start justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4" />
                Verified
              </dt>
              <dd className="text-sm text-green-600 dark:text-green-400">
                {formatDate(resource.last_verified_at)}
              </dd>
            </div>
          )}

          {/* Namespace (for MCP servers) */}
          {resource.namespace && (
            <div className="flex items-start justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Namespace
              </dt>
              <dd className="text-sm font-mono text-gray-900 dark:text-white">
                {resource.namespace}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Quick Actions */}
      <div
        className={cn(
          "rounded-xl p-5",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Actions
        </h3>

        <div className="space-y-2">
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            )}
          >
            <PencilIcon className="w-4 h-4" />
            Suggest an edit
          </button>

          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            )}
          >
            <FlagIcon className="w-4 h-4" />
            Report issue
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUTHOR CARD COMPONENT
// =============================================================================

function AuthorCard({
  author,
  isPrimary,
}: {
  author: ResourceAuthorRow;
  isPrimary?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          "bg-gradient-to-br from-gray-100 to-gray-200",
          "dark:from-[#1a1a1a] dark:to-[#262626]",
          "border border-gray-200 dark:border-[#333333]",
          "text-sm font-medium text-gray-600 dark:text-gray-400"
        )}
      >
        {author.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={author.avatar_url}
            alt={author.name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          author.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {author.name}
          </span>
          {isPrimary && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              Primary
            </span>
          )}
        </div>

        {author.role && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {author.role}
          </div>
        )}

        {/* Social Links */}
        <div className="flex items-center gap-2 mt-2">
          {author.github_username && (
            <a
              href={`https://github.com/${author.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={`@${author.github_username} on GitHub`}
            >
              <GitHubIcon className="w-4 h-4" />
            </a>
          )}
          {author.twitter_username && (
            <a
              href={`https://twitter.com/${author.twitter_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={`@${author.twitter_username} on Twitter`}
            >
              <TwitterIcon className="w-4 h-4" />
            </a>
          )}
          {author.website_url && (
            <a
              href={author.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Website"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
