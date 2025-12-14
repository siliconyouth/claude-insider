'use client';

/**
 * RelatedDocuments Component
 *
 * Displays related documentation pages on resource detail pages.
 * Part of the bidirectional cross-linking system.
 */

import Link from 'next/link';
import { cn } from '@/lib/design-system';

// Icon components
const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Category icons for doc categories
const CATEGORY_ICONS: Record<string, string> = {
  'getting-started': '🚀',
  configuration: '⚙️',
  'tips-and-tricks': '💡',
  api: '🔌',
  integrations: '🔗',
  tutorials: '📖',
  examples: '💻',
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  'getting-started': 'Getting Started',
  configuration: 'Configuration',
  'tips-and-tricks': 'Tips & Tricks',
  api: 'API Reference',
  integrations: 'Integrations',
  tutorials: 'Tutorials',
  examples: 'Examples',
};

export interface RelatedDocument {
  id: number;
  slug: string;
  title: string;
  description?: string;
  docCategory: string;
}

interface RelatedDocumentsProps {
  /** Array of related documents */
  documents: RelatedDocument[];
  /** Section title */
  title?: string;
  /** Maximum documents to show */
  maxDocs?: number;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

export function RelatedDocuments({
  documents,
  title = 'Learn More',
  maxDocs = 5,
  className,
  compact = false,
}: RelatedDocumentsProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  const displayDocs = documents.slice(0, maxDocs);

  return (
    <section
      className={cn(
        'p-6 rounded-xl',
        'bg-gray-50 dark:bg-gray-900/50',
        'border border-gray-200 dark:border-gray-800',
        className
      )}
      aria-labelledby="related-docs-title"
    >
      <h3
        id="related-docs-title"
        className={cn(
          'font-semibold text-gray-900 dark:text-white',
          'flex items-center gap-2 mb-4',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        <span className="text-violet-500">
          <DocumentTextIcon className="w-5 h-5" />
        </span>
        {title}
      </h3>

      <ul className={cn('space-y-2', compact && 'space-y-1')}>
        {displayDocs.map((doc) => (
          <li key={doc.id}>
            <Link
              href={`/docs/${doc.slug}`}
              className={cn(
                'flex items-center gap-3 group',
                'p-3 rounded-lg',
                'bg-white dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                'hover:border-blue-500/50 hover:shadow-sm',
                'transition-all duration-200',
                compact && 'p-2'
              )}
            >
              {/* Category icon */}
              <span className={cn('text-lg', compact && 'text-base')}>
                {CATEGORY_ICONS[doc.docCategory] || '📄'}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      'bg-gray-100 dark:bg-gray-700',
                      'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {CATEGORY_NAMES[doc.docCategory] || doc.docCategory}
                  </span>
                </div>
                <p
                  className={cn(
                    'font-medium text-gray-900 dark:text-white truncate',
                    'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
                    'transition-colors duration-150',
                    compact ? 'text-sm' : 'text-base'
                  )}
                >
                  {doc.title}
                </p>
                {!compact && doc.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {doc.description}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRightIcon
                className={cn(
                  'w-5 h-5 text-gray-400',
                  'group-hover:text-blue-500 dark:group-hover:text-cyan-400',
                  'group-hover:translate-x-0.5',
                  'transition-all duration-150'
                )}
              />
            </Link>
          </li>
        ))}
      </ul>

      {/* Show more indicator */}
      {documents.length > maxDocs && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          +{documents.length - maxDocs} more related documents
        </p>
      )}
    </section>
  );
}

/**
 * Compact list variant for sidebars
 */
export function RelatedDocumentsList({
  documents,
  title = 'Related Docs',
  maxDocs = 5,
}: Pick<RelatedDocumentsProps, 'documents' | 'title' | 'maxDocs'>) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h4>
      <ul className="space-y-1">
        {documents.slice(0, maxDocs).map((doc) => (
          <li key={doc.id}>
            <Link
              href={`/docs/${doc.slug}`}
              className={cn(
                'text-sm text-gray-700 dark:text-gray-300',
                'hover:text-blue-600 dark:hover:text-cyan-400',
                'flex items-center gap-1.5 py-1',
                'transition-colors duration-150'
              )}
            >
              <span className="text-xs opacity-60">
                {CATEGORY_ICONS[doc.docCategory] || '📄'}
              </span>
              <span className="truncate">{doc.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Skeleton loading state
 */
export function RelatedDocumentsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
      {/* Title skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Items skeleton */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
