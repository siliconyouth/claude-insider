/**
 * Mention Input Component
 *
 * A textarea input that supports @ mentions with autocomplete.
 * Shows user suggestions when @ is typed and allows selecting users.
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  KeyboardEvent,
} from "react";
import { cn } from "@/lib/design-system";

interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  displayName?: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, onSubmit, placeholder, disabled, className }, ref) => {
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mentionStartRef = useRef<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Forward ref
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Search users when mention search changes
    useEffect(() => {
      if (!showMentions || mentionSearch.length < 1) {
        setUsers([]);
        return;
      }

      const searchUsers = async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(mentionSearch)}&limit=5`);
          if (response.ok) {
            const data = await response.json();
            // Add Claude Insider assistant as a special mention
            const assistantUser: User = {
              id: "assistant",
              name: "Claude Insider",
              username: "claudeinsider",
              displayName: "AI Assistant",
            };
            const filteredUsers = data.users || [];
            // Add assistant if search matches
            if ("claudeinsider".includes(mentionSearch.toLowerCase()) || "ai assistant".includes(mentionSearch.toLowerCase())) {
              setUsers([assistantUser, ...filteredUsers]);
            } else {
              setUsers(filteredUsers);
            }
          }
        } catch {
          setUsers([]);
        } finally {
          setIsSearching(false);
        }
      };

      const debounce = setTimeout(searchUsers, 150);
      return () => clearTimeout(debounce);
    }, [mentionSearch, showMentions]);

    // Handle input changes
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart;

      onChange(newValue);

      // Check if we should show mentions
      // Look backwards from cursor to find @
      const textBeforeCursor = newValue.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Check if @ is at start or preceded by whitespace
        const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
        if (lastAtIndex === 0 || charBeforeAt === " " || charBeforeAt === "\n") {
          const searchText = textBeforeCursor.slice(lastAtIndex + 1);
          // Only show if no space after @
          if (!searchText.includes(" ") && searchText.length < 20) {
            mentionStartRef.current = lastAtIndex;
            setMentionSearch(searchText);
            setShowMentions(true);
            setSelectedIndex(0);

            // Calculate dropdown position
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              // Simple positioning - show below the textarea
              const rect = textarea.getBoundingClientRect();
              setMentionPosition({
                top: rect.height + 4,
                left: 0,
              });
            }
            return;
          }
        }
      }

      // Hide mentions if no valid @ found
      setShowMentions(false);
      mentionStartRef.current = null;
    }, [onChange]);

    // Handle user selection
    const selectUser = useCallback((user: User) => {
      if (mentionStartRef.current === null) return;

      const beforeMention = value.slice(0, mentionStartRef.current);
      const cursorPos = textareaRef.current?.selectionStart || value.length;
      const afterMention = value.slice(cursorPos);

      const newValue = `${beforeMention}@${user.username} ${afterMention}`;
      onChange(newValue);

      setShowMentions(false);
      mentionStartRef.current = null;
      setMentionSearch("");

      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + user.username.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }, [value, onChange]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showMentions && users.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const selectedUser = users[selectedIndex];
          if (selectedUser) selectUser(selectedUser);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowMentions(false);
        } else if (e.key === "Tab") {
          e.preventDefault();
          const selectedUser = users[selectedIndex];
          if (selectedUser) selectUser(selectedUser);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    }, [showMentions, users, selectedIndex, selectUser, onSubmit]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setShowMentions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, [value]);

    return (
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none rounded-xl border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111]",
            "px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[48px] max-h-[200px]",
            className
          )}
        />

        {/* Mention dropdown */}
        {showMentions && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full max-w-sm rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111] shadow-lg"
            style={{ top: mentionPosition.top, left: mentionPosition.left }}
          >
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                <svg className="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching...
              </div>
            ) : users.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {mentionSearch.length > 0 ? "No users found" : "Type to search users"}
              </div>
            ) : (
              <div className="py-1 max-h-60 overflow-y-auto">
                {users.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      index === selectedIndex
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    {user.id === "assistant" ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0 p-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icons/icon-192x192.png"
                          alt="Claude Insider AI"
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    ) : user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {(user.displayName || user.name || user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {user.displayName || user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </div>
                    </div>
                    {user.id === "assistant" && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white">
                        AI
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";
