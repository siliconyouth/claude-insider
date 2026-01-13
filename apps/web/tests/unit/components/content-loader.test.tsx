/**
 * ContentLoader Component Tests
 *
 * Tests for the content loading and skeleton components:
 * - ContentLoader: Suspense wrapper with route-based skeletons
 * - Route detection and skeleton selection
 * - Page-specific skeleton components
 * - NavigationLoader and PageLoadingOverlay
 *
 * Note: Suspense-based tests are limited because React Suspense only shows
 * fallback when children actually suspend (throw a promise). We test skeleton
 * components directly and verify ContentLoader renders children correctly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ContentLoader,
  HomePageSkeleton,
  DocsIndexSkeleton,
  DocsPageSkeleton,
  LegalPageSkeleton,
  ChangelogSkeleton,
  GenericPageSkeleton,
  NavigationLoader,
  PageLoadingOverlay,
} from "@/components/content-loader";

// Mock usePathname
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock skeleton components
vi.mock("@/components/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
  SkeletonText: ({ lines, className }: { lines: number; className?: string }) => (
    <div data-testid="skeleton-text" data-lines={lines} className={className} />
  ),
  SkeletonCard: () => <div data-testid="skeleton-card" />,
  SkeletonDocPage: () => <div data-testid="skeleton-doc-page" />,
  SkeletonHero: () => <div data-testid="skeleton-hero" />,
  SkeletonSidebar: () => <div data-testid="skeleton-sidebar" />,
}));

describe("ContentLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  describe("Children Rendering", () => {
    it("should render children when not suspended", () => {
      render(
        <ContentLoader>
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <ContentLoader>
          <div>First child</div>
          <div>Second child</div>
        </ContentLoader>
      );

      expect(screen.getByText("First child")).toBeInTheDocument();
      expect(screen.getByText("Second child")).toBeInTheDocument();
    });

    it("should render nested children", () => {
      render(
        <ContentLoader>
          <div>
            <span>Nested content</span>
          </div>
        </ContentLoader>
      );

      expect(screen.getByText("Nested content")).toBeInTheDocument();
    });
  });

  describe("Route Type Handling", () => {
    it("should accept home type", () => {
      render(
        <ContentLoader type="home">
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should accept docs type", () => {
      render(
        <ContentLoader type="docs">
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should accept docs-page type", () => {
      render(
        <ContentLoader type="docs-page">
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should accept legal type", () => {
      render(
        <ContentLoader type="legal">
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should accept changelog type", () => {
      render(
        <ContentLoader type="changelog">
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should accept unknown type", () => {
      render(
        <ContentLoader type="unknown">
          <div>Content</div>
        </ContentLoader>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Pathname Integration", () => {
    it("should use pathname hook", () => {
      mockUsePathname.mockReturnValue("/docs/getting-started");

      render(
        <ContentLoader>
          <div>Content</div>
        </ContentLoader>
      );

      expect(mockUsePathname).toHaveBeenCalled();
    });

    it("should work with various pathnames", () => {
      const paths = ["/", "/docs", "/docs/api", "/privacy", "/changelog", "/other"];

      paths.forEach((path) => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(
          <ContentLoader>
            <div>Content for {path}</div>
          </ContentLoader>
        );
        expect(screen.getByText(`Content for ${path}`)).toBeInTheDocument();
        unmount();
      });
    });
  });
});

describe("HomePageSkeleton", () => {
  it("should render hero skeleton", () => {
    render(<HomePageSkeleton />);

    expect(screen.getByTestId("skeleton-hero")).toBeInTheDocument();
  });

  it("should render category cards", () => {
    render(<HomePageSkeleton />);

    // 6 category cards
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(6);
  });

  it("should render stats section", () => {
    render(<HomePageSkeleton />);

    // Stats section has 4 items, each with 2 skeletons
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  it("should have proper layout classes", () => {
    const { container } = render(<HomePageSkeleton />);

    expect(container.querySelector(".space-y-16")).toBeInTheDocument();
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });
});

describe("DocsIndexSkeleton", () => {
  it("should render title skeleton", () => {
    render(<DocsIndexSkeleton />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render section cards grid", () => {
    render(<DocsIndexSkeleton />);

    const { container } = render(<DocsIndexSkeleton />);
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });

  it("should render skeleton text in cards", () => {
    render(<DocsIndexSkeleton />);

    // 6 cards, each with SkeletonText
    expect(screen.getAllByTestId("skeleton-text").length).toBeGreaterThanOrEqual(6);
  });

  it("should have responsive layout", () => {
    const { container } = render(<DocsIndexSkeleton />);

    expect(container.querySelector(".md\\:grid-cols-2")).toBeInTheDocument();
  });
});

describe("DocsPageSkeleton", () => {
  it("should render sidebar", () => {
    render(<DocsPageSkeleton />);

    expect(screen.getByTestId("skeleton-sidebar")).toBeInTheDocument();
  });

  it("should render main content", () => {
    render(<DocsPageSkeleton />);

    expect(screen.getByTestId("skeleton-doc-page")).toBeInTheDocument();
  });

  it("should render breadcrumb skeletons", () => {
    render(<DocsPageSkeleton />);

    // Breadcrumb has 5 skeleton items
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it("should render TOC section", () => {
    const { container } = render(<DocsPageSkeleton />);

    // TOC has sticky positioning and border
    expect(container.querySelector(".sticky")).toBeInTheDocument();
    expect(container.querySelector(".border-l")).toBeInTheDocument();
  });

  it("should have three-column layout", () => {
    const { container } = render(<DocsPageSkeleton />);

    expect(container.querySelector(".flex.gap-12")).toBeInTheDocument();
    expect(container.querySelectorAll("aside")).toHaveLength(2);
  });

  it("should hide sidebar on smaller screens", () => {
    const { container } = render(<DocsPageSkeleton />);

    const sidebar = container.querySelector("aside.hidden.lg\\:block");
    expect(sidebar).toBeInTheDocument();
  });

  it("should hide TOC on smaller screens", () => {
    const { container } = render(<DocsPageSkeleton />);

    const toc = container.querySelector("aside.hidden.xl\\:block");
    expect(toc).toBeInTheDocument();
  });
});

describe("LegalPageSkeleton", () => {
  it("should render title skeleton", () => {
    render(<LegalPageSkeleton />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render multiple sections", () => {
    render(<LegalPageSkeleton />);

    // 5 sections, each with SkeletonText
    expect(screen.getAllByTestId("skeleton-text")).toHaveLength(5);
  });

  it("should have max width container", () => {
    const { container } = render(<LegalPageSkeleton />);

    expect(container.querySelector(".max-w-4xl")).toBeInTheDocument();
  });

  it("should have proper spacing", () => {
    const { container } = render(<LegalPageSkeleton />);

    expect(container.querySelector(".py-12")).toBeInTheDocument();
  });
});

describe("ChangelogSkeleton", () => {
  it("should render title skeleton", () => {
    render(<ChangelogSkeleton />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render version entries", () => {
    const { container } = render(<ChangelogSkeleton />);

    // 4 version entries with border-b
    expect(container.querySelectorAll(".border-b").length).toBeGreaterThanOrEqual(4);
  });

  it("should render change sections per version", () => {
    render(<ChangelogSkeleton />);

    // Multiple skeletons for changes
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(10);
  });

  it("should have max width container", () => {
    const { container } = render(<ChangelogSkeleton />);

    expect(container.querySelector(".max-w-4xl")).toBeInTheDocument();
  });
});

describe("GenericPageSkeleton", () => {
  it("should render title skeleton", () => {
    render(<GenericPageSkeleton />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render body text skeletons", () => {
    render(<GenericPageSkeleton />);

    // Two SkeletonText components (6 lines and 4 lines)
    const texts = screen.getAllByTestId("skeleton-text");
    expect(texts).toHaveLength(2);
    expect(texts[0]).toHaveAttribute("data-lines", "6");
    expect(texts[1]).toHaveAttribute("data-lines", "4");
  });

  it("should have max width container", () => {
    const { container } = render(<GenericPageSkeleton />);

    expect(container.querySelector(".max-w-4xl")).toBeInTheDocument();
  });

  it("should have centered layout", () => {
    const { container } = render(<GenericPageSkeleton />);

    expect(container.querySelector(".mx-auto")).toBeInTheDocument();
  });
});

describe("NavigationLoader", () => {
  describe("Visibility", () => {
    it("should not render when isLoading is false", () => {
      const { container } = render(<NavigationLoader isLoading={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when isLoading is true", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("Styling", () => {
    it("should have fixed positioning", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.querySelector(".fixed")).toBeInTheDocument();
    });

    it("should be at top of screen", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.querySelector(".top-0")).toBeInTheDocument();
    });

    it("should span full width", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.querySelector(".left-0")).toBeInTheDocument();
      expect(container.querySelector(".right-0")).toBeInTheDocument();
    });

    it("should have high z-index", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.querySelector(".z-50")).toBeInTheDocument();
    });

    it("should have progress bar height", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.querySelector(".h-1")).toBeInTheDocument();
    });

    it("should have gradient progress bar", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      const progressBar = container.querySelector(".bg-gradient-to-r");
      expect(progressBar).toBeInTheDocument();
    });

    it("should hide overflow", () => {
      const { container } = render(<NavigationLoader isLoading={true} />);

      expect(container.querySelector(".overflow-hidden")).toBeInTheDocument();
    });
  });
});

describe("PageLoadingOverlay", () => {
  describe("Visibility", () => {
    it("should not render when isVisible is false", () => {
      const { container } = render(<PageLoadingOverlay isVisible={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when isVisible is true", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("Message", () => {
    it("should show default loading message", () => {
      render(<PageLoadingOverlay isVisible={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show custom message", () => {
      render(<PageLoadingOverlay isVisible={true} message="Please wait..." />);

      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have fixed positioning", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.querySelector(".fixed")).toBeInTheDocument();
    });

    it("should cover full viewport", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.querySelector(".inset-0")).toBeInTheDocument();
    });

    it("should have high z-index", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.querySelector(".z-50")).toBeInTheDocument();
    });

    it("should center content", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.querySelector(".flex.items-center.justify-center")).toBeInTheDocument();
    });

    it("should have backdrop blur", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.querySelector(".backdrop-blur-sm")).toBeInTheDocument();
    });
  });

  describe("Spinner", () => {
    it("should render spinner", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      // Spinner has two circles
      const circles = container.querySelectorAll(".rounded-full");
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it("should have spinning animation", () => {
      const { container } = render(<PageLoadingOverlay isVisible={true} />);

      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });
});

describe("Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("should work with various nested docs paths", () => {
    const paths = [
      "/docs/api",
      "/docs/getting-started/installation",
      "/docs/tutorials/basics/first-project",
    ];

    paths.forEach((path) => {
      mockUsePathname.mockReturnValue(path);
      const { unmount } = render(
        <ContentLoader>
          <div>Content</div>
        </ContentLoader>
      );
      // Children render without suspension
      expect(screen.getByText("Content")).toBeInTheDocument();
      unmount();
    });
  });

  it("should handle all legal routes", () => {
    const paths = ["/privacy", "/terms", "/disclaimer", "/accessibility"];

    paths.forEach((path) => {
      mockUsePathname.mockReturnValue(path);
      const { unmount } = render(
        <ContentLoader>
          <div>Content</div>
        </ContentLoader>
      );
      // Children render without suspension
      expect(screen.getByText("Content")).toBeInTheDocument();
      unmount();
    });
  });

  it("should handle home and changelog routes", () => {
    const paths = ["/", "/changelog"];

    paths.forEach((path) => {
      mockUsePathname.mockReturnValue(path);
      const { unmount } = render(
        <ContentLoader>
          <div>Content</div>
        </ContentLoader>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
      unmount();
    });
  });
});
