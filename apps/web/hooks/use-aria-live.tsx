"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

/**
 * ARIA Live Region Hooks
 * Provides screen reader announcements for dynamic content
 *
 * Part of the UX System - Pillar 7: Accessibility Refinements
 *
 * Features:
 * - Polite announcements (non-interrupting)
 * - Assertive announcements (interrupting)
 * - Message queuing with debounce
 * - Context-based announcer provider
 * - Hook-based local announcements
 */

// ============================================
// TYPES
// ============================================

type AriaLivePoliteness = "polite" | "assertive" | "off";

interface Announcement {
  id: string;
  message: string;
  politeness: AriaLivePoliteness;
  timestamp: number;
}

interface AnnouncerContextValue {
  /** Make a polite announcement (waits for pause in speech) */
  announce: (message: string) => void;
  /** Make an assertive announcement (interrupts current speech) */
  announceAssertive: (message: string) => void;
  /** Clear all pending announcements */
  clearAnnouncements: () => void;
  /** Current announcements */
  announcements: Announcement[];
}

interface UseAriaLiveOptions {
  /** Default politeness level */
  politeness?: AriaLivePoliteness;
  /** Clear message after this many ms */
  clearAfter?: number;
  /** Debounce rapid announcements */
  debounceMs?: number;
}

// ============================================
// CONTEXT
// ============================================

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

// Stable no-op fallback object for when used outside AnnouncerProvider
// This prevents infinite loops when announce is used as a useEffect dependency
const noopAnnouncer: AnnouncerContextValue = {
  announce: () => {},
  announceAssertive: () => {},
  clearAnnouncements: () => {},
  announcements: [],
};

/**
 * Hook to access the announcer context
 */
export function useAnnouncer() {
  const context = useContext(AnnouncerContext);
  // Return stable reference to prevent infinite loops in useEffect dependencies
  return context ?? noopAnnouncer;
}

// ============================================
// PROVIDER
// ============================================

interface AnnouncerProviderProps {
  children: ReactNode;
  /** Time in ms before announcements are cleared */
  clearAfter?: number;
}

export function AnnouncerProvider({
  children,
  clearAfter = 5000,
}: AnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const clearTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addAnnouncement = useCallback(
    (message: string, politeness: AriaLivePoliteness) => {
      const announcement: Announcement = {
        id: generateId(),
        message,
        politeness,
        timestamp: Date.now(),
      };

      setAnnouncements((prev) => [...prev, announcement]);

      // Set the message in the appropriate live region
      if (politeness === "assertive") {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }

      // Clear after delay
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }

      clearTimeoutRef.current = setTimeout(() => {
        setPoliteMessage("");
        setAssertiveMessage("");
      }, clearAfter);
    },
    [clearAfter]
  );

  const announce = useCallback(
    (message: string) => {
      addAnnouncement(message, "polite");
    },
    [addAnnouncement]
  );

  const announceAssertive = useCallback(
    (message: string) => {
      addAnnouncement(message, "assertive");
    },
    [addAnnouncement]
  );

  const clearAnnouncements = useCallback(() => {
    setPoliteMessage("");
    setAssertiveMessage("");
    setAnnouncements([]);
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnnouncerContext.Provider
      value={{
        announce,
        announceAssertive,
        clearAnnouncements,
        announcements,
      }}
    >
      {children}
      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

// ============================================
// STANDALONE HOOK
// ============================================

/**
 * Standalone ARIA live hook for component-local announcements
 * Use this when you don't need the context-based announcer
 */
export function useAriaLive(options: UseAriaLiveOptions = {}) {
  const {
    politeness = "polite",
    clearAfter = 5000,
    debounceMs = 100,
  } = options;

  const [message, setMessage] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const clearRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const announce = useCallback(
    (text: string, _overridePoliteness?: AriaLivePoliteness) => {
      // Debounce rapid announcements
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        // Clear previous message first to ensure re-announcement
        setMessage("");

        // Small delay to ensure the clear registers
        requestAnimationFrame(() => {
          setMessage(text);
        });

        // Clear after delay
        if (clearRef.current) {
          clearTimeout(clearRef.current);
        }

        clearRef.current = setTimeout(() => {
          setMessage("");
        }, clearAfter);
      }, debounceMs);
    },
    [clearAfter, debounceMs]
  );

  const clear = useCallback(() => {
    setMessage("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (clearRef.current) clearTimeout(clearRef.current);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  // Return the live region props and announce function
  return {
    announce,
    clear,
    message,
    liveRegionProps: {
      role: politeness === "assertive" ? "alert" : "status",
      "aria-live": politeness,
      "aria-atomic": true as const,
      className: "sr-only",
      children: message,
    },
  };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Announce loading state changes
 */
export function useLoadingAnnouncement(
  isLoading: boolean,
  options: {
    loadingMessage?: string;
    loadedMessage?: string;
    announce?: (message: string) => void;
  } = {}
) {
  const {
    loadingMessage = "Loading...",
    loadedMessage = "Content loaded",
    announce: customAnnounce,
  } = options;

  const { announce: contextAnnounce } = useAnnouncer();
  const announce = customAnnounce || contextAnnounce;
  const wasLoading = useRef(false);

  useEffect(() => {
    if (isLoading && !wasLoading.current) {
      announce(loadingMessage);
    } else if (!isLoading && wasLoading.current) {
      announce(loadedMessage);
    }
    wasLoading.current = isLoading;
  }, [isLoading, loadingMessage, loadedMessage, announce]);
}

/**
 * Announce form validation errors
 */
export function useErrorAnnouncement(
  error: string | null | undefined,
  options: {
    prefix?: string;
    announce?: (message: string) => void;
  } = {}
) {
  const { prefix = "Error:", announce: customAnnounce } = options;
  const { announceAssertive: contextAnnounce } = useAnnouncer();
  const announce = customAnnounce || contextAnnounce;
  const previousError = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== previousError.current) {
      announce(`${prefix} ${error}`);
    }
    previousError.current = error || null;
  }, [error, prefix, announce]);
}

/**
 * Announce successful actions
 */
export function useSuccessAnnouncement() {
  const { announce } = useAnnouncer();

  return useCallback(
    (message: string) => {
      announce(message);
    },
    [announce]
  );
}

/**
 * Announce navigation/route changes
 */
export function useRouteAnnouncement(title: string) {
  const { announce } = useAnnouncer();
  const previousTitle = useRef<string>("");

  useEffect(() => {
    if (title && title !== previousTitle.current) {
      // Delay to allow page to render
      const timeoutId = setTimeout(() => {
        announce(`Navigated to ${title}`);
      }, 100);

      previousTitle.current = title;
      return () => clearTimeout(timeoutId);
    }
  }, [title, announce]);
}

/**
 * Announce countdown/timer updates
 */
export function useCountdownAnnouncement(
  secondsRemaining: number,
  options: {
    announceAt?: number[];
    formatMessage?: (seconds: number) => string;
  } = {}
) {
  const {
    announceAt = [30, 10, 5, 3, 2, 1],
    formatMessage = (s) =>
      s === 1 ? "1 second remaining" : `${s} seconds remaining`,
  } = options;
  const { announce } = useAnnouncer();
  const announcedValues = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (announceAt.includes(secondsRemaining) && !announcedValues.current.has(secondsRemaining)) {
      announce(formatMessage(secondsRemaining));
      announcedValues.current.add(secondsRemaining);
    }

    // Reset when countdown restarts
    if (secondsRemaining > Math.max(...announceAt)) {
      announcedValues.current.clear();
    }
  }, [secondsRemaining, announceAt, formatMessage, announce]);
}

/**
 * Announce list item count changes
 */
export function useListCountAnnouncement(
  count: number,
  options: {
    itemName?: string;
    pluralItemName?: string;
  } = {}
) {
  const { itemName = "item", pluralItemName = "items" } = options;
  const { announce } = useAnnouncer();
  const previousCount = useRef<number>(count);

  useEffect(() => {
    if (count !== previousCount.current) {
      const name = count === 1 ? itemName : pluralItemName;
      announce(`${count} ${name}`);
      previousCount.current = count;
    }
  }, [count, itemName, pluralItemName, announce]);
}
