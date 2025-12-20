'use client';

/**
 * Trending Resources Section
 *
 * Displays trending resources in horizontal card layout.
 * Uses the new horizontal variant of ResourceCard for a compact, scannable list.
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/design-system';
import { ResourceCard } from '@/components/resources/resource-card';
import { getTopByStars, getFeaturedResources } from '@/data/resources';

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const TrendingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export function TrendingResources() {
  // Get a mix of trending resources (by stars and featured)
  const trendingResources = useMemo(() => {
    const topStars = getTopByStars(10);
    const featured = getFeaturedResources(10);

    // Interleave featured and top stars, avoiding duplicates
    const seen = new Set<string>();
    const result = [];

    const maxLen = Math.max(topStars.length, featured.length);
    for (let i = 0; i < maxLen && result.length < 6; i++) {
      const featuredItem = featured[i];
      const topStarsItem = topStars[i];

      if (featuredItem && !seen.has(featuredItem.id)) {
        seen.add(featuredItem.id);
        result.push(featuredItem);
      }
      if (result.length < 6 && topStarsItem && !seen.has(topStarsItem.id)) {
        seen.add(topStarsItem.id);
        result.push(topStarsItem);
      }
    }

    return result.slice(0, 6);
  }, []);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingIcon className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          Trending This Week
        </h3>
        <Link
          href="/resources?sort=stars"
          className={cn(
            'flex items-center gap-1 text-sm text-blue-600 dark:text-cyan-400',
            'hover:underline transition-colors'
          )}
        >
          View All <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {trendingResources.map((resource, index) => (
          <div
            key={resource.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ResourceCard
              resource={resource}
              slug={resource.id}
              variant="horizontal"
              showCategory
              showTags
              maxTags={2}
              showThumbnail
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrendingResources;
