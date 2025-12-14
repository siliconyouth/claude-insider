/**
 * Keyboard Shortcuts Configuration
 *
 * Defines all available keyboard shortcuts and their metadata.
 *
 * Best Practices Applied:
 * - Cmd/Ctrl+K for search (industry standard)
 * - Single letters (j/k/s) only work when NOT in text inputs
 * - Alt/Option used for custom navigation (rarely conflicts with browser)
 * - Escape for closing modals (universal)
 * - / for search focus (Unix/Vim standard)
 * - ? for help (universal)
 *
 * Avoided Conflicts:
 * - Cmd+C/V/X/Z (copy/paste/cut/undo)
 * - Cmd+R/Shift+R (reload/hard reload)
 * - Cmd+T/Shift+T (new tab/reopen tab)
 * - Cmd+W (close tab)
 * - Cmd+F/Shift+F (find)
 * - Cmd+D (bookmark)
 * - Cmd+S (save)
 * - Cmd+P (print)
 * - Cmd+L (address bar)
 * - Cmd+N (new window)
 */

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: ("ctrl" | "meta" | "alt" | "shift")[];
  description: string;
  category: "navigation" | "search" | "actions" | "accessibility";
  action: string;
  global?: boolean;
  /** If true, shortcut only works when NOT in a text input/textarea */
  nonInputOnly?: boolean;
}

export const shortcuts: KeyboardShortcut[] = [
  // ============================================
  // SEARCH SHORTCUTS
  // ============================================
  {
    id: "open-search",
    key: "k",
    modifiers: ["meta"],
    description: "Open search",
    category: "search",
    action: "openSearch",
    global: true,
  },
  {
    id: "open-search-alt",
    key: "k",
    modifiers: ["ctrl"],
    description: "Open search (Windows/Linux)",
    category: "search",
    action: "openSearch",
    global: true,
  },
  {
    id: "close-search",
    key: "Escape",
    description: "Close search/modal",
    category: "search",
    action: "closeModal",
    global: true,
  },
  {
    id: "focus-search",
    key: "/",
    description: "Focus search input",
    category: "search",
    action: "focusSearch",
    global: true,
    nonInputOnly: true,
  },

  // ============================================
  // NAVIGATION SHORTCUTS
  // Using Alt/Option modifier (rarely conflicts with browsers)
  // ============================================
  {
    id: "go-home",
    key: "h",
    modifiers: ["alt"],
    description: "Go to home",
    category: "navigation",
    action: "goHome",
    global: true,
  },
  {
    id: "go-docs",
    key: "d",
    modifiers: ["alt", "shift"],
    description: "Go to documentation",
    category: "navigation",
    action: "goDocs",
    global: true,
  },
  {
    id: "go-resources",
    key: "r",
    modifiers: ["alt", "shift"],
    description: "Go to resources",
    category: "navigation",
    action: "goResources",
    global: true,
  },
  {
    id: "go-favorites",
    key: "f",
    modifiers: ["alt", "shift"],
    description: "Go to favorites",
    category: "navigation",
    action: "goFavorites",
    global: true,
  },
  // Vim-style navigation (only when not in text input)
  {
    id: "next-item",
    key: "j",
    description: "Next item",
    category: "navigation",
    action: "nextItem",
    nonInputOnly: true,
  },
  {
    id: "prev-item",
    key: "k",
    description: "Previous item",
    category: "navigation",
    action: "prevItem",
    nonInputOnly: true,
  },
  {
    id: "open-item",
    key: "Enter",
    description: "Open selected item",
    category: "navigation",
    action: "openItem",
    nonInputOnly: true,
  },

  // ============================================
  // ACTION SHORTCUTS
  // ============================================
  {
    id: "toggle-favorite",
    key: "s",
    description: "Save/unsave favorite",
    category: "actions",
    action: "toggleFavorite",
    nonInputOnly: true,
  },
  {
    id: "copy-link",
    key: "l",
    modifiers: ["alt", "shift"],
    description: "Copy page link",
    category: "actions",
    action: "copyLink",
    global: true,
  },
  {
    id: "toggle-theme",
    key: "t",
    modifiers: ["alt"],
    description: "Toggle theme",
    category: "actions",
    action: "toggleTheme",
    global: true,
  },

  // ============================================
  // ACCESSIBILITY SHORTCUTS
  // ============================================
  {
    id: "show-shortcuts",
    key: "?",
    description: "Show keyboard shortcuts",
    category: "accessibility",
    action: "showHelp",
    global: true,
    nonInputOnly: true,
  },
  {
    id: "skip-to-content",
    key: "0",
    modifiers: ["alt"],
    description: "Skip to main content",
    category: "accessibility",
    action: "skipToContent",
    global: true,
  },
];

export const shortcutCategories = [
  { id: "search", label: "Search", icon: "search" },
  { id: "navigation", label: "Navigation", icon: "compass" },
  { id: "actions", label: "Actions", icon: "zap" },
  { id: "accessibility", label: "Accessibility", icon: "eye" },
] as const;

/**
 * Format a shortcut key for display
 */
export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== "undefined" && navigator.platform?.includes("Mac");

  if (shortcut.modifiers?.includes("meta")) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.modifiers?.includes("ctrl")) {
    parts.push("Ctrl");
  }
  if (shortcut.modifiers?.includes("alt")) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (shortcut.modifiers?.includes("shift")) {
    parts.push("⇧");
  }

  // Format the key
  let key = shortcut.key;
  if (key === "Escape") key = "Esc";
  if (key === "Enter") key = "↵";
  if (key === " ") key = "Space";
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);

  return parts.join(" + ");
}

/**
 * Check if the current focus is in a text input element
 */
export function isInTextInput(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === "input") {
    const inputType = (activeElement as HTMLInputElement).type?.toLowerCase();
    // These input types accept text
    const textInputTypes = ["text", "password", "email", "number", "search", "tel", "url", "date", "time", "datetime-local"];
    return textInputTypes.includes(inputType) || !inputType;
  }

  if (tagName === "textarea") return true;
  if ((activeElement as HTMLElement).isContentEditable) return true;

  return false;
}

/**
 * Check if a keyboard event matches a shortcut
 *
 * This function ensures EXACT modifier matching:
 * - If shortcut requires Shift, event must have Shift AND NO extra modifiers
 * - This prevents Cmd+Shift+R from triggering Shift+R shortcuts
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check if shortcut should be blocked when in text input
  if (shortcut.nonInputOnly && isInTextInput()) {
    return false;
  }

  // Required modifiers from shortcut definition
  const needsMeta = shortcut.modifiers?.includes("meta") ?? false;
  const needsCtrl = shortcut.modifiers?.includes("ctrl") ?? false;
  const needsAlt = shortcut.modifiers?.includes("alt") ?? false;
  const needsShift = shortcut.modifiers?.includes("shift") ?? false;

  // Actual modifiers pressed
  const hasMeta = event.metaKey;
  const hasCtrl = event.ctrlKey;
  const hasAlt = event.altKey;
  const hasShift = event.shiftKey;

  // For cross-platform: treat Ctrl on Windows/Linux as equivalent to Meta on Mac
  // But ONLY for shortcuts that specifically request meta
  const isMac = typeof navigator !== "undefined" && navigator.platform?.includes("Mac");

  // Check that required modifiers are pressed
  if (needsMeta) {
    // On Mac: require Meta (Cmd)
    // On Windows/Linux: accept either Meta or Ctrl
    if (isMac) {
      if (!hasMeta) return false;
    } else {
      if (!hasMeta && !hasCtrl) return false;
    }
  }

  if (needsCtrl && !hasCtrl) return false;
  if (needsAlt && !hasAlt) return false;
  if (needsShift && !hasShift) return false;

  // CRITICAL: Check that NO EXTRA modifiers are pressed
  // This prevents Cmd+Shift+R from triggering an Alt+Shift+R shortcut
  if (!needsMeta && hasMeta) return false;
  if (!needsCtrl && hasCtrl) {
    // Exception: on non-Mac, Ctrl can substitute for Meta
    if (isMac || !needsMeta) return false;
  }
  if (!needsAlt && hasAlt) return false;
  if (!needsShift && hasShift) {
    // Exception: ? requires shift to type
    if (shortcut.key !== "?") return false;
  }

  // Check the key (case-insensitive)
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  return eventKey === shortcutKey;
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: KeyboardShortcut["category"]): KeyboardShortcut[] {
  return shortcuts.filter((s) => s.category === category);
}

/**
 * Get all global shortcuts
 */
export function getGlobalShortcuts(): KeyboardShortcut[] {
  return shortcuts.filter((s) => s.global);
}

/**
 * Reserved browser/OS shortcuts that should NEVER be overridden
 * This list is for documentation and testing purposes
 */
export const RESERVED_SHORTCUTS = {
  // Copy/Paste/Undo
  "meta+c": "Copy",
  "meta+v": "Paste",
  "meta+x": "Cut",
  "meta+z": "Undo",
  "meta+shift+z": "Redo",
  "meta+a": "Select all",

  // Browser navigation
  "meta+r": "Reload",
  "meta+shift+r": "Hard reload",
  "meta+t": "New tab",
  "meta+shift+t": "Reopen closed tab",
  "meta+w": "Close tab",
  "meta+n": "New window",
  "meta+shift+n": "New incognito window",
  "meta+l": "Focus address bar",
  "meta+d": "Bookmark",

  // Find
  "meta+f": "Find in page",
  "meta+g": "Find next",
  "meta+shift+g": "Find previous",

  // Other
  "meta+s": "Save",
  "meta+p": "Print",
  "meta+q": "Quit app",
  "meta+h": "Hide app (Mac)",
  "meta+m": "Minimize",

  // Function keys
  "F1": "Help",
  "F5": "Reload (Windows)",
  "F11": "Full screen",
  "F12": "Developer tools",
} as const;
