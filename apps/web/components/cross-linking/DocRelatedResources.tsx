/**
 * DocRelatedResources Component
 *
 * Server component that fetches and displays resources related to a documentation page.
 * Uses the doc_resource_relationships table to find AI-analyzed relationships.
 */

import Link from 'next/link';
import { getResourcesForDoc, type DocRelatedResource } from '@/lib/resources/queries';
import { cn } from '@/lib/design-system';

// Relationship type labels and colors
const RELATIONSHIP_LABELS: Record<string, { label: string; color: string }> = {
  required: { label: 'Required', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  recommended: { label: 'Recommended', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  related: { label: 'Related', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  example: { label: 'Example', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  alternative: { label: 'Alternative', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  extends: { label: 'Extends', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  implements: { label: 'Implements', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
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

interface DocRelatedResourcesProps {
  /** Documentation slug (e.g., "api/streaming" or "getting-started/installation") */
  docSlug: string;
  /** Maximum number of resources to show */
  maxResources?: number;
  /** Custom title */
  title?: string;
  /** Show relationship badges */
  showRelationshipType?: boolean;
}

export async function DocRelatedResources({
  docSlug,
  maxResources = 6,
  title = 'Related Resources',
  showRelationshipType = true,
}: DocRelatedResourcesProps) {
  // Fetch related resources from database
  const resources = await getResourcesForDoc(docSlug, maxResources);

  // Don't render if no resources
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <section
      className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 not-prose"
      aria-labelledby="related-resources-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          id="related-resources-heading"
          className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
        >
          <span className="text-blue-500">
            <BookIcon className="w-5 h-5" />
          </span>
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({resources.length})
          </span>
        </h3>

        <Link
          href="/resources"
          className={cn(
            'text-sm font-medium',
            'text-blue-600 dark:text-cyan-400',
            'hover:text-blue-700 dark:hover:text-cyan-300',
            'flex items-center gap-1 group',
            'transition-colors duration-200'
          )}
        >
          Browse all
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Resource cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            showRelationshipType={showRelationshipType}
          />
        ))}
      </div>
    </section>
  );
}

// Individual resource card component
function ResourceCard({
  resource,
  showRelationshipType,
}: {
  resource: DocRelatedResource;
  showRelationshipType: boolean;
}) {
  const relationshipInfo = RELATIONSHIP_LABELS[resource.relationship_type] ?? {
    label: 'Related',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  };
  const categoryIcon = CATEGORY_ICONS[resource.category] || '📚';

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block p-4 rounded-xl',
        'bg-white dark:bg-[#111111]',
        'border border-gray-200 dark:border-[#262626]',
        'hover:border-blue-500/50 hover:shadow-lg',
        'transition-all duration-200'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
          {resource.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.icon_url}
              alt=""
              className="w-6 h-6 rounded"
              loading="lazy"
            />
          ) : (
            categoryIcon
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              {resource.title}
            </h4>
            {showRelationshipType && (
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', relationshipInfo.color)}>
                {relationshipInfo.label}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {resource.description}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <span className="capitalize">{resource.category.replace('-', ' ')}</span>
            {resource.github_stars > 0 && (
              <span className="flex items-center gap-1">
                <StarIcon className="w-3 h-3" />
                {formatStars(resource.github_stars)}
              </span>
            )}
          </div>
        </div>

        {/* External link indicator */}
        <ExternalLinkIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </a>
  );
}

// Helper to format star counts
function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

// Icon components
function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

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
