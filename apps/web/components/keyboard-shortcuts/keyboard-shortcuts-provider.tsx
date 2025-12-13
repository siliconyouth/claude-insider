"use client";

/**
 * Keyboard Shortcuts Provider
 *
 * Global keyboard shortcuts handler and context provider.
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  shortcuts,
  matchesShortcut,
} from "@/lib/keyboard-shortcuts";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";

interface KeyboardShortcutsContextType {
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
  registerAction: (action: string, handler: () => void) => () => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [customActions, setCustomActions] = useState<Map<string, () => void>>(new Map());

  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  const registerAction = useCallback((action: string, handler: () => void) => {
    setCustomActions((prev) => {
      const next = new Map(prev);
      next.set(action, handler);
      return next;
    });

    // Return unregister function
    return () => {
      setCustomActions((prev) => {
        const next = new Map(prev);
        next.delete(action);
        return next;
      });
    };
  }, []);

  // Built-in action handlers
  const handleAction = useCallback(
    (action: string) => {
      // Check custom actions first
      const customHandler = customActions.get(action);
      if (customHandler) {
        customHandler();
        return true;
      }

      // Built-in actions
      switch (action) {
        case "showHelp":
          showHelp();
          return true;
        case "closeModal":
          if (isHelpOpen) {
            hideHelp();
            return true;
          }
          return false;
        case "goHome":
          router.push("/");
          return true;
        case "goDocs":
          router.push("/docs");
          return true;
        case "goResources":
          router.push("/resources");
          return true;
        case "goFavorites":
          router.push("/favorites");
          return true;
        case "skipToContent": {
          const main = document.getElementById("main-content");
          if (main) {
            main.focus();
            main.scrollIntoView({ behavior: "smooth" });
          }
          return true;
        }
        case "focusSearch": {
          const searchInput = document.querySelector<HTMLInputElement>(
            '[data-search-input], input[type="search"], input[placeholder*="Search"]'
          );
          if (searchInput) {
            searchInput.focus();
            return true;
          }
          return false;
        }
        case "copyLink":
          navigator.clipboard.writeText(window.location.href);
          return true;
        default:
          return false;
      }
    },
    [customActions, showHelp, hideHelp, isHelpOpen, router]
  );

  // Global keyboard event listener
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs (unless it's a global shortcut)
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        // Skip non-global shortcuts when typing
        if (isTyping && !shortcut.global) return false;

        // Skip search shortcut (/) when in input - let user type
        if (isTyping && shortcut.key === "/") return false;

        // When typing, skip shortcuts that would interfere with normal text input:
        // - Shift + single letter (typing capital letters)
        // - Shift + punctuation (typing symbols like >, ?, etc.)
        // Only allow shortcuts with Cmd/Ctrl/Alt when typing
        if (isTyping && shortcut.modifiers) {
          const hasOnlyShift =
            shortcut.modifiers.length === 1 &&
            shortcut.modifiers[0] === "shift";
          const hasCmdCtrlAlt =
            shortcut.modifiers.includes("meta") ||
            shortcut.modifiers.includes("ctrl") ||
            shortcut.modifiers.includes("alt");

          // Skip Shift-only shortcuts when typing (blocks capital letters)
          if (hasOnlyShift && !hasCmdCtrlAlt) return false;
        }

        return matchesShortcut(event, shortcut);
      });

      if (matchingShortcut) {
        const handled = handleAction(matchingShortcut.action);
        if (handled) {
          event.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleAction]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        showHelp,
        hideHelp,
        isHelpOpen,
        registerAction,
        enabled,
        setEnabled,
      }}
    >
      {children}
      <KeyboardShortcutsModal isOpen={isHelpOpen} onClose={hideHelp} />
    </KeyboardShortcutsContext.Provider>
  );
}
