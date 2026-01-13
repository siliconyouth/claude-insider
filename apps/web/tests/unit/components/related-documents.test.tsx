/**
 * RelatedDocuments Components Tests
 *
 * Tests for the related documents display:
 * - RelatedDocuments (main component)
 * - RelatedDocumentsList (compact variant)
 * - RelatedDocumentsSkeleton (loading state)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  RelatedDocuments,
  RelatedDocumentsList,
  RelatedDocumentsSkeleton,
} from "@/components/cross-linking/RelatedDocuments";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe("RelatedDocuments", () => {
  const mockDocuments = [
    {
      id: 1,
      slug: "getting-started/installation",
      title: "Installation Guide",
      description: "How to install the tool",
      docCategory: "getting-started",
    },
    {
      id: 2,
      slug: "configuration/settings",
      title: "Configuration Settings",
      description: "Configure your environment",
      docCategory: "configuration",
    },
    {
      id: 3,
      slug: "api/endpoints",
      title: "API Endpoints",
      description: "Available API endpoints",
      docCategory: "api",
    },
    {
      id: 4,
      slug: "tutorials/quick-start",
      title: "Quick Start Tutorial",
      description: "Get started quickly",
      docCategory: "tutorials",
    },
    {
      id: 5,
      slug: "tips-and-tricks/shortcuts",
      title: "Keyboard Shortcuts",
      description: "Useful shortcuts",
      docCategory: "tips-and-tricks",
    },
    {
      id: 6,
      slug: "examples/basic",
      title: "Basic Example",
      description: "A basic example",
      docCategory: "examples",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<RelatedDocuments documents={mockDocuments} />)).not.toThrow();
    });

    it("should render section element", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("should return null for empty documents", () => {
      const { container } = render(<RelatedDocuments documents={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should return null for undefined documents", () => {
      const { container } = render(<RelatedDocuments documents={undefined as unknown as typeof mockDocuments} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Title", () => {
    it("should show default title 'Learn More'", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      expect(screen.getByText("Learn More")).toBeInTheDocument();
    });

    it("should show custom title when provided", () => {
      render(<RelatedDocuments documents={mockDocuments} title="Related Documentation" />);
      expect(screen.getByText("Related Documentation")).toBeInTheDocument();
    });

    it("should have aria-labelledby for accessibility", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      const section = screen.getByRole("region");
      expect(section.getAttribute("aria-labelledby")).toBe("related-docs-title");
    });
  });

  describe("Document Links", () => {
    it("should render document links", () => {
      render(<RelatedDocuments documents={mockDocuments.slice(0, 3)} />);
      expect(screen.getByText("Installation Guide")).toBeInTheDocument();
      expect(screen.getByText("Configuration Settings")).toBeInTheDocument();
      expect(screen.getByText("API Endpoints")).toBeInTheDocument();
    });

    it("should link to correct doc paths", () => {
      render(<RelatedDocuments documents={mockDocuments.slice(0, 1)} />);
      const link = screen.getByText("Installation Guide").closest("a");
      expect(link?.getAttribute("href")).toBe("/docs/getting-started/installation");
    });

    it("should show document descriptions", () => {
      render(<RelatedDocuments documents={mockDocuments.slice(0, 1)} />);
      expect(screen.getByText("How to install the tool")).toBeInTheDocument();
    });
  });

  describe("Max Documents", () => {
    it("should show max 5 documents by default", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      expect(screen.getByText("Installation Guide")).toBeInTheDocument();
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
      expect(screen.queryByText("Basic Example")).not.toBeInTheDocument();
    });

    it("should respect maxDocs prop", () => {
      render(<RelatedDocuments documents={mockDocuments} maxDocs={3} />);
      expect(screen.getByText("Installation Guide")).toBeInTheDocument();
      expect(screen.getByText("API Endpoints")).toBeInTheDocument();
      expect(screen.queryByText("Quick Start Tutorial")).not.toBeInTheDocument();
    });

    it("should show overflow message when more documents exist", () => {
      render(<RelatedDocuments documents={mockDocuments} maxDocs={3} />);
      expect(screen.getByText("+3 more related documents")).toBeInTheDocument();
    });

    it("should not show overflow when all documents fit", () => {
      render(<RelatedDocuments documents={mockDocuments.slice(0, 2)} maxDocs={5} />);
      expect(screen.queryByText(/more related documents/)).not.toBeInTheDocument();
    });
  });

  describe("Category Icons", () => {
    it("should show category icons", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      expect(screen.getByText("🚀")).toBeInTheDocument(); // getting-started
      expect(screen.getByText("⚙️")).toBeInTheDocument(); // configuration
      expect(screen.getByText("🔌")).toBeInTheDocument(); // api
      expect(screen.getByText("📖")).toBeInTheDocument(); // tutorials
    });

    it("should show default icon for unknown category", () => {
      const unknownCategoryDoc = [
        { id: 99, slug: "unknown/doc", title: "Unknown Doc", docCategory: "unknown" },
      ];
      render(<RelatedDocuments documents={unknownCategoryDoc} />);
      expect(screen.getByText("📄")).toBeInTheDocument();
    });
  });

  describe("Category Names", () => {
    it("should show category display names", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
      expect(screen.getByText("API Reference")).toBeInTheDocument();
    });

    it("should show raw category for unknown categories", () => {
      const unknownCategoryDoc = [
        { id: 99, slug: "unknown/doc", title: "Unknown Doc", docCategory: "unknown-cat" },
      ];
      render(<RelatedDocuments documents={unknownCategoryDoc} />);
      expect(screen.getByText("unknown-cat")).toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("should have smaller text in compact mode", () => {
      render(<RelatedDocuments documents={mockDocuments.slice(0, 1)} compact={true} />);
      const title = screen.getByText("Installation Guide");
      expect(title.className).toContain("text-sm");
    });

    it("should hide descriptions in compact mode", () => {
      render(<RelatedDocuments documents={mockDocuments.slice(0, 1)} compact={true} />);
      expect(screen.queryByText("How to install the tool")).not.toBeInTheDocument();
    });

    it("should have smaller padding in compact mode", () => {
      const { container } = render(
        <RelatedDocuments documents={mockDocuments.slice(0, 1)} compact={true} />
      );
      const link = container.querySelector("a");
      expect(link?.className).toContain("p-2");
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      const section = screen.getByRole("region");
      expect(section.className).toContain("rounded-xl");
    });

    it("should have border", () => {
      render(<RelatedDocuments documents={mockDocuments} />);
      const section = screen.getByRole("region");
      expect(section.className).toContain("border");
    });

    it("should have document icon in title", () => {
      const { container } = render(<RelatedDocuments documents={mockDocuments} />);
      const titleIcon = container.querySelector("h3 svg");
      expect(titleIcon).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(<RelatedDocuments documents={mockDocuments} className="custom-class" />);
      const section = screen.getByRole("region");
      expect(section.className).toContain("custom-class");
    });
  });
});

describe("RelatedDocumentsList", () => {
  const mockDocuments = [
    { id: 1, slug: "guide/intro", title: "Introduction", docCategory: "getting-started" },
    { id: 2, slug: "guide/setup", title: "Setup Guide", docCategory: "configuration" },
    { id: 3, slug: "guide/api", title: "API Guide", docCategory: "api" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<RelatedDocumentsList documents={mockDocuments} />)).not.toThrow();
    });

    it("should return null for empty documents", () => {
      const { container } = render(<RelatedDocumentsList documents={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Title", () => {
    it("should show default title 'Related Docs'", () => {
      render(<RelatedDocumentsList documents={mockDocuments} />);
      expect(screen.getByText("Related Docs")).toBeInTheDocument();
    });

    it("should show custom title when provided", () => {
      render(<RelatedDocumentsList documents={mockDocuments} title="See Also" />);
      expect(screen.getByText("See Also")).toBeInTheDocument();
    });
  });

  describe("Document Links", () => {
    it("should render document titles", () => {
      render(<RelatedDocumentsList documents={mockDocuments} />);
      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Setup Guide")).toBeInTheDocument();
      expect(screen.getByText("API Guide")).toBeInTheDocument();
    });

    it("should link to correct doc paths", () => {
      render(<RelatedDocumentsList documents={mockDocuments.slice(0, 1)} />);
      const link = screen.getByText("Introduction").closest("a");
      expect(link?.getAttribute("href")).toBe("/docs/guide/intro");
    });
  });

  describe("Category Icons", () => {
    it("should show small category icons", () => {
      render(<RelatedDocumentsList documents={mockDocuments} />);
      expect(screen.getByText("🚀")).toBeInTheDocument();
      expect(screen.getByText("⚙️")).toBeInTheDocument();
      expect(screen.getByText("🔌")).toBeInTheDocument();
    });
  });

  describe("Max Documents", () => {
    it("should respect maxDocs prop", () => {
      render(<RelatedDocumentsList documents={mockDocuments} maxDocs={2} />);
      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Setup Guide")).toBeInTheDocument();
      expect(screen.queryByText("API Guide")).not.toBeInTheDocument();
    });
  });
});

describe("RelatedDocumentsSkeleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<RelatedDocumentsSkeleton />)).not.toThrow();
    });

    it("should render 3 skeleton items by default", () => {
      const { container } = render(<RelatedDocumentsSkeleton />);
      const skeletonItems = container.querySelectorAll(".animate-pulse");
      // Multiple pulse elements per item + title
      expect(skeletonItems.length).toBeGreaterThan(3);
    });

    it("should respect count prop", () => {
      const { container } = render(<RelatedDocumentsSkeleton count={5} />);
      // Look for the item containers
      const itemContainers = container.querySelectorAll(".space-y-2 > div");
      expect(itemContainers.length).toBe(5);
    });
  });

  describe("Styling", () => {
    it("should have animate-pulse class", () => {
      const { container } = render(<RelatedDocumentsSkeleton />);
      const pulsingElements = container.querySelectorAll(".animate-pulse");
      expect(pulsingElements.length).toBeGreaterThan(0);
    });

    it("should have rounded corners on container", () => {
      const { container } = render(<RelatedDocumentsSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<RelatedDocumentsSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("border");
    });
  });
});
