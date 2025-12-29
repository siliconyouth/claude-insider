"use client";

/**
 * Emoji Picker Component
 *
 * A simple emoji picker for message reactions.
 * Shows commonly used reaction emojis in a compact popover.
 * Uses viewport-aware positioning to prevent clipping.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";

// Common reaction emojis (Matrix SDK convention - simple, universal set)
const REACTION_EMOJIS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "🎉", "🔥",
  "👏", "🙏", "💯", "✅", "❌", "👀", "🤔", "💪",
];

// Quick reactions (shown prominently)
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉"];

// Picker dimensions for positioning calculations
const PICKER_WIDTH_QUICK = 220; // 5 emojis + expand button
const PICKER_WIDTH_FULL = 300; // 8-column grid
const PICKER_HEIGHT_QUICK = 48;
const PICKER_HEIGHT_FULL = 140;
const PADDING = 8;

interface Position {
  top: number;
  left: number;
  side: "above" | "below";
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  /** Anchor element rect for positioning (from getBoundingClientRect) */
  anchorRect?: DOMRect | null;
  className?: string;
}

export function EmojiPicker({
  onSelect,
  onClose,
  anchorRect,
  className,
}: EmojiPickerProps) {
  const [showAll, setShowAll] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate position based on anchor and viewport
  const calculatePosition = useCallback((rect: DOMRect, expanded: boolean): Position => {
    const pickerWidth = expanded ? PICKER_WIDTH_FULL : PICKER_WIDTH_QUICK;
    const pickerHeight = expanded ? PICKER_HEIGHT_FULL : PICKER_HEIGHT_QUICK;

    // Center horizontally on anchor
    let left = rect.left + rect.width / 2 - pickerWidth / 2;

    // Keep within horizontal bounds
    if (left < PADDING) left = PADDING;
    if (left + pickerWidth > window.innerWidth - PADDING) {
      left = window.innerWidth - pickerWidth - PADDING;
    }

    // Determine vertical position based on available space
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let side: "above" | "below";
    let top: number;

    // Prefer above, but use below if not enough space
    if (spaceAbove >= pickerHeight + PADDING) {
      side = "above";
      top = rect.top - pickerHeight - PADDING;
    } else if (spaceBelow >= pickerHeight + PADDING) {
      side = "below";
      top = rect.bottom + PADDING;
    } else {
      // Not enough space either way - use the larger space
      if (spaceAbove >= spaceBelow) {
        side = "above";
        top = Math.max(PADDING, rect.top - pickerHeight - PADDING);
      } else {
        side = "below";
        top = rect.bottom + PADDING;
      }
    }

    return { top, left, side };
  }, []);

  // Mount state and initial position
  useEffect(() => {
    setMounted(true);
    if (anchorRect) {
      setPosition(calculatePosition(anchorRect, false));
    }
    return () => setMounted(false);
  }, [anchorRect, calculatePosition]);

  // Update position when expanded
  useEffect(() => {
    if (anchorRect && mounted) {
      setPosition(calculatePosition(anchorRect, showAll));
    }
  }, [showAll, anchorRect, mounted, calculatePosition]);

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

  const pickerWidth = showAll ? PICKER_WIDTH_FULL : PICKER_WIDTH_QUICK;

  // If no position yet or not mounted, don't render
  if (!mounted || !position) return null;

  const picker = (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-[100]",
        "bg-white dark:bg-[#1a1a1a]",
        "border border-gray-200 dark:border-[#333]",
        "rounded-xl shadow-xl",
        "p-2",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        position.side === "above" ? "origin-bottom" : "origin-top",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        width: pickerWidth,
      }}
    >
      {/* Quick reactions row - only shown when collapsed */}
      {!showAll && (
        <div className="flex items-center gap-1">
          {QUICK_REACTIONS.map((emoji) => (
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
        </div>
      )}

      {/* Full emoji grid - only shown when expanded */}
      {showAll && (
        <div className="grid grid-cols-8 gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={`all-${emoji}`}
              onClick={() => handleSelect(emoji)}
              className={cn(
                "p-1.5 rounded-lg text-lg",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-transform hover:scale-110",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(picker, document.body);
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      // Capture the button's position when opening
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setAnchorRect(null);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={handleClick}
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
          onClose={handleClose}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}
