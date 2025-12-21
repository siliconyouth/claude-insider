"use client";

/**
 * Search Filters Integration
 *
 * Integrates the search filter system into the universal search modal.
 * Provides:
 * - Collapsible filter panel toggle
 * - Quick filter chips for common filters
 * - Save search with filters
 * - Filter state management
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { type SearchFilters } from "@/app/actions/search";
import {
  SlidersHorizontalIcon,
  XIcon,
  BookmarkPlusIcon,
  CheckIcon,
  FileTextIcon,
  LinkIcon,
  UserIcon,
  ClockIcon,
  StarIcon,
} from "lucide-react";

interface SearchFiltersIntegrationProps {
  /** Current filter state */
  filters: SearchFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilters) => void;
  /** Callback to save current search with filters */
  onSaveSearch?: (name: string) => void;
  /** Whether filters panel is expanded */
  isExpanded?: boolean;
  /** Current search query (for save functionality) */
  query?: string;
  /** Available categories for filter dropdown */
  categories?: string[];
  /** className */
  className?: string;
}

// Default filter values
const DEFAULT_FILTERS: SearchFilters = {
  type: "all",
  category: undefined,
  sortBy: "relevance",
  dateRange: "all",
  minRating: undefined,
};

// Type filter options
const TYPE_OPTIONS: Array<{
  value: SearchFilters["type"];
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "all", label: "All", icon: null },
  {
    value: "doc",
    label: "Docs",
    icon: <FileTextIcon className="w-3 h-3" />,
  },
  {
    value: "resource",
    label: "Resources",
    icon: <LinkIcon className="w-3 h-3" />,
  },
  { value: "user", label: "Users", icon: <UserIcon className="w-3 h-3" /> },
];

// Date range options
const DATE_OPTIONS: Array<{
  value: SearchFilters["dateRange"];
  label: string;
}> = [
  { value: "all", label: "Any time" },
  { value: "day", label: "Past 24h" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

// Sort options
const SORT_OPTIONS: Array<{
  value: SearchFilters["sortBy"];
  label: string;
}> = [
  { value: "relevance", label: "Relevance" },
  { value: "date", label: "Most recent" },
  { value: "rating", label: "Highest rated" },
  { value: "popularity", label: "Most popular" },
];

export function SearchFiltersIntegration({
  filters,
  onFiltersChange,
  onSaveSearch,
  isExpanded: externalExpanded,
  query,
  categories = [],
  className,
}: SearchFiltersIntegrationProps) {
  const [isExpanded, setIsExpanded] = useState(externalExpanded ?? false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    filters.type !== "all" ||
    filters.category !== undefined ||
    filters.sortBy !== "relevance" ||
    filters.dateRange !== "all" ||
    filters.minRating !== undefined;

  // Count active filters
  const activeFilterCount = [
    filters.type !== "all",
    filters.category !== undefined,
    filters.sortBy !== "relevance",
    filters.dateRange !== "all",
    filters.minRating !== undefined,
  ].filter(Boolean).length;

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  // Handle save search
  const handleSaveSearch = async () => {
    if (!onSaveSearch || !saveName.trim()) return;

    setIsSaving(true);
    try {
      await onSaveSearch(saveName.trim());
      setShowSaveDialog(false);
      setSaveName("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("border-b border-gray-200 dark:border-[#262626]", className)}>
      {/* Filter Toggle Bar */}
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-lg transition-colors",
            hasActiveFilters
              ? "bg-blue-500/10 text-blue-600 dark:text-cyan-400"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          )}
        >
          <SlidersHorizontalIcon className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Quick clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <XIcon className="w-3 h-3" />
              Clear
            </button>
          )}

          {/* Save search button */}
          {onSaveSearch && query && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors"
              title="Save this search"
            >
              <BookmarkPlusIcon className="w-3.5 h-3.5" />
              Save
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Chips */}
      {!isExpanded && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {/* Type chips */}
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("type", option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors",
                filters.type === option.value
                  ? "bg-blue-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Content Type
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter("type", option.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
                    filters.type === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  updateFilter(
                    "category",
                    e.target.value || undefined
                  )
                }
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range & Sort Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                <ClockIcon className="w-3 h-3 inline mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange || "all"}
                onChange={(e) =>
                  updateFilter(
                    "dateRange",
                    e.target.value as SearchFilters["dateRange"]
                  )
                }
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                {DATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy || "relevance"}
                onChange={(e) =>
                  updateFilter(
                    "sortBy",
                    e.target.value as SearchFilters["sortBy"]
                  )
                }
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <StarIcon className="w-3 h-3 inline mr-1" />
              Minimum Rating
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    updateFilter(
                      "minRating",
                      rating === 0 ? undefined : rating
                    )
                  }
                  className={cn(
                    "flex-1 py-2 text-sm rounded-lg transition-colors",
                    (filters.minRating || 0) === rating ||
                      (rating === 0 && !filters.minRating)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {rating === 0 ? "Any" : `${rating}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-[#262626] pt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name your search..."
              className={cn(
                "flex-1 px-3 py-2 text-sm rounded-lg",
                "bg-white dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveSearch();
                if (e.key === "Escape") setShowSaveDialog(false);
              }}
            />
            <button
              onClick={handleSaveSearch}
              disabled={!saveName.trim() || isSaving}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "bg-blue-500 text-white",
                "hover:bg-blue-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName("");
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          {hasActiveFilters && (
            <p className="mt-2 text-xs text-gray-500">
              This will save the current query &quot;{query}&quot; with{" "}
              {activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing search filter state
 */
export function useSearchFilters(initialFilters?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.category !== undefined ||
    filters.sortBy !== "relevance" ||
    filters.dateRange !== "all" ||
    filters.minRating !== undefined;

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

export { DEFAULT_FILTERS };
