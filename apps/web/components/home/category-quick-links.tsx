'use client';

/**
 * Category Quick Links
 *
 * Compact horizontal scrolling category navigation.
 * Each category shows an icon, name, and resource count in a pill-style button.
 */

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { cn } from '@/lib/design-system';
import { getCategoriesWithCounts } from '@/data/resources';

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export function CategoryQuickLinks() {
  const categories = useMemo(() => getCategoriesWithCounts(), []);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Browse by Category
      </h3>

      <div className="relative group">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full',
            'bg-white dark:bg-[#111111]',
            'border border-gray-200 dark:border-[#262626]',
            'shadow-lg',
            'flex items-center justify-center',
            'text-gray-500 dark:text-gray-400',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-200',
            'hover:text-blue-600 dark:hover:text-cyan-400',
            '-ml-5'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full',
            'bg-white dark:bg-[#111111]',
            'border border-gray-200 dark:border-[#262626]',
            'shadow-lg',
            'flex items-center justify-center',
            'text-gray-500 dark:text-gray-400',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-200',
            'hover:text-blue-600 dark:hover:text-cyan-400',
            '-mr-5'
          )}
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className={cn(
            'flex gap-3 overflow-x-auto',
            'scrollbar-hide',
            'pb-2 -mb-2', // Extra padding for focus rings
            'px-1 -mx-1'
          )}
        >
          {/* "All" link */}
          <Link
            href="/resources"
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
              'text-white font-medium text-sm',
              'shadow-lg shadow-blue-500/20',
              'hover:shadow-xl hover:shadow-blue-500/30',
              'transition-all duration-200',
              'hover:-translate-y-0.5'
            )}
          >
            <span className="text-lg">✨</span>
            <span>All Resources</span>
          </Link>

          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/resources/${category.slug}`}
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'bg-white dark:bg-[#111111]',
                'border border-gray-200 dark:border-[#262626]',
                'text-gray-700 dark:text-gray-300',
                'transition-all duration-200',
                'hover:border-blue-500/50',
                'hover:text-blue-600 dark:hover:text-cyan-400',
                'hover:-translate-y-0.5',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="font-medium text-sm whitespace-nowrap">
                {category.shortName || category.name}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                {category.count}
              </span>
            </Link>
          ))}
        </div>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 dark:from-[#0a0a0a] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default CategoryQuickLinks;
