'use client';

/**
 * ResourceCard Component
 * Displays a resource with title, description, tags, and metadata
 * Follows Claude Insider design system patterns (violet/blue/cyan gradients)
 *
 * Now supports user interaction buttons (favorites, ratings, collections)
 */

import { cn } from '@/lib/design-system';
import type { ResourceEntry, ResourceCategory } from '@/data/resources/schema';
import { getCategoryBySlug } from '@/data/resources/schema';
import { FavoriteButton } from '@/components/interactions/favorite-button';
import { CollectionButton } from '@/components/interactions/collection-button';
import { AskAIButton } from '@/components/ask-ai/ask-ai-button';

// Icons for different resource elements
const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ForkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

// Status badge configurations
const STATUS_BADGE_STYLES: Record<string, string> = {
  official: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  community: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  beta: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  deprecated: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
};

// Difficulty badge configurations
const DIFFICULTY_BADGE_STYLES: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  expert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

interface ResourceCardProps {
  resource: ResourceEntry;
  variant?: 'default' | 'compact' | 'featured';
  showCategory?: boolean;
  showTags?: boolean;
  showInteractions?: boolean;
  showAskAI?: boolean;
  maxTags?: number;
  className?: string;
}

/**
 * Wrapper component for interaction buttons to prevent link navigation
 */
function InteractionBar({
  resource,
  variant = 'default',
  showAskAI = false,
}: {
  resource: ResourceEntry;
  variant?: 'default' | 'compact' | 'featured';
  showAskAI?: boolean;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const size = variant === 'compact' ? 'sm' : 'sm';

  // Build AI context for this resource
  const aiContext = {
    type: 'resource' as const,
    title: resource.title,
    text: resource.description,
    metadata: {
      category: resource.category,
      status: resource.status,
      ...(resource.github?.language && { language: resource.github.language }),
      ...(resource.github?.stars && { stars: String(resource.github.stars) }),
    },
  };

  // Build suggested questions based on resource
  const suggestions = [
    `What is ${resource.title}?`,
    `How do I use ${resource.title}?`,
    resource.github ? `How do I install ${resource.title}?` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-1',
        variant === 'compact' ? 'ml-auto' : ''
      )}
    >
      {showAskAI && (
        <AskAIButton
          context={aiContext}
          suggestions={suggestions}
          variant="pill"
          size="sm"
          position="inline"
          label="Ask"
        />
      )}
      <FavoriteButton resourceType="resource" resourceId={resource.id} size={size} />
      <CollectionButton resourceType="resource" resourceId={resource.id} size={size} />
    </div>
  );
}

/**
 * Format large numbers for display (e.g., 12500 -> "12.5k")
 */
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Get the appropriate color classes for a category
 */
function getCategoryColor(category: ResourceCategory): string {
  const DEFAULT_COLOR = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    blue: DEFAULT_COLOR,
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  };
  return colorMap[category.color] ?? DEFAULT_COLOR;
}

export function ResourceCard({
  resource,
  variant = 'default',
  showCategory = true,
  showTags = true,
  showInteractions = false,
  showAskAI = false,
  maxTags = 3,
  className,
}: ResourceCardProps) {
  const category = getCategoryBySlug(resource.category);

  // Featured variant with gradient border and glow
  if (variant === 'featured') {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group relative block overflow-hidden rounded-xl',
          'bg-white dark:bg-[#111111]',
          'border border-gray-200 dark:border-[#262626]',
          'shadow-sm',
          'transition-all duration-300',
          'hover:shadow-xl hover:shadow-blue-500/10',
          'hover:-translate-y-1',
          'hover:border-blue-500/50',
          className
        )}
      >
        {/* Featured badge */}
        {resource.featured && resource.featuredReason && (
          <div className="absolute top-0 right-0 z-10">
            <div className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 rounded-bl-lg rounded-tr-xl">
              {resource.featuredReason}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Header: Icon + Title */}
          <div className="flex items-start gap-4">
            {category && (
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl',
                  'bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10',
                  'group-hover:from-violet-500/20 group-hover:via-blue-500/20 group-hover:to-cyan-500/20',
                  'transition-all duration-300'
                )}
              >
                {category.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                {resource.title}
              </h3>
              {showCategory && category && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {category.name}
                </p>
              )}
            </div>
            <ExternalLinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>

          {/* Description */}
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {resource.description}
          </p>

          {/* GitHub Stats */}
          {resource.github && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <StarIcon className="w-4 h-4 text-yellow-500" />
                <span>{formatNumber(resource.github.stars)}</span>
              </div>
              {resource.github.forks > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <ForkIcon className="w-4 h-4" />
                  <span>{formatNumber(resource.github.forks)}</span>
                </div>
              )}
              {resource.github.language && (
                <span className="text-gray-500 dark:text-gray-500">
                  {resource.github.language}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {showTags && resource.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.slice(0, maxTags).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
              {resource.tags.length > maxTags && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  +{resource.tags.length - maxTags}
                </span>
              )}
            </div>
          )}

          {/* Footer: Status + Version + Interactions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                  STATUS_BADGE_STYLES[resource.status] || STATUS_BADGE_STYLES.community
                )}
              >
                {resource.status}
              </span>
              {resource.difficulty && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                    DIFFICULTY_BADGE_STYLES[resource.difficulty]
                  )}
                >
                  {resource.difficulty}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {resource.version && (
                <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                  v{resource.version}
                </span>
              )}
              {showInteractions && (
                <InteractionBar resource={resource} variant="featured" showAskAI={showAskAI} />
              )}
            </div>
          </div>
        </div>
      </a>
    );
  }

  // Compact variant for lists and search results
  if (variant === 'compact') {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group flex items-center gap-4 p-4 rounded-lg',
          'bg-white dark:bg-[#111111]',
          'border border-gray-200 dark:border-[#262626]',
          'transition-all duration-200',
          'hover:border-blue-500/50',
          'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
          className
        )}
      >
        {/* Category Icon */}
        {category && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl',
              getCategoryColor(category)
            )}
          >
            {category.icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              {resource.title}
            </h4>
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded capitalize',
                STATUS_BADGE_STYLES[resource.status] || STATUS_BADGE_STYLES.community
              )}
            >
              {resource.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
            {resource.description}
          </p>
        </div>

        {/* GitHub Stars */}
        {resource.github && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 shrink-0">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span>{formatNumber(resource.github.stars)}</span>
          </div>
        )}

        {/* Interactions */}
        {showInteractions && (
          <InteractionBar resource={resource} variant="compact" showAskAI={showAskAI} />
        )}

        {/* External Link Icon */}
        <ExternalLinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </a>
    );
  }

  // Default variant
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block p-5 rounded-xl',
        'bg-white dark:bg-[#111111]',
        'border border-gray-200 dark:border-[#262626]',
        'shadow-sm',
        'transition-all duration-200',
        'hover:shadow-lg hover:shadow-blue-500/5',
        'hover:-translate-y-0.5',
        'hover:border-blue-500/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {category && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl',
              getCategoryColor(category)
            )}
          >
            {category.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              {resource.title}
            </h4>
            {resource.github && (
              <GitHubIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            )}
          </div>
          {showCategory && category && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {category.shortName || category.name}
            </p>
          )}
        </div>
        <ExternalLinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {resource.description}
      </p>

      {/* GitHub Stats */}
      {resource.github && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs">{formatNumber(resource.github.stars)}</span>
          </div>
          {resource.github.language && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {resource.github.language}
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {showTags && resource.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {resource.tags.slice(0, maxTags).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
          {resource.tags.length > maxTags && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              +{resource.tags.length - maxTags}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full capitalize',
              STATUS_BADGE_STYLES[resource.status] || STATUS_BADGE_STYLES.community
            )}
          >
            {resource.status}
          </span>
          {resource.difficulty && (
            <span
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded-full capitalize',
                DIFFICULTY_BADGE_STYLES[resource.difficulty]
              )}
            >
              {resource.difficulty}
            </span>
          )}
        </div>
        {showInteractions && (
          <InteractionBar resource={resource} variant="default" showAskAI={showAskAI} />
        )}
      </div>
    </a>
  );
}

/**
 * Skeleton loading state for ResourceCard
 */
export function ResourceCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="p-6 rounded-xl border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="p-5 rounded-xl border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  );
}

export default ResourceCard;
