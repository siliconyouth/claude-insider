/**
 * Action Commands
 *
 * Quick action commands for common operations.
 */

import type { Command } from "./types";

export const actionCommands: Command[] = [
  // Theme Toggle
  {
    id: "action-toggle-theme",
    label: "Toggle Theme",
    description: "Switch between light and dark mode",
    category: "settings",
    keywords: ["theme", "dark", "light", "mode"],
    shortcut: { key: "t", modifiers: ["meta", "shift"] },
    action: () => {
      // Toggle theme via document class
      const html = document.documentElement;
      const isDark = html.classList.contains("dark");
      html.classList.toggle("dark", !isDark);
      localStorage.setItem("theme", isDark ? "light" : "dark");
    },
  },

  // Refresh Page
  {
    id: "action-refresh",
    label: "Refresh Page",
    description: "Reload the current page",
    category: "action",
    keywords: ["refresh", "reload"],
    shortcut: { key: "r", modifiers: ["meta", "shift"] },
    action: () => {
      window.location.reload();
    },
  },

  // Copy Current URL
  {
    id: "action-copy-url",
    label: "Copy Current URL",
    description: "Copy page URL to clipboard",
    category: "action",
    keywords: ["copy", "url", "link", "share"],
    action: async ({ close }) => {
      await navigator.clipboard.writeText(window.location.href);
      close();
      // Note: Could add toast notification here
    },
  },

  // Go Back
  {
    id: "action-go-back",
    label: "Go Back",
    description: "Navigate to previous page",
    category: "action",
    keywords: ["back", "previous"],
    action: () => {
      window.history.back();
    },
  },

  // Go Forward
  {
    id: "action-go-forward",
    label: "Go Forward",
    description: "Navigate to next page",
    category: "action",
    keywords: ["forward", "next"],
    action: () => {
      window.history.forward();
    },
  },

  // Open Search
  {
    id: "action-open-search",
    label: "Open Site Search",
    description: "Open the main search modal",
    category: "action",
    keywords: ["search", "find"],
    shortcut: { key: "/", modifiers: [] },
    action: () => {
      // Dispatch custom event to open search modal
      window.dispatchEvent(new CustomEvent("open-search-modal"));
    },
  },

  // Open Notifications
  {
    id: "action-open-notifications",
    label: "Open Notifications",
    description: "View your notifications",
    category: "action",
    keywords: ["notifications", "alerts", "inbox"],
    action: () => {
      // Dispatch custom event to open notifications
      window.dispatchEvent(new CustomEvent("open-notifications"));
    },
  },

  // Toggle Sidebar (dashboard)
  {
    id: "action-toggle-sidebar",
    label: "Toggle Sidebar",
    description: "Show or hide the sidebar",
    category: "action",
    keywords: ["sidebar", "nav", "toggle"],
    shortcut: { key: "b", modifiers: ["meta"] },
    action: () => {
      window.dispatchEvent(new CustomEvent("toggle-sidebar"));
    },
    minRole: "moderator",
  },
];
