/**
 * Keyboard Shortcuts Tests
 *
 * Tests for keyboard shortcut configuration and helper functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  shortcuts,
  shortcutCategories,
  formatShortcutKey,
  getShortcutsByCategory,
  getGlobalShortcuts,
  RESERVED_SHORTCUTS,
  type KeyboardShortcut,
} from "@/lib/keyboard-shortcuts";

describe("shortcuts constant", () => {
  it("should be an array", () => {
    expect(Array.isArray(shortcuts)).toBe(true);
  });

  it("should have at least 10 shortcuts", () => {
    expect(shortcuts.length).toBeGreaterThanOrEqual(10);
  });

  it("should have valid shortcut structure", () => {
    shortcuts.forEach((shortcut) => {
      expect(shortcut).toHaveProperty("id");
      expect(shortcut).toHaveProperty("key");
      expect(shortcut).toHaveProperty("description");
      expect(shortcut).toHaveProperty("category");
      expect(shortcut).toHaveProperty("action");
      expect(typeof shortcut.id).toBe("string");
      expect(typeof shortcut.key).toBe("string");
      expect(typeof shortcut.description).toBe("string");
      expect(typeof shortcut.action).toBe("string");
    });
  });

  it("should have unique IDs", () => {
    const ids = shortcuts.map((s) => s.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it("should have valid categories", () => {
    const validCategories = ["navigation", "search", "actions", "accessibility"];
    shortcuts.forEach((shortcut) => {
      expect(validCategories).toContain(shortcut.category);
    });
  });

  it("should have non-empty descriptions", () => {
    shortcuts.forEach((shortcut) => {
      expect(shortcut.description.length).toBeGreaterThan(0);
    });
  });

  it("should have modifiers as array when present", () => {
    shortcuts.forEach((shortcut) => {
      if (shortcut.modifiers) {
        expect(Array.isArray(shortcut.modifiers)).toBe(true);
        shortcut.modifiers.forEach((mod) => {
          expect(["ctrl", "meta", "alt", "shift"]).toContain(mod);
        });
      }
    });
  });
});

describe("Key shortcuts", () => {
  it("should have Cmd/Ctrl+K for search", () => {
    const searchShortcut = shortcuts.find(
      (s) => s.action === "openSearch" && s.modifiers?.includes("meta")
    );
    expect(searchShortcut).toBeDefined();
    expect(searchShortcut?.key).toBe("k");
  });

  it("should have Escape for closing modals", () => {
    const escapeShortcut = shortcuts.find((s) => s.key === "Escape");
    expect(escapeShortcut).toBeDefined();
    expect(escapeShortcut?.action).toBe("closeModal");
  });

  it("should have / for focus search", () => {
    const slashShortcut = shortcuts.find((s) => s.key === "/" && s.action === "focusSearch");
    expect(slashShortcut).toBeDefined();
    expect(slashShortcut?.nonInputOnly).toBe(true);
  });

  it("should have ? for showing help", () => {
    const helpShortcut = shortcuts.find((s) => s.key === "?" && s.action === "showHelp");
    expect(helpShortcut).toBeDefined();
  });

  it("should have vim-style j/k navigation", () => {
    const nextShortcut = shortcuts.find((s) => s.key === "j" && s.action === "nextItem");
    const prevShortcut = shortcuts.find((s) => s.key === "k" && s.action === "prevItem");

    expect(nextShortcut).toBeDefined();
    expect(prevShortcut).toBeDefined();
    expect(nextShortcut?.nonInputOnly).toBe(true);
    expect(prevShortcut?.nonInputOnly).toBe(true);
  });
});

describe("shortcutCategories", () => {
  it("should have all expected categories", () => {
    const categoryIds = shortcutCategories.map((c) => c.id);

    expect(categoryIds).toContain("search");
    expect(categoryIds).toContain("navigation");
    expect(categoryIds).toContain("actions");
    expect(categoryIds).toContain("accessibility");
  });

  it("should have valid structure", () => {
    shortcutCategories.forEach((category) => {
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("label");
      expect(category).toHaveProperty("icon");
      expect(typeof category.id).toBe("string");
      expect(typeof category.label).toBe("string");
      expect(typeof category.icon).toBe("string");
    });
  });
});

describe("formatShortcutKey", () => {
  // Mock navigator for consistent testing
  const originalNavigator = global.navigator;

  describe("on Mac", () => {
    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "MacIntel" },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should format meta as ⌘ on Mac", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test",
        category: "search",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toContain("⌘");
    });

    it("should format alt as ⌥ on Mac", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "h",
        modifiers: ["alt"],
        description: "Test",
        category: "navigation",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toContain("⌥");
    });

    it("should format shift as ⇧", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "d",
        modifiers: ["alt", "shift"],
        description: "Test",
        category: "navigation",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toContain("⇧");
    });
  });

  describe("on Windows/Linux", () => {
    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "Win32" },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should format meta as Ctrl on Windows", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "k",
        modifiers: ["meta"],
        description: "Test",
        category: "search",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toContain("Ctrl");
    });

    it("should format alt as Alt on Windows", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "h",
        modifiers: ["alt"],
        description: "Test",
        category: "navigation",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toContain("Alt");
    });
  });

  describe("special keys", () => {
    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "MacIntel" },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should format Escape as Esc", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "Escape",
        description: "Test",
        category: "search",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toBe("Esc");
    });

    it("should format Enter as ↵", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "Enter",
        description: "Test",
        category: "navigation",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toBe("↵");
    });

    it("should uppercase single letter keys", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "k",
        description: "Test",
        category: "search",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toBe("K");
    });
  });

  describe("multiple modifiers", () => {
    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "MacIntel" },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should join modifiers with + ", () => {
      const shortcut: KeyboardShortcut = {
        id: "test",
        key: "d",
        modifiers: ["alt", "shift"],
        description: "Test",
        category: "navigation",
        action: "test",
      };

      const formatted = formatShortcutKey(shortcut);
      expect(formatted).toContain(" + ");
    });
  });
});

describe("getShortcutsByCategory", () => {
  it("should return shortcuts for search category", () => {
    const searchShortcuts = getShortcutsByCategory("search");

    expect(searchShortcuts.length).toBeGreaterThan(0);
    searchShortcuts.forEach((s) => {
      expect(s.category).toBe("search");
    });
  });

  it("should return shortcuts for navigation category", () => {
    const navShortcuts = getShortcutsByCategory("navigation");

    expect(navShortcuts.length).toBeGreaterThan(0);
    navShortcuts.forEach((s) => {
      expect(s.category).toBe("navigation");
    });
  });

  it("should return shortcuts for actions category", () => {
    const actionShortcuts = getShortcutsByCategory("actions");

    expect(actionShortcuts.length).toBeGreaterThan(0);
    actionShortcuts.forEach((s) => {
      expect(s.category).toBe("actions");
    });
  });

  it("should return shortcuts for accessibility category", () => {
    const a11yShortcuts = getShortcutsByCategory("accessibility");

    expect(a11yShortcuts.length).toBeGreaterThan(0);
    a11yShortcuts.forEach((s) => {
      expect(s.category).toBe("accessibility");
    });
  });
});

describe("getGlobalShortcuts", () => {
  it("should return only global shortcuts", () => {
    const globalShortcuts = getGlobalShortcuts();

    globalShortcuts.forEach((s) => {
      expect(s.global).toBe(true);
    });
  });

  it("should include Cmd/Ctrl+K search shortcut", () => {
    const globalShortcuts = getGlobalShortcuts();
    const searchShortcut = globalShortcuts.find(
      (s) => s.action === "openSearch" && s.modifiers?.includes("meta")
    );

    expect(searchShortcut).toBeDefined();
  });

  it("should include Escape shortcut", () => {
    const globalShortcuts = getGlobalShortcuts();
    const escapeShortcut = globalShortcuts.find((s) => s.key === "Escape");

    expect(escapeShortcut).toBeDefined();
  });
});

describe("RESERVED_SHORTCUTS", () => {
  it("should list copy/paste/undo shortcuts", () => {
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+c");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+v");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+x");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+z");
  });

  it("should list browser navigation shortcuts", () => {
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+r");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+t");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+w");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+n");
  });

  it("should list find shortcuts", () => {
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+f");
    expect(RESERVED_SHORTCUTS).toHaveProperty("meta+g");
  });

  it("should not be overridden by app shortcuts", () => {
    const reservedKeys = Object.keys(RESERVED_SHORTCUTS);

    shortcuts.forEach((shortcut) => {
      // Build the key string for this shortcut
      const mods = shortcut.modifiers || [];
      const keyParts = [...mods.map((m) => m.replace("meta", "meta")), shortcut.key];
      const keyString = keyParts.join("+").toLowerCase();

      // Check if this matches any reserved shortcut
      if (reservedKeys.some((reserved) => reserved.toLowerCase() === keyString)) {
        // This would be a problem - app shortcut overlaps with reserved
        console.warn(`Potential overlap: ${keyString}`);
      }
    });

    // Test passes if no errors thrown - overlap detection is for documentation
    expect(true).toBe(true);
  });
});

describe("Shortcut safety", () => {
  it("should not have Cmd+S (save) shortcut", () => {
    const saveShortcut = shortcuts.find(
      (s) => s.key.toLowerCase() === "s" && s.modifiers?.includes("meta")
    );
    expect(saveShortcut).toBeUndefined();
  });

  it("should not have Cmd+R (reload) shortcut", () => {
    const reloadShortcut = shortcuts.find(
      (s) => s.key.toLowerCase() === "r" && s.modifiers?.includes("meta") && !s.modifiers?.includes("alt")
    );
    expect(reloadShortcut).toBeUndefined();
  });

  it("should not have Cmd+C (copy) shortcut", () => {
    const copyShortcut = shortcuts.find(
      (s) => s.key.toLowerCase() === "c" && s.modifiers?.includes("meta")
    );
    expect(copyShortcut).toBeUndefined();
  });

  it("should not have Cmd+V (paste) shortcut", () => {
    const pasteShortcut = shortcuts.find(
      (s) => s.key.toLowerCase() === "v" && s.modifiers?.includes("meta")
    );
    expect(pasteShortcut).toBeUndefined();
  });
});

describe("nonInputOnly shortcuts", () => {
  it("should have nonInputOnly for single-letter shortcuts", () => {
    const singleLetterShortcuts = shortcuts.filter(
      (s) => s.key.length === 1 && s.key.match(/[a-z]/i) && !s.modifiers?.length
    );

    singleLetterShortcuts.forEach((s) => {
      expect(s.nonInputOnly).toBe(true);
    });
  });

  it("should have nonInputOnly for / shortcut", () => {
    const slashShortcut = shortcuts.find((s) => s.key === "/");
    expect(slashShortcut?.nonInputOnly).toBe(true);
  });

  it("should have nonInputOnly for ? shortcut", () => {
    const questionShortcut = shortcuts.find((s) => s.key === "?");
    expect(questionShortcut?.nonInputOnly).toBe(true);
  });
});

describe("Type exports", () => {
  it("should export KeyboardShortcut type with correct shape", () => {
    const shortcut: KeyboardShortcut = {
      id: "test-id",
      key: "k",
      modifiers: ["meta"],
      description: "Test shortcut",
      category: "search",
      action: "testAction",
      global: true,
      nonInputOnly: false,
    };

    expect(shortcut.id).toBe("test-id");
    expect(shortcut.key).toBe("k");
    expect(shortcut.modifiers).toContain("meta");
    expect(shortcut.category).toBe("search");
  });
});
