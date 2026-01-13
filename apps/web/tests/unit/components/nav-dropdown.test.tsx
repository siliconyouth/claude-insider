/**
 * NavDropdown Component Tests
 *
 * Tests for the navigation dropdown components:
 * - NavDropdown: Hover dropdown menu with multiple layouts
 * - NavLink: Simple nav link without dropdown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { NavDropdown, NavLink, NavItem, NavSection } from "@/components/nav-dropdown";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: vi.fn(({ href, children, className, ...props }) => (
    <a href={href} className={className} data-testid="next-link" {...props}>
      {children}
    </a>
  )),
}));

describe("NavDropdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockSections: NavSection[] = [
    {
      title: "Getting Started",
      items: [
        { label: "Introduction", href: "/docs/intro" },
        { label: "Installation", href: "/docs/install", description: "Setup guide" },
      ],
    },
  ];

  describe("Trigger Rendering", () => {
    it("should render trigger link with label", () => {
      render(<NavDropdown label="Documentation" href="/docs" sections={[]} />);

      expect(screen.getByText("Documentation")).toBeInTheDocument();
    });

    it("should render trigger as Next.js Link", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={[]} />);

      const link = screen.getByTestId("next-link");
      expect(link).toHaveAttribute("href", "/docs");
    });

    it("should show chevron icon when has dropdown", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const chevron = container.querySelector("svg");
      expect(chevron).toBeInTheDocument();
      expect(chevron).toHaveClass("w-3.5", "h-3.5");
    });

    it("should not show chevron when no dropdown", () => {
      const { container } = render(<NavDropdown label="About" href="/about" sections={[]} />);

      const chevron = container.querySelector("svg");
      expect(chevron).not.toBeInTheDocument();
    });
  });

  describe("Active State", () => {
    it("should apply active styles when isActive is true", () => {
      render(<NavDropdown label="Docs" href="/docs" isActive sections={[]} />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("text-gray-900");
      expect(link.className).toContain("bg-gray-100");
    });

    it("should apply inactive styles when isActive is false", () => {
      render(<NavDropdown label="Docs" href="/docs" isActive={false} sections={[]} />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("text-gray-600");
    });

    it("should apply default inactive styles when isActive not provided", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={[]} />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("text-gray-600");
    });
  });

  describe("Focus Styles", () => {
    it("should have focus-visible styles", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={[]} />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("focus-visible:ring-2");
      expect(link.className).toContain("focus-visible:ring-blue-500");
    });
  });

  describe("Dropdown Visibility", () => {
    it("should not show dropdown by default", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
    });

    it("should show dropdown on mouse enter", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Installation")).toBeInTheDocument();
    });

    it("should hide dropdown on mouse leave after delay", async () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(screen.getByText("Introduction")).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);

      // Still visible immediately
      expect(screen.getByText("Introduction")).toBeInTheDocument();

      // After 150ms delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.queryByText("Introduction")).not.toBeInTheDocument();
    });

    it("should cancel close timer on re-enter", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;

      // Open dropdown
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText("Introduction")).toBeInTheDocument();

      // Start leaving
      fireEvent.mouseLeave(trigger);

      // Advance only 100ms (less than 150ms threshold)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Re-enter before timeout
      fireEvent.mouseEnter(trigger);

      // Advance past the original timeout
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should still be open
      expect(screen.getByText("Introduction")).toBeInTheDocument();
    });

    it("should rotate chevron when dropdown is open", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      const chevron = container.querySelector("svg");
      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Layout Variants", () => {
    it("should apply list layout styles by default", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      // List layout min-width
      expect(container.querySelector(".min-w-\\[240px\\]")).toBeInTheDocument();
    });

    it("should apply mega layout styles", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} layout="mega" />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".min-w-\\[600px\\]")).toBeInTheDocument();
      expect(container.querySelector(".grid.grid-cols-3")).toBeInTheDocument();
    });

    it("should apply grid layout styles", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} layout="grid" />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".min-w-\\[480px\\]")).toBeInTheDocument();
      expect(container.querySelector(".grid.grid-cols-2")).toBeInTheDocument();
    });

    it("should show section titles in mega layout", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} layout="mega" />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
    });

    it("should show section titles in grid layout", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} layout="grid" />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
    });

    it("should not show section titles in list layout", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} layout="list" />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      // Items should be visible but not section titles (list layout hides them)
      expect(screen.getByText("Introduction")).toBeInTheDocument();
    });
  });

  describe("Section Items", () => {
    const itemsWithFeatures: NavSection[] = [
      {
        title: "Features",
        items: [
          {
            label: "Feature 1",
            href: "/feature-1",
            description: "Feature description",
            icon: <span data-testid="item-icon">📦</span>,
            badge: "New",
          },
          {
            label: "External",
            href: "https://external.com",
            external: true,
          },
        ],
      },
    ];

    it("should render item labels", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={itemsWithFeatures} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Feature 1")).toBeInTheDocument();
    });

    it("should render item descriptions", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={itemsWithFeatures} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Feature description")).toBeInTheDocument();
    });

    it("should render item icons", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={itemsWithFeatures} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByTestId("item-icon")).toBeInTheDocument();
    });

    it("should render item badges", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={itemsWithFeatures} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should render external link attributes", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={itemsWithFeatures} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      const externalLink = screen.getByText("External").closest("a");
      expect(externalLink).toHaveAttribute("target", "_blank");
      expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should show external link icon", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={itemsWithFeatures} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      // External link has an SVG icon
      const externalItem = screen.getByText("External").closest("a");
      const svg = externalItem?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Featured Item", () => {
    const featured: NavItem = {
      label: "Featured Item",
      href: "/featured",
      description: "This is a featured item",
      icon: <span data-testid="featured-icon">⭐</span>,
      badge: "HOT",
    };

    it("should render featured item", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} featured={featured} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Featured Item")).toBeInTheDocument();
    });

    it("should render featured item description", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} featured={featured} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("This is a featured item")).toBeInTheDocument();
    });

    it("should render featured item icon", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} featured={featured} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByTestId("featured-icon")).toBeInTheDocument();
    });

    it("should render featured item badge", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} featured={featured} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("HOT")).toBeInTheDocument();
    });

    it("should have gradient background", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} featured={featured} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      const featuredSection = container.querySelector(".bg-gradient-to-r");
      expect(featuredSection).toBeInTheDocument();
    });

    it("should link to featured href", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={mockSections} featured={featured} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      const featuredLink = screen.getByText("Featured Item").closest("a");
      expect(featuredLink).toHaveAttribute("href", "/featured");
    });
  });

  describe("Footer", () => {
    it("should render footer content", () => {
      render(
        <NavDropdown
          label="Docs"
          href="/docs"
          sections={mockSections}
          footer={<div data-testid="footer-content">Footer</div>}
        />
      );

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByTestId("footer-content")).toBeInTheDocument();
    });

    it("should not render footer when not provided", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      // Footer has specific bg-gray-50 class
      expect(container.querySelector(".bg-gray-50")).not.toBeInTheDocument();
    });

    it("should have footer styling", () => {
      const { container } = render(
        <NavDropdown
          label="Docs"
          href="/docs"
          sections={mockSections}
          footer={<span>Footer</span>}
        />
      );

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      const footer = container.querySelector(".bg-gray-50");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("px-4", "py-3");
    });
  });

  describe("Dropdown Positioning", () => {
    it("should position dropdown below trigger", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      const dropdown = container.querySelector(".top-full");
      expect(dropdown).toBeInTheDocument();
    });

    it("should center dropdown horizontally", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      const dropdown = container.querySelector(".left-1\\/2.-translate-x-1\\/2");
      expect(dropdown).toBeInTheDocument();
    });

    it("should have high z-index", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".z-50")).toBeInTheDocument();
    });
  });

  describe("Animation Classes", () => {
    it("should have entrance animation classes", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      const animated = container.querySelector(".animate-in");
      expect(animated).toBeInTheDocument();
      expect(animated).toHaveClass("fade-in-0", "zoom-in-95", "slide-in-from-top-2");
    });
  });

  describe("Dropdown Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".rounded-xl")).toBeInTheDocument();
    });

    it("should have border styling", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".border.border-gray-200")).toBeInTheDocument();
    });

    it("should have shadow styling", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".shadow-xl")).toBeInTheDocument();
    });

    it("should have max-width for viewport safety", () => {
      const { container } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);

      expect(container.querySelector(".max-w-\\[calc\\(100vw-2rem\\)\\]")).toBeInTheDocument();
    });
  });

  describe("Multiple Sections", () => {
    const multipleSections: NavSection[] = [
      { title: "Section 1", items: [{ label: "Item 1", href: "/item-1" }] },
      { title: "Section 2", items: [{ label: "Item 2", href: "/item-2" }] },
      { title: "Section 3", items: [{ label: "Item 3", href: "/item-3" }] },
    ];

    it("should render all sections", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={multipleSections} layout="mega" />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
      expect(screen.getByText("Section 3")).toBeInTheDocument();
    });

    it("should render all items", () => {
      render(<NavDropdown label="Docs" href="/docs" sections={multipleSections} />);

      const trigger = screen.getByText("Docs");
      fireEvent.mouseEnter(trigger.closest("div")!);

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });
  });

  describe("Cleanup", () => {
    it("should cleanup timeout on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      const { container, unmount } = render(<NavDropdown label="Docs" href="/docs" sections={mockSections} />);

      const trigger = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});

describe("NavLink", () => {
  describe("Rendering", () => {
    it("should render label", () => {
      render(<NavLink label="About" href="/about" />);

      expect(screen.getByText("About")).toBeInTheDocument();
    });

    it("should render as Next.js Link for internal href", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link).toHaveAttribute("href", "/about");
    });

    it("should render as anchor for external href", () => {
      render(<NavLink label="External" href="https://example.com" external />);

      const link = screen.getByText("External");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Active State", () => {
    it("should apply active styles when isActive is true", () => {
      render(<NavLink label="About" href="/about" isActive />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("text-gray-900");
      expect(link.className).toContain("bg-gray-100");
    });

    it("should apply inactive styles when isActive is false", () => {
      render(<NavLink label="About" href="/about" isActive={false} />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("text-gray-600");
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("rounded-lg");
    });

    it("should have padding", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("px-2");
      expect(link.className).toContain("py-1.5");
    });

    it("should have medium font weight", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("font-medium");
    });

    it("should have transition", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("transition-all");
      expect(link.className).toContain("duration-200");
    });
  });

  describe("Focus Styles", () => {
    it("should have focus-visible styles", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link.className).toContain("focus:outline-none");
      expect(link.className).toContain("focus-visible:ring-2");
      expect(link.className).toContain("focus-visible:ring-blue-500");
    });
  });

  describe("External Links", () => {
    it("should not have external attributes when internal", () => {
      render(<NavLink label="About" href="/about" />);

      const link = screen.getByTestId("next-link");
      expect(link).not.toHaveAttribute("target");
      expect(link).not.toHaveAttribute("rel");
    });

    it("should have target blank for external", () => {
      render(<NavLink label="External" href="https://example.com" external />);

      const link = screen.getByText("External");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer for external", () => {
      render(<NavLink label="External" href="https://example.com" external />);

      const link = screen.getByText("External");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});

describe("TypeScript Interfaces", () => {
  describe("NavItem interface", () => {
    it("should accept minimal props", () => {
      const item: NavItem = { label: "Test", href: "/test" };
      expect(item.label).toBe("Test");
      expect(item.href).toBe("/test");
    });

    it("should accept all optional props", () => {
      const item: NavItem = {
        label: "Test",
        href: "/test",
        description: "Description",
        icon: <span>Icon</span>,
        badge: "Badge",
        external: true,
      };
      expect(item.description).toBe("Description");
      expect(item.badge).toBe("Badge");
      expect(item.external).toBe(true);
    });
  });

  describe("NavSection interface", () => {
    it("should have title and items", () => {
      const section: NavSection = {
        title: "Section",
        items: [{ label: "Item", href: "/item" }],
      };
      expect(section.title).toBe("Section");
      expect(section.items).toHaveLength(1);
    });
  });
});
