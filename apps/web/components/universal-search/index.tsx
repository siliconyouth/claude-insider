"use client";

/**
 * Universal Search Component
 *
 * Unified search experience combining:
 * - Quick Search: Fuse.js fuzzy search (instant, local)
 * - AI Search: Claude-powered semantic search with summaries
 *
 * Features:
 * - Single Cmd+K shortcut
 * - Mode toggle between Quick and AI
 * - Voice search in AI mode
 * - Keyboard navigation (↑↓, Enter, Esc)
 * - Search history
 */

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { cn } from "@/lib/design-system";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAnnouncer } from "@/hooks/use-aria-live";
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
import { VoiceRecognizer, isSpeechRecognitionSupported } from "@/lib/speech-recognition";
import { SkeletonSearchResult } from "@/components/skeleton";
import { ModeToggle } from "./mode-toggle";
import { SearchMode, AISearchResponse } from "./types";
import { searchUsersForMention } from "@/app/actions/messaging";

// Extended result type that can be document or user
interface UserSearchResult {
  resultType: "user";
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  url: string;
  title: string;
  description: string;
  category: "Users";
}

interface DocumentSearchResult extends SearchDocument {
  resultType: "document";
}

type UnifiedSearchResult = UserSearchResult | DocumentSearchResult;

interface UniversalSearchProps {
  /** Show expanded search bar with placeholder text */
  expanded?: boolean;
}

export function UniversalSearch({ expanded = false }: UniversalSearchProps) {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<SearchMode>("quick");

  // Search state
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Quick search state
  const [quickResults, setQuickResults] = useState<UnifiedSearchResult[]>([]);
  const [isQuickSearching, startQuickSearchTransition] = useTransition();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const fuseRef = useRef<Fuse<SearchDocument> | null>(null);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI search state
  const [aiResponse, setAiResponse] = useState<AISearchResponse | null>(null);
  const [isAISearching, startAISearchTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { announce } = useAnnouncer();

  // Focus trap for modal accessibility
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    initialFocusRef: inputRef as React.RefObject<HTMLElement>,
    returnFocusRef: triggerButtonRef as React.RefObject<HTMLElement>,
    onEscape: () => closeModal(),
    closeOnEscape: true,
    closeOnClickOutside: true,
    onClickOutside: () => closeModal(),
  });

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setQuickResults([]);
    setAiResponse(null);
    setAiError(null);
    setSelectedIndex(0);
  }, []);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);

    // Initialize Fuse.js search index
    const documents = buildSearchIndex();
    fuseRef.current = createSearchInstance(documents);

    // Check speech recognition support
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Initialize voice recognizer
  useEffect(() => {
    if (!speechSupported) return;

    voiceRecognizerRef.current = new VoiceRecognizer({
      language: "en-US",
      continuous: false,
      interimResults: true,
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setQuery(transcript);
          setInterimTranscript("");
          setIsListening(false);
          announce(`Voice search: ${transcript}`);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setInterimTranscript("");
        announce(`Voice error: ${err}`);
      },
      onStart: () => {
        setIsListening(true);
        announce("Listening for voice search...");
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript("");
      },
    });

    return () => {
      voiceRecognizerRef.current?.abort();
    };
  }, [speechSupported, announce]);

  // Toggle voice recognition
  const toggleVoiceSearch = useCallback(() => {
    if (!voiceRecognizerRef.current) return;

    if (isListening) {
      voiceRecognizerRef.current.stop();
    } else {
      voiceRecognizerRef.current.start();
    }
  }, [isListening]);

  // Load search history when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchHistory(getSearchHistory());
    }
  }, [isOpen]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k" && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Quick search when query changes (includes user search with @ trigger)
  useEffect(() => {
    if (mode !== "quick") return;

    // Clear any pending user search
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (!query || query.length < 2) {
      setQuickResults([]);
      return;
    }

    // Check if query starts with @ for user-only search
    const isUserSearch = query.startsWith("@");
    const userQuery = isUserSearch ? query.slice(1) : query;

    startQuickSearchTransition(async () => {
      const results: UnifiedSearchResult[] = [];

      // Search users if @ prefix or query is 2+ chars (mix users with docs)
      if (isUserSearch || query.length >= 2) {
        // Debounce user search slightly
        userSearchTimeoutRef.current = setTimeout(async () => {
          try {
            const userResult = await searchUsersForMention(userQuery || query, 5);
            if (userResult.success && userResult.users) {
              // Filter out users without usernames (can't navigate to their profile)
              const userResults: UserSearchResult[] = userResult.users
                .filter((u) => u.username)
                .map((u) => ({
                  resultType: "user" as const,
                  id: u.id,
                  name: u.displayName || u.name || "Unknown",
                  username: u.username,
                  avatarUrl: u.avatarUrl,
                  url: `/users/${u.username}`,
                  title: u.displayName || u.name || "Unknown",
                  description: `@${u.username}`,
                  category: "Users" as const,
                }));

              // If user-only search, show only users
              if (isUserSearch) {
                setQuickResults(userResults);
                setSelectedIndex(0);
                announce(`${userResults.length} ${userResults.length === 1 ? "user" : "users"} found`);
              } else {
                // Mix users with document results
                setQuickResults((prev) => {
                  // Remove old user results, add new ones at top
                  const docResults = prev.filter((r) => r.resultType !== "user");
                  return [...userResults, ...docResults].slice(0, 10);
                });
              }
            }
          } catch {
            // Silently fail user search
          }
        }, 200);
      }

      // Search documents (skip if @ prefix)
      if (!isUserSearch && fuseRef.current) {
        const searchResults = fuseRef.current.search(query, { limit: 8 });
        const docResults: DocumentSearchResult[] = searchResults.map((r) => ({
          ...r.item,
          resultType: "document" as const,
        }));
        results.push(...docResults);
      }

      setQuickResults(results);
      setSelectedIndex(0);

      if (results.length > 0) {
        announce(`${results.length} ${results.length === 1 ? "result" : "results"} found`);
      } else if (!isUserSearch) {
        announce("No results found");
      }
    });

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [query, mode, announce]);

  // AI search with debounce
  useEffect(() => {
    if (mode !== "ai") return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 3) {
      setAiResponse(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performAISearch(query);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode]);

  const performAISearch = async (searchQuery: string) => {
    setAiError(null);
    startAISearchTransition(async () => {
      try {
        const res = await fetch("/api/search/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });

        if (!res.ok) {
          throw new Error("Search failed");
        }

        const data: AISearchResponse = await res.json();
        setAiResponse(data);
        setSelectedIndex(0);

        if (data.results.length > 0) {
          announce(`${data.results.length} ${data.results.length === 1 ? "result" : "results"} found`);
        } else {
          announce("No results found");
        }
      } catch (err) {
        console.error("AI search error:", err);
        setAiError("Search failed. Please try again.");
      }
    });
  };

  // Get current results based on mode (memoized to prevent recreation on every render)
  const currentResults = useMemo(
    () => mode === "quick" ? quickResults : (aiResponse?.results || []).map((r) => ({ ...r, resultType: "document" as const })),
    [mode, quickResults, aiResponse?.results]
  );
  const isSearching = mode === "quick" ? isQuickSearching : isAISearching;
  const minQueryLength = mode === "quick" ? 2 : 3;

  // Navigate to result (defined before handleKeyDown which uses it)
  const navigateToResult = useCallback((url: string) => {
    if (query.trim()) {
      addToSearchHistory(query);
    }
    setIsNavigating(true);
    router.push(url);
    setTimeout(() => {
      closeModal();
      setIsNavigating(false);
    }, 150);
  }, [query, router, closeModal]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, currentResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && currentResults[selectedIndex]) {
        e.preventDefault();
        const result = currentResults[selectedIndex];
        navigateToResult(result.url);
      } else if (e.key === "Tab" && !e.shiftKey) {
        // Tab to toggle mode
        e.preventDefault();
        setMode(mode === "quick" ? "ai" : "quick");
      }
    },
    [currentResults, selectedIndex, mode, navigateToResult]
  );

  // Handle history click
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  // Clear search history
  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  // Handle suggested query
  const handleSuggestedQuery = (suggested: string) => {
    setQuery(suggested);
  };

  const relevanceColors = {
    high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <>
      {/* Search button */}
      <button
        ref={triggerButtonRef}
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 h-8 text-xs rounded-lg",
          "text-gray-600 dark:text-gray-400",
          "hover:text-gray-900 dark:hover:text-gray-200",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
          expanded
            ? "px-2.5 w-[160px] lg:w-[200px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#404040]"
            : "px-2.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#404040]"
        )}
        aria-label="Search (Ctrl+K or Cmd+K)"
        aria-haspopup="dialog"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
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
        <span className={cn(
          expanded ? "inline text-gray-500 dark:text-gray-400" : "hidden sm:inline"
        )}>
          Search
        </span>
        <kbd className={cn(
          "items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 rounded ml-auto",
          expanded ? "hidden lg:inline-flex" : "hidden sm:inline-flex"
        )}>
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              className="min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeModal();
              }}
            >
              <div
                ref={containerRef}
                className={cn(
                  "relative w-full max-w-2xl rounded-xl overflow-hidden",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  mode === "ai" && "border-violet-500/30 dark:border-violet-500/20",
                  "shadow-2xl shadow-black/20",
                  mode === "ai" && "shadow-violet-500/10",
                  "animate-scale-in"
                )}
              >
                <h2 id="search-dialog-title" className="sr-only">
                  Search documentation
                </h2>

                {/* Close button */}
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Header with mode toggle */}
                <div className="px-4 pr-12 pt-3 pb-2 border-b border-gray-200 dark:border-[#262626] flex items-center justify-between">
                  <ModeToggle mode={mode} onModeChange={setMode} />
                  <span className="text-xs text-gray-400">
                    Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Tab</kbd> to switch
                  </span>
                </div>

                {/* AI mode badge */}
                {mode === "ai" && (
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#262626] bg-violet-500/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <SparklesIcon className="w-3 h-3 text-violet-500" />
                      <span>Natural language search powered by Claude AI</span>
                    </div>
                  </div>
                )}

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 pr-12 border-b border-gray-300 dark:border-gray-700">
                  <svg
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      mode === "ai" ? "text-violet-500 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                    )}
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
                    type="text"
                    placeholder={
                      isListening
                        ? "Listening..."
                        : mode === "quick"
                        ? "Search..."
                        : "Ask anything about Claude Code..."
                    }
                    value={isListening ? interimTranscript || query : query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "w-full py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 outline-none",
                      isListening && "placeholder-violet-500"
                    )}
                    aria-label="Search"
                    aria-autocomplete="list"
                    disabled={isListening}
                  />
                  {/* Voice search button (AI mode only) */}
                  {mode === "ai" && speechSupported && (
                    <button
                      onClick={toggleVoiceSearch}
                      className={cn(
                        "flex-shrink-0 p-2 rounded-lg transition-all",
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "text-gray-400 hover:text-violet-500 hover:bg-violet-500/10"
                      )}
                      aria-label={isListening ? "Stop listening" : "Start voice search"}
                      title={isListening ? "Stop listening" : "Search by voice"}
                    >
                      <MicrophoneIcon className="w-5 h-5" />
                    </button>
                  )}
                  {isSearching && (
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-5 h-5 border-2 rounded-full animate-spin",
                        mode === "ai"
                          ? "border-violet-500/30 border-t-violet-500"
                          : "border-blue-500/30 border-t-blue-500"
                      )} />
                    </div>
                  )}
                  {query && !isSearching && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setQuickResults([]);
                        setAiResponse(null);
                      }}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
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

                {/* Voice listening indicator */}
                {isListening && (
                  <div className="px-4 py-2 bg-violet-500/10 border-b border-violet-500/20">
                    <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span>Listening... Speak your question</span>
                    </div>
                  </div>
                )}

                {/* AI Error */}
                {mode === "ai" && aiError && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-red-500">{aiError}</p>
                  </div>
                )}

                {/* AI Summary */}
                {mode === "ai" && aiResponse?.summary && (
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-[#262626] bg-violet-500/5">
                    <div className="flex items-start gap-2">
                      <SparklesIcon className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{aiResponse.summary}</p>
                    </div>
                  </div>
                )}

                {/* Expanded query info */}
                {mode === "ai" && aiResponse?.expandedQuery && (
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#262626] text-xs text-gray-500">
                    Also searching: <span className="text-violet-500">{aiResponse.expandedQuery}</span>
                  </div>
                )}

                {/* Loading skeleton */}
                {isSearching && query.length >= minQueryLength && (
                  <div className="py-2">
                    <SkeletonSearchResult />
                    <SkeletonSearchResult />
                    <SkeletonSearchResult />
                  </div>
                )}

                {/* Results */}
                {!isSearching && currentResults.length > 0 && (
                  <ul
                    role="listbox"
                    aria-label="Search results"
                    className="max-h-80 overflow-y-auto py-2"
                  >
                    {currentResults.map((result, index) => (
                      <li
                        key={result.url}
                        role="option"
                        aria-selected={index === selectedIndex}
                      >
                        <button
                          onClick={() => navigateToResult(result.url)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "w-full px-4 py-3 text-left flex items-start gap-3 transition-all focus:outline-none",
                            index === selectedIndex
                              ? mode === "ai" ? "bg-violet-500/10" : "bg-blue-500/10"
                              : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                            isNavigating && index === selectedIndex && "opacity-50"
                          )}
                          tabIndex={-1}
                          disabled={isNavigating}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {/* User avatar for user results */}
                            {result.resultType === "user" ? (
                              (result as UserSearchResult).avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={(result as UserSearchResult).avatarUrl}
                                  alt={(result as UserSearchResult).name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    {(result as UserSearchResult).name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )
                            ) : mode === "quick" ? (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium",
                                  index === selectedIndex
                                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                )}
                                aria-hidden="true"
                              >
                                {result.category.charAt(0)}
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                  relevanceColors[(result as { relevance: "high" | "medium" | "low" }).relevance || "medium"]
                                )}
                              >
                                {(result as { relevance?: string }).relevance || "medium"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium truncate",
                                index === selectedIndex
                                  ? mode === "ai" ? "text-violet-600 dark:text-violet-400" : "text-blue-600 dark:text-cyan-400"
                                  : "text-gray-900 dark:text-white"
                              )}
                            >
                              {result.title}
                              {mode === "ai" && (result as { section?: string }).section !== result.title && (
                                <span className="text-gray-500 font-normal">
                                  {" "}› {(result as { section?: string }).section}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {mode === "quick"
                                ? (result as { description?: string }).description
                                : (result as { snippet?: string }).snippet}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{result.category}</p>
                          </div>
                          {index === selectedIndex && (
                            <div className="flex-shrink-0 text-xs text-gray-500" aria-hidden="true">
                              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd>
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* No results */}
                {!isSearching && query.length >= minQueryLength && currentResults.length === 0 && !aiError && (
                  <div className="px-4 py-12 text-center" role="status" aria-live="polite">
                    <p className="text-gray-600 dark:text-gray-400">
                      No results found for &quot;{query}&quot;
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mode === "quick" ? "Try different keywords" : "Try rephrasing your question"}
                    </p>
                  </div>
                )}

                {/* AI Suggested queries */}
                {mode === "ai" && aiResponse?.suggestedQueries && aiResponse.suggestedQueries.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626]">
                    <p className="text-xs font-medium text-gray-500 mb-2">Related searches:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiResponse.suggestedQueries.map((suggested, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestedQuery(suggested)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {suggested}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initial state */}
                {!isSearching && query.length < minQueryLength && (
                  <div className="px-4 py-4">
                    {/* Recent searches (quick mode) */}
                    {mode === "quick" && searchHistory.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Recent searches
                          </span>
                          <button
                            onClick={handleClearHistory}
                            className="text-xs text-gray-500 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {searchHistory.map((item) => (
                            <button
                              key={item.timestamp}
                              onClick={() => handleHistoryClick(item.query)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    {/* Hint */}
                    <div className="text-center py-4">
                      {mode === "quick" ? (
                        <>
                          <p className="text-gray-600 dark:text-gray-400">
                            Type at least 2 characters to search
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Search docs, resources, and pages
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 mb-4">
                            <SparklesIcon className="w-6 h-6 text-violet-500" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Ask questions in natural language
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Try: &quot;How do I configure MCP servers?&quot;
                          </p>
                        </>
                      )}
                      <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
                        <span>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>{" "}
                          Navigate
                        </span>
                        <span>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd>{" "}
                          Select
                        </span>
                        <span>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>{" "}
                          Close
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {mode === "ai" ? (
                        <>
                          <SparklesIcon className="w-3 h-3" />
                          Powered by Claude AI
                        </>
                      ) : (
                        "Search powered by Fuse.js"
                      )}
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>{" "}
                      to close
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}
