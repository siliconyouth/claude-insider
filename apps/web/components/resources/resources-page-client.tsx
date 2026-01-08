'use client';

/**
 * Resources Page Client Component (v1.18.5)
 *
 * Hybrid architecture for optimal performance:
 * 1. Receives lean initial data (24 items) from Server Component
 * 2. Fetches full lean list via API when filters are applied
 * 3. Client-side search and filtering on the full dataset
 *
 * Key optimizations:
 * - Uses ResourceListItem (lean schema) for listings (~500 bytes vs ~2KB)
 * - Infinite scroll with IntersectionObserver
 * - API fetching only when needed (no filters = use initial data)
 *
 * @module components/resources/resources-page-client
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ResourceCard } from '@/components/resources/resource-card';
import { cn } from '@/lib/design-system';
import { ResourceInsights } from '@/components/resources/resource-insights';
import type {
  ResourceEntry,
  ResourceListItem,
  ResourceCategorySlug,
  DifficultyLevel,
  ResourceStatus,
  ResourceStats,
  TagWithCount,
} from '@/data/resources/schema';
import { searchResources, filterResources } from '@/lib/resources/client-helpers';

// Pagination constants for infinite scroll
const ITEMS_PER_PAGE = 24;

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
  targetAudience: string[];
  useCases: string[];
  minKeyFeatures: number | null;
  hasPros: boolean | null;
  hasCons: boolean | null;
  hasPrerequisites: boolean | null;
}

interface CategoryWithCount {
  slug: ResourceCategorySlug;
  name: string;
  shortName?: string;
  icon: string;
  count: number;
}

interface DifficultyStatItem {
  level: DifficultyLevel;
  count: number;
}

interface StatusStatItem {
  status: ResourceStatus;
  count: number;
}

interface AudienceStatItem {
  audience: string;
  count: number;
}

interface UseCaseStatItem {
  useCase: string;
  count: number;
}

interface EnhancedCoverage {
  total: number;
  hasKeyFeatures: number;
  hasPros: number;
  hasCons: number;
  hasTargetAudience: number;
  hasUseCases: number;
  hasPrerequisites: number;
  hasAiAnalysis: number;
}

export interface ResourcesPageClientProps {
  // Initial resources (lean items from server cache, first 24)
  initialResources: ResourceListItem[] | ResourceEntry[];
  stats: ResourceStats;
  categories: CategoryWithCount[];
  popularTags: TagWithCount[];
  difficultyStats: DifficultyStatItem[];
  statusStats: StatusStatItem[];
  audienceStats: AudienceStatItem[];
  useCasesStats: UseCaseStatItem[];
  enhancedCoverage: EnhancedCoverage;
  // Total count for knowing when to fetch more
  totalResources?: number;
}

export function ResourcesPageClient({
  initialResources,
  stats,
  categories,
  popularTags,
  difficultyStats,
  statusStats,
  audienceStats,
  useCasesStats,
  enhancedCoverage,
  totalResources = 0,
}: ResourcesPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State for API-fetched full resource list
  const [allResources, setAllResources] = useState<(ResourceListItem | ResourceEntry)[]>(initialResources);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [hasFetchedAll, setHasFetchedAll] = useState(false);

  // Fetch all resources when filters are first applied or on mount if initial data is partial
  const fetchAllResources = useCallback(async () => {
    if (hasFetchedAll || isLoadingAll) return;

    setIsLoadingAll(true);
    try {
      // Fetch all resources in pages (API already handles this efficiently)
      const allItems: (ResourceListItem | ResourceEntry)[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/resources?page=${page}&limit=100`);
        const data = await response.json();
        allItems.push(...data.resources);
        hasMore = page < data.totalPages;
        page++;
      }

      setAllResources(allItems);
      setHasFetchedAll(true);
    } catch (error) {
      console.error('Failed to fetch all resources:', error);
    } finally {
      setIsLoadingAll(false);
    }
  }, [hasFetchedAll, isLoadingAll]);

  // Initialize filters from URL params
  const initialFilters: FilterState = useMemo(() => ({
    query: searchParams?.get('q') || '',
    category: (searchParams?.get('category') as ResourceCategorySlug) || null,
    tags: searchParams?.get('tag') ? [searchParams.get('tag')!] : [],
    difficulty: (searchParams?.get('difficulty') as DifficultyLevel) || null,
    status: (searchParams?.get('status') as ResourceStatus) || null,
    featured: searchParams?.get('featured') === 'true' ? true : null,
    sort: (searchParams?.get('sort') as SortOption) || 'relevance',
    targetAudience: searchParams?.get('audience')?.split(',').filter(Boolean) || [],
    useCases: searchParams?.get('usecase')?.split(',').filter(Boolean) || [],
    minKeyFeatures: searchParams?.get('minFeatures') ? parseInt(searchParams.get('minFeatures')!) : null,
    hasPros: searchParams?.get('hasPros') === 'true' ? true : null,
    hasCons: searchParams?.get('hasCons') === 'true' ? true : null,
    hasPrerequisites: searchParams?.get('hasPrerequisites') === 'true' ? true : null,
  }), [searchParams]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Infinite scroll pagination state
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // URL Parameter Sync
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.tags.length > 0 && filters.tags[0]) params.set('tag', filters.tags[0]);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.status) params.set('status', filters.status);
    if (filters.featured) params.set('featured', 'true');
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    if (filters.targetAudience.length > 0) params.set('audience', filters.targetAudience.join(','));
    if (filters.useCases.length > 0) params.set('usecase', filters.useCases.join(','));
    if (filters.minKeyFeatures !== null) params.set('minFeatures', filters.minKeyFeatures.toString());
    if (filters.hasPros) params.set('hasPros', 'true');
    if (filters.hasCons) params.set('hasCons', 'true');
    if (filters.hasPrerequisites) params.set('hasPrerequisites', 'true');

    const newUrl = params.toString() ? `/resources?${params.toString()}` : '/resources';
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Fetch all resources when initial data is partial (less than total)
  useEffect(() => {
    if (initialResources.length < totalResources && !hasFetchedAll) {
      fetchAllResources();
    }
  }, [initialResources.length, totalResources, hasFetchedAll, fetchAllResources]);

  // Filter and search resources
  const filteredResources = useMemo(() => {
    // Cast to ResourceEntry[] for compatibility with search/filter functions
    // Both ResourceListItem and ResourceEntry have the required fields
    const sourceResources = allResources as ResourceEntry[];
    let results: ResourceEntry[];

    const enhancedFilters = {
      targetAudience: filters.targetAudience.length > 0 ? filters.targetAudience : undefined,
      useCases: filters.useCases.length > 0 ? filters.useCases : undefined,
      minKeyFeatures: filters.minKeyFeatures ?? undefined,
      hasPros: filters.hasPros ?? undefined,
      hasCons: filters.hasCons ?? undefined,
      hasPrerequisites: filters.hasPrerequisites ?? undefined,
    };

    if (filters.query.trim()) {
      const searchResults = searchResources(sourceResources, {
        query: filters.query,
        category: filters.category || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        difficulty: filters.difficulty || undefined,
        status: filters.status || undefined,
        featured: filters.featured ?? undefined,
        limit: 100,
        ...enhancedFilters,
      });
      results = searchResults.map((r) => r.item);
    } else {
      results = filterResources(sourceResources, {
        category: filters.category || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        difficulty: filters.difficulty || undefined,
        status: filters.status || undefined,
        featured: filters.featured ?? undefined,
        ...enhancedFilters,
      });
    }

    // Sort results
    switch (filters.sort) {
      case 'stars':
        results = [...results].sort((a, b) => {
          // Support both full ResourceEntry (github?.stars) and lean (githubStars)
          const aStars = (a as ResourceEntry).github?.stars ?? (a as unknown as ResourceListItem).githubStars ?? 0;
          const bStars = (b as ResourceEntry).github?.stars ?? (b as unknown as ResourceListItem).githubStars ?? 0;
          return bStars - aStars;
        });
        break;
      case 'recent':
        results = [...results].sort((a, b) =>
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
        break;
      case 'title':
        results = [...results].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return results;
  }, [filters, allResources]);

  // Filter handlers
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

  const toggleAudience = useCallback((audience: string) => {
    setFilters((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter((a) => a !== audience)
        : [...prev.targetAudience, audience],
    }));
  }, []);

  const toggleUseCase = useCallback((useCase: string) => {
    setFilters((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(useCase)
        ? prev.useCases.filter((u) => u !== useCase)
        : [...prev.useCases, useCase],
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
      targetAudience: [],
      useCases: [],
      minKeyFeatures: null,
      hasPros: null,
      hasCons: null,
      hasPrerequisites: null,
    });
  }, []);

  const hasActiveFilters = filters.query || filters.category || filters.tags.length > 0 ||
    filters.difficulty || filters.status || filters.featured !== null ||
    filters.targetAudience.length > 0 || filters.useCases.length > 0 ||
    filters.minKeyFeatures !== null || filters.hasPros !== null ||
    filters.hasCons !== null || filters.hasPrerequisites !== null;

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [
    filters.query, filters.category, filters.tags, filters.difficulty,
    filters.status, filters.featured, filters.sort, filters.targetAudience,
    filters.useCases, filters.minKeyFeatures, filters.hasPros, filters.hasCons,
    filters.hasPrerequisites
  ]);

  // Load more function
  const loadMore = useCallback(() => {
    if (isLoadingMore || displayCount >= filteredResources.length) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredResources.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, displayCount, filteredResources.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoadingMore && displayCount < filteredResources.length) {
          loadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, isLoadingMore, displayCount, filteredResources.length]);

  const visibleResources = useMemo(
    () => filteredResources.slice(0, displayCount),
    [filteredResources, displayCount]
  );

  const hasMoreToLoad = displayCount < filteredResources.length;

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
              {stats.totalResources} Resources - {stats.totalCategories} Categories
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Claude AI <span className="gradient-text-stripe">Resources</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-6">
              Curated collection of tools, MCP servers, SDKs, tutorials, and community resources
            </p>
            <Link
              href="/resources/submit"
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium',
                'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                'text-white shadow-lg shadow-blue-500/25',
                'hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500',
                'hover:shadow-xl hover:shadow-blue-500/30',
                'transition-all duration-200'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit Resource
            </Link>
          </div>

          {/* Resource Insights Charts */}
          <ResourceInsights
            categories={categories}
            difficultyStats={difficultyStats}
            statusStats={statusStats}
            totalResources={stats.totalResources}
            selectedCategory={filters.category}
            selectedDifficulty={filters.difficulty}
            onCategoryClick={(slug) => updateFilter('category', slug === filters.category ? null : slug as ResourceCategorySlug)}
            onDifficultyClick={(level) => updateFilter('difficulty', level === filters.difficulty ? null : level as DifficultyLevel)}
            className="mb-8"
            audienceStats={audienceStats}
            useCasesStats={useCasesStats}
            enhancedCoverage={enhancedCoverage}
            onAudienceClick={toggleAudience}
            onUseCaseClick={toggleUseCase}
            selectedAudiences={filters.targetAudience}
            selectedUseCases={filters.useCases}
            showEnhancedInsights={true}
          />

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

            {/* Expanded Filters - Simplified for initial implementation */}
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

                  {/* Featured Toggle */}
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer h-10">
                      <input
                        type="checkbox"
                        checked={filters.featured === true}
                        onChange={(e) => updateFilter('featured', e.target.checked ? true : null)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Featured only
                      </span>
                    </label>
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

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <CloseIcon className="w-4 h-4" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredResources.length === 1
                ? '1 resource found'
                : hasMoreToLoad
                  ? `Showing ${displayCount} of ${filteredResources.length} resources`
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
            <>
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              )}>
                {visibleResources.map((resource, index) => (
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

              {/* Load More / Infinite Scroll Trigger */}
              {hasMoreToLoad && (
                <div
                  ref={loadMoreRef}
                  className="flex flex-col items-center justify-center py-12"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    <button
                      onClick={loadMore}
                      className={cn(
                        'px-6 py-3 rounded-xl text-sm font-medium',
                        'border border-gray-200 dark:border-[#262626]',
                        'bg-white dark:bg-[#111111]',
                        'text-gray-700 dark:text-gray-300',
                        'hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-cyan-400',
                        'transition-all duration-200'
                      )}
                    >
                      Load more ({filteredResources.length - displayCount} remaining)
                    </button>
                  )}
                </div>
              )}

              {/* All loaded indicator */}
              {!hasMoreToLoad && filteredResources.length > ITEMS_PER_PAGE && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  All {filteredResources.length} resources loaded
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">No resources found</div>
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
