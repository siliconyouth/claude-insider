"use client";

/**
 * Resource Authors Component
 *
 * Displays the creators and maintainers of a resource with
 * social links and role badges.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import type { ResourceAuthorRow } from "@/lib/resources/queries";

interface ResourceAuthorsProps {
  authors: ResourceAuthorRow[];
  className?: string;
}

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const roleLabels: Record<string, { label: string; color: string }> = {
  creator: {
    label: "Creator",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  },
  maintainer: {
    label: "Maintainer",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
  contributor: {
    label: "Contributor",
    color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  },
  author: {
    label: "Author",
    color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  },
  organization: {
    label: "Organization",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  },
};

const defaultRole = {
  label: "Contributor",
  color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

export function ResourceAuthors({ authors, className }: ResourceAuthorsProps) {
  if (!authors || authors.length === 0) return null;

  // Sort: primary first, then by name
  const sortedAuthors = [...authors].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {sortedAuthors.length === 1 ? "Creator" : "Team"}
      </h3>
      <div className="space-y-3">
        {sortedAuthors.map((author) => (
          <AuthorCard key={author.id} author={author} />
        ))}
      </div>
    </div>
  );
}

function AuthorCard({ author }: { author: ResourceAuthorRow }) {
  const roleInfo = roleLabels[author.role] ?? defaultRole;
  const avatarUrl = author.avatar_url || (author.github_username
    ? `https://github.com/${author.github_username}.png`
    : null);

  // If author is linked to a platform user, make the card linkable
  const CardWrapper = author.user_id
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={`/u/${author.user_id}`} className="block">
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <CardWrapper>
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          author.user_id && "hover:border-blue-500/50 transition-colors cursor-pointer"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={author.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {author.name}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                roleInfo.color
              )}
            >
              {roleInfo.label}
            </span>
            {author.is_primary && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                Primary
              </span>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 mt-2">
            {author.github_username && (
              <a
                href={`https://github.com/${author.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={`@${author.github_username} on GitHub`}
              >
                <GithubIcon className="w-4 h-4" />
                <span className="hidden sm:inline">@{author.github_username}</span>
              </a>
            )}
            {author.twitter_username && (
              <a
                href={`https://twitter.com/${author.twitter_username}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={`@${author.twitter_username} on X`}
              >
                <TwitterIcon className="w-4 h-4" />
                <span className="hidden sm:inline">@{author.twitter_username}</span>
              </a>
            )}
            {author.website_url && (
              <a
                href={author.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Website"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Website</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
