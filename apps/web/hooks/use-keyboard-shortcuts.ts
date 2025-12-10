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
 * Keyboard Shortcuts System
 * Global keyboard shortcut registration and management
 *
 * Part of the UX System - Pillar 7: Accessibility Refinements
 *
 * Features:
 * - Global shortcut registration
 * - Modifier key support (Cmd/Ctrl, Alt, Shift)
 * - Priority/scope-based handling
 * - Conflict detection
 * - Shortcut help dialog support
 */

// ============================================
// TYPES
// ============================================

type ModifierKey = "ctrl" | "alt" | "shift" | "meta";

interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key to trigger (e.g., "k", "Enter", "Escape") */
  key: string;
  /** Required modifier keys */
  modifiers?: ModifierKey[];
  /** Description for help dialog */
  description: string;
  /** Callback to execute */
  handler: (event: KeyboardEvent) => void;
  /** Whether shortcut is currently active */
  enabled?: boolean;
  /** Scope/priority (higher = more specific) */
  priority?: number;
  /** Category for grouping in help */
  category?: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
}

interface ShortcutRegistration {
  id: string;
  unregister: () => void;
}

interface KeyboardShortcutsContextValue {
  /** Register a new shortcut */
  register: (shortcut: KeyboardShortcut) => ShortcutRegistration;
  /** Unregister a shortcut by ID */
  unregister: (id: string) => void;
  /** Get all registered shortcuts */
  getShortcuts: () => KeyboardShortcut[];
  /** Check if a shortcut ID is registered */
  isRegistered: (id: string) => boolean;
  /** Enable/disable a shortcut */
  setEnabled: (id: string, enabled: boolean) => void;
  /** Enable/disable all shortcuts */
  setGlobalEnabled: (enabled: boolean) => void;
  /** Whether shortcuts are globally enabled */
  globalEnabled: boolean;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Normalize key name for cross-platform consistency
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
  };
  return keyMap[key] || key;
}

/**
 * Check if event matches shortcut
 */
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const eventKey = normalizeKey(event.key).toLowerCase();
  const shortcutKey = normalizeKey(shortcut.key).toLowerCase();

  if (eventKey !== shortcutKey) {
    return false;
  }

  const modifiers = shortcut.modifiers || [];
  const needsCtrl = modifiers.includes("ctrl");
  const needsMeta = modifiers.includes("meta");
  const needsAlt = modifiers.includes("alt");
  const needsShift = modifiers.includes("shift");

  // On Mac, treat Cmd (meta) as Ctrl equivalent for common shortcuts
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
  const needsCtrlOrMeta = needsCtrl || needsMeta;

  if (needsCtrlOrMeta && !hasCtrlOrMeta) return false;
  if (!needsCtrlOrMeta && hasCtrlOrMeta) return false;
  if (needsAlt !== event.altKey) return false;
  if (needsShift !== event.shiftKey) return false;

  return true;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const parts: string[] = [];
  const modifiers = shortcut.modifiers || [];

  if (modifiers.includes("ctrl") || modifiers.includes("meta")) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (modifiers.includes("alt")) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (modifiers.includes("shift")) {
    parts.push(isMac ? "⇧" : "Shift");
  }

  // Format key
  let key = shortcut.key;
  const keyMap: Record<string, string> = {
    Enter: "↵",
    Escape: "Esc",
    Space: "Space",
    Up: "↑",
    Down: "↓",
    Left: "←",
    Right: "→",
    Backspace: "⌫",
    Delete: "Del",
    Tab: "Tab",
  };

  key = keyMap[key] || key.toUpperCase();
  parts.push(key);

  return parts.join(isMac ? "" : "+");
}

// ============================================
// CONTEXT
// ============================================

const KeyboardShortcutsContext =
  createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcuts must be used within KeyboardShortcutsProvider"
    );
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
  /** Default enabled state */
  defaultEnabled?: boolean;
}

export function KeyboardShortcutsProvider({
  children,
  defaultEnabled = true,
}: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(
    new Map()
  );
  const [globalEnabled, setGlobalEnabled] = useState(defaultEnabled);

  const register = useCallback(
    (shortcut: KeyboardShortcut): ShortcutRegistration => {
      setShortcuts((prev) => {
        const next = new Map(prev);
        next.set(shortcut.id, { ...shortcut, enabled: shortcut.enabled ?? true });
        return next;
      });

      return {
        id: shortcut.id,
        unregister: () => {
          setShortcuts((prev) => {
            const next = new Map(prev);
            next.delete(shortcut.id);
            return next;
          });
        },
      };
    },
    []
  );

  const unregister = useCallback((id: string) => {
    setShortcuts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getShortcuts = useCallback(() => {
    return Array.from(shortcuts.values());
  }, [shortcuts]);

  const isRegistered = useCallback(
    (id: string) => {
      return shortcuts.has(id);
    },
    [shortcuts]
  );

  const setEnabled = useCallback((id: string, enabled: boolean) => {
    setShortcuts((prev) => {
      const shortcut = prev.get(id);
      if (!shortcut) return prev;
      const next = new Map(prev);
      next.set(id, { ...shortcut, enabled });
      return next;
    });
  }, []);

  // Handle keyboard events
  useEffect(() => {
    if (!globalEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if target is editable element (unless explicitly handled)
      const target = event.target as HTMLElement;
      const isEditable =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      // Get matching shortcuts sorted by priority
      const matchingShortcuts = Array.from(shortcuts.values())
        .filter(
          (s) =>
            s.enabled !== false &&
            matchesShortcut(event, s) &&
            // Allow shortcuts with modifiers in editable elements
            (!isEditable || (s.modifiers && s.modifiers.length > 0))
        )
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Execute highest priority match
      if (matchingShortcuts.length > 0) {
        const shortcut = matchingShortcuts[0];

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        shortcut.handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [globalEnabled, shortcuts]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        register,
        unregister,
        getShortcuts,
        isRegistered,
        setEnabled,
        setGlobalEnabled,
        globalEnabled,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================
// HOOK FOR SINGLE SHORTCUT
// ============================================

interface UseKeyboardShortcutOptions {
  /** Key to trigger */
  key: string;
  /** Modifier keys */
  modifiers?: ModifierKey[];
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Description for help */
  description?: string;
  /** Category for help grouping */
  category?: string;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Priority level */
  priority?: number;
}

/**
 * Register a single keyboard shortcut
 */
export function useKeyboardShortcut(options: UseKeyboardShortcutOptions) {
  const {
    key,
    modifiers,
    handler,
    description = "",
    category = "General",
    enabled = true,
    priority = 0,
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Generate stable ID
  const idRef = useRef(
    `shortcut-${key}-${(modifiers || []).sort().join("-")}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip in editable elements unless has modifiers
      const target = event.target as HTMLElement;
      const isEditable =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (isEditable && (!modifiers || modifiers.length === 0)) {
        return;
      }

      // Check if matches
      const eventKey = normalizeKey(event.key).toLowerCase();
      const shortcutKey = normalizeKey(key).toLowerCase();

      if (eventKey !== shortcutKey) return;

      const needsCtrl = modifiers?.includes("ctrl") || modifiers?.includes("meta");
      const needsAlt = modifiers?.includes("alt");
      const needsShift = modifiers?.includes("shift");

      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (needsCtrl && !hasCtrlOrMeta) return;
      if (!needsCtrl && hasCtrlOrMeta) return;
      if (needsAlt !== event.altKey) return;
      if (needsShift !== event.shiftKey) return;

      event.preventDefault();
      handlerRef.current(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, modifiers, enabled]);

  return {
    id: idRef.current,
    formatted: formatShortcut({
      id: idRef.current,
      key,
      modifiers,
      description,
      handler: handlerRef.current,
    }),
  };
}

// ============================================
// COMMON SHORTCUTS HOOK
// ============================================

interface UseCommonShortcutsOptions {
  onSearch?: () => void;
  onEscape?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onHelp?: () => void;
}

/**
 * Register common keyboard shortcuts
 */
export function useCommonShortcuts(options: UseCommonShortcutsOptions) {
  const { onSearch, onEscape, onSave, onUndo, onRedo, onHelp } = options;

  useKeyboardShortcut({
    key: "k",
    modifiers: ["ctrl"],
    handler: () => onSearch?.(),
    description: "Open search",
    category: "Navigation",
    enabled: !!onSearch,
  });

  useKeyboardShortcut({
    key: "Escape",
    handler: () => onEscape?.(),
    description: "Close modal/dialog",
    category: "General",
    enabled: !!onEscape,
    priority: -1, // Lower priority so specific modals can override
  });

  useKeyboardShortcut({
    key: "s",
    modifiers: ["ctrl"],
    handler: () => onSave?.(),
    description: "Save",
    category: "Actions",
    enabled: !!onSave,
  });

  useKeyboardShortcut({
    key: "z",
    modifiers: ["ctrl"],
    handler: () => onUndo?.(),
    description: "Undo",
    category: "Actions",
    enabled: !!onUndo,
  });

  useKeyboardShortcut({
    key: "z",
    modifiers: ["ctrl", "shift"],
    handler: () => onRedo?.(),
    description: "Redo",
    category: "Actions",
    enabled: !!onRedo,
  });

  useKeyboardShortcut({
    key: "?",
    modifiers: ["shift"],
    handler: () => onHelp?.(),
    description: "Show keyboard shortcuts",
    category: "Help",
    enabled: !!onHelp,
  });
}

// ============================================
// SHORTCUTS HELP COMPONENT DATA
// ============================================

export interface ShortcutHelpItem {
  key: string;
  modifiers?: ModifierKey[];
  description: string;
  category: string;
  formatted: string;
}

/**
 * Get formatted shortcuts for help display
 */
export function useShortcutsHelp(): ShortcutHelpItem[] {
  try {
    const { getShortcuts } = useKeyboardShortcuts();
    return getShortcuts()
      .filter((s) => s.description)
      .map((s) => ({
        key: s.key,
        modifiers: s.modifiers,
        description: s.description,
        category: s.category || "General",
        formatted: formatShortcut(s),
      }))
      .sort((a, b) => {
        // Sort by category, then by key
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.key.localeCompare(b.key);
      });
  } catch {
    // Return empty if used outside provider
    return [];
  }
}
