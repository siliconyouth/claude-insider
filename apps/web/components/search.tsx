"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
  buildSearchIndex,
  createSearchInstance,
  SearchDocument,
} from "@/lib/search";
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  SearchHistoryItem,
} from "@/lib/search-history";
import { cn } from "@/lib/design-system";
import { SkeletonSearchResult } from "@/components/skeleton";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAnnouncer } from "@/hooks/use-aria-live";

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const fuseRef = useRef<Fuse<SearchDocument> | null>(null);
  const router = useRouter();
  const { announce } = useAnnouncer();

  // Focus trap for modal accessibility
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    initialFocusRef: inputRef as React.RefObject<HTMLElement>,
    returnFocusRef: triggerButtonRef as React.RefObject<HTMLElement>,
    onEscape: () => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
    },
    closeOnEscape: true,
    closeOnClickOutside: true,
    onClickOutside: () => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
    },
  });

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load search history on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchHistory(getSearchHistory());
    }
  }, [isOpen]);

  // Initialize search index
  useEffect(() => {
    const documents = buildSearchIndex();
    fuseRef.current = createSearchInstance(documents);
  }, []);

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setResults([]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search when query changes (with transition for smooth UI)
  useEffect(() => {
    if (!fuseRef.current || !query || query.length < 2) {
      setResults([]);
      return;
    }

    startSearchTransition(() => {
      const searchResults = fuseRef.current!.search(query, { limit: 8 });
      const mappedResults = searchResults.map((r) => r.item);
      setResults(mappedResults);
      setSelectedIndex(0);

      // Announce results count for screen readers
      if (mappedResults.length > 0) {
        announce(
          `${mappedResults.length} ${mappedResults.length === 1 ? "result" : "results"} found`
        );
      } else {
        announce("No results found");
      }
    });
  }, [query, announce]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].url);
        setIsOpen(false);
        setQuery("");
        setResults([]);
      }
    },
    [results, selectedIndex, router]
  );

  // Navigate to result with optimistic loading state
  const navigateToResult = (url: string) => {
    if (query.trim()) {
      addToSearchHistory(query);
    }
    setIsNavigating(true);
    router.push(url);
    // Close modal after a brief delay to show navigation feedback
    setTimeout(() => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      setIsNavigating(false);
    }, 150);
  };

  // Handle clicking on a search history item
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  // Clear search history and refresh the list
  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  return (
    <>
      {/* Search button */}
      <button
        ref={triggerButtonRef}
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg",
          "text-gray-600 dark:text-gray-400",
          "bg-gray-100 dark:bg-[#1a1a1a]",
          "border border-gray-200 dark:border-[#262626]",
          "hover:border-gray-300 dark:hover:border-[#404040]",
          "hover:text-gray-900 dark:hover:text-gray-200",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
        )}
        aria-label="Search documentation (Ctrl+K or Cmd+K)"
        aria-haspopup="dialog"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search docs...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal - rendered via portal to escape stacking context */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-dialog-title"
          onClick={(e) => {
            // Close when clicking on the backdrop (not the modal content)
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              setQuery("");
              setResults([]);
            }
          }}
        >
          {/* Modal container - clicks here also close if outside modal */}
          <div
            className="min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-4"
            onClick={(e) => {
              // Close when clicking on the container area (not the modal itself)
              if (e.target === e.currentTarget) {
                setIsOpen(false);
                setQuery("");
                setResults([]);
              }
            }}
          >
            <div
              ref={containerRef}
              className={cn(
                "relative w-full max-w-xl rounded-xl overflow-hidden",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "shadow-2xl shadow-black/20",
                "animate-scale-in"
              )}
            >
              <h2 id="search-dialog-title" className="sr-only">Search documentation</h2>
              {/* Close button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                  setResults([]);
                }}
                className="absolute top-3 right-3 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Close search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 pr-12 border-b border-gray-300 dark:border-gray-700">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="search"
                  placeholder="Search documentation..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 outline-none"
                  aria-label="Search"
                  aria-autocomplete="list"
                  aria-controls={results.length > 0 ? "search-results" : undefined}
                  aria-activedescendant={results.length > 0 ? `search-result-${selectedIndex}` : undefined}
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                    }}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                    aria-label="Clear search"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Loading skeleton */}
              {isSearching && query.length >= 2 && (
                <div className="py-2">
                  <SkeletonSearchResult />
                  <SkeletonSearchResult />
                  <SkeletonSearchResult />
                </div>
              )}

              {/* Results */}
              {!isSearching && results.length > 0 && (
                <ul
                  id="search-results"
                  role="listbox"
                  aria-label="Search results"
                  className="max-h-96 overflow-y-auto py-2"
                >
                  {results.map((result, index) => (
                    <li
                      key={result.url}
                      id={`search-result-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <button
                        onClick={() => navigateToResult(result.url)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full px-4 py-3 text-left flex items-start gap-3 transition-all focus:outline-none",
                          index === selectedIndex
                            ? "bg-orange-500/10"
                            : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                          isNavigating && index === selectedIndex && "opacity-50"
                        )}
                        tabIndex={-1}
                        disabled={isNavigating}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
                              index === selectedIndex
                                ? "bg-orange-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                            aria-hidden="true"
                          >
                            {result.category.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${
                              index === selectedIndex
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {result.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {result.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {result.category}
                          </p>
                        </div>
                        {index === selectedIndex && (
                          <div className="flex-shrink-0 text-xs text-gray-500" aria-hidden="true">
                            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                              Enter
                            </kbd>
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* No results */}
              {!isSearching && query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-12 text-center" role="status" aria-live="polite">
                  <p className="text-gray-600 dark:text-gray-400">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try different keywords
                  </p>
                </div>
              )}

              {/* Initial state - show search history or hint */}
              {!isSearching && query.length < 2 && (
                <div className="px-4 py-4">
                  {/* Recent searches */}
                  {searchHistory.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Recent searches
                        </span>
                        <button
                          onClick={handleClearHistory}
                          className="text-xs text-gray-500 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item) => (
                          <button
                            key={item.timestamp}
                            onClick={() => handleHistoryClick(item.query)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-orange-500/10 hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {item.query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search hint */}
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Type at least 2 characters to search
                    </p>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          ↑↓
                        </kbd>{" "}
                        Navigate
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          Enter
                        </kbd>{" "}
                        Select
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          Esc
                        </kbd>{" "}
                        Close
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Search powered by Fuse.js</span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>{" "}
                    or click outside to close
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
