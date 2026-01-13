/**
 * LinkifiedText Component Tests
 *
 * Tests for the text linkification component with hover previews:
 * - URL detection and linkification
 * - Internal path detection (/docs/, /resources/, etc.)
 * - Link styling and attributes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinkifiedText } from "@/components/linkified-text";

// Mock createPortal to render content inline for testing
vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

// Mock next/link
vi.mock("next/link", () => ({
  default: vi.fn(({ children, href, className, ...props }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  )),
}));

// Mock search index
const mockSearchIndex = [
  {
    url: "/docs/getting-started",
    title: "Getting Started",
    description: "Learn how to get started with Claude",
    category: "Documentation",
  },
  {
    url: "/docs/api-reference",
    title: "API Reference",
    description: "Complete API documentation",
    category: "Documentation",
  },
  {
    url: "/assistant",
    title: "AI Assistant",
    description: "Chat with our AI assistant",
    category: "Tools",
  },
];

vi.mock("@/lib/search", () => ({
  buildSearchIndex: () => mockSearchIndex,
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("LinkifiedText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Plain Text", () => {
    it("should render plain text without links", () => {
      render(<LinkifiedText text="Hello, this is plain text." />);

      expect(screen.getByText("Hello, this is plain text.")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<LinkifiedText text="Hello" className="custom-class" />);

      const span = screen.getByText("Hello").closest("span");
      expect(span).toHaveClass("custom-class");
    });

    it("should handle empty text", () => {
      const { container } = render(<LinkifiedText text="" />);

      expect(container.querySelector("span")).toBeInTheDocument();
    });

    it("should handle text with special characters", () => {
      render(<LinkifiedText text={'Hello & goodbye "quotes"'} />);

      expect(screen.getByText(/Hello & goodbye/)).toBeInTheDocument();
    });
  });

  describe("URL Detection", () => {
    it("should linkify http URLs", () => {
      render(<LinkifiedText text="Check out http://example.com for more info" />);

      const link = screen.getByRole("link", { name: "http://example.com" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "http://example.com");
    });

    it("should linkify https URLs", () => {
      render(<LinkifiedText text="Visit https://secure.example.com today" />);

      const link = screen.getByRole("link", { name: "https://secure.example.com" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://secure.example.com");
    });

    it("should linkify URLs with paths", () => {
      render(<LinkifiedText text="See https://example.com/path/to/page" />);

      const link = screen.getByRole("link", { name: "https://example.com/path/to/page" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify URLs with query parameters", () => {
      render(<LinkifiedText text="Link: https://example.com/search?q=test&page=1" />);

      const link = screen.getByRole("link", { name: "https://example.com/search?q=test&page=1" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify multiple URLs in same text", () => {
      render(
        <LinkifiedText text="Visit https://a.com and https://b.com for more" />
      );

      expect(screen.getByRole("link", { name: "https://a.com" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "https://b.com" })).toBeInTheDocument();
    });

    it("should open external links in new tab", () => {
      render(<LinkifiedText text="Visit https://external.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Internal Path Detection", () => {
    it("should linkify /docs paths", () => {
      render(<LinkifiedText text="Check out /docs/getting-started for help" />);

      const link = screen.getByRole("link", { name: "/docs/getting-started" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/docs/getting-started");
    });

    it("should linkify /resources paths", () => {
      render(<LinkifiedText text="See /resources/tools for tools" />);

      const link = screen.getByRole("link", { name: "/resources/tools" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /assistant path", () => {
      render(<LinkifiedText text="Try the /assistant feature" />);

      const link = screen.getByRole("link", { name: "/assistant" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /changelog path", () => {
      render(<LinkifiedText text="See /changelog for updates" />);

      const link = screen.getByRole("link", { name: "/changelog" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /privacy path", () => {
      render(<LinkifiedText text="Read our /privacy policy" />);

      const link = screen.getByRole("link", { name: "/privacy" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /terms path", () => {
      render(<LinkifiedText text="Accept /terms to continue" />);

      const link = screen.getByRole("link", { name: "/terms" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /disclaimer path", () => {
      render(<LinkifiedText text="Read /disclaimer before use" />);

      const link = screen.getByRole("link", { name: "/disclaimer" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /accessibility path", () => {
      render(<LinkifiedText text="Our /accessibility statement" />);

      const link = screen.getByRole("link", { name: "/accessibility" });
      expect(link).toBeInTheDocument();
    });

    it("should not open internal links in new tab", () => {
      render(<LinkifiedText text="Check /docs/getting-started" />);

      const link = screen.getByRole("link");
      expect(link).not.toHaveAttribute("target", "_blank");
    });

    it("should handle paths at start of text", () => {
      render(<LinkifiedText text="/docs/api-reference is the API guide" />);

      const link = screen.getByRole("link", { name: "/docs/api-reference" });
      expect(link).toBeInTheDocument();
    });

    it("should handle nested paths", () => {
      render(<LinkifiedText text="Go to /docs/api/endpoints/users for user API" />);

      const link = screen.getByRole("link", { name: /\/docs\/api\/endpoints\/users/ });
      expect(link).toBeInTheDocument();
    });
  });

  describe("Mixed Content", () => {
    it("should handle text with both URLs and paths", () => {
      render(
        <LinkifiedText text="Check /docs/getting-started or visit https://example.com" />
      );

      expect(screen.getByRole("link", { name: "/docs/getting-started" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "https://example.com" })).toBeInTheDocument();
    });

    it("should preserve text between links", () => {
      render(
        <LinkifiedText text="Start at /docs then go to https://example.com okay?" />
      );

      expect(screen.getByText(/Start at/)).toBeInTheDocument();
      expect(screen.getByText(/then go to/)).toBeInTheDocument();
      expect(screen.getByText(/okay\?/)).toBeInTheDocument();
    });

    it("should handle adjacent links", () => {
      render(<LinkifiedText text="Links: https://a.com https://b.com" />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
    });
  });

  describe("Link Styling", () => {
    it("should apply link styling classes", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-blue-600");
      expect(link).toHaveClass("underline");
    });

    it("should have hover transition classes", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("transition-colors");
    });

    it("should have underline offset", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("underline-offset-2");
    });
  });

  describe("Title Attributes", () => {
    it("should have title attribute on external links", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("title", "example.com");
    });

    it("should have title attribute on internal links", () => {
      render(<LinkifiedText text="Check /docs/getting-started" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("title", "Getting Started");
    });

    it("should strip www from domain in title", () => {
      render(<LinkifiedText text="Visit https://www.example.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("title", "example.com");
    });
  });

  describe("Edge Cases", () => {
    it("should handle URL at end of sentence with punctuation", () => {
      render(<LinkifiedText text="Visit https://example.com." />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com.");
    });

    it("should handle multiple whitespace", () => {
      render(<LinkifiedText text="Check   /docs/getting-started   for help" />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("should not linkify invalid paths", () => {
      render(<LinkifiedText text="This is /not-a-valid-path for testing" />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should handle URLs without www", () => {
      render(<LinkifiedText text="Go to https://sub.example.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://sub.example.com");
    });

    it("should handle complex URLs", () => {
      render(<LinkifiedText text="API at https://api.example.com/v1/users?id=123&type=admin" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://api.example.com/v1/users?id=123&type=admin");
    });

    it("should handle URLs with fragments", () => {
      render(<LinkifiedText text="See https://example.com/docs#section-1" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com/docs#section-1");
    });
  });

  describe("Mouse Events", () => {
    it("should handle mouse enter on link", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");

      // Should not throw
      fireEvent.mouseEnter(link);
      expect(link).toBeInTheDocument();
    });

    it("should handle mouse leave on link", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");

      fireEvent.mouseEnter(link);
      fireEvent.mouseLeave(link);
      expect(link).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible link roles", () => {
      render(<LinkifiedText text="Visit https://example.com and /docs/getting-started" />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
    });

    it("should be keyboard focusable", () => {
      render(<LinkifiedText text="Visit https://example.com" />);

      const link = screen.getByRole("link");
      link.focus();

      expect(document.activeElement).toBe(link);
    });

    it("should have descriptive title for screen readers", () => {
      render(<LinkifiedText text="Check out https://github.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("title");
    });

    it("should have noopener noreferrer for external links", () => {
      render(<LinkifiedText text="Visit https://external.com" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Resources Paths", () => {
    it("should linkify /resources base path", () => {
      render(<LinkifiedText text="Browse /resources for all resources" />);

      const link = screen.getByRole("link", { name: "/resources" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /resources/tools path", () => {
      render(<LinkifiedText text="See /resources/tools" />);

      const link = screen.getByRole("link", { name: "/resources/tools" });
      expect(link).toBeInTheDocument();
    });

    it("should linkify /resources/mcp-servers path", () => {
      render(<LinkifiedText text="Check /resources/mcp-servers for MCP" />);

      const link = screen.getByRole("link", { name: /\/resources\/mcp-servers/ });
      expect(link).toBeInTheDocument();
    });
  });

  describe("Multiple Links in Sequence", () => {
    it("should handle many links", () => {
      render(
        <LinkifiedText text="Visit /docs and /resources and /assistant and /changelog" />
      );

      expect(screen.getByRole("link", { name: "/docs" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "/resources" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "/assistant" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "/changelog" })).toBeInTheDocument();
    });

    it("should handle mixed internal and external links", () => {
      render(
        <LinkifiedText text="See /docs/api or https://github.com or /resources" />
      );

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
    });
  });
});
