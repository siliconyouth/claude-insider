/**
 * Message Search Hook
 *
 * Handles in-conversation message search with debouncing and navigation.
 * Matrix SDK pattern: Simple text search with jump-to-message.
 */

import { useCallback, useState, useRef } from "react";
import { searchMessages, type SearchResult } from "@/app/actions/messaging";

interface UseMessageSearchOptions {
  conversationId: string;
  /** Debounce delay in ms (default 300ms) */
  debounceMs?: number;
  /** Callback when user selects a result to jump to */
  onJumpToMessage?: (messageId: string) => void;
}

interface UseMessageSearchReturn {
  /** Current search query */
  query: string;
  /** Update search query (debounced) */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchResult[];
  /** Whether search is in progress */
  isSearching: boolean;
  /** Current selected result index (for keyboard navigation) */
  selectedIndex: number;
  /** Move to next result */
  nextResult: () => void;
  /** Move to previous result */
  prevResult: () => void;
  /** Jump to currently selected result */
  jumpToSelected: () => void;
  /** Clear search */
  clearSearch: () => void;
  /** Total count of results */
  totalCount: number;
  /** Error message if search failed */
  error: string | null;
}

export function useMessageSearch({
  conversationId,
  debounceMs = 300,
  onJumpToMessage,
}: UseMessageSearchOptions): UseMessageSearchReturn {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef("");

  // Debounced search execution
  const executeSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();

    // Clear results for empty or too short query
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setTotalCount(0);
      setSelectedIndex(0);
      setError(null);
      return;
    }

    // Skip if same as last query
    if (trimmed === lastQueryRef.current) return;
    lastQueryRef.current = trimmed;

    setIsSearching(true);
    setError(null);

    try {
      const result = await searchMessages(conversationId, trimmed);

      if (result.success && result.results) {
        setResults(result.results);
        setTotalCount(result.totalCount || 0);
        setSelectedIndex(0);
      } else {
        setError(result.error || "Search failed");
        setResults([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed");
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  }, [conversationId]);

  // Set query with debounce
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(newQuery);
    }, debounceMs);
  }, [executeSearch, debounceMs]);

  // Navigate to next result
  const nextResult = useCallback(() => {
    if (results.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % results.length);
  }, [results.length]);

  // Navigate to previous result
  const prevResult = useCallback(() => {
    if (results.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  // Jump to selected result
  const jumpToSelected = useCallback(() => {
    const selected = results[selectedIndex];
    if (selected && onJumpToMessage) {
      onJumpToMessage(selected.message.id);
    }
  }, [results, selectedIndex, onJumpToMessage]);

  // Clear search
  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQueryState("");
    setResults([]);
    setTotalCount(0);
    setSelectedIndex(0);
    setError(null);
    lastQueryRef.current = "";
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    selectedIndex,
    nextResult,
    prevResult,
    jumpToSelected,
    clearSearch,
    totalCount,
    error,
  };
}
