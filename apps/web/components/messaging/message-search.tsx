"use client";

/**
 * Message Search Component
 *
 * In-conversation search UI with:
 * - Search input with clear button
 * - Results list with match highlighting
 * - Keyboard navigation (up/down/enter)
 * - Jump to message on click
 *
 * Matrix SDK pattern: Inline search within chat window.
 */

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useMessageSearch } from "@/hooks/use-message-search";

interface MessageSearchBarProps {
  conversationId: string;
  /** Callback when user wants to jump to a message */
  onJumpToMessage: (messageId: string) => void;
  /** Whether the search bar is visible */
  isOpen: boolean;
  /** Callback to close search */
  onClose: () => void;
  className?: string;
}

export function MessageSearchBar({
  conversationId,
  onJumpToMessage,
  isOpen,
  onClose,
  className,
}: MessageSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useMessageSearch({
    conversationId,
    onJumpToMessage,
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear search when closed
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowDown":
        e.preventDefault();
        nextResult();
        break;
      case "ArrowUp":
        e.preventDefault();
        prevResult();
        break;
      case "Enter":
        e.preventDefault();
        jumpToSelected();
        onClose();
        break;
    }
  }, [onClose, nextResult, prevResult, jumpToSelected]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "flex flex-col",
        "bg-white dark:bg-[#1a1a1a]",
        "border-b border-gray-200 dark:border-[#333]",
        className
      )}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search icon */}
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in conversation..."
          className={cn(
            "flex-1 bg-transparent",
            "text-sm text-gray-900 dark:text-white",
            "placeholder-gray-400 dark:placeholder-gray-500",
            "focus:outline-none"
          )}
        />

        {/* Loading spinner or result count */}
        {isSearching ? (
          <svg
            className="w-4 h-4 text-gray-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : query && totalCount > 0 ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {selectedIndex + 1} of {totalCount}
          </span>
        ) : null}

        {/* Navigation arrows */}
        {results.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={prevResult}
              className={cn(
                "p-1 rounded",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title="Previous result (↑)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={nextResult}
              className={cn(
                "p-1 rounded",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title="Next result (↓)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Clear/Close button */}
        <button
          onClick={onClose}
          className={cn(
            "p-1 rounded",
            "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          title="Close search (Esc)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results dropdown */}
      {query && !isSearching && (
        <div className="max-h-48 overflow-y-auto border-t border-gray-100 dark:border-[#262626]">
          {error ? (
            <div className="px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No messages found
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.message.id}
                onClick={() => {
                  onJumpToMessage(result.message.id);
                  onClose();
                }}
                className={cn(
                  "w-full px-4 py-2 text-left",
                  "hover:bg-gray-50 dark:hover:bg-[#222]",
                  index === selectedIndex && "bg-blue-50 dark:bg-blue-900/20",
                  "transition-colors"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {result.message.senderName}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {formatSearchTime(result.message.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  <HighlightedText
                    text={result.matchContext}
                    highlight={query}
                  />
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format time for search results (shorter format)
 */
function formatSearchTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Highlight matching text in search results
 */
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegex(highlight)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Escape special regex characters in search query
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Search Toggle Button - can be placed in chat header
 */
interface SearchToggleButtonProps {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export function SearchToggleButton({
  onClick,
  isActive = false,
  className,
}: SearchToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg",
        "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive && "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-cyan-400",
        "transition-colors",
        className
      )}
      title="Search in conversation (Ctrl+F)"
      aria-label="Search in conversation"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
  );
}
