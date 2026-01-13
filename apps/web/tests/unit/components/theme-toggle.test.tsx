/**
 * ThemeToggle Component Tests
 *
 * Tests for the theme cycling button (dark -> light -> system).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  // Mock localStorage
  let mockStorage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
  };

  // Mock matchMedia
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  const mockMediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];
  const mockMediaQuery = {
    matches: false,
    addEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      if (event === "change") {
        mockMediaQueryListeners.push(callback);
      }
    }),
    removeEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      const index = mockMediaQueryListeners.indexOf(callback);
      if (index > -1) {
        mockMediaQueryListeners.splice(index, 1);
      }
    }),
  };

  // Mock document.documentElement
  const mockClassList = {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockStorage = {};

    // Setup localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    // Setup matchMedia mock
    mockMatchMedia = vi.fn().mockReturnValue(mockMediaQuery);
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    // Setup documentElement classList mock
    Object.defineProperty(document.documentElement, "classList", {
      value: mockClassList,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
    mockMediaQueryListeners.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render a button", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have accessible aria-label", () => {
      render(<ThemeToggle />);

      // Should always have accessible aria-label
      const button = screen.getByRole("button", { name: /current theme/i });
      expect(button).toBeInTheDocument();
    });

    it("should render placeholder div before mount", () => {
      const { container } = render(<ThemeToggle />);

      // Before useEffect runs, should have empty div
      const placeholder = container.querySelector(".w-5.h-5");
      expect(placeholder).toBeInTheDocument();
    });

    it("should have correct styling classes", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("p-2");
      expect(button).toHaveClass("rounded-lg");
      expect(button).toHaveClass("transition-colors");
    });
  });

  describe("After Mount", () => {
    it("should show dark theme icon after mount with no saved theme", async () => {
      const { container } = render(<ThemeToggle />);

      // Wait for mount effect
      await act(async () => {
        vi.runAllTimers();
      });

      // Should show moon icon for dark theme
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should update aria-label after mount", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Current theme: dark")
      );
    });

    it("should have title attribute after mount", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: dark");
    });
  });

  describe("Theme Loading", () => {
    it("should load saved theme from localStorage", async () => {
      mockStorage["theme"] = "light";

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: light");
    });

    it("should use system preference when no saved theme and system prefers light", async () => {
      mockMediaQuery.matches = true; // Prefers light

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: system");
    });

    it("should default to dark when no saved theme and system prefers dark", async () => {
      mockMediaQuery.matches = false; // Prefers dark

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: dark");
    });
  });

  describe("Theme Cycling", () => {
    it("should cycle from dark to light on click", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: dark");

      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });

      expect(button).toHaveAttribute("title", "Theme: light");
    });

    it("should cycle from light to system on click", async () => {
      mockStorage["theme"] = "light";

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: light");

      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });

      expect(button).toHaveAttribute("title", "Theme: system");
    });

    it("should cycle from system to dark on click", async () => {
      mockStorage["theme"] = "system";

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: system");

      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });

      expect(button).toHaveAttribute("title", "Theme: dark");
    });

    it("should complete full cycle: dark -> light -> system -> dark", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");

      // Start at dark
      expect(button).toHaveAttribute("title", "Theme: dark");

      // Click to light
      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });
      expect(button).toHaveAttribute("title", "Theme: light");

      // Click to system
      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });
      expect(button).toHaveAttribute("title", "Theme: system");

      // Click back to dark
      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });
      expect(button).toHaveAttribute("title", "Theme: dark");
    });
  });

  describe("Theme Application", () => {
    it("should save theme to localStorage on change", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });

    it("should apply dark class when theme is dark", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockClassList.remove).toHaveBeenCalledWith("dark", "light");
      expect(mockClassList.add).toHaveBeenCalledWith("dark");
    });

    it("should apply light class when theme is light", async () => {
      mockStorage["theme"] = "light";

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockClassList.add).toHaveBeenCalledWith("light");
    });

    it("should apply system theme based on media query", async () => {
      mockStorage["theme"] = "system";
      mockMediaQuery.matches = true; // System prefers light

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockClassList.add).toHaveBeenCalledWith("light");
    });

    it("should apply dark when system theme and media query prefers dark", async () => {
      mockStorage["theme"] = "system";
      mockMediaQuery.matches = false; // System prefers dark

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockClassList.add).toHaveBeenCalledWith("dark");
    });
  });

  describe("System Theme Changes", () => {
    it("should add listener for system theme changes when theme is system", async () => {
      mockStorage["theme"] = "system";

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("should not add listener when theme is not system", async () => {
      mockStorage["theme"] = "dark";

      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      // Check it was called for initial query but not for change listener
      expect(mockMediaQuery.addEventListener).not.toHaveBeenCalled();
    });

    it("should remove listener on unmount", async () => {
      mockStorage["theme"] = "system";

      const { unmount } = render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      unmount();

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
    });
  });

  describe("Theme Icons", () => {
    it("should show moon icon for dark theme", async () => {
      mockStorage["theme"] = "dark";
      const { container } = render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // Moon icon has specific path
      expect(svg?.querySelector("path")).toHaveAttribute(
        "d",
        expect.stringContaining("20.354")
      );
    });

    it("should show sun icon for light theme", async () => {
      mockStorage["theme"] = "light";
      const { container } = render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // Sun icon has specific path with M12 3v1
      expect(svg?.querySelector("path")).toHaveAttribute(
        "d",
        expect.stringContaining("M12 3v1")
      );
    });

    it("should show computer icon for system theme", async () => {
      mockStorage["theme"] = "system";
      const { container } = render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // Computer icon has specific path with M9.75 17L9 20
      expect(svg?.querySelector("path")).toHaveAttribute(
        "d",
        expect.stringContaining("M9.75 17L9 20")
      );
    });
  });

  describe("Accessibility", () => {
    it("should be focusable", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it("should have descriptive aria-label with current theme", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "aria-label",
        "Current theme: dark. Click to change."
      );
    });

    it("should update aria-label when theme changes", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
        vi.runAllTimers();
      });

      expect(button).toHaveAttribute(
        "aria-label",
        "Current theme: light. Click to change."
      );
    });

    it("should support keyboard activation", async () => {
      render(<ThemeToggle />);

      await act(async () => {
        vi.runAllTimers();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: dark");

      await act(async () => {
        fireEvent.keyDown(button, { key: "Enter" });
        fireEvent.click(button); // Simulate Enter key activation
        vi.runAllTimers();
      });

      expect(button).toHaveAttribute("title", "Theme: light");
    });
  });
});
