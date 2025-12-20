'use client';

/**
 * Resources Index Page
 * Full directory of Claude AI resources with search, filters, and category browsing
 */

import { useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ResourceCard, ResourceCardSkeleton } from '@/components/resources/resource-card';
import { cn } from '@/lib/design-system';
import {
  getResourceStats,
  getCategoriesWithCounts,
  getPopularTags,
  filterResources,
  type ResourceEntry,
  type ResourceCategorySlug,
  type DifficultyLevel,
  type ResourceStatus,
} from '@/data/resources';
import { searchResources } from '@/lib/resources/search';

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'stars' | 'recent' | 'title';

interface FilterState {
  query: string;
  category: ResourceCategorySlug | null;
  tags: string[];
  difficulty: DifficultyLevel | null;
  status: ResourceStatus | null;
  featured: boolean | null;
  sort: SortOption;
}

// Loading fallback for Suspense
function ResourcesLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="resources" />
      <main id="main-content" className="pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-6 w-48 mx-auto bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse mb-4" />
            <div className="h-10 w-80 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
            <div className="h-6 w-96 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ResourceCardSkeleton key={i} variant="default" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Main page component wrapped with Suspense
export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourcesLoading />}>
      <ResourcesContent />
    </Suspense>
  );
}

// Inner content component that uses useSearchParams
function ResourcesContent() {
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initialFilters: FilterState = useMemo(() => ({
    query: searchParams?.get('q') || '',
    category: (searchParams?.get('category') as ResourceCategorySlug) || null,
    tags: searchParams?.get('tag') ? [searchParams.get('tag')!] : [],
    difficulty: (searchParams?.get('difficulty') as DifficultyLevel) || null,
    status: (searchParams?.get('status') as ResourceStatus) || null,
    featured: searchParams?.get('featured') === 'true' ? true : null,
    sort: (searchParams?.get('sort') as SortOption) || 'relevance',
  }), [searchParams]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Get static data
  const stats = useMemo(() => getResourceStats(), []);
  const categories = useMemo(() => getCategoriesWithCounts(), []);
  const popularTags = useMemo(() => getPopularTags(30), []);

  // Filter and search resources
  const filteredResources = useMemo(() => {
    let results: ResourceEntry[];

    // If there's a search query, use Fuse.js search
    if (filters.query.trim()) {
      const searchResults = searchResources({
        query: filters.query,
        category: filters.category || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        difficulty: filters.difficulty || undefined,
        status: filters.status || undefined,
        featured: filters.featured ?? undefined,
        limit: 100,
      });
      results = searchResults.map((r) => r.item);
    } else {
      // No search query, use filter function
      results = filterResources({
        category: filters.category || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        difficulty: filters.difficulty || undefined,
        status: filters.status || undefined,
        featured: filters.featured ?? undefined,
      });
    }

    // Sort results
    switch (filters.sort) {
      case 'stars':
        results = [...results].sort((a, b) => (b.github?.stars || 0) - (a.github?.stars || 0));
        break;
      case 'recent':
        results = [...results].sort((a, b) =>
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
        break;
      case 'title':
        results = [...results].sort((a, b) => a.title.localeCompare(b.title));
        break;
      // 'relevance' keeps the search order
    }

    return results;
  }, [filters]);

  // Update filter handlers
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      category: null,
      tags: [],
      difficulty: null,
      status: null,
      featured: null,
      sort: 'relevance',
    });
  }, []);

  const hasActiveFilters = filters.query || filters.category || filters.tags.length > 0 ||
    filters.difficulty || filters.status || filters.featured !== null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="resources" />

      <main id="main-content" className="pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              {stats.totalResources} Resources • {stats.totalCategories} Categories
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Claude AI <span className="gradient-text-stripe">Resources</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Curated collection of tools, MCP servers, SDKs, tutorials, and community resources
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={filters.query}
                  onChange={(e) => updateFilter('query', e.target.value)}
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-xl',
                    'bg-white dark:bg-[#111111]',
                    'border border-gray-200 dark:border-[#262626]',
                    'text-gray-900 dark:text-white',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'transition-all duration-200'
                  )}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl',
                  'border border-gray-200 dark:border-[#262626]',
                  showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500/50' : 'bg-white dark:bg-[#111111]',
                  'text-gray-700 dark:text-gray-300',
                  'transition-all duration-200',
                  'hover:border-blue-500/50'
                )}
              >
                <FilterIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </button>

              {/* View Mode Toggle */}
              <div className="flex rounded-xl border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111] overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'px-3 py-3 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-cyan-400'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'px-3 py-3 transition-colors',
                    viewMode === 'list'
                      ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-cyan-400'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 p-6 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => updateFilter('category', e.target.value as ResourceCategorySlug || null)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-gray-50 dark:bg-gray-900',
                        'border border-gray-200 dark:border-[#262626]',
                        'text-gray-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.icon} {cat.name} ({cat.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={filters.difficulty || ''}
                      onChange={(e) => updateFilter('difficulty', e.target.value as DifficultyLevel || null)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-gray-50 dark:bg-gray-900',
                        'border border-gray-200 dark:border-[#262626]',
                        'text-gray-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => updateFilter('status', e.target.value as ResourceStatus || null)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-gray-50 dark:bg-gray-900',
                        'border border-gray-200 dark:border-[#262626]',
                        'text-gray-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    >
                      <option value="">All Status</option>
                      <option value="official">Official</option>
                      <option value="community">Community</option>
                      <option value="beta">Beta</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <select
                      value={filters.sort}
                      onChange={(e) => updateFilter('sort', e.target.value as SortOption)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-gray-50 dark:bg-gray-900',
                        'border border-gray-200 dark:border-[#262626]',
                        'text-gray-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="stars">Most Stars</option>
                      <option value="recent">Recently Added</option>
                      <option value="title">Title (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Tag Cloud */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Filter by Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.slice(0, 20).map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => toggleTag(tag.name)}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm transition-all duration-200',
                          filters.tags.includes(tag.name)
                            ? 'bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Featured Toggle & Clear */}
                <div className="mt-6 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.featured === true}
                      onChange={(e) => updateFilter('featured', e.target.checked ? true : null)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show only featured resources
                    </span>
                  </label>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <CloseIcon className="w-4 h-4" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-sm">
                  Category: {categories.find((c) => c.slug === filters.category)?.name}
                  <button onClick={() => updateFilter('category', null)}>
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm">
                  {tag}
                  <button onClick={() => toggleTag(tag)}>
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {filters.difficulty && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                  {filters.difficulty}
                  <button onClick={() => updateFilter('difficulty', null)}>
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-sm">
                  {filters.status}
                  <button onClick={() => updateFilter('status', null)}>
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm">
                  Featured
                  <button onClick={() => updateFilter('featured', null)}>
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredResources.length === 1
                ? '1 resource found'
                : `${filteredResources.length} resources found`}
            </p>
          </div>

          {/* Category Quick Links */}
          {!hasActiveFilters && (
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/resources/${cat.slug}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-white dark:bg-[#111111]',
                    'border border-gray-200 dark:border-[#262626]',
                    'text-gray-700 dark:text-gray-300',
                    'transition-all duration-200',
                    'hover:border-blue-500/50',
                    'hover:text-blue-600 dark:hover:text-cyan-400'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.shortName || cat.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({cat.count})</span>
                </Link>
              ))}
            </div>
          )}

          {/* Results Grid/List */}
          {filteredResources.length > 0 ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            )}>
              {filteredResources.map((resource, index) => (
                <div
                  key={resource.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <ResourceCard
                    resource={resource}
                    slug={resource.id}
                    variant={viewMode === 'grid' ? 'default' : 'compact'}
                    showCategory
                    showTags={viewMode === 'grid'}
                    showInteractions
                    showAskAI
                    maxTags={3}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No resources found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filters
              </p>
              <button
                onClick={clearFilters}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'text-blue-600 dark:text-cyan-400',
                  'border border-blue-500/30',
                  'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                  'transition-colors'
                )}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
