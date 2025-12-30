"use client";

/**
 * Dashboard Navigation Context
 *
 * Manages collapse state for navigation groups with localStorage persistence.
 * Groups stay expanded/collapsed across sessions.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ============================================
// TYPES
// ============================================

interface NavContextValue {
  /** Map of group IDs to their expanded state */
  expandedGroups: Record<string, boolean>;
  /** Toggle a group's expanded state */
  toggleGroup: (groupId: string) => void;
  /** Check if a group is expanded */
  isExpanded: (groupId: string) => boolean;
  /** Expand all groups */
  expandAll: () => void;
  /** Collapse all groups */
  collapseAll: () => void;
}

// ============================================
// CONTEXT
// ============================================

const NavContext = createContext<NavContextValue | null>(null);

const STORAGE_KEY = "dashboard-nav-state";

// Default expanded state for groups
const DEFAULT_EXPANDED: Record<string, boolean> = {
  overview: true,
  content: true,
  moderation: true,
  analytics: false,
  security: false,
  admin: false,
  settings: false,
};

// ============================================
// PROVIDER
// ============================================

interface NavProviderProps {
  children: ReactNode;
}

export function NavProvider({ children }: NavProviderProps) {
  const [expandedGroups, setExpandedGroups] =
    useState<Record<string, boolean>>(DEFAULT_EXPANDED);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setExpandedGroups({ ...DEFAULT_EXPANDED, ...parsed });
      }
    } catch {
      // Ignore parse errors, use defaults
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups));
      } catch {
        // Ignore storage errors (private mode, quota exceeded)
      }
    }
  }, [expandedGroups, isHydrated]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const isExpanded = useCallback(
    (groupId: string) => {
      return expandedGroups[groupId] ?? true;
    },
    [expandedGroups],
  );

  const expandAll = useCallback(() => {
    setExpandedGroups((prev) => {
      const all: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        all[key] = true;
      });
      return all;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedGroups((prev) => {
      const all: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        all[key] = false;
      });
      return all;
    });
  }, []);

  return (
    <NavContext.Provider
      value={{ expandedGroups, toggleGroup, isExpanded, expandAll, collapseAll }}
    >
      {children}
    </NavContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useNav() {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error("useNav must be used within NavProvider");
  }
  return context;
}
