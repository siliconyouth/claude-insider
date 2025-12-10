"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";

/**
 * Focus Trap Hook
 * Traps keyboard focus within a container element for modal dialogs
 *
 * Part of the UX System - Pillar 7: Accessibility Refinements
 *
 * Features:
 * - Traps Tab/Shift+Tab within container
 * - Handles dynamic content (mutation observer)
 * - Returns focus to trigger on close
 * - Supports initial focus element
 * - Auto-focuses first focusable element
 */

// ============================================
// TYPES
// ============================================

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Element to focus initially (defaults to first focusable) */
  initialFocusRef?: RefObject<HTMLElement>;
  /** Element to return focus to on close */
  returnFocusRef?: RefObject<HTMLElement>;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
  /** Whether to close on escape */
  closeOnEscape?: boolean;
  /** Whether to close when clicking outside */
  closeOnClickOutside?: boolean;
  /** Callback when clicking outside */
  onClickOutside?: () => void;
  /** Auto focus first focusable element */
  autoFocus?: boolean;
}

interface UseFocusTrapReturn {
  /** Ref to attach to the container element */
  containerRef: RefObject<HTMLDivElement>;
  /** Manually focus the first focusable element */
  focusFirst: () => void;
  /** Manually focus the last focusable element */
  focusLast: () => void;
  /** Get all focusable elements in container */
  getFocusableElements: () => HTMLElement[];
}

// ============================================
// CONSTANTS
// ============================================

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
  "audio[controls]",
  "video[controls]",
  "details > summary",
].join(", ");

// ============================================
// HOOK
// ============================================

export function useFocusTrap(
  options: UseFocusTrapOptions = {}
): UseFocusTrapReturn {
  const {
    enabled = true,
    initialFocusRef,
    returnFocusRef,
    onEscape,
    closeOnEscape = true,
    closeOnClickOutside = false,
    onClickOutside,
    autoFocus = true,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTORS
    );

    // Filter out elements that are not visible
    return Array.from(elements).filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !el.hasAttribute("inert") &&
        el.offsetParent !== null
      );
    });
  }, []);

  // Focus first focusable element
  const focusFirst = useCallback(() => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [getFocusableElements]);

  // Focus last focusable element
  const focusLast = useCallback(() => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape
      if (event.key === "Escape") {
        if (closeOnEscape) {
          event.preventDefault();
          event.stopPropagation();
          onEscape?.();
        }
        return;
      }

      // Handle Tab
      if (event.key === "Tab") {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift+Tab on first element -> focus last
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab on last element -> focus first
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        // If focus is outside container, bring it back
        if (
          containerRef.current &&
          !containerRef.current.contains(activeElement)
        ) {
          event.preventDefault();
          if (event.shiftKey) {
            lastElement.focus();
          } else {
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, closeOnEscape, onEscape, getFocusableElements]);

  // Handle click outside
  useEffect(() => {
    if (!enabled || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside?.();
      }
    };

    // Delay to prevent immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [enabled, closeOnClickOutside, onClickOutside]);

  // Store previous focus and set initial focus
  useEffect(() => {
    if (!enabled) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set initial focus
    if (autoFocus) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          focusFirst();
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [enabled, autoFocus, initialFocusRef, focusFirst]);

  // Return focus when disabled
  useEffect(() => {
    if (enabled) return;

    // Return focus to specified element or previous element
    const elementToFocus =
      returnFocusRef?.current || previousActiveElement.current;

    if (elementToFocus && typeof elementToFocus.focus === "function") {
      elementToFocus.focus();
    }
  }, [enabled, returnFocusRef]);

  // Handle dynamic content with MutationObserver
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const observer = new MutationObserver(() => {
      // Re-check focusable elements when DOM changes
      const focusable = getFocusableElements();
      const activeElement = document.activeElement as HTMLElement;

      // If current focus is outside container, bring it back
      if (
        containerRef.current &&
        !containerRef.current.contains(activeElement)
      ) {
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "tabindex", "hidden"],
    });

    return () => observer.disconnect();
  }, [enabled, getFocusableElements]);

  return {
    containerRef: containerRef as RefObject<HTMLDivElement>,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

// ============================================
// useFocusReturn Hook
// ============================================

interface UseFocusReturnOptions {
  /** Whether to enable focus return */
  enabled?: boolean;
  /** Element to return focus to */
  returnTo?: RefObject<HTMLElement>;
}

/**
 * Simple hook to return focus to a previous element
 * Useful when you need focus return without full trap
 */
export function useFocusReturn(options: UseFocusReturnOptions = {}) {
  const { enabled = true, returnTo } = options;
  const previousElement = useRef<HTMLElement | null>(null);

  // Store focus on mount
  useEffect(() => {
    if (enabled) {
      previousElement.current = document.activeElement as HTMLElement;
    }
  }, [enabled]);

  // Return focus on unmount
  useEffect(() => {
    return () => {
      if (enabled) {
        const element = returnTo?.current || previousElement.current;
        if (element && typeof element.focus === "function") {
          // Use setTimeout to ensure cleanup happens after React updates
          setTimeout(() => element.focus(), 0);
        }
      }
    };
  }, [enabled, returnTo]);

  return {
    previousElement: previousElement.current,
    returnFocus: () => {
      const element = returnTo?.current || previousElement.current;
      if (element && typeof element.focus === "function") {
        element.focus();
      }
    },
  };
}

// ============================================
// useFocusVisible Hook
// ============================================

/**
 * Detects if focus should be visible (keyboard navigation)
 * vs hidden (mouse click)
 */
export function useFocusVisible() {
  const ref = useRef<HTMLElement>(null);
  const isFocusVisible = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        isFocusVisible.current = true;
      }
    };

    const handleMouseDown = () => {
      isFocusVisible.current = false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return {
    ref,
    isFocusVisible: isFocusVisible.current,
  };
}

// ============================================
// useRovingTabIndex Hook
// ============================================

interface UseRovingTabIndexOptions {
  /** Current focused index */
  currentIndex: number;
  /** Total number of items */
  itemCount: number;
  /** Callback when index changes */
  onIndexChange: (index: number) => void;
  /** Whether navigation wraps around */
  wrap?: boolean;
  /** Orientation for arrow key handling */
  orientation?: "horizontal" | "vertical" | "both";
}

/**
 * Implements roving tabindex pattern for list navigation
 * (e.g., menu items, toolbar buttons, listbox options)
 */
export function useRovingTabIndex(options: UseRovingTabIndexOptions) {
  const {
    currentIndex,
    itemCount,
    onIndexChange,
    wrap = true,
    orientation = "vertical",
  } = options;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newIndex = currentIndex;

      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal =
        orientation === "horizontal" || orientation === "both";

      switch (event.key) {
        case "ArrowUp":
          if (isVertical) {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? itemCount - 1 : 0;
            }
          }
          break;
        case "ArrowDown":
          if (isVertical) {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= itemCount) {
              newIndex = wrap ? 0 : itemCount - 1;
            }
          }
          break;
        case "ArrowLeft":
          if (isHorizontal) {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? itemCount - 1 : 0;
            }
          }
          break;
        case "ArrowRight":
          if (isHorizontal) {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= itemCount) {
              newIndex = wrap ? 0 : itemCount - 1;
            }
          }
          break;
        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;
        case "End":
          event.preventDefault();
          newIndex = itemCount - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        onIndexChange(newIndex);
      }
    },
    [currentIndex, itemCount, onIndexChange, wrap, orientation]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === currentIndex ? 0 : -1),
    [currentIndex]
  );

  return {
    handleKeyDown,
    getTabIndex,
  };
}
