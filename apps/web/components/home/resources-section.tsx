'use client';

/**
 * Homepage Resources Section
 *
 * Redesigned resources section with:
 * - Hero featured cards (Editor's Pick + Trending)
 * - Horizontal category quick links
 * - Trending resources grid (horizontal cards)
 * - Popular tags cloud
 * - CTA button
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/design-system';
import { HeroFeatured } from './hero-featured';
import { TrendingResources } from './trending-resources';
import { CategoryQuickLinks } from './category-quick-links';
import { getResourceStats, getPopularTags } from '@/data/resources';

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
 * Quick Stats Bar - Compact horizontal stats
 */
function QuickStats() {
  const stats = useMemo(() => getResourceStats(), []);

  const statItems = [
    { label: 'Resources', value: stats.totalResources, icon: '📚' },
    { label: 'GitHub Stars', value: formatNumber(stats.totalGitHubStars), icon: '⭐' },
    { label: 'Categories', value: stats.totalCategories, icon: '📁' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm">
      {statItems.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>{stat.icon}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{stat.value}</span>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Popular Tags Component - Compact tag cloud
 */
function PopularTags() {
  const tags = useMemo(() => getPopularTags(15), []);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Popular Tags
        </h3>
        <Link
          href="/resources"
          className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
        >
          See all tags →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Link
            key={tag.name}
            href={`/resources?tag=${encodeURIComponent(tag.name)}`}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full',
              'bg-gray-100 dark:bg-gray-800',
              'text-gray-700 dark:text-gray-300 text-sm',
              'border border-transparent',
              'transition-all duration-200',
              'hover:bg-gradient-to-r hover:from-violet-500/10 hover:via-blue-500/10 hover:to-cyan-500/10',
              'hover:border-blue-500/30',
              'hover:text-blue-600 dark:hover:text-cyan-400',
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 20}ms` }}
          >
            #{tag.name}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Resources Section Component
 */
export function ResourcesSection() {
  return (
    <section className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#0a0a0a] to-white dark:to-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        {/* Section Header */}
        <div className="text-center mb-10">
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
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-6">
            Tools, MCP servers, SDKs, and community resources for Claude AI developers
          </p>

          {/* Quick Stats */}
          <QuickStats />
        </div>

        {/* Quick Search Bar */}
        <div className="mb-10 max-w-xl mx-auto">
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

        {/* Hero Featured Cards */}
        <HeroFeatured />

        {/* Category Quick Links */}
        <CategoryQuickLinks />

        {/* Trending Resources */}
        <TrendingResources />

        {/* Popular Tags */}
        <PopularTags />

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/resources"
            className={cn(
              'inline-flex items-center gap-2 px-8 py-4 rounded-xl',
              'text-white font-semibold text-lg',
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
