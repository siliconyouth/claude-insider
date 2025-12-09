"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
  buildSearchIndex,
  createSearchInstance,
  SearchDocument,
} from "@/lib/search";

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fuseRef = useRef<Fuse<SearchDocument> | null>(null);
  const router = useRouter();

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Search when query changes
  useEffect(() => {
    if (!fuseRef.current || !query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchResults = fuseRef.current.search(query, { limit: 8 });
    setResults(searchResults.map((r) => r.item));
    setSelectedIndex(0);
  }, [query]);

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

  // Navigate to result
  const navigateToResult = (url: string) => {
    router.push(url);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      {/* Search button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 hover:text-gray-300 transition-colors"
      >
        <svg
          className="w-4 h-4"
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
        <span className="hidden sm:inline">Search docs...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-700 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal - rendered via portal to escape stacking context */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
              setResults([]);
            }}
          />

          {/* Modal */}
          <div className="relative min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-4">
            <div className="relative w-full max-w-xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                  setResults([]);
                }}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors z-10"
                aria-label="Close search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
              <div className="flex items-center gap-3 px-4 pr-12 border-b border-gray-700">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
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
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search documentation..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full py-4 bg-transparent text-white placeholder-gray-500 outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                    }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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

              {/* Results */}
              {results.length > 0 && (
                <ul className="max-h-96 overflow-y-auto py-2">
                  {results.map((result, index) => (
                    <li key={result.url}>
                      <button
                        onClick={() => navigateToResult(result.url)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                          index === selectedIndex
                            ? "bg-orange-500/10"
                            : "hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
                              index === selectedIndex
                                ? "bg-orange-500 text-white"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {result.category.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${
                              index === selectedIndex
                                ? "text-orange-400"
                                : "text-white"
                            }`}
                          >
                            {result.title}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {result.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {result.category}
                          </p>
                        </div>
                        {index === selectedIndex && (
                          <div className="flex-shrink-0 text-xs text-gray-500">
                            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
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
              {query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="text-gray-400">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try different keywords
                  </p>
                </div>
              )}

              {/* Initial state */}
              {query.length < 2 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-400">
                    Type at least 2 characters to search
                  </p>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
                        ↑↓
                      </kbd>{" "}
                      Navigate
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
                        Enter
                      </kbd>{" "}
                      Select
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
                        Esc
                      </kbd>{" "}
                      Close
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Search powered by Fuse.js</span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Esc</kbd>{" "}
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
