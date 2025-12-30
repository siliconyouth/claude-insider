"use client";

/**
 * Command Palette Modal
 *
 * The main command palette UI with fuzzy search.
 * Uses Fuse.js for typo-tolerant searching.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import Fuse from "fuse.js";
import { useCommandPalette } from "./command-palette-provider";
import {
  getGroupedCommands,
  type Command,
  type CommandGroup,
  type UserRole,
  type CommandContext,
} from "@/lib/commands";
import { cn } from "@/lib/design-system";

// ============================================
// TYPES
// ============================================

interface CommandPaletteModalProps {
  /** Current user role for filtering commands */
  userRole?: UserRole;
}

// ============================================
// ICONS
// ============================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} fill="none" viewBox="0 0 24 24">
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ============================================
// KEYBOARD SHORTCUT DISPLAY
// ============================================

function ShortcutBadge({ shortcut }: { shortcut: Command["shortcut"] }) {
  if (!shortcut) return null;

  const modifierSymbols: Record<string, string> = {
    meta: "⌘",
    ctrl: "⌃",
    alt: "⌥",
    shift: "⇧",
  };

  return (
    <div className="ui-cmd-shortcut">
      {shortcut.modifiers?.map((mod) => (
        <kbd key={mod} className="ui-cmd-key">
          {modifierSymbols[mod] || mod}
        </kbd>
      ))}
      <kbd className="ui-cmd-key">{shortcut.key.toUpperCase()}</kbd>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CommandPaletteModal({
  userRole = "user",
}: CommandPaletteModalProps) {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get filtered commands for user role
  const groups = useMemo(() => getGroupedCommands(userRole), [userRole]);

  // Flatten commands for search
  const allCommands = useMemo(
    () => groups.flatMap((group) => group.commands),
    [groups],
  );

  // Fuse.js search instance
  const fuse = useMemo(
    () =>
      new Fuse(allCommands, {
        keys: [
          { name: "label", weight: 2 },
          { name: "description", weight: 1 },
          { name: "keywords", weight: 1.5 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [allCommands],
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return groups;
    }

    const results = fuse.search(query);
    const matchedCommands = results.map((r) => r.item);

    // Group results by category
    const groupedResults: CommandGroup[] = [];

    const navigation = matchedCommands.filter((c) => c.category === "navigation");
    const actions = matchedCommands.filter((c) => c.category === "action");
    const settings = matchedCommands.filter((c) => c.category === "settings");

    if (navigation.length > 0) {
      groupedResults.push({ id: "navigation", label: "Navigation", commands: navigation });
    }
    if (actions.length > 0) {
      groupedResults.push({ id: "action", label: "Actions", commands: actions });
    }
    if (settings.length > 0) {
      groupedResults.push({ id: "settings", label: "Settings", commands: settings });
    }

    return groupedResults;
  }, [query, groups, fuse]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(
    () => searchResults.flatMap((group) => group.commands),
    [searchResults],
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current || flatResults.length === 0) return;

    const items = listRef.current.querySelectorAll("[data-command-item]");
    const selectedItem = items[selectedIndex] as HTMLElement | undefined;
    selectedItem?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, flatResults.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
          break;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case "Enter":
          event.preventDefault();
          if (flatResults[selectedIndex]) {
            executeCommand(flatResults[selectedIndex]);
          }
          break;

        case "Tab":
          // Prevent focus from leaving modal
          event.preventDefault();
          break;
      }
    },
    [flatResults, selectedIndex],
  );

  // Execute a command
  const executeCommand = useCallback(
    async (command: Command) => {
      setIsExecuting(true);

      const context: CommandContext = {
        userRole,
        pathname,
        close,
        navigate: (href: string) => {
          close();
          router.push(href);
        },
      };

      try {
        await command.action(context);
      } catch (error) {
        console.error("[CommandPalette] Command execution failed:", error);
      } finally {
        setIsExecuting(false);
      }
    },
    [userRole, pathname, close, router],
  );

  // Click backdrop to close
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        close();
      }
    },
    [close],
  );

  // Don't render if closed or on server
  if (!isOpen || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div className="ui-cmd-modal" onClick={handleBackdropClick} role="dialog" aria-modal>
      <div className="ui-cmd-container" role="combobox" aria-expanded="true">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="ui-cmd-input pl-12"
            placeholder="Search commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
            aria-autocomplete="list"
          />
          {isExecuting && (
            <LoadingSpinner className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Command List */}
        <div ref={listRef} className="ui-cmd-list" role="listbox">
          {searchResults.length === 0 ? (
            <div className="ui-cmd-empty">
              No commands found for "{query}"
            </div>
          ) : (
            searchResults.map((group) => (
              <div key={group.id} role="group" aria-label={group.label}>
                <div className="ui-cmd-group">{group.label}</div>
                {group.commands.map((command) => {
                  const globalIndex = flatResults.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <div
                      key={command.id}
                      data-command-item
                      className={cn(
                        "ui-cmd-item",
                        isSelected && "ui-cmd-item-selected",
                      )}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {/* Icon */}
                      {command.icon && (
                        <span className="w-5 h-5 flex items-center justify-center opacity-70">
                          {command.icon}
                        </span>
                      )}

                      {/* Label & Description */}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{command.label}</div>
                        {command.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {command.description}
                          </div>
                        )}
                      </div>

                      {/* Shortcut */}
                      <ShortcutBadge shortcut={command.shortcut} />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t ui-border flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="ui-cmd-key">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="ui-cmd-key">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="ui-cmd-key">esc</kbd>
              Close
            </span>
          </div>
          <span>{flatResults.length} commands</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
