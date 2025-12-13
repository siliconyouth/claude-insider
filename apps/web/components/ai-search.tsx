"use client";

/**
 * AI-Powered Search Component
 *
 * Provides natural language search with:
 * - AI query understanding and expansion
 * - Semantic search results
 * - AI-generated summaries
 * - Suggested follow-up queries
 * - Voice search support
 */

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/design-system";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAnnouncer } from "@/hooks/use-aria-live";
import { VoiceRecognizer, isSpeechRecognitionSupported } from "@/lib/speech-recognition";

interface AISearchResult {
  title: string;
  section: string;
  url: string;
  category: string;
  snippet: string;
  relevance: "high" | "medium" | "low";
}

interface AISearchResponse {
  query: string;
  expandedQuery?: string;
  results: AISearchResult[];
  summary?: string;
  suggestedQueries?: string[];
}

export function AISearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AISearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);
  const router = useRouter();
  const { announce } = useAnnouncer();

  // Check speech recognition support
  useEffect(() => {
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
    setResponse(null);
    setError(null);
  }, []);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + K to open AI search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "k") {
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

  // Debounced AI search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 3) {
      setResponse(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performAISearch(query);
    }, 500); // Debounce for 500ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performAISearch = async (searchQuery: string) => {
    setError(null);
    startSearchTransition(async () => {
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
        setResponse(data);
        setSelectedIndex(0);

        // Announce results for screen readers
        if (data.results.length > 0) {
          announce(
            `${data.results.length} ${data.results.length === 1 ? "result" : "results"} found`
          );
        } else {
          announce("No results found");
        }
      } catch (err) {
        console.error("AI search error:", err);
        setError("Search failed. Please try again.");
      }
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!response?.results.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, response.results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && response.results[selectedIndex]) {
        e.preventDefault();
        navigateToResult(response.results[selectedIndex].url);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [response, selectedIndex]
  );

  // Navigate to result
  const navigateToResult = (url: string) => {
    setIsNavigating(true);
    router.push(url);
    setTimeout(() => {
      closeModal();
      setIsNavigating(false);
    }, 150);
  };

  // Handle suggested query click
  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
  };

  const relevanceColors = {
    high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <>
      {/* AI Search button */}
      <button
        ref={triggerButtonRef}
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg",
          "text-gray-600 dark:text-gray-400",
          "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10",
          "border border-violet-500/30 dark:border-violet-500/20",
          "hover:border-violet-500/50 dark:hover:border-violet-500/40",
          "hover:text-violet-600 dark:hover:text-violet-400",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
        )}
        aria-label="AI Search (Ctrl+Shift+K or Cmd+Shift+K)"
        aria-haspopup="dialog"
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="hidden sm:inline">AI Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-200/50 dark:bg-gray-700/50 rounded">
          <span className="text-xs">⌘⇧</span>K
        </kbd>
      </button>

      {/* AI Search modal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-search-dialog-title"
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
                  "border border-violet-500/30 dark:border-violet-500/20",
                  "shadow-2xl shadow-violet-500/10",
                  "animate-scale-in"
                )}
              >
                <h2 id="ai-search-dialog-title" className="sr-only">
                  AI-Powered Search
                </h2>

                {/* Close button */}
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
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

                {/* Header badge */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-[#262626]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 text-violet-600 dark:text-violet-400 font-medium">
                      <SparklesIcon className="w-3 h-3" />
                      AI-Powered
                    </span>
                    <span className="text-gray-500">
                      Natural language search with intelligent results
                    </span>
                  </div>
                </div>

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 pr-12 border-b border-gray-300 dark:border-gray-700">
                  <svg
                    className="w-5 h-5 text-violet-500 dark:text-violet-400 flex-shrink-0"
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
                    placeholder={isListening ? "Listening..." : "Ask anything about Claude Code..."}
                    value={isListening ? interimTranscript || query : query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "w-full py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 outline-none",
                      isListening && "placeholder-violet-500"
                    )}
                    aria-label="AI Search"
                    aria-autocomplete="list"
                    aria-controls={response?.results.length ? "ai-search-results" : undefined}
                    aria-activedescendant={
                      response?.results.length ? `ai-search-result-${selectedIndex}` : undefined
                    }
                    disabled={isListening}
                  />
                  {/* Voice search button */}
                  {speechSupported && (
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
                      <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    </div>
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

                {/* Error state */}
                {error && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}

                {/* AI Summary */}
                {response?.summary && (
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-[#262626] bg-violet-500/5">
                    <div className="flex items-start gap-2">
                      <SparklesIcon className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{response.summary}</p>
                    </div>
                  </div>
                )}

                {/* Expanded query info */}
                {response?.expandedQuery && (
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#262626] text-xs text-gray-500">
                    Also searching: <span className="text-violet-500">{response.expandedQuery}</span>
                  </div>
                )}

                {/* Results */}
                {response && response.results.length > 0 && (
                  <ul
                    id="ai-search-results"
                    role="listbox"
                    aria-label="Search results"
                    className="max-h-80 overflow-y-auto py-2"
                  >
                    {response.results.map((result, index) => (
                      <li
                        key={result.url}
                        id={`ai-search-result-${index}`}
                        role="option"
                        aria-selected={index === selectedIndex}
                      >
                        <button
                          onClick={() => navigateToResult(result.url)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "w-full px-4 py-3 text-left flex items-start gap-3 transition-all focus:outline-none",
                            index === selectedIndex
                              ? "bg-violet-500/10"
                              : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                            isNavigating && index === selectedIndex && "opacity-50"
                          )}
                          tabIndex={-1}
                          disabled={isNavigating}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                relevanceColors[result.relevance]
                              )}
                            >
                              {result.relevance}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium truncate",
                                index === selectedIndex
                                  ? "text-violet-600 dark:text-violet-400"
                                  : "text-gray-900 dark:text-white"
                              )}
                            >
                              {result.title}
                              {result.section !== result.title && (
                                <span className="text-gray-500 font-normal">
                                  {" "}
                                  › {result.section}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {result.snippet}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{result.category}</p>
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
                {response && response.results.length === 0 && !isSearching && (
                  <div className="px-4 py-12 text-center" role="status" aria-live="polite">
                    <p className="text-gray-600 dark:text-gray-400">
                      No results found for &quot;{query}&quot;
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try rephrasing your question or use different keywords
                    </p>
                  </div>
                )}

                {/* Suggested queries */}
                {response?.suggestedQueries && response.suggestedQueries.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626]">
                    <p className="text-xs font-medium text-gray-500 mb-2">Related searches:</p>
                    <div className="flex flex-wrap gap-2">
                      {response.suggestedQueries.map((suggested, i) => (
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
                {!response && !isSearching && query.length < 3 && (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 mb-4">
                      <SparklesIcon className="w-6 h-6 text-violet-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ask questions in natural language
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Try: &quot;How do I configure MCP servers?&quot; or &quot;What permissions
                      does Claude need?&quot;
                    </p>
                    <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>{" "}
                        Navigate
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          Enter
                        </kbd>{" "}
                        Select
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>{" "}
                        Close
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <SparklesIcon className="w-3 h-3" />
                      Powered by Claude AI
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
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
