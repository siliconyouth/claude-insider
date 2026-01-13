/**
 * DocsLayout Component Tests
 *
 * Tests for the documentation page layout:
 * - Page structure (header, footer, sidebar, main content)
 * - Breadcrumb navigation
 * - Sidebar rendering
 * - Page navigation (prev/next)
 * - Reading time display
 * - User interactions (favorite, rating)
 * - Edit actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocsLayout } from "@/components/docs-layout";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock child components
vi.mock("@/components/header", () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

vi.mock("@/components/footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/table-of-contents", () => ({
  TableOfContents: () => <div data-testid="table-of-contents">TOC</div>,
}));

vi.mock("@/components/json-ld", () => ({
  ArticleJsonLd: ({ title }: { title: string }) => (
    <script data-testid="article-json-ld" data-title={title} />
  ),
}));

vi.mock("@/components/edit-on-github", () => ({
  EditOnGitHub: ({ filePath }: { filePath: string }) => (
    <a data-testid="edit-on-github" href={`https://github.com/edit/${filePath}`}>Edit on GitHub</a>
  ),
}));

vi.mock("@/components/interactions/suggest-edit-button", () => ({
  SuggestEditButton: () => <button data-testid="suggest-edit">Suggest Edit</button>,
}));

vi.mock("@/components/interactions/comment-section", () => ({
  CommentSection: ({ resourceId }: { resourceId: string }) => (
    <div data-testid="comment-section" data-resource-id={resourceId}>Comments</div>
  ),
}));

vi.mock("@/components/interactions/favorite-button", () => ({
  FavoriteButton: ({ resourceId }: { resourceId: string }) => (
    <button data-testid="favorite-button" data-resource-id={resourceId}>Favorite</button>
  ),
}));

vi.mock("@/components/interactions/rating-stars", () => ({
  RatingStars: ({ resourceId }: { resourceId: string }) => (
    <div data-testid="rating-stars" data-resource-id={resourceId}>Rating</div>
  ),
}));

vi.mock("@/components/cross-linking/DocRelatedResources", () => ({
  DocRelatedResources: ({ docSlug }: { docSlug: string }) => (
    <div data-testid="related-resources" data-slug={docSlug}>Related Resources</div>
  ),
}));

vi.mock("@/components/cross-linking/RelatedResources", () => ({
  RelatedResourcesSkeleton: () => <div data-testid="related-skeleton">Loading...</div>,
}));

vi.mock("@/components/mobile", () => ({
  SwipeNavigationWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="swipe-wrapper">{children}</div>,
}));

vi.mock("@/components/ai-editor", () => ({
  AIEditorButton: () => <button data-testid="ai-editor">AI Edit</button>,
}));

describe("DocsLayout", () => {
  const defaultProps = {
    title: "Test Page",
    breadcrumbs: [
      { label: "Docs", href: "/docs" },
      { label: "Test Page" },
    ],
    children: <p>Test content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Page Structure", () => {
    it("should render header", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("should render footer", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("should render main content area", () => {
      const { container } = render(<DocsLayout {...defaultProps} />);

      // Main element has id="main-content"
      expect(container.querySelector("#main-content")).toBeInTheDocument();
    });

    it("should render table of contents", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByTestId("table-of-contents")).toBeInTheDocument();
    });

    it("should render article JSON-LD", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByTestId("article-json-ld")).toBeInTheDocument();
    });

    it("should pass title to JSON-LD", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByTestId("article-json-ld")).toHaveAttribute("data-title", "Test Page");
    });

    it("should wrap content in SwipeNavigationWrapper", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByTestId("swipe-wrapper")).toBeInTheDocument();
    });
  });

  describe("Title and Description", () => {
    it("should render page title", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByRole("heading", { name: "Test Page" })).toBeInTheDocument();
    });

    it("should render title as h1", () => {
      render(<DocsLayout {...defaultProps} />);

      const heading = screen.getByRole("heading", { name: "Test Page" });
      expect(heading.tagName).toBe("H1");
    });

    it("should render description when provided", () => {
      render(<DocsLayout {...defaultProps} description="This is a description" />);

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      render(<DocsLayout {...defaultProps} />);

      const article = screen.getByRole("article");
      expect(article.querySelector("p.text-lg")).toBeNull();
    });
  });

  describe("Breadcrumbs", () => {
    it("should render breadcrumb navigation", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render breadcrumb items", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByText("Docs")).toBeInTheDocument();
      // "Test Page" appears in both breadcrumb and h1, so use getAllByText
      expect(screen.getAllByText("Test Page").length).toBeGreaterThanOrEqual(1);
    });

    it("should link breadcrumb items with href", () => {
      render(<DocsLayout {...defaultProps} />);

      const docsLink = screen.getByRole("link", { name: "Docs" });
      expect(docsLink).toHaveAttribute("href", "/docs");
    });

    it("should render last breadcrumb as text (no link)", () => {
      render(<DocsLayout {...defaultProps} />);

      // "Test Page" appears in both breadcrumb and h1
      // Get all elements and find the one in the nav (breadcrumb)
      const testPageElements = screen.getAllByText("Test Page");
      const navElement = testPageElements.find(el => el.closest("nav"));
      expect(navElement).toBeDefined();
      expect(navElement?.closest("a")).toBeNull();
    });

    it("should render separator between breadcrumbs", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByText("/")).toBeInTheDocument();
    });
  });

  describe("Sidebar", () => {
    const sidebarProps = {
      ...defaultProps,
      sidebar: [
        {
          title: "Getting Started",
          items: [
            { label: "Introduction", href: "/docs/intro", active: true },
            { label: "Installation", href: "/docs/install" },
          ],
        },
        {
          title: "Advanced",
          items: [
            { label: "Configuration", href: "/docs/config" },
          ],
        },
      ],
    };

    it("should render sidebar when provided", () => {
      const { container } = render(<DocsLayout {...sidebarProps} />);

      expect(container.querySelector("aside")).toBeInTheDocument();
    });

    it("should render sidebar sections", () => {
      render(<DocsLayout {...sidebarProps} />);

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("Advanced")).toBeInTheDocument();
    });

    it("should render sidebar items", () => {
      render(<DocsLayout {...sidebarProps} />);

      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Installation")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
    });

    it("should link sidebar items", () => {
      render(<DocsLayout {...sidebarProps} />);

      const introLink = screen.getByRole("link", { name: "Introduction" });
      expect(introLink).toHaveAttribute("href", "/docs/intro");
    });

    it("should highlight active item", () => {
      render(<DocsLayout {...sidebarProps} />);

      const activeLink = screen.getByRole("link", { name: "Introduction" });
      expect(activeLink.className).toContain("text-blue-600");
    });

    it("should not render sidebar when not provided", () => {
      const { container } = render(<DocsLayout {...defaultProps} />);

      expect(container.querySelector("aside")).toBeNull();
    });
  });

  describe("Page Navigation", () => {
    it("should render prev/next navigation when provided", () => {
      render(
        <DocsLayout
          {...defaultProps}
          prevPage={{ label: "Previous", href: "/docs/prev" }}
          nextPage={{ label: "Next", href: "/docs/next" }}
        />
      );

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("should link to previous page", () => {
      render(
        <DocsLayout
          {...defaultProps}
          prevPage={{ label: "Previous", href: "/docs/prev" }}
        />
      );

      const prevLink = screen.getByRole("link", { name: "Previous" });
      expect(prevLink).toHaveAttribute("href", "/docs/prev");
    });

    it("should link to next page", () => {
      render(
        <DocsLayout
          {...defaultProps}
          nextPage={{ label: "Next", href: "/docs/next" }}
        />
      );

      const nextLink = screen.getByRole("link", { name: "Next" });
      expect(nextLink).toHaveAttribute("href", "/docs/next");
    });

    it("should render only prev when next not provided", () => {
      render(
        <DocsLayout
          {...defaultProps}
          prevPage={{ label: "Previous", href: "/docs/prev" }}
        />
      );

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("should not render navigation when neither provided", () => {
      const { container } = render(<DocsLayout {...defaultProps} />);

      // Look for the nav section with border-t
      const navSection = container.querySelector(".border-t.border-gray-200");
      expect(navSection).toBeNull();
    });
  });

  describe("Reading Time", () => {
    it("should display reading time when provided", () => {
      render(<DocsLayout {...defaultProps} readingTime="5 min read" />);

      expect(screen.getByText("5 min read")).toBeInTheDocument();
    });

    it("should not display reading time when not provided", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    const propsWithSlug = {
      ...defaultProps,
      slug: ["getting-started", "intro"],
    };

    it("should render favorite button when slug provided", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("favorite-button")).toBeInTheDocument();
    });

    it("should render rating stars when slug provided", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("rating-stars")).toBeInTheDocument();
    });

    it("should pass resource id to favorite button", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("favorite-button")).toHaveAttribute(
        "data-resource-id",
        "getting-started/intro"
      );
    });

    it("should not render interactions without slug", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.queryByTestId("favorite-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("rating-stars")).not.toBeInTheDocument();
    });
  });

  describe("Edit Actions", () => {
    const propsWithEdit = {
      ...defaultProps,
      slug: ["test"],
      editPath: "content/docs/test.mdx",
    };

    it("should render edit on GitHub when editPath provided", () => {
      render(<DocsLayout {...propsWithEdit} />);

      expect(screen.getByTestId("edit-on-github")).toBeInTheDocument();
    });

    it("should render suggest edit button when editPath provided", () => {
      render(<DocsLayout {...propsWithEdit} />);

      expect(screen.getByTestId("suggest-edit")).toBeInTheDocument();
    });

    it("should render AI editor when rawContent provided", () => {
      render(<DocsLayout {...propsWithEdit} rawContent="# Test content" />);

      expect(screen.getByTestId("ai-editor")).toBeInTheDocument();
    });

    it("should not render AI editor without rawContent", () => {
      render(<DocsLayout {...propsWithEdit} />);

      expect(screen.queryByTestId("ai-editor")).not.toBeInTheDocument();
    });

    it("should not render edit actions without editPath", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.queryByTestId("edit-on-github")).not.toBeInTheDocument();
    });
  });

  describe("Related Resources", () => {
    const propsWithSlug = {
      ...defaultProps,
      slug: ["getting-started"],
    };

    it("should render related resources when slug provided", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("related-resources")).toBeInTheDocument();
    });

    it("should pass doc slug to related resources", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("related-resources")).toHaveAttribute(
        "data-slug",
        "getting-started"
      );
    });

    it("should not render related resources without slug", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.queryByTestId("related-resources")).not.toBeInTheDocument();
    });
  });

  describe("Comments Section", () => {
    const propsWithSlug = {
      ...defaultProps,
      slug: ["test", "page"],
    };

    it("should render comment section when slug provided", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("comment-section")).toBeInTheDocument();
    });

    it("should pass resource id to comment section", () => {
      render(<DocsLayout {...propsWithSlug} />);

      expect(screen.getByTestId("comment-section")).toHaveAttribute(
        "data-resource-id",
        "test/page"
      );
    });

    it("should not render comments without slug", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.queryByTestId("comment-section")).not.toBeInTheDocument();
    });
  });

  describe("Children Content", () => {
    it("should render children content", () => {
      render(<DocsLayout {...defaultProps} />);

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render children inside article", () => {
      render(<DocsLayout {...defaultProps} />);

      const article = screen.getByRole("article");
      expect(article).toContainElement(screen.getByText("Test content"));
    });
  });

  describe("Styling", () => {
    it("should have min-h-screen", () => {
      const { container } = render(<DocsLayout {...defaultProps} />);

      expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });

    it("should have max-w-7xl container", () => {
      const { container } = render(<DocsLayout {...defaultProps} />);

      expect(container.querySelector(".max-w-7xl")).toBeInTheDocument();
    });

    it("should have prose styling on article", () => {
      render(<DocsLayout {...defaultProps} />);

      const article = screen.getByRole("article");
      expect(article.className).toContain("prose");
    });
  });
});
