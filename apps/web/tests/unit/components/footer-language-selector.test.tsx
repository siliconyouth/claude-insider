/**
 * FooterLanguageSelector Component Tests
 *
 * Tests for the footer language selector component:
 * - Dropdown toggle positioned above
 * - Region-based locale grouping
 * - Click outside to close
 * - Locale change with cookie and reload
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FooterLanguageSelector } from "@/components/footer-language-selector";

// Mock useLocale
const mockUseLocale = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock i18n config with regions
vi.mock("@/i18n/config", () => ({
  localeNames: {
    en: "English",
    "es-MX": "Español (México)",
    "pt-BR": "Português",
    de: "Deutsch",
    fr: "Français",
    es: "Español",
    it: "Italiano",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
  },
  localeFlags: {
    en: "🇺🇸",
    "es-MX": "🇲🇽",
    "pt-BR": "🇧🇷",
    de: "🇩🇪",
    fr: "🇫🇷",
    es: "🇪🇸",
    it: "🇮🇹",
    ja: "🇯🇵",
    ko: "🇰🇷",
    zh: "🇨🇳",
  },
  localeRegions: {
    americas: ["en", "es-MX", "pt-BR"],
    europe: ["de", "fr", "es", "it"],
    asia: ["ja", "ko", "zh"],
  },
}));

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

describe("FooterLanguageSelector", () => {
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
      render(<FooterLanguageSelector />);

      expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    });

    it("should render current locale name", () => {
      render(<FooterLanguageSelector />);

      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<FooterLanguageSelector />);

      const chevron = container.querySelector("svg");
      expect(chevron).toBeInTheDocument();
    });

    it("should have correct aria attributes", () => {
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-haspopup", "listbox");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should have accessible label", () => {
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "English, select language");
    });

    it("should have smaller text size for footer", () => {
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("text-xs");
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<FooterLanguageSelector />);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should show dropdown when button is clicked", () => {
      render(<FooterLanguageSelector />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("should hide dropdown when button is clicked again", () => {
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should update aria-expanded when open", () => {
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<FooterLanguageSelector />);

      fireEvent.click(screen.getByRole("button"));

      const chevron = container.querySelector("svg");
      // SVG className is an SVGAnimatedString, use getAttribute
      expect(chevron?.getAttribute("class")).toContain("rotate-180");
    });
  });

  describe("Dropdown Positioning", () => {
    it("should position dropdown above button", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("bottom-full");
    });

    it("should have margin below dropdown", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("mb-2");
    });

    it("should center dropdown horizontally", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("left-1/2");
      expect(dropdown?.className).toContain("-translate-x-1/2");
    });
  });

  describe("Region Groups", () => {
    beforeEach(() => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
    });

    it("should display Americas region header", () => {
      expect(screen.getByText("Americas")).toBeInTheDocument();
    });

    it("should display Europe region header", () => {
      expect(screen.getByText("Europe")).toBeInTheDocument();
    });

    it("should display Asia region header", () => {
      expect(screen.getByText("Asia")).toBeInTheDocument();
    });

    it("should have uppercase styling for region headers", () => {
      const americasHeader = screen.getByText("Americas");
      expect(americasHeader).toHaveClass("uppercase", "tracking-wider");
    });

    it("should render Americas locales", () => {
      // English appears twice - once in button, once in dropdown
      expect(screen.getAllByText("English").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Español (México)")).toBeInTheDocument();
      expect(screen.getByText("Português")).toBeInTheDocument();
    });

    it("should render Europe locales", () => {
      expect(screen.getByText("Deutsch")).toBeInTheDocument();
      expect(screen.getByText("Français")).toBeInTheDocument();
      expect(screen.getByText("Español")).toBeInTheDocument();
      expect(screen.getByText("Italiano")).toBeInTheDocument();
    });

    it("should render Asia locales", () => {
      expect(screen.getByText("日本語")).toBeInTheDocument();
      expect(screen.getByText("한국어")).toBeInTheDocument();
      expect(screen.getByText("中文")).toBeInTheDocument();
    });
  });

  describe("Grid Layout", () => {
    it("should have 3-column grid for Americas", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const grids = container.querySelectorAll(".grid");
      expect(grids[0]).toHaveClass("grid-cols-3");
    });

    it("should have 4-column grid for Europe", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const grids = container.querySelectorAll(".grid");
      expect(grids[1]).toHaveClass("grid-cols-4");
    });

    it("should have 3-column grid for Asia", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const grids = container.querySelectorAll(".grid");
      expect(grids[2]).toHaveClass("grid-cols-3");
    });
  });

  describe("Language Buttons", () => {
    it("should have option role for each language button", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(10);
    });

    it("should mark current locale as selected", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const selectedOption = screen.getByRole("option", { selected: true });
      expect(selectedOption).toHaveTextContent("English");
    });

    it("should have active styling for current locale", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const selectedOption = screen.getByRole("option", { selected: true });
      expect(selectedOption.className).toContain("from-violet-600/10");
      expect(selectedOption.className).toContain("text-blue-600");
    });

    it("should display flag and name in each button", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const japaneseOption = screen.getByRole("option", { name: /日本語/i });
      expect(japaneseOption).toBeInTheDocument();
      expect(japaneseOption.textContent).toContain("🇯🇵");
    });
  });

  describe("Locale Change", () => {
    it("should set cookie when locale is changed", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Deutsch"));

      expect(document.cookie).toContain("NEXT_LOCALE=de");
    });

    it("should reload page when locale is changed", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("Français"));

      expect(mockReload).toHaveBeenCalled();
    });

    it("should close dropdown after locale change", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByText("日本語"));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("Click Outside", () => {
    it("should close dropdown when clicking outside", () => {
      render(
        <div data-testid="outside">
          <FooterLanguageSelector />
        </div>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("outside"));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not close when clicking inside dropdown", () => {
      render(<FooterLanguageSelector />);

      fireEvent.click(screen.getByRole("button"));
      const listbox = screen.getByRole("listbox");

      fireEvent.mouseDown(listbox);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("should cleanup event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(<FooterLanguageSelector />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function)
      );
    });
  });

  describe("Focus Styles", () => {
    it("should have focus-visible ring styles", () => {
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("focus:outline-none");
      expect(button.className).toContain("focus-visible:ring-2");
      expect(button.className).toContain("focus-visible:ring-blue-500");
    });
  });

  describe("Dropdown Styling", () => {
    it("should have proper width", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("w-[420px]");
    });

    it("should have max width for mobile", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("max-w-[90vw]");
    });

    it("should have rounded corners", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("rounded-xl");
    });

    it("should have shadow", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("shadow-lg");
    });

    it("should have animation class", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("animate-fade-in");
    });

    it("should have z-50 for proper stacking", () => {
      const { container } = render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown?.className).toContain("z-50");
    });
  });

  describe("Different Current Locale", () => {
    it("should display Japanese when ja is current locale", () => {
      mockUseLocale.mockReturnValue("ja");
      render(<FooterLanguageSelector />);

      expect(screen.getByText("🇯🇵")).toBeInTheDocument();
      expect(screen.getByText("日本語")).toBeInTheDocument();
    });

    it("should have Japanese as selected in dropdown", () => {
      mockUseLocale.mockReturnValue("ja");
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const selectedOption = screen.getByRole("option", { selected: true });
      expect(selectedOption).toHaveTextContent("日本語");
    });

    it("should update aria-label with current locale", () => {
      mockUseLocale.mockReturnValue("de");
      render(<FooterLanguageSelector />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Deutsch, select language");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on flag emoji", () => {
      render(<FooterLanguageSelector />);

      const flagSpan = screen.getByText("🇺🇸");
      expect(flagSpan).toHaveAttribute("aria-hidden", "true");
    });

    it("should have aria-hidden on chevron", () => {
      const { container } = render(<FooterLanguageSelector />);

      const chevron = container.querySelector("svg");
      expect(chevron).toHaveAttribute("aria-hidden", "true");
    });

    it("should have listbox aria-label", () => {
      render(<FooterLanguageSelector />);
      fireEvent.click(screen.getByRole("button"));

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-label", "Select language");
    });
  });
});
