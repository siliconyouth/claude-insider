/**
 * FilterBar Component
 *
 * Search input with filter buttons for dashboard lists.
 * Handles debounced search and filter state.
 */

"use client";

import { cn } from "@/lib/design-system";
import type { FilterOption } from "@/lib/dashboard/types";

interface FilterBarProps {
  /** Search input value */
  search?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Filter configurations */
  filters?: Array<{
    key: string;
    value: string;
    options: FilterOption[];
    label?: string;
  }>;
  /** Filter change handler */
  onFilterChange?: (key: string, value: string) => void;
  /** Clear all filters handler */
  onClearFilters?: () => void;
  /** Show clear button */
  showClear?: boolean;
  /** Additional className */
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onFilterChange,
  onClearFilters,
  showClear = false,
  className,
}: FilterBarProps) {
  const hasActiveFilters = filters.some(f => f.value && f.value !== "all") || (search && search.length > 0);

  return (
    <div className={cn("flex flex-col gap-4 mb-6", className)}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative">
          <input
            type="text"
            value={search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full rounded-lg px-4 py-2 pl-10",
              "bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700",
              "text-gray-900 dark:text-gray-100 placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors"
            )}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* Filter Buttons */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <FilterButtonGroup
              key={filter.key}
              label={filter.label}
              options={filter.options}
              value={filter.value}
              onChange={(value) => onFilterChange?.(filter.key, value)}
            />
          ))}

          {showClear && hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={cn(
                "ml-2 px-3 py-1.5 text-xs font-medium rounded-lg",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              )}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Filter button group for a single filter key
 */
interface FilterButtonGroupProps {
  label?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

function FilterButtonGroup({ label, options, value, onChange }: FilterButtonGroupProps) {
  return (
    <div className="flex items-center gap-1">
      {label && (
        <span className="text-xs text-gray-500 mr-1">{label}:</span>
      )}
      <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              value === option.value
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 opacity-70">({option.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Single filter dropdown (alternative to button group)
 */
interface FilterSelectProps {
  label?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <label className="text-sm text-gray-600 dark:text-gray-400">{label}:</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm",
          "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700",
          "text-gray-900 dark:text-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-blue-500"
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
