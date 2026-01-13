/**
 * CategoryQuickLinks Component Tests
 *
 * Tests for the category quick links navigation:
 * - Initial rendering
 * - Category links
 * - All Resources link
 * - Scroll buttons
 * - Category counts
 * - Animation delays
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryQuickLinks } from "@/components/home/category-quick-links";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className, style }: { children: React.ReactNode; href: string; className?: string; style?: React.CSSProperties }) => (
    <a href={href} className={className} style={style}>{children}</a>
  ),
}));

describe("CategoryQuickLinks", () => {
  const mockCategories = [
    { slug: "tools", name: "Tools", shortName: "Tools", icon: "🔧", count: 150 },
    { slug: "libraries", name: "Libraries", shortName: "Libs", icon: "📚", count: 230 },
    { slug: "tutorials", name: "Tutorials", icon: "📖", count: 45 },
    { slug: "templates", name: "Templates", icon: "📋", count: 80 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<CategoryQuickLinks categories={mockCategories} />)).not.toThrow();
    });

    it("should render section title", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("Browse by Category")).toBeInTheDocument();
    });

    it("should render 'All Resources' link", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("All Resources")).toBeInTheDocument();
    });

    it("should render all category links", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("Tools")).toBeInTheDocument();
      expect(screen.getByText("Libs")).toBeInTheDocument(); // Uses shortName
      expect(screen.getByText("Tutorials")).toBeInTheDocument();
      expect(screen.getByText("Templates")).toBeInTheDocument();
    });
  });

  describe("All Resources Link", () => {
    it("should link to /resources", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const allLink = screen.getByText("All Resources").closest("a");
      expect(allLink?.getAttribute("href")).toBe("/resources");
    });

    it("should have gradient styling", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const allLink = screen.getByText("All Resources").closest("a");
      expect(allLink?.className).toContain("from-violet-600");
      expect(allLink?.className).toContain("via-blue-600");
      expect(allLink?.className).toContain("to-cyan-600");
    });

    it("should have sparkle emoji", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("✨")).toBeInTheDocument();
    });
  });

  describe("Category Links", () => {
    it("should link to category pages", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);

      const toolsLink = screen.getByText("Tools").closest("a");
      expect(toolsLink?.getAttribute("href")).toBe("/resources/tools");

      const libsLink = screen.getByText("Libs").closest("a");
      expect(libsLink?.getAttribute("href")).toBe("/resources/libraries");
    });

    it("should show category icons", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("🔧")).toBeInTheDocument();
      expect(screen.getByText("📚")).toBeInTheDocument();
      expect(screen.getByText("📖")).toBeInTheDocument();
      expect(screen.getByText("📋")).toBeInTheDocument();
    });

    it("should show category counts", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("230")).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
    });

    it("should use shortName when available", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("Libs")).toBeInTheDocument(); // shortName
      expect(screen.queryByText("Libraries")).not.toBeInTheDocument(); // full name not shown
    });

    it("should use name when shortName not available", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByText("Tutorials")).toBeInTheDocument(); // no shortName
    });
  });

  describe("Scroll Buttons", () => {
    it("should render left scroll button", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    });

    it("should render right scroll button", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    });

    it("should have SVG icons in scroll buttons", () => {
      const { container } = render(<CategoryQuickLinks categories={mockCategories} />);
      const scrollButtons = container.querySelectorAll('button[aria-label^="Scroll"]');
      expect(scrollButtons.length).toBe(2);
      scrollButtons.forEach((btn) => {
        expect(btn.querySelector("svg")).toBeInTheDocument();
      });
    });

    it("should have opacity-0 class on scroll buttons (hidden by default)", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const leftBtn = screen.getByLabelText("Scroll left");
      const rightBtn = screen.getByLabelText("Scroll right");
      expect(leftBtn.className).toContain("opacity-0");
      expect(rightBtn.className).toContain("opacity-0");
    });

    it("should have group-hover:opacity-100 for visibility on hover", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const leftBtn = screen.getByLabelText("Scroll left");
      expect(leftBtn.className).toContain("group-hover:opacity-100");
    });
  });

  describe("Animation Delays", () => {
    it("should have staggered animation delays", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);

      // Find category links (not the All Resources link)
      const categoryLinks = mockCategories.map((cat) =>
        screen.getByText(cat.shortName || cat.name).closest("a")
      );

      categoryLinks.forEach((link, index) => {
        const style = link?.getAttribute("style");
        expect(style).toContain(`animation-delay: ${index * 30}ms`);
      });
    });
  });

  describe("Styling", () => {
    it("should have title styled correctly", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const title = screen.getByText("Browse by Category");
      expect(title.className).toContain("text-xl");
      expect(title.className).toContain("font-semibold");
    });

    it("should have category links with border", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const toolsLink = screen.getByText("Tools").closest("a");
      expect(toolsLink?.className).toContain("border");
    });

    it("should have category links with rounded corners", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const toolsLink = screen.getByText("Tools").closest("a");
      expect(toolsLink?.className).toContain("rounded-xl");
    });

    it("should have hover translate effect", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const toolsLink = screen.getByText("Tools").closest("a");
      expect(toolsLink?.className).toContain("hover:-translate-y-0.5");
    });

    it("should have fade animation class", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const toolsLink = screen.getByText("Tools").closest("a");
      expect(toolsLink?.className).toContain("animate-fade-in");
    });
  });

  describe("Count Badge", () => {
    it("should have count badge styling", () => {
      render(<CategoryQuickLinks categories={mockCategories} />);
      const countBadge = screen.getByText("150");
      expect(countBadge.className).toContain("rounded-full");
      expect(countBadge.className).toContain("bg-gray-100");
      expect(countBadge.className).toContain("text-xs");
    });
  });

  describe("Scrollable Container", () => {
    it("should have overflow-x-auto for horizontal scrolling", () => {
      const { container } = render(<CategoryQuickLinks categories={mockCategories} />);
      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should have scrollbar-hide class", () => {
      const { container } = render(<CategoryQuickLinks categories={mockCategories} />);
      const scrollContainer = container.querySelector(".scrollbar-hide");
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe("Fade Edges", () => {
    it("should have gradient fade on left", () => {
      const { container } = render(<CategoryQuickLinks categories={mockCategories} />);
      const leftFade = container.querySelector(".bg-gradient-to-r");
      expect(leftFade).toBeInTheDocument();
    });

    it("should have gradient fade on right", () => {
      const { container } = render(<CategoryQuickLinks categories={mockCategories} />);
      const rightFade = container.querySelector(".bg-gradient-to-l");
      expect(rightFade).toBeInTheDocument();
    });

    it("should have pointer-events-none on fade elements", () => {
      const { container } = render(<CategoryQuickLinks categories={mockCategories} />);
      const fades = container.querySelectorAll(".pointer-events-none");
      expect(fades.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Empty State", () => {
    it("should still render All Resources with empty categories", () => {
      render(<CategoryQuickLinks categories={[]} />);
      expect(screen.getByText("All Resources")).toBeInTheDocument();
    });
  });

  describe("Scroll Functionality", () => {
    it("should call scrollBy on scroll button click", () => {
      const scrollByMock = vi.fn();
      const originalScrollBy = Element.prototype.scrollBy;
      Element.prototype.scrollBy = scrollByMock;

      render(<CategoryQuickLinks categories={mockCategories} />);

      fireEvent.click(screen.getByLabelText("Scroll right"));

      // Restore
      Element.prototype.scrollBy = originalScrollBy;

      expect(scrollByMock).toHaveBeenCalled();
    });
  });
});
