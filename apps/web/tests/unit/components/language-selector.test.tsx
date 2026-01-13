/**
 * LanguageSelector Component Tests
 *
 * Tests for the header language selector component:
 * - Dropdown toggle
 * - Locale display with flags
 * - Click outside to close
 * - Locale change with cookie and reload
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LanguageSelector } from "@/components/language-selector";

// Mock useLocale
const mockUseLocale = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
}));

// Mock i18n config
const mockLocales = ["en", "es", "fr"];
const mockLocaleNames: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};
const mockLocaleFlags: Record<string, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
};

vi.mock("@/i18n/config", () => ({
  locales: ["en", "es", "fr"],
  localeNames: {
    en: "English",
    es: "Español",
    fr: "Français",
  },
  localeFlags: {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
  },
}));

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

describe("LanguageSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocale.mockReturnValue("en");
    Object.defineProperty(document, "cookie", {
      value: "",
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Button Rendering", () => {
    it("should render current locale flag", () => {
      render(<LanguageSelector />);

      expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    });

    it("should render current locale name on larger screens", () => {
      render(<LanguageSelector />);

      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("should hide name on mobile (sm:inline class)", () => {
      render(<LanguageSelector />);

      const name = screen.getByText("English");
      expect(name).toHaveClass("hidden", "sm:inline");
    });

    it("should render chevron icon when multiple locales available", () => {
      const { container } = render(<LanguageSelector />);

      const chevron = container.querySelector("svg");
      expect(chevron).toBeInTheDocument();
    });

    it("should have correct aria attributes", () => {
      render(<LanguageSelector />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-haspopup", "listbox");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should have title for multiple locales", () => {
      render(<LanguageSelector />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Select language");
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<LanguageSelector />);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should show dropdown when button is clicked", () => {
      render(<LanguageSelector />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("should hide dropdown when button is clicked again", () => {
      render(<LanguageSelector />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should update aria-expanded when open", () => {
      render(<LanguageSelector />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<LanguageSelector />);

      fireEvent.click(screen.getByRole("button"));

      const chevron = container.querySelector("svg");
      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Dropdown Content", () => {
    beforeEach(() => {
      render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
    });

    it("should display all available locales", () => {
      // English appears twice - once in button, once in dropdown
      expect(screen.getAllByText("English").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Español")).toBeInTheDocument();
      expect(screen.getByText("Français")).toBeInTheDocument();
    });

    it("should display flags for all locales", () => {
      // Flag appears twice - once in button, once in dropdown
      expect(screen.getAllByText("🇺🇸").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("🇪🇸")).toBeInTheDocument();
      expect(screen.getByText("🇫🇷")).toBeInTheDocument();
    });

    it("should have listbox role on dropdown", () => {
      expect(screen.getByRole("listbox")).toHaveAttribute(
        "aria-label",
        "Select language"
      );
    });

    it("should have option role on each locale button", () => {
      const options = screen.getAllByRole("option");
      expect(options.length).toBe(3);
    });

    it("should mark current locale as selected", () => {
      const selectedOption = screen.getByRole("option", { selected: true });
      expect(selectedOption).toHaveTextContent("English");
    });

    it("should show checkmark for current locale", () => {
      // Checkmark SVG should be in the selected option
      const selectedOption = screen.getByRole("option", { selected: true });
      const checkmark = selectedOption.querySelector("svg");
      expect(checkmark).toBeInTheDocument();
    });

    it("should have active styling for current locale", () => {
      const selectedOption = screen.getByRole("option", { selected: true });
      expect(selectedOption.className).toContain("bg-blue-500/10");
      expect(selectedOption.className).toContain("text-blue-600");
    });
  });

  describe("Locale Change", () => {
    it("should set cookie when locale is changed", () => {
      render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Español"));

      expect(document.cookie).toContain("NEXT_LOCALE=es");
    });

    it("should reload page when locale is changed", () => {
      render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Español"));

      expect(mockReload).toHaveBeenCalled();
    });

    it("should close dropdown after locale change", () => {
      render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Español"));

      // Dropdown should close (even though page reloads, the state should update)
      // Since reload is mocked, we can check the state
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("Click Outside", () => {
    it("should close dropdown when clicking outside", () => {
      render(
        <div data-testid="outside">
          <LanguageSelector />
        </div>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside"));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not close when clicking inside dropdown", () => {
      render(<LanguageSelector />);

      fireEvent.click(screen.getByRole("button"));
      const listbox = screen.getByRole("listbox");

      fireEvent.mouseDown(listbox);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("should cleanup event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(<LanguageSelector />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function)
      );
    });
  });

  describe("Focus Styles", () => {
    it("should have focus ring styles", () => {
      render(<LanguageSelector />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("focus:outline-none");
      expect(button.className).toContain("focus:ring-2");
      expect(button.className).toContain("focus:ring-blue-500");
    });
  });

  describe("Different Current Locale", () => {
    it("should display Spanish when es is current locale", () => {
      mockUseLocale.mockReturnValue("es");
      render(<LanguageSelector />);

      expect(screen.getByText("🇪🇸")).toBeInTheDocument();
      expect(screen.getByText("Español")).toBeInTheDocument();
    });

    it("should display French when fr is current locale", () => {
      mockUseLocale.mockReturnValue("fr");
      render(<LanguageSelector />);

      expect(screen.getByText("🇫🇷")).toBeInTheDocument();
      expect(screen.getByText("Français")).toBeInTheDocument();
    });
  });

  describe("Dropdown Styling", () => {
    it("should have proper positioning", () => {
      const { container } = render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown).toHaveClass("absolute", "right-0", "mt-1");
    });

    it("should have max width for viewport safety", () => {
      const { container } = render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown).toHaveClass("max-w-[calc(100vw-2rem)]");
    });

    it("should have z-50 for proper stacking", () => {
      const { container } = render(<LanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown).toHaveClass("z-50");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on flag emoji", () => {
      render(<LanguageSelector />);

      const flagSpan = screen.getByText("🇺🇸");
      expect(flagSpan).toHaveAttribute("aria-hidden", "true");
    });

    it("should have aria-hidden on chevron", () => {
      const { container } = render(<LanguageSelector />);

      const chevron = container.querySelector("svg");
      expect(chevron).toHaveAttribute("aria-hidden", "true");
    });
  });
});

describe("LanguageSelector with Single Locale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocale.mockReturnValue("en");
  });

  // Note: With our mock of 3 locales, this test simulates behavior
  // The actual single locale behavior would need different mock setup
  it("should have hover styles for multiple locales", () => {
    render(<LanguageSelector />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:bg-gray-100");
    expect(button.className).toContain("cursor-pointer");
  });
});
