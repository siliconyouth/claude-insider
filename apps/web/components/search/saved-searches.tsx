"use client";

/**
 * Saved Searches Component
 *
 * Display and manage saved searches.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import {
  getSavedSearches,
  deleteSavedSearch,
  useSavedSearch,
} from "@/app/actions/search";
import type { SavedSearch, SearchFilters } from "@/app/actions/search";

interface SavedSearchesProps {
  onSelect?: (query: string, filters: SearchFilters) => void;
  className?: string;
}

export function SavedSearches({ onSelect, className }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSearches = useCallback(async () => {
    setIsLoading(true);
    const result = await getSavedSearches();
    if (result.searches) {
      setSearches(result.searches);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

  const handleSelect = async (search: SavedSearch) => {
    // Update use count
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSavedSearch(search.id);
    onSelect?.(search.query, search.filters);
  };

  const handleDelete = async (searchId: string) => {
    const result = await deleteSavedSearch(searchId);
    if (!result.error) {
      setSearches((prev) => prev.filter((s) => s.id !== searchId));
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-12 bg-gray-100 dark:bg-[#111111] rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No saved searches yet
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Save your frequent searches for quick access
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {searches.map((search) => (
        <div
          key={search.id}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-lg",
            "bg-gray-50 dark:bg-[#111111]",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
            "cursor-pointer transition-colors"
          )}
          onClick={() => handleSelect(search)}
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {search.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              &quot;{search.query}&quot;
              {Object.keys(search.filters).length > 0 && (
                <span className="ml-1">
                  + {Object.keys(search.filters).length} filter
                  {Object.keys(search.filters).length > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          {/* Use count */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {search.use_count} uses
          </span>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(search.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
            title="Delete saved search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Save Search Modal
 */
export function SaveSearchModal({
  query,
  filters,
  onSave,
  onClose,
}: {
  query: string;
  filters: SearchFilters;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#111111] rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Save Search
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., API Documentation"
              autoFocus
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-gray-50 dark:bg-[#0a0a0a]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </div>

          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Search query:
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              &quot;{query}&quot;
            </p>
            {Object.keys(filters).length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                With {Object.keys(filters).length} filter
                {Object.keys(filters).length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={cn(
                "px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "hover:shadow-lg hover:shadow-blue-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
