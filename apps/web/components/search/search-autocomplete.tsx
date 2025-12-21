"use client";

/**
 * Search Autocomplete Component
 *
 * Smart autocomplete dropdown that combines:
 * - Recent searches (user's search history)
 * - Saved searches (user's bookmarked searches)
 * - Popular searches (trending queries from all users)
 *
 * Features:
 * - Debounced query (300ms)
 * - Keyboard navigation (up/down/enter)
 * - Text highlighting for matches
 * - Grouped sections with icons
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/design-system";
import {
  getSearchHistory as getSearchHistoryAction,
  getSavedSearches,
  getSearchSuggestions,
  type SavedSearch,
  type SearchHistoryEntry,
} from "@/app/actions/search";
import {
  ClockIcon,
  BookmarkIcon,
  TrendingUpIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

// Suggestion types
export type SuggestionType = "recent" | "saved" | "popular" | "suggestion";

export interface SearchSuggestion {
  id: string;
  query: string;
  type: SuggestionType;
  filters?: Record<string, unknown>;
  meta?: {
    useCount?: number;
    searchCount?: number;
    lastUsed?: string;
  };
}

interface SearchAutocompleteProps {
  /** Current search query */
  query: string;
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: SearchSuggestion) => void;
  /** Callback to clear a recent search */
  onClearRecent?: (id: string) => void;
  /** Whether the dropdown is visible */
  isOpen: boolean;
  /** Currently selected index for keyboard navigation */
  selectedIndex: number;
  /** Callback when selected index changes */
  onSelectedIndexChange: (index: number) => void;
  /** Additional className */
  className?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchAutocomplete({
  query,
  onSelect,
  onClearRecent,
  isOpen,
  selectedIndex,
  onSelectedIndexChange,
  className,
}: SearchAutocompleteProps) {
  // State for different suggestion sources
  const [recentSearches, setRecentSearches] = useState<SearchHistoryEntry[]>(
    []
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce the query for suggestions fetch
  const debouncedQuery = useDebounce(query, 300);

  // Refs for scroll-into-view
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // Fetch initial data (recent and saved searches)
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [historyResult, savedResult] = await Promise.all([
          getSearchHistoryAction(5),
          getSavedSearches(),
        ]);

        if (historyResult.history) {
          setRecentSearches(historyResult.history);
        }
        if (savedResult.searches) {
          setSavedSearches(savedResult.searches);
        }
      } catch (error) {
        console.error("[Autocomplete] Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isOpen]);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setPopularSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const result = await getSearchSuggestions(debouncedQuery);
        if (result.suggestions) {
          setPopularSuggestions(result.suggestions);
        }
      } catch (error) {
        console.error("[Autocomplete] Error fetching suggestions:", error);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Build combined suggestions list
  const suggestions = useMemo(() => {
    const result: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    const seenQueries = new Set<string>();

    // Filter and add recent searches
    const filteredRecent = recentSearches
      .filter(
        (item) =>
          !query || item.query.toLowerCase().includes(queryLower)
      )
      .slice(0, 3);

    for (const item of filteredRecent) {
      if (!seenQueries.has(item.query.toLowerCase())) {
        seenQueries.add(item.query.toLowerCase());
        result.push({
          id: `recent-${item.id}`,
          query: item.query,
          type: "recent",
          filters: item.filters as Record<string, unknown>,
          meta: {
            lastUsed: item.searched_at,
          },
        });
      }
    }

    // Filter and add saved searches
    const filteredSaved = savedSearches
      .filter(
        (item) =>
          !query ||
          item.query.toLowerCase().includes(queryLower) ||
          item.name.toLowerCase().includes(queryLower)
      )
      .slice(0, 3);

    for (const item of filteredSaved) {
      if (!seenQueries.has(item.query.toLowerCase())) {
        seenQueries.add(item.query.toLowerCase());
        result.push({
          id: `saved-${item.id}`,
          query: item.query,
          type: "saved",
          filters: item.filters as Record<string, unknown>,
          meta: {
            useCount: item.use_count,
            lastUsed: item.last_used_at || undefined,
          },
        });
      }
    }

    // Add popular suggestions
    for (const suggestion of popularSuggestions) {
      if (!seenQueries.has(suggestion.toLowerCase())) {
        seenQueries.add(suggestion.toLowerCase());
        result.push({
          id: `popular-${suggestion}`,
          query: suggestion,
          type: "popular",
        });
      }
    }

    return result;
  }, [query, recentSearches, savedSearches, popularSuggestions]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const itemEl = itemRefs.current.get(selectedIndex);
      if (itemEl && listRef.current) {
        itemEl.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex, suggestions.length]);

  // Highlight matching text
  const highlightMatch = useCallback(
    (text: string) => {
      if (!query || query.length < 2) {
        return <span>{text}</span>;
      }

      const queryLower = query.toLowerCase();
      const textLower = text.toLowerCase();
      const startIndex = textLower.indexOf(queryLower);

      if (startIndex === -1) {
        return <span>{text}</span>;
      }

      const endIndex = startIndex + query.length;
      return (
        <span>
          {text.slice(0, startIndex)}
          <mark className="bg-blue-500/20 text-blue-600 dark:text-cyan-400 rounded px-0.5">
            {text.slice(startIndex, endIndex)}
          </mark>
          {text.slice(endIndex)}
        </span>
      );
    },
    [query]
  );

  // Get icon for suggestion type
  const getIcon = (type: SuggestionType) => {
    switch (type) {
      case "recent":
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
      case "saved":
        return <BookmarkIcon className="w-4 h-4 text-amber-500" />;
      case "popular":
        return <TrendingUpIcon className="w-4 h-4 text-green-500" />;
      default:
        return <SearchIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get label for suggestion type
  const getTypeLabel = (type: SuggestionType) => {
    switch (type) {
      case "recent":
        return "Recent";
      case "saved":
        return "Saved";
      case "popular":
        return "Trending";
      default:
        return "Suggestion";
    }
  };

  // Don't render if no suggestions or closed
  if (!isOpen || (suggestions.length === 0 && !isLoading)) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-full left-0 right-0 mt-1 z-50",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "rounded-lg shadow-lg shadow-black/10",
        "overflow-hidden",
        className
      )}
    >
      {isLoading ? (
        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          Loading suggestions...
        </div>
      ) : (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Search suggestions"
          className="max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              ref={(el) => {
                if (el) itemRefs.current.set(index, el);
              }}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                "px-3 py-2 flex items-center gap-3 cursor-pointer",
                "transition-colors duration-100",
                index === selectedIndex
                  ? "bg-blue-500/10 dark:bg-blue-500/5"
                  : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onSelectedIndexChange(index)}
            >
              {/* Icon */}
              <div className="flex-shrink-0">{getIcon(suggestion.type)}</div>

              {/* Query text */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm truncate",
                    index === selectedIndex
                      ? "text-blue-600 dark:text-cyan-400"
                      : "text-gray-900 dark:text-white"
                  )}
                >
                  {highlightMatch(suggestion.query)}
                </p>
              </div>

              {/* Type badge */}
              <span
                className={cn(
                  "flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded",
                  suggestion.type === "recent" &&
                    "bg-gray-100 dark:bg-gray-800 text-gray-500",
                  suggestion.type === "saved" &&
                    "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                  suggestion.type === "popular" &&
                    "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                )}
              >
                {getTypeLabel(suggestion.type)}
              </span>

              {/* Clear button for recent searches */}
              {suggestion.type === "recent" && onClearRecent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearRecent(suggestion.id.replace("recent-", ""));
                  }}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                  aria-label={`Remove "${suggestion.query}" from history`}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Footer hint */}
      {suggestions.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-2">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                ↑↓
              </kbd>
              Navigate
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                Enter
              </kbd>
              Select
            </span>
            <span>{suggestions.length} suggestions</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing autocomplete state
 */
export function useSearchAutocomplete() {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, suggestions: SearchSuggestion[]) => {
      if (!isOpen || suggestions.length === 0) return false;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return true;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return true;

        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            return suggestions[selectedIndex];
          }
          return false;

        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          return true;

        default:
          return false;
      }
    },
    [isOpen, selectedIndex]
  );

  const reset = useCallback(() => {
    setSelectedIndex(-1);
    setIsOpen(false);
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    isOpen,
    setIsOpen,
    handleKeyDown,
    reset,
  };
}
