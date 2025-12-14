'use client';

/**
 * RelatedResources Component
 *
 * Displays a section of related resources at the end of documentation
 * sections or pages. Supports multiple layouts and variants.
 */

import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { ResourceCard } from '@/components/resources/resource-card';
import type { ResourceEntry } from '@/data/resources/schema';

// Icon components
const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

interface RelatedResourcesProps {
  /** Array of resources to display */
  resources: ResourceEntry[];
  /** Section title */
  title?: string;
  /** Card display variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Maximum number of resources to show */
  maxResources?: number;
  /** Show "View all" link */
  showViewAll?: boolean;
  /** Custom "View all" href */
  viewAllHref?: string;
  /** Layout mode */
  layout?: 'grid' | 'list';
  /** Additional CSS classes */
  className?: string;
  /** Show section border */
  showBorder?: boolean;
  /** Show section icon */
  showIcon?: boolean;
}

export function RelatedResources({
  resources,
  title = 'Related Resources',
  variant = 'default',
  maxResources = 3,
  showViewAll = true,
  viewAllHref = '/resources',
  layout = 'grid',
  className,
  showBorder = true,
  showIcon = true,
}: RelatedResourcesProps) {
  // Don't render if no resources
  if (!resources || resources.length === 0) {
    return null;
  }

  const displayResources = resources.slice(0, maxResources);
  const hasMore = resources.length > maxResources;

  return (
    <section
      className={cn(
        'mt-12 pt-8',
        showBorder && 'border-t border-gray-200 dark:border-gray-800',
        className
      )}
      aria-labelledby="related-resources-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          id="related-resources-title"
          className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
        >
          {showIcon && (
            <span className="text-blue-500">
              <BookOpenIcon className="w-5 h-5" />
            </span>
          )}
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({resources.length})
          </span>
        </h3>

        {showViewAll && hasMore && (
          <Link
            href={viewAllHref}
            className={cn(
              'text-sm font-medium',
              'text-blue-600 dark:text-cyan-400',
              'hover:text-blue-700 dark:hover:text-cyan-300',
              'flex items-center gap-1 group',
              'transition-colors duration-200'
            )}
          >
            View all
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Resource cards */}
      <div
        className={cn(
          layout === 'grid' && 'grid gap-4',
          layout === 'grid' && (variant === 'compact'
            ? 'grid-cols-1'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'),
          layout === 'list' && 'space-y-3'
        )}
      >
        {displayResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            variant={variant}
            showCategory
            showTags={variant !== 'compact'}
            maxTags={2}
            showInteractions={false}
          />
        ))}
      </div>

      {/* View all button for mobile (when more resources exist) */}
      {showViewAll && hasMore && (
        <div className="mt-6 text-center md:hidden">
          <Link
            href={viewAllHref}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2',
              'text-sm font-medium rounded-lg',
              'bg-gray-100 dark:bg-gray-800',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              'transition-colors duration-200'
            )}
          >
            View all {resources.length} resources
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * Compact inline version for use within content
 */
export function InlineRelatedResources({
  resources,
  maxResources = 2,
}: {
  resources: ResourceEntry[];
  maxResources?: number;
}) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="my-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Related resources:
      </p>
      <div className="space-y-2">
        {resources.slice(0, maxResources).map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 p-2 rounded-md',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'transition-colors duration-150'
            )}
          >
            <span className="text-lg">{getCategoryIcon(resource.category)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {resource.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {resource.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loading state
 */
export function RelatedResourcesSkeleton({
  count = 3,
  layout = 'grid',
}: {
  count?: number;
  layout?: 'grid' | 'list';
}) {
  return (
    <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div
        className={cn(
          layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
          layout === 'list' && 'space-y-3'
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Helper to get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    official: '🎯',
    tools: '🛠️',
    'mcp-servers': '🔌',
    rules: '📝',
    prompts: '💡',
    agents: '🤖',
    tutorials: '📖',
    sdks: '🔧',
    showcases: '🌟',
    community: '👥',
  };
  return icons[category] || '📚';
}
