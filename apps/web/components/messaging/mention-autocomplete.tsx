"use client";

/**
 * Mention Autocomplete Component
 *
 * Shows autocomplete suggestions when user types @ in chat input.
 * Filters participants as user types and allows selection via click or keyboard.
 *
 * Features:
 * - Triggered immediately when @ is typed
 * - Shows conversation participants + AI assistant
 * - Keyboard navigation (up/down arrows, enter to select, escape to close)
 * - Click to select
 * - Filters by name/username as user types
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

// ============================================================================
// Types
// ============================================================================

export interface MentionUser {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isAI?: boolean;
}

interface MentionAutocompleteProps {
  /** Current input value */
  inputValue: string;
  /** Cursor position in input */
  cursorPosition: number;
  /** Available users to mention (participants) - shown first */
  users: MentionUser[];
  /** Whether to show the autocomplete */
  isOpen: boolean;
  /** Called when autocomplete should open/close */
  onOpenChange: (open: boolean) => void;
  /** Called when a user is selected */
  onSelect: (user: MentionUser, mentionText: string) => void;
  /** Optional async function to search all users (like Telegram) */
  onSearch?: (query: string) => Promise<MentionUser[]>;
  /** Position relative to input */
  position?: { top: number; left: number };
  className?: string;
}

// AI Assistant as mentionable user
const AI_USER: MentionUser = {
  id: AI_ASSISTANT_USER_ID,
  name: "Claude Insider",
  username: "claudeinsider",
  isAI: true,
};

// ============================================================================
// Hook: useMentionDetection
// ============================================================================

/**
 * Hook to detect @ mentions in input and track what user is typing after @
 */
export function useMentionDetection(inputValue: string, cursorPosition: number) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);

  useEffect(() => {
    // Look backward from cursor to find @
    const textBeforeCursor = inputValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) {
      setMentionQuery(null);
      setMentionStart(-1);
      return;
    }

    // Check if @ is at start or preceded by whitespace
    const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
    if (charBefore !== " " && charBefore !== "\n" && lastAtIndex !== 0) {
      setMentionQuery(null);
      setMentionStart(-1);
      return;
    }

    // Get text after @ until cursor
    const query = textBeforeCursor.slice(lastAtIndex + 1);

    // If query contains space, mention is complete
    if (query.includes(" ")) {
      setMentionQuery(null);
      setMentionStart(-1);
      return;
    }

    setMentionQuery(query.toLowerCase());
    setMentionStart(lastAtIndex);
  }, [inputValue, cursorPosition]);

  return { mentionQuery, mentionStart };
}

// ============================================================================
// Component
// ============================================================================

export function MentionAutocomplete({
  inputValue,
  cursorPosition,
  users,
  isOpen,
  onOpenChange,
  onSelect,
  onSearch,
  position,
  className,
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<MentionUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Use mention detection hook
  const { mentionQuery, mentionStart } = useMentionDetection(inputValue, cursorPosition);

  // All mentionable users (participants + AI) - memoized
  const localUsers: MentionUser[] = useMemo(
    () => [AI_USER, ...users.filter((u) => u.id !== AI_ASSISTANT_USER_ID)],
    [users]
  );

  // Search for users when query is 2+ characters (like Telegram)
  useEffect(() => {
    if (!onSearch || mentionQuery === null || mentionQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(mentionQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mentionQuery, onSearch]);

  // Merge local users with search results, deduplicating - memoized
  const filteredUsers = useMemo(() => {
    const localFiltered = mentionQuery !== null
      ? localUsers.filter((user) => {
          if (mentionQuery === "") return true;
          const searchTerm = mentionQuery.toLowerCase();
          return (
            user.name.toLowerCase().includes(searchTerm) ||
            (user.username?.toLowerCase().includes(searchTerm) ?? false)
          );
        })
      : [];

    if (searchResults.length === 0) return localFiltered;

    // Deduplicate: merge search results, excluding those already in local
    const localIds = new Set(localFiltered.map((u) => u.id));
    const additionalUsers = searchResults.filter((u) => !localIds.has(u.id));

    return [...localFiltered, ...additionalUsers];
  }, [localUsers, searchResults, mentionQuery]);

  // Open/close based on whether we have a mention query and results
  useEffect(() => {
    const shouldBeOpen = mentionQuery !== null && filteredUsers.length > 0;
    if (shouldBeOpen !== isOpen) {
      onOpenChange(shouldBeOpen);
    }
  }, [mentionQuery, filteredUsers.length, isOpen, onOpenChange]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
          break;
        case "Enter":
        case "Tab":
          if (filteredUsers[selectedIndex]) {
            e.preventDefault();
            handleSelect(filteredUsers[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [isOpen, filteredUsers, selectedIndex, onOpenChange]
  );

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  // Handle selection
  const handleSelect = (user: MentionUser) => {
    const mentionText = `@${user.username || user.name.replace(/\s+/g, "")}`;
    onSelect(user, mentionText);
    onOpenChange(false);
  };

  // Show loading state when searching or results available
  const shouldShow = isOpen && (filteredUsers.length > 0 || isSearching);
  if (!shouldShow) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className={cn(
        "absolute z-50 w-64 max-h-48 overflow-y-auto",
        "bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg",
        "border border-gray-200 dark:border-[#333]",
        "py-1",
        className
      )}
      style={position ? { bottom: position.top, left: position.left } : { bottom: "100%", left: 0 }}
    >
      {/* Loading indicator */}
      {isSearching && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Searching users...</span>
        </div>
      )}

      {filteredUsers.map((user, index) => (
        <button
          key={user.id}
          onClick={() => handleSelect(user)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
            index === selectedIndex
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "hover:bg-gray-50 dark:hover:bg-[#262626]"
          )}
        >
          {/* Avatar */}
          {user.isAI ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">CI</span>
            </div>
          ) : user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Name and username */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {user.name}
            </div>
            {user.username && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{user.username}
              </div>
            )}
          </div>

          {/* AI badge */}
          {user.isAI && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              AI
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default MentionAutocomplete;
