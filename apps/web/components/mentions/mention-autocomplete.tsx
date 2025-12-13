"use client";

/**
 * Mention Autocomplete Component
 *
 * Dropdown showing username suggestions while typing @mentions.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { getMentionAtCursor, insertMention } from "@/lib/mentions";
import { searchUsers, type SearchUserResult } from "@/app/actions/users";

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

export function MentionAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder,
  rows = 3,
  maxLength,
  className,
  disabled,
}: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchUserResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionInfo, setMentionInfo] = useState<{
    query: string;
    start: number;
    end: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle cursor/text changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);

    // Check for mention at cursor
    const mention = getMentionAtCursor(newValue, cursorPos);
    setMentionInfo(mention);

    if (mention && mention.query.length >= 1) {
      // Debounce search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        const result = await searchUsers(mention.query);
        if (result.users) {
          setSuggestions(result.users.slice(0, 5));
          setShowSuggestions(result.users.length > 0);
          setSelectedIndex(0);
        }
      }, 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, onSubmit]);

  // Select a suggestion
  const selectSuggestion = useCallback((user: SearchUserResult) => {
    if (!mentionInfo || !user.username) return;
    const username = user.username; // TypeScript narrowing

    const newValue = insertMention(value, mentionInfo.start, mentionInfo.end, username);
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setMentionInfo(null);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionInfo.start + username.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, mentionInfo, onChange]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-lg resize-none",
          "bg-gray-50 dark:bg-[#0a0a0a]",
          "border border-gray-200 dark:border-[#262626]",
          "text-gray-900 dark:text-white placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors",
          className
        )}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            "absolute z-50 w-full mt-1 rounded-xl overflow-hidden",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "shadow-lg max-h-60 overflow-y-auto"
          )}
        >
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectSuggestion(user)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-left",
                "transition-colors",
                index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              )}
            >
              {/* Avatar */}
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {user.name}
                </p>
                {user.username && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      {!showSuggestions && mentionInfo && mentionInfo.query.length > 0 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626] text-sm text-gray-500 dark:text-gray-400">
          Searching for @{mentionInfo.query}...
        </div>
      )}
    </div>
  );
}
