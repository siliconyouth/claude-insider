/**
 * Keyboard Shortcuts Configuration
 *
 * Defines all available keyboard shortcuts and their metadata.
 */

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: ("ctrl" | "meta" | "alt" | "shift")[];
  description: string;
  category: "navigation" | "search" | "actions" | "accessibility";
  action: string;
  global?: boolean;
}

export const shortcuts: KeyboardShortcut[] = [
  // Search shortcuts
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

  // Navigation shortcuts
  {
    id: "go-home",
    key: "g",
    modifiers: ["shift"],
    description: "Go to home",
    category: "navigation",
    action: "goHome",
    global: true,
  },
  {
    id: "go-docs",
    key: "d",
    modifiers: ["shift"],
    description: "Go to documentation",
    category: "navigation",
    action: "goDocs",
    global: true,
  },
  {
    id: "go-resources",
    key: "r",
    modifiers: ["shift"],
    description: "Go to resources",
    category: "navigation",
    action: "goResources",
    global: true,
  },
  {
    id: "go-favorites",
    key: "f",
    modifiers: ["shift"],
    description: "Go to favorites",
    category: "navigation",
    action: "goFavorites",
    global: true,
  },
  {
    id: "next-item",
    key: "j",
    description: "Next item",
    category: "navigation",
    action: "nextItem",
  },
  {
    id: "prev-item",
    key: "k",
    description: "Previous item",
    category: "navigation",
    action: "prevItem",
  },
  {
    id: "open-item",
    key: "Enter",
    description: "Open selected item",
    category: "navigation",
    action: "openItem",
  },

  // Action shortcuts
  {
    id: "toggle-favorite",
    key: "s",
    description: "Save/unsave favorite",
    category: "actions",
    action: "toggleFavorite",
  },
  {
    id: "copy-link",
    key: "c",
    modifiers: ["meta", "shift"],
    description: "Copy page link",
    category: "actions",
    action: "copyLink",
    global: true,
  },
  {
    id: "copy-link-alt",
    key: "c",
    modifiers: ["ctrl", "shift"],
    description: "Copy page link (Windows/Linux)",
    category: "actions",
    action: "copyLink",
    global: true,
  },
  {
    id: "toggle-theme",
    key: "t",
    modifiers: ["shift"],
    description: "Toggle theme",
    category: "actions",
    action: "toggleTheme",
    global: true,
  },

  // Accessibility shortcuts
  {
    id: "show-shortcuts",
    key: "?",
    description: "Show keyboard shortcuts",
    category: "accessibility",
    action: "showHelp",
    global: true,
  },
  {
    id: "skip-to-content",
    key: ".",
    modifiers: ["shift"],
    description: "Skip to main content",
    category: "accessibility",
    action: "skipToContent",
    global: true,
  },
  {
    id: "focus-search",
    key: "/",
    description: "Focus search input",
    category: "search",
    action: "focusSearch",
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

  if (shortcut.modifiers?.includes("meta")) {
    parts.push(typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (shortcut.modifiers?.includes("ctrl")) {
    parts.push("Ctrl");
  }
  if (shortcut.modifiers?.includes("alt")) {
    parts.push(typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌥" : "Alt");
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
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check modifiers
  const needsMeta = shortcut.modifiers?.includes("meta") ?? false;
  const needsCtrl = shortcut.modifiers?.includes("ctrl") ?? false;
  const needsAlt = shortcut.modifiers?.includes("alt") ?? false;
  const needsShift = shortcut.modifiers?.includes("shift") ?? false;

  // On Mac, metaKey is ⌘, on Windows it's the Windows key
  // We treat Ctrl on Windows/Linux as equivalent to Meta on Mac for shortcuts
  const metaOrCtrl = event.metaKey || (needsMeta && event.ctrlKey);

  if (needsMeta && !metaOrCtrl) return false;
  if (needsCtrl && !event.ctrlKey) return false;
  if (needsAlt && !event.altKey) return false;
  if (needsShift && !event.shiftKey) return false;

  // If no modifiers needed, make sure none are pressed (except for ? which needs shift)
  if (!needsMeta && !needsCtrl && !needsAlt && !needsShift) {
    if (event.metaKey || event.ctrlKey || event.altKey) return false;
    // Allow shift for ? since it requires shift to type
    if (event.shiftKey && shortcut.key !== "?") return false;
  }

  // Check the key
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
