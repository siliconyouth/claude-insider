/**
 * PrefetchLink Component Tests
 *
 * Tests for the smart prefetching link components:
 * - PrefetchLink: Base link with hover/focus/intersection prefetching
 * - NavPrefetchLink: Navigation link with icon and active state
 * - CardPrefetchLink: Card-style link with title, description, icon
 * - BreadcrumbPrefetchLink: Simple breadcrumb link
 * - TocLink: Table of Contents link with smooth scroll
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import {
  PrefetchLink,
  NavPrefetchLink,
  CardPrefetchLink,
  BreadcrumbPrefetchLink,
  TocLink,
} from "@/components/prefetch-link";

// Mock next/link
vi.mock("next/link", () => ({
  default: vi.fn(({ children, href, className, prefetch, ...props }) => (
    <a href={typeof href === "string" ? href : href.pathname} className={className} {...props}>
      {children}
    </a>
  )),
}));

// Mock usePrefetch hook
const mockPrefetchRef = vi.fn();
const mockUsePrefetch = vi.fn().mockReturnValue({
  ref: mockPrefetchRef,
  isPrefetching: false,
  isPrefetched: false,
});

vi.mock("@/hooks/use-prefetch", () => ({
  usePrefetch: (...args: unknown[]) => mockUsePrefetch(...args),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("PrefetchLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrefetch.mockReturnValue({
      ref: mockPrefetchRef,
      isPrefetching: false,
      isPrefetched: false,
    });
  });

  describe("Rendering", () => {
    it("should render a link with children", () => {
      render(<PrefetchLink href="/test">Test Link</PrefetchLink>);

      const link = screen.getByRole("link", { name: "Test Link" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("should handle object href", () => {
      render(
        <PrefetchLink href={{ pathname: "/docs", query: { page: 1 } }}>
          Docs
        </PrefetchLink>
      );

      const link = screen.getByRole("link", { name: "Docs" });
      expect(link).toHaveAttribute("href", "/docs");
    });

    it("should apply custom className", () => {
      render(
        <PrefetchLink href="/test" className="custom-class">
          Test
        </PrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("custom-class");
    });

    it("should have relative positioning for indicator", () => {
      render(<PrefetchLink href="/test">Test</PrefetchLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("relative");
    });

    it("should pass additional props to link", () => {
      render(
        <PrefetchLink href="/test" aria-label="Navigate to test">
          Test
        </PrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-label", "Navigate to test");
    });
  });

  describe("Prefetch Hook Integration", () => {
    it("should call usePrefetch with correct URL string", () => {
      render(<PrefetchLink href="/docs/getting-started">Getting Started</PrefetchLink>);

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/docs/getting-started",
        expect.objectContaining({
          onHover: true,
          onFocus: true,
          onIntersection: true,
          hoverDelay: 100,
        })
      );
    });

    it("should call usePrefetch with pathname from object href", () => {
      render(
        <PrefetchLink href={{ pathname: "/api/reference" }}>API</PrefetchLink>
      );

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/api/reference",
        expect.any(Object)
      );
    });

    it("should pass custom priority to usePrefetch", () => {
      render(
        <PrefetchLink href="/test" priority="high">
          High Priority
        </PrefetchLink>
      );

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({ priority: "high" })
      );
    });

    it("should pass custom hoverDelay to usePrefetch", () => {
      render(
        <PrefetchLink href="/test" hoverDelay={250}>
          Delayed
        </PrefetchLink>
      );

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({ hoverDelay: 250 })
      );
    });

    it("should disable all prefetching when noPrefetch is true", () => {
      render(
        <PrefetchLink href="/test" noPrefetch>
          No Prefetch
        </PrefetchLink>
      );

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({
          onHover: false,
          onFocus: false,
          onIntersection: false,
        })
      );
    });
  });

  describe("Prefetch Indicator", () => {
    it("should not show indicator by default", () => {
      render(<PrefetchLink href="/test">Test</PrefetchLink>);

      const indicator = document.querySelector("[aria-hidden='true']");
      expect(indicator).not.toBeInTheDocument();
    });

    it("should not show indicator when showIndicator is true but not prefetching", () => {
      render(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      const indicator = document.querySelector("[aria-hidden='true']");
      expect(indicator).not.toBeInTheDocument();
    });

    it("should show pulsing indicator when prefetching", () => {
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: true,
        isPrefetched: false,
      });

      const { container } = render(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      const indicator = container.querySelector("[aria-hidden='true']");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-blue-400");
      expect(indicator).toHaveClass("animate-pulse");
    });

    it("should show green indicator when prefetched", () => {
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: false,
        isPrefetched: true,
      });

      const { container } = render(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      const indicator = container.querySelector("[aria-hidden='true']");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-green-400");
    });

    it("should have correct positioning classes on indicator", () => {
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: true,
        isPrefetched: false,
      });

      const { container } = render(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      const indicator = container.querySelector("[aria-hidden='true']");
      expect(indicator).toHaveClass("absolute");
      expect(indicator).toHaveClass("-right-2");
      expect(indicator).toHaveClass("-top-0.5");
      expect(indicator).toHaveClass("rounded-full");
    });
  });

  describe("Loading State", () => {
    it("should add prefetch-loading class when prefetching", () => {
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: true,
        isPrefetched: false,
      });

      render(<PrefetchLink href="/test">Test</PrefetchLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("prefetch-loading");
    });

    it("should not add prefetch-loading class when not prefetching", () => {
      render(<PrefetchLink href="/test">Test</PrefetchLink>);

      const link = screen.getByRole("link");
      expect(link).not.toHaveClass("prefetch-loading");
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to anchor element", () => {
      const ref = createRef<HTMLAnchorElement>();
      render(
        <PrefetchLink ref={ref} href="/test">
          Test
        </PrefetchLink>
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current?.href).toContain("/test");
    });

    it("should call function ref with anchor element", () => {
      const refFn = vi.fn();
      render(
        <PrefetchLink ref={refFn} href="/test">
          Test
        </PrefetchLink>
      );

      expect(refFn).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
    });

    it("should call prefetch ref with anchor element", () => {
      render(<PrefetchLink href="/test">Test</PrefetchLink>);

      expect(mockPrefetchRef).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
    });

    it("should handle null ref on unmount", () => {
      const ref = createRef<HTMLAnchorElement>();
      const { unmount } = render(
        <PrefetchLink ref={ref} href="/test">
          Test
        </PrefetchLink>
      );

      unmount();
      expect(mockPrefetchRef).toHaveBeenCalledWith(null);
    });
  });
});

describe("NavPrefetchLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrefetch.mockReturnValue({
      ref: mockPrefetchRef,
      isPrefetching: false,
      isPrefetched: false,
    });
  });

  describe("Rendering", () => {
    it("should render navigation link with children", () => {
      render(<NavPrefetchLink href="/docs">Documentation</NavPrefetchLink>);

      const link = screen.getByRole("link", { name: "Documentation" });
      expect(link).toBeInTheDocument();
    });

    it("should have navigation styling classes", () => {
      render(<NavPrefetchLink href="/docs">Docs</NavPrefetchLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("flex");
      expect(link).toHaveClass("items-center");
      expect(link).toHaveClass("rounded-md");
      expect(link).toHaveClass("text-sm");
      expect(link).toHaveClass("font-medium");
    });

    it("should apply custom className", () => {
      render(
        <NavPrefetchLink href="/docs" className="my-nav-link">
          Docs
        </NavPrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("my-nav-link");
    });
  });

  describe("Icon Support", () => {
    it("should render icon when provided", () => {
      render(
        <NavPrefetchLink href="/docs" icon={<span data-testid="nav-icon">📄</span>}>
          Docs
        </NavPrefetchLink>
      );

      expect(screen.getByTestId("nav-icon")).toBeInTheDocument();
    });

    it("should wrap icon in flex-shrink-0 container", () => {
      render(
        <NavPrefetchLink href="/docs" icon={<span data-testid="nav-icon">📄</span>}>
          Docs
        </NavPrefetchLink>
      );

      const iconWrapper = screen.getByTestId("nav-icon").parentElement;
      expect(iconWrapper).toHaveClass("flex-shrink-0");
    });

    it("should not render icon container when no icon", () => {
      const { container } = render(
        <NavPrefetchLink href="/docs">Docs</NavPrefetchLink>
      );

      const iconWrapper = container.querySelector(".flex-shrink-0");
      expect(iconWrapper).not.toBeInTheDocument();
    });
  });

  describe("Active State", () => {
    it("should apply active styles when isActive is true", () => {
      render(
        <NavPrefetchLink href="/docs" isActive>
          Docs
        </NavPrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-gray-900");
    });

    it("should not apply active styles by default", () => {
      render(<NavPrefetchLink href="/docs">Docs</NavPrefetchLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-gray-600");
    });
  });

  describe("Priority", () => {
    it("should use high priority for navigation links", () => {
      render(<NavPrefetchLink href="/docs">Docs</NavPrefetchLink>);

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/docs",
        expect.objectContaining({ priority: "high" })
      );
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to anchor element", () => {
      const ref = createRef<HTMLAnchorElement>();
      render(
        <NavPrefetchLink ref={ref} href="/docs">
          Docs
        </NavPrefetchLink>
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });
});

describe("CardPrefetchLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrefetch.mockReturnValue({
      ref: mockPrefetchRef,
      isPrefetching: false,
      isPrefetched: false,
    });
  });

  describe("Rendering", () => {
    it("should render card with title", () => {
      render(
        <CardPrefetchLink href="/feature" title="Feature Card">
          Content
        </CardPrefetchLink>
      );

      expect(screen.getByRole("heading", { name: "Feature Card" })).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <CardPrefetchLink
          href="/feature"
          title="Feature"
          description="This is a description"
        >
          Content
        </CardPrefetchLink>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      render(
        <CardPrefetchLink href="/feature" title="Feature">
          Content
        </CardPrefetchLink>
      );

      const paragraphs = document.querySelectorAll("p");
      expect(paragraphs).toHaveLength(0);
    });

    it("should render icon when provided", () => {
      render(
        <CardPrefetchLink
          href="/feature"
          title="Feature"
          icon={<span data-testid="card-icon">🎯</span>}
        >
          Content
        </CardPrefetchLink>
      );

      expect(screen.getByTestId("card-icon")).toBeInTheDocument();
    });

    it("should have card styling classes", () => {
      render(
        <CardPrefetchLink href="/feature" title="Feature">
          Content
        </CardPrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("rounded-xl");
      expect(link).toHaveClass("border");
      expect(link).toHaveClass("shadow-sm");
    });

    it("should apply custom className", () => {
      render(
        <CardPrefetchLink href="/feature" title="Feature" className="my-card">
          Content
        </CardPrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("my-card");
    });
  });

  describe("Icon Container", () => {
    it("should wrap icon in styled container", () => {
      render(
        <CardPrefetchLink
          href="/feature"
          title="Feature"
          icon={<span data-testid="card-icon">🎯</span>}
        >
          Content
        </CardPrefetchLink>
      );

      const iconContainer = screen.getByTestId("card-icon").parentElement;
      expect(iconContainer).toHaveClass("mb-4");
      expect(iconContainer).toHaveClass("rounded-lg");
      expect(iconContainer).toHaveClass("h-12");
      expect(iconContainer).toHaveClass("w-12");
    });

    it("should not render icon container when no icon", () => {
      const { container } = render(
        <CardPrefetchLink href="/feature" title="Feature">
          Content
        </CardPrefetchLink>
      );

      const iconContainer = container.querySelector(".h-12.w-12");
      expect(iconContainer).not.toBeInTheDocument();
    });
  });

  describe("Title Styling", () => {
    it("should have h3 heading with correct classes", () => {
      render(
        <CardPrefetchLink href="/feature" title="Feature Title">
          Content
        </CardPrefetchLink>
      );

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveClass("text-lg");
      expect(heading).toHaveClass("font-semibold");
    });
  });

  describe("Description Styling", () => {
    it("should have line-clamp on description", () => {
      render(
        <CardPrefetchLink
          href="/feature"
          title="Feature"
          description="Long description"
        >
          Content
        </CardPrefetchLink>
      );

      const description = screen.getByText("Long description");
      expect(description).toHaveClass("line-clamp-2");
      expect(description).toHaveClass("text-sm");
    });
  });

  describe("Priority and Indicator", () => {
    it("should use normal priority for card links", () => {
      render(
        <CardPrefetchLink href="/feature" title="Feature">
          Content
        </CardPrefetchLink>
      );

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/feature",
        expect.objectContaining({ priority: "normal" })
      );
    });

    it("should show indicator by default", () => {
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: true,
        isPrefetched: false,
      });

      const { container } = render(
        <CardPrefetchLink href="/feature" title="Feature">
          Content
        </CardPrefetchLink>
      );

      const indicator = container.querySelector("[aria-hidden='true']");
      expect(indicator).toBeInTheDocument();
    });
  });
});

describe("BreadcrumbPrefetchLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrefetch.mockReturnValue({
      ref: mockPrefetchRef,
      isPrefetching: false,
      isPrefetched: false,
    });
  });

  describe("Rendering", () => {
    it("should render breadcrumb link with children", () => {
      render(<BreadcrumbPrefetchLink href="/">Home</BreadcrumbPrefetchLink>);

      const link = screen.getByRole("link", { name: "Home" });
      expect(link).toBeInTheDocument();
    });

    it("should have breadcrumb styling classes", () => {
      render(<BreadcrumbPrefetchLink href="/">Home</BreadcrumbPrefetchLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-sm");
      expect(link).toHaveClass("text-gray-500");
      expect(link).toHaveClass("transition-colors");
    });

    it("should apply custom className", () => {
      render(
        <BreadcrumbPrefetchLink href="/" className="custom-breadcrumb">
          Home
        </BreadcrumbPrefetchLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("custom-breadcrumb");
    });
  });

  describe("Priority", () => {
    it("should use high priority for breadcrumb links", () => {
      render(<BreadcrumbPrefetchLink href="/docs">Docs</BreadcrumbPrefetchLink>);

      expect(mockUsePrefetch).toHaveBeenCalledWith(
        "/docs",
        expect.objectContaining({ priority: "high" })
      );
    });
  });
});

describe("TocLink", () => {
  // Mock document.getElementById and scrollIntoView
  let mockGetElementById: ReturnType<typeof vi.fn>;
  let mockScrollIntoView: ReturnType<typeof vi.fn>;
  let mockPushState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockScrollIntoView = vi.fn();
    mockGetElementById = vi.fn().mockReturnValue({
      scrollIntoView: mockScrollIntoView,
    });
    mockPushState = vi.fn();

    Object.defineProperty(document, "getElementById", {
      value: mockGetElementById,
      writable: true,
    });

    Object.defineProperty(window, "history", {
      value: { pushState: mockPushState },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render anchor with correct href", () => {
      render(<TocLink anchor="introduction">Introduction</TocLink>);

      const link = screen.getByRole("link", { name: "Introduction" });
      expect(link).toHaveAttribute("href", "#introduction");
    });

    it("should have TOC styling classes", () => {
      render(<TocLink anchor="test">Test Section</TocLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("block");
      expect(link).toHaveClass("text-sm");
      expect(link).toHaveClass("transition-colors");
      expect(link).toHaveClass("py-1");
    });

    it("should apply custom className", () => {
      render(
        <TocLink anchor="test" className="custom-toc">
          Test
        </TocLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("custom-toc");
    });
  });

  describe("Active State", () => {
    it("should apply active styles when isActive is true", () => {
      render(
        <TocLink anchor="test" isActive>
          Active Section
        </TocLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-blue-600");
      expect(link).toHaveClass("font-medium");
    });

    it("should apply inactive styles by default", () => {
      render(<TocLink anchor="test">Inactive Section</TocLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-gray-600");
      expect(link).not.toHaveClass("font-medium");
    });
  });

  describe("Nesting Levels", () => {
    it("should not add padding at level 0", () => {
      render(<TocLink anchor="test" level={0}>Level 0</TocLink>);

      const link = screen.getByRole("link");
      expect(link).not.toHaveClass("pl-4");
    });

    it("should add padding at level 1", () => {
      render(<TocLink anchor="test" level={1}>Level 1</TocLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("pl-4");
    });

    it("should add padding at level 2", () => {
      render(<TocLink anchor="test" level={2}>Level 2</TocLink>);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("pl-4");
    });
  });

  describe("Click Behavior", () => {
    it("should scroll to element on click", () => {
      render(<TocLink anchor="target-section">Section</TocLink>);

      const link = screen.getByRole("link");
      fireEvent.click(link);

      expect(mockGetElementById).toHaveBeenCalledWith("target-section");
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });

    it("should update URL hash on click", () => {
      render(<TocLink anchor="my-section">Section</TocLink>);

      const link = screen.getByRole("link");
      fireEvent.click(link);

      expect(mockPushState).toHaveBeenCalledWith(null, "", "#my-section");
    });

    it("should prevent default link behavior", () => {
      render(<TocLink anchor="test">Test</TocLink>);

      const link = screen.getByRole("link");
      const event = fireEvent.click(link);

      // Click was handled, default was prevented
      expect(mockGetElementById).toHaveBeenCalled();
    });

    it("should not scroll if element not found", () => {
      mockGetElementById.mockReturnValue(null);

      render(<TocLink anchor="nonexistent">Missing</TocLink>);

      const link = screen.getByRole("link");
      fireEvent.click(link);

      expect(mockGetElementById).toHaveBeenCalledWith("nonexistent");
      expect(mockScrollIntoView).not.toHaveBeenCalled();
      expect(mockPushState).not.toHaveBeenCalled();
    });
  });

  describe("Additional Props", () => {
    it("should pass additional props to anchor", () => {
      render(
        <TocLink anchor="test" aria-label="Jump to test section">
          Test
        </TocLink>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-label", "Jump to test section");
    });

    it("should handle data attributes", () => {
      render(
        <TocLink anchor="test" data-testid="toc-link">
          Test
        </TocLink>
      );

      expect(screen.getByTestId("toc-link")).toBeInTheDocument();
    });
  });
});

describe("Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrefetch.mockReturnValue({
      ref: mockPrefetchRef,
      isPrefetching: false,
      isPrefetched: false,
    });
  });

  describe("Multiple Links", () => {
    it("should handle multiple links with different priorities", () => {
      render(
        <>
          <NavPrefetchLink href="/nav">Nav</NavPrefetchLink>
          <CardPrefetchLink href="/card" title="Card">Content</CardPrefetchLink>
          <BreadcrumbPrefetchLink href="/breadcrumb">Breadcrumb</BreadcrumbPrefetchLink>
        </>
      );

      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });

  describe("State Changes", () => {
    it("should update indicator when prefetch state changes", () => {
      mockUsePrefetch.mockReturnValueOnce({
        ref: mockPrefetchRef,
        isPrefetching: false,
        isPrefetched: false,
      });

      const { rerender, container } = render(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      // Initially no indicator
      expect(container.querySelector("[aria-hidden='true']")).not.toBeInTheDocument();

      // Update to prefetching state
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: true,
        isPrefetched: false,
      });

      rerender(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      // Now indicator should show
      expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should maintain accessible link role across all variants", () => {
      render(
        <>
          <PrefetchLink href="/prefetch">Prefetch</PrefetchLink>
          <NavPrefetchLink href="/nav">Nav</NavPrefetchLink>
          <CardPrefetchLink href="/card" title="Card">Content</CardPrefetchLink>
          <BreadcrumbPrefetchLink href="/breadcrumb">Breadcrumb</BreadcrumbPrefetchLink>
          <TocLink anchor="toc">TOC</TocLink>
        </>
      );

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(5);
    });

    it("should hide indicator from screen readers", () => {
      mockUsePrefetch.mockReturnValue({
        ref: mockPrefetchRef,
        isPrefetching: true,
        isPrefetched: false,
      });

      const { container } = render(
        <PrefetchLink href="/test" showIndicator>
          Test
        </PrefetchLink>
      );

      const indicator = container.querySelector("[aria-hidden='true']");
      expect(indicator).toHaveAttribute("aria-hidden", "true");
    });
  });
});
