"use client";

/**
 * Emoji Picker Component
 *
 * A simple emoji picker for message reactions.
 * Shows commonly used reaction emojis in a compact popover.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";

// Common reaction emojis (Matrix SDK convention - simple, universal set)
const REACTION_EMOJIS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "🎉", "🔥",
  "👏", "🙏", "💯", "✅", "❌", "👀", "🤔", "💪",
];

// Quick reactions (shown prominently)
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  /** Position relative to trigger */
  position?: "above" | "below";
  className?: string;
}

export function EmojiPicker({
  onSelect,
  onClose,
  position = "above",
  className,
}: EmojiPickerProps) {
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose]
  );

  const emojisToShow = showAll ? REACTION_EMOJIS : QUICK_REACTIONS;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-50",
        "bg-white dark:bg-[#1a1a1a]",
        "border border-gray-200 dark:border-[#333]",
        "rounded-xl shadow-lg",
        "p-2",
        position === "above" ? "bottom-full mb-2" : "top-full mt-2",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {emojisToShow.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className={cn(
              "p-1.5 rounded-lg text-lg",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-transform hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        {/* Toggle to show more emojis */}
        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className={cn(
              "p-1.5 rounded-lg text-sm",
              "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="More emojis"
          >
            +
          </button>
        )}
      </div>

      {/* Full emoji grid */}
      {showAll && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-8 gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={`all-${emoji}`}
                onClick={() => handleSelect(emoji)}
                className={cn(
                  "p-1 rounded text-lg",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-transform hover:scale-110",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact reaction button that shows the emoji picker
 */
interface ReactionButtonProps {
  onReact: (emoji: string) => void;
  className?: string;
}

export function ReactionButton({ onReact, className }: ReactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1.5 rounded-full",
          "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "transition-colors",
          isOpen && "bg-gray-100 dark:bg-gray-800"
        )}
        title="Add reaction"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <EmojiPicker
          onSelect={onReact}
          onClose={() => setIsOpen(false)}
          position="above"
        />
      )}
    </div>
  );
}
