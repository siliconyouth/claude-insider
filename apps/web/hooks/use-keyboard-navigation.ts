/**
 * Keyboard Navigation Hook
 *
 * Provides J/K vim-style navigation for lists.
 */

import { useState, useCallback, useEffect, useRef } from "react";

interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect?: (index: number) => void;
  enabled?: boolean;
  loop?: boolean;
}

interface UseKeyboardNavigationResult {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handlers: {
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  getItemProps: (index: number) => {
    ref: (el: HTMLElement | null) => void;
    tabIndex: number;
    "aria-selected": boolean;
    "data-selected": boolean;
  };
}

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  enabled = true,
  loop = true,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationResult {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Reset selection when item count changes
  useEffect(() => {
    if (selectedIndex >= itemCount) {
             
      setSelectedIndex(itemCount > 0 ? 0 : -1);
    }
  }, [itemCount, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      const element = itemRefs.current.get(selectedIndex);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  const moveSelection = useCallback(
    (direction: "next" | "prev") => {
      if (!enabled || itemCount === 0) return;

      setSelectedIndex((current) => {
        if (direction === "next") {
          if (current < itemCount - 1) {
            return current + 1;
          }
          return loop ? 0 : current;
        } else {
          if (current > 0) {
            return current - 1;
          }
          return loop ? itemCount - 1 : current;
        }
      });
    },
    [enabled, itemCount, loop]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case "j":
        case "ArrowDown":
          event.preventDefault();
          moveSelection("next");
          break;
        case "k":
        case "ArrowUp":
          event.preventDefault();
          moveSelection("prev");
          break;
        case "Enter":
        case " ":
          if (selectedIndex >= 0) {
            event.preventDefault();
            onSelect?.(selectedIndex);
          }
          break;
        case "Home":
          if (itemCount > 0) {
            event.preventDefault();
            setSelectedIndex(0);
          }
          break;
        case "End":
          if (itemCount > 0) {
            event.preventDefault();
            setSelectedIndex(itemCount - 1);
          }
          break;
      }
    },
    [enabled, moveSelection, selectedIndex, onSelect, itemCount]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        if (el) {
          itemRefs.current.set(index, el);
        } else {
          itemRefs.current.delete(index);
        }
      },
      tabIndex: index === selectedIndex ? 0 : -1,
      "aria-selected": index === selectedIndex,
      "data-selected": index === selectedIndex,
    }),
    [selectedIndex]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handlers: {
      onKeyDown: handleKeyDown,
    },
    getItemProps,
  };
}
