'use client';

/**
 * InlineResourceLink Component
 *
 * MDX component for embedding resource links with hover previews.
 * Usage: <ResourceLink id="anthropic-docs">Claude Documentation</ResourceLink>
 */

import { useMemo } from 'react';
import { cn } from '@/lib/design-system';
import { ResourceHoverCard } from '@/components/cross-linking/ResourceHoverCard';
import { getAllResources } from '@/data/resources';
import type { ResourceEntry } from '@/data/resources/schema';

// Resource cache for client-side lookup
let resourceCache: Map<string, ResourceEntry> | null = null;

function getResourceById(id: string): ResourceEntry | undefined {
  if (!resourceCache) {
    const resources = getAllResources();
    resourceCache = new Map(resources.map((r) => [r.id, r]));
  }
  return resourceCache.get(id);
}

interface InlineResourceLinkProps {
  /** Resource ID to link to */
  id: string;
  /** Link text (defaults to resource title) */
  children?: React.ReactNode;
  /** Enable hover card preview */
  showHover?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function InlineResourceLink({
  id,
  children,
  showHover = true,
  className,
}: InlineResourceLinkProps) {
  const resource = useMemo(() => getResourceById(id), [id]);

  // If resource not found, render children as plain text
  if (!resource) {
    console.warn(`[InlineResourceLink] Resource not found: ${id}`);
    return <span className={className}>{children || id}</span>;
  }

  const linkContent = (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-blue-600 dark:text-cyan-400',
        'hover:text-blue-700 dark:hover:text-cyan-300',
        'underline underline-offset-2',
        'inline-flex items-center gap-1',
        'transition-colors duration-150',
        className
      )}
    >
      {children || resource.title}
      <ExternalLinkIcon className="w-3 h-3 opacity-60" />
    </a>
  );

  if (showHover) {
    return (
      <ResourceHoverCard resource={resource}>
        {linkContent}
      </ResourceHoverCard>
    );
  }

  return linkContent;
}

/**
 * Embed a resource card directly in content
 * Usage: <ResourceEmbed id="anthropic-docs" variant="compact" />
 */
export function ResourceEmbed({
  id,
  variant = 'compact',
  showTags = true,
  className,
}: {
  id: string;
  variant?: 'default' | 'compact' | 'featured';
  showTags?: boolean;
  className?: string;
}) {
  const resource = useMemo(() => getResourceById(id), [id]);

  if (!resource) {
    console.warn(`[ResourceEmbed] Resource not found: ${id}`);
    return (
      <div className={cn(
        'p-4 rounded-lg border border-yellow-200 dark:border-yellow-800',
        'bg-yellow-50 dark:bg-yellow-900/20',
        'text-yellow-800 dark:text-yellow-200 text-sm',
        className
      )}>
        Resource not found: {id}
      </div>
    );
  }

  // Dynamically import ResourceCard to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ResourceCard } = require('@/components/resources/resource-card');

  return (
    <div className={cn('my-4', className)}>
      <ResourceCard
        resource={resource}
        variant={variant}
        showCategory
        showTags={showTags}
        showInteractions={false}
      />
    </div>
  );
}

/**
 * Embed multiple resources in a grid
 * Usage: <ResourceGrid ids={['res1', 'res2', 'res3']} />
 */
export function ResourceGrid({
  ids,
  variant = 'compact',
  columns = 2,
  className,
}: {
  ids: string[];
  variant?: 'default' | 'compact';
  columns?: 2 | 3;
  className?: string;
}) {
  const resources = useMemo(() =>
    ids.map(getResourceById).filter((r): r is ResourceEntry => !!r),
    [ids]
  );

  if (resources.length === 0) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ResourceCard } = require('@/components/resources/resource-card');

  return (
    <div
      className={cn(
        'my-6 grid gap-4',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          variant={variant}
          showCategory
          showTags={false}
          showInteractions={false}
        />
      ))}
    </div>
  );
}

// Small external link icon
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
