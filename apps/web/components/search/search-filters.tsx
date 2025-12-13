"use client";

/**
 * Search Filters Component
 *
 * Filter controls for advanced search.
 */

import { cn } from "@/lib/design-system";
import type { SearchFilters } from "@/app/actions/search";

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  categories?: string[];
  className?: string;
}

export function SearchFiltersPanel({
  filters,
  onChange,
  categories = [],
  className,
}: SearchFiltersProps) {
  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasFilters =
    filters.category ||
    filters.type ||
    filters.sortBy ||
    filters.dateRange ||
    filters.minRating;

  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-gray-50 dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Content Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Content Type
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "doc", label: "Docs" },
              { value: "resource", label: "Resources" },
              { value: "user", label: "Users" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateFilter(
                    "type",
                    option.value as SearchFilters["type"]
                  )
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  (filters.type || "all") === option.value
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Category
            </label>
            <select
              value={filters.category || ""}
              onChange={(e) => updateFilter("category", e.target.value || undefined)}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-white dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#333]",
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

        {/* Sort By */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy || "relevance"}
            onChange={(e) =>
              updateFilter("sortBy", e.target.value as SearchFilters["sortBy"])
            }
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-white dark:bg-[#1a1a1a]",
              "border border-gray-200 dark:border-[#333]",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <option value="relevance">Relevance</option>
            <option value="date">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Any time" },
              { value: "day", label: "Today" },
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
              { value: "year", label: "This year" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateFilter(
                    "dateRange",
                    option.value as SearchFilters["dateRange"]
                  )
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  (filters.dateRange || "all") === option.value
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Minimum Rating
          </label>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  updateFilter("minRating", rating === 0 ? undefined : rating)
                }
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  (filters.minRating || 0) === rating
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                    : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]"
                )}
              >
                {rating === 0 ? (
                  "Any"
                ) : (
                  <>
                    {rating}
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    +
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact filter bar for inline use
 */
export function SearchFilterBar({
  filters,
  onChange,
  className,
}: Omit<SearchFiltersProps, "categories">) {
  const hasFilters =
    filters.type ||
    filters.sortBy ||
    filters.dateRange ||
    filters.minRating;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Quick type filters */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#111111] rounded-lg">
        {[
          { value: "all", label: "All" },
          { value: "doc", label: "Docs" },
          { value: "resource", label: "Resources" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() =>
              onChange({
                ...filters,
                type: option.value as SearchFilters["type"],
              })
            }
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              (filters.type || "all") === option.value
                ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <select
        value={filters.sortBy || "relevance"}
        onChange={(e) =>
          onChange({
            ...filters,
            sortBy: e.target.value as SearchFilters["sortBy"],
          })
        }
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs",
          "bg-gray-100 dark:bg-[#111111]",
          "border-0 text-gray-700 dark:text-gray-300",
          "focus:outline-none focus:ring-2 focus:ring-blue-500"
        )}
      >
        <option value="relevance">Relevance</option>
        <option value="date">Recent</option>
        <option value="rating">Rated</option>
        <option value="popularity">Popular</option>
      </select>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={() => onChange({})}
          className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}
