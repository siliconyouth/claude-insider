"use client";

/**
 * Advanced Search Page
 *
 * Full-featured search with filters, history, and saved searches.
 */

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/design-system";
import { buildSearchIndex, createSearchInstance, search } from "@/lib/search";
import { SearchFiltersPanel, SearchFilterBar } from "@/components/search/search-filters";
import { SavedSearches, SaveSearchModal } from "@/components/search/saved-searches";
import {
  recordSearch,
  getSearchHistory,
  getPopularSearches,
  saveSearch,
  clearSearchHistory,
} from "@/app/actions/search";
import type { SearchFilters, SearchHistoryEntry, PopularSearch } from "@/app/actions/search";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-64 bg-gray-100 dark:bg-gray-900 rounded mt-2 animate-pulse" />
        </div>

        {/* Search input skeleton */}
        <div className="mb-6">
          <div className="h-14 bg-gray-100 dark:bg-[#111111] rounded-xl animate-pulse" />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-100 dark:bg-[#111111] rounded-lg animate-pulse" />
              <div className="h-8 w-20 bg-gray-100 dark:bg-[#111111] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
              <div className="h-5 w-48 mx-auto bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-50 dark:bg-[#111111] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<Array<{
    title: string;
    description: string;
    url: string;
    category: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Create search index
  const searchIndex = useMemo(() => {
    const docs = buildSearchIndex();
    return createSearchInstance(docs);
  }, []);

  // Get categories from docs
  const categories = useMemo(() => {
    const docs = buildSearchIndex();
    return [...new Set(docs.map((d) => d.category))];
  }, []);

  // Load history and popular searches
  useEffect(() => {
    async function loadData() {
      const [historyResult, popularResult] = await Promise.all([
        getSearchHistory(5),
        getPopularSearches(5),
      ]);
      if (historyResult.history) {
        setHistory(historyResult.history);
      }
      if (popularResult.searches) {
        setPopularSearches(popularResult.searches);
      }
    }
    loadData();
  }, []);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      // Search using Fuse.js
      let searchResults = search(searchIndex, searchQuery, 50);

      // Apply filters
      if (searchFilters.category) {
        searchResults = searchResults.filter(
          (r) => r.category === searchFilters.category
        );
      }

      setResults(searchResults);

      // Record search
      await recordSearch({
        query: searchQuery,
        filters: searchFilters,
        resultCount: searchResults.length,
      });

      // Update URL
      const params = new URLSearchParams();
      params.set("q", searchQuery);
      router.push(`/search?${params.toString()}`, { scroll: false });

      setIsSearching(false);
    },
    [searchIndex, router]
  );

  // Initial search from URL
  useEffect(() => {
    if (initialQuery) {
       
      performSearch(initialQuery, filters);
    }
  }, [initialQuery, filters, performSearch]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, filters);
  };

  // Handle saved search select
  const handleSavedSearchSelect = (savedQuery: string, savedFilters: SearchFilters) => {
    setQuery(savedQuery);
    setFilters(savedFilters);
    performSearch(savedQuery, savedFilters);
  };

  // Handle save search
  const handleSaveSearch = async (name: string) => {
    await saveSearch({ name, query, filters });
    setShowSaveModal(false);
  };

  // Handle clear history
  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Search
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Search documentation, resources, and more
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className={cn(
                "w-full px-5 py-4 pl-12 rounded-xl text-lg",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition-all"
              )}
            />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className="flex items-center justify-between mt-4">
            <SearchFilterBar filters={filters} onChange={setFilters} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                  showFilters
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
              </button>
              {query && results.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  Save
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Filters panel */}
            {showFilters && (
              <SearchFiltersPanel
                filters={filters}
                onChange={setFilters}
                categories={categories}
                className="mb-6"
              />
            )}

            {/* Results */}
            {isSearching ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse p-4 rounded-xl bg-gray-100 dark:bg-[#111111]"
                  >
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
                </p>
                {results.map((result, index) => (
                  <Link
                    key={index}
                    href={result.url}
                    className={cn(
                      "block p-4 rounded-xl",
                      "bg-white dark:bg-[#111111]",
                      "border border-gray-200 dark:border-[#262626]",
                      "hover:border-blue-500/50 hover:shadow-lg",
                      "transition-all duration-200"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {result.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.description}
                        </p>
                      </div>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {result.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-12">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-16 h-16 mx-auto mb-4 text-gray-200 dark:text-gray-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  Enter a search term to get started
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Saved searches */}
            <div
              className={cn(
                "rounded-xl p-4",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Saved Searches
              </h3>
              <SavedSearches onSelect={handleSavedSearchSelect} />
            </div>

            {/* Recent searches */}
            {history.length > 0 && (
              <div
                className={cn(
                  "rounded-xl p-4",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Recent Searches
                  </h3>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setQuery(item.query);
                        setFilters(item.filters);
                        performSearch(item.query, item.filters);
                      }}
                      className="flex items-center gap-2 w-full p-2 rounded-lg text-sm text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular searches */}
            {popularSearches.length > 0 && (
              <div
                className={cn(
                  "rounded-xl p-4",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(item.query);
                        performSearch(item.query, filters);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Search Modal */}
        {showSaveModal && (
          <SaveSearchModal
            query={query}
            filters={filters}
            onSave={handleSaveSearch}
            onClose={() => setShowSaveModal(false)}
          />
        )}
      </div>
    </div>
  );
}
