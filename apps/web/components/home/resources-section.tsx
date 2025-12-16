'use client';

/**
 * Homepage Resources Section
 * Displays stats, featured resources, category grid, and tag cloud
 * Placed after the hero section on the homepage
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/design-system';
import { ResourceCard } from '@/components/resources/resource-card';
import {
  getResourceStats,
  getFeaturedResources,
  getCategoriesWithCounts,
  getPopularTags,
  getTopByStars,
} from '@/data/resources';

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/**
 * Format large numbers (e.g., 85000 -> "85k")
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Stats Bar Component
 * Displays key resource statistics in a horizontal bar
 */
function StatsBar() {
  const stats = useMemo(() => getResourceStats(), []);

  const statItems = [
    { label: 'Resources', value: stats.totalResources, icon: '📚' },
    { label: 'Categories', value: stats.totalCategories, icon: '📁' },
    { label: 'GitHub Stars', value: formatNumber(stats.totalGitHubStars), icon: '⭐' },
    { label: 'Tags', value: stats.totalTags, icon: '🏷️' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {statItems.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            'text-center p-4 rounded-xl',
            'bg-white dark:bg-[#111111]',
            'border border-gray-200 dark:border-[#262626]',
            'animate-fade-in-up'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-2xl font-bold gradient-text-stripe">{stat.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Category Grid Component
 * Displays all resource categories with counts
 */
function CategoryGrid() {
  const categories = useMemo(() => getCategoriesWithCounts(), []);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Browse by Category
        </h3>
        <Link
          href="/resources"
          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
        >
          View All <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            href={`/resources/${category.slug}`}
            className={cn(
              'group flex flex-col items-center p-4 rounded-xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]',
              'transition-all duration-200',
              'hover:border-blue-500/50',
              'hover:shadow-lg hover:shadow-blue-500/5',
              'hover:-translate-y-0.5',
              'animate-fade-in-up'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
              {category.icon}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
              {category.shortName || category.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {category.count} resources
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Featured Resources Component
 * Shows featured/curated resources in cards
 */
function FeaturedResources() {
  const featured = useMemo(() => getFeaturedResources(6), []);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Featured Resources
        </h3>
        <Link
          href="/resources?featured=true"
          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
        >
          View All Featured <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featured.map((resource, index) => (
          <div
            key={resource.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ResourceCard
              resource={resource}
              variant="featured"
              showCategory
              showTags
              maxTags={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Popular Tags Component
 * Shows trending/popular tags as a cloud
 */
function PopularTags() {
  const tags = useMemo(() => getPopularTags(20), []);

  // Define tag size based on count
  const getTagSize = (count: number): string => {
    const maxCount = tags[0]?.count || 1;
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-base font-semibold';
    if (ratio > 0.4) return 'text-sm font-medium';
    return 'text-xs';
  };

  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Popular Tags
      </h3>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Link
            key={tag.name}
            href={`/resources?tag=${encodeURIComponent(tag.name)}`}
            className={cn(
              'px-3 py-1.5 rounded-full',
              'bg-gray-100 dark:bg-gray-800',
              'text-gray-700 dark:text-gray-300',
              'border border-transparent',
              'transition-all duration-200',
              'hover:bg-gradient-to-r hover:from-violet-500/10 hover:via-blue-500/10 hover:to-cyan-500/10',
              'hover:border-blue-500/30',
              'hover:text-blue-600 dark:hover:text-cyan-400',
              getTagSize(tag.count),
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 20}ms` }}
          >
            {tag.name}
            <span className="ml-1 text-gray-500 dark:text-gray-400 text-[10px]">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Top by Stars Component
 * Shows resources sorted by GitHub stars
 */
function TopByStars() {
  const topResources = useMemo(() => getTopByStars(5), []);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-yellow-500" />
          Most Popular
        </h3>
        <Link
          href="/resources?sort=stars"
          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
        >
          View All <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {topResources.map((resource, index) => (
          <div
            key={resource.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <ResourceCard
              resource={resource}
              variant="compact"
              showCategory
              showTags={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Resources Section Component
 * Combines all subcomponents into a cohesive homepage section
 */
export function ResourcesSection() {
  return (
    <section className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#0a0a0a] to-white dark:to-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            Curated Collection
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover <span className="gradient-text-stripe">Resources</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Curated tools, MCP servers, SDKs, prompts, and community resources for Claude AI developers
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="mb-12 max-w-xl mx-auto">
          <Link
            href="/resources"
            className={cn(
              'flex items-center gap-3 px-4 py-3 w-full rounded-xl',
              'bg-white dark:bg-[#111111]',
              'border border-gray-200 dark:border-[#262626]',
              'text-gray-500 dark:text-gray-400',
              'transition-all duration-200',
              'hover:border-blue-500/50',
              'hover:shadow-lg hover:shadow-blue-500/5'
            )}
          >
            <SearchIcon className="w-5 h-5" />
            <span className="flex-1 text-left">Search resources...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 font-mono">
              ⌘K
            </kbd>
          </Link>
        </div>

        {/* Stats Bar */}
        <StatsBar />

        {/* Category Grid */}
        <CategoryGrid />

        {/* Featured Resources */}
        <FeaturedResources />

        {/* Two Column Layout: Popular Tags + Top by Stars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PopularTags />
          <TopByStars />
        </div>

        {/* CTA to Resources Page */}
        <div className="text-center mt-12">
          <Link
            href="/resources"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
              'text-white font-semibold',
              'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
              'shadow-lg shadow-blue-500/25',
              'hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500',
              'hover:shadow-xl hover:shadow-blue-500/30',
              'hover:-translate-y-0.5',
              'transition-all duration-200'
            )}
          >
            Explore All Resources
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ResourcesSection;
