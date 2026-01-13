/**
 * ContentMeta Component Tests
 *
 * Tests for the content metadata component showing sources and generation info.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentMeta } from "@/components/content-meta";

// Mock the build-info.json import
vi.mock("@/data/build-info.json", () => ({
  default: {
    version: "1.21.0",
  },
}));

describe("ContentMeta", () => {
  const mockSources = [
    { title: "Official Claude Docs", url: "https://docs.anthropic.com" },
    { title: "API Reference", url: "https://api.anthropic.com/docs" },
  ];

  const defaultProps = {
    sources: mockSources,
    generatedDate: "2024-06-15",
  };

  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Rendering", () => {
    it("should render sources section", () => {
      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText("Sources")).toBeInTheDocument();
    });

    it("should render all source links", () => {
      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText("Official Claude Docs")).toBeInTheDocument();
      expect(screen.getByText("API Reference")).toBeInTheDocument();
    });

    it("should render generation info section", () => {
      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText("Generated with AI")).toBeInTheDocument();
    });

    it("should render Claude AI link", () => {
      render(<ContentMeta {...defaultProps} />);

      const claudeLink = screen.getByRole("link", { name: "Claude AI" });
      expect(claudeLink).toHaveAttribute("href", "https://claude.ai");
    });

    it("should render Anthropic link", () => {
      render(<ContentMeta {...defaultProps} />);

      const anthropicLink = screen.getByRole("link", { name: "Anthropic" });
      expect(anthropicLink).toHaveAttribute("href", "https://anthropic.com");
    });
  });

  describe("Sources Links", () => {
    it("should have correct href for each source", () => {
      render(<ContentMeta {...defaultProps} />);

      const links = screen.getAllByRole("link");
      const sourceLinks = links.filter(
        (link) =>
          link.getAttribute("href") === "https://docs.anthropic.com" ||
          link.getAttribute("href") === "https://api.anthropic.com/docs"
      );

      expect(sourceLinks).toHaveLength(2);
    });

    it("should open sources in new tab", () => {
      render(<ContentMeta {...defaultProps} />);

      const docsLink = screen.getByRole("link", { name: /Official Claude Docs/i });
      expect(docsLink).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer for security", () => {
      render(<ContentMeta {...defaultProps} />);

      const docsLink = screen.getByRole("link", { name: /Official Claude Docs/i });
      expect(docsLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should render external link icon for each source", () => {
      render(<ContentMeta {...defaultProps} />);

      // Each source link should have an SVG icon
      const sourceLinks = screen.getAllByRole("link").filter(
        (link) =>
          link.textContent?.includes("Official Claude Docs") ||
          link.textContent?.includes("API Reference")
      );

      sourceLinks.forEach((link) => {
        const svg = link.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("Model Prop", () => {
    it("should default to 'Claude Opus 4.5'", () => {
      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText(/Model: Claude Opus 4\.5/)).toBeInTheDocument();
    });

    it("should accept custom model name", () => {
      render(<ContentMeta {...defaultProps} model="Claude Sonnet 4" />);

      expect(screen.getByText(/Model: Claude Sonnet 4/)).toBeInTheDocument();
    });

    it("should display model in generation info", () => {
      render(<ContentMeta {...defaultProps} model="Claude Haiku 3.5" />);

      expect(screen.getByText(/Model: Claude Haiku 3\.5/)).toBeInTheDocument();
    });
  });

  describe("Generated Date", () => {
    it("should display the generation date", () => {
      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText(/Generated: 2024-06-15/)).toBeInTheDocument();
    });

    it("should display different date formats", () => {
      render(<ContentMeta {...defaultProps} generatedDate="January 15, 2025" />);

      expect(screen.getByText(/Generated: January 15, 2025/)).toBeInTheDocument();
    });
  });

  describe("Build Version", () => {
    it("should display app version from build-info.json", () => {
      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText(/Build: v1\.21\.0/)).toBeInTheDocument();
    });

    it("should display 'dev' buildId when env variable is not set", () => {
      delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText(/Build: v1\.21\.0-dev/)).toBeInTheDocument();
    });

    it("should display truncated commit SHA when available", () => {
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "abc1234567890";

      render(<ContentMeta {...defaultProps} />);

      expect(screen.getByText(/Build: v1\.21\.0-abc1234/)).toBeInTheDocument();
    });

    it("should truncate SHA to 7 characters", () => {
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "1234567890abcdef";

      render(<ContentMeta {...defaultProps} />);

      // Should show first 7 chars only
      expect(screen.getByText(/Build: v1\.21\.0-1234567/)).toBeInTheDocument();
      expect(screen.queryByText(/890abcdef/)).not.toBeInTheDocument();
    });
  });

  describe("External Links Security", () => {
    it("should have target _blank on Claude AI link", () => {
      render(<ContentMeta {...defaultProps} />);

      const link = screen.getByRole("link", { name: "Claude AI" });
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer on Claude AI link", () => {
      render(<ContentMeta {...defaultProps} />);

      const link = screen.getByRole("link", { name: "Claude AI" });
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should have target _blank on Anthropic link", () => {
      render(<ContentMeta {...defaultProps} />);

      const link = screen.getByRole("link", { name: "Anthropic" });
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer on Anthropic link", () => {
      render(<ContentMeta {...defaultProps} />);

      const link = screen.getByRole("link", { name: "Anthropic" });
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Styling", () => {
    it("should have top border separator", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("border-t");
    });

    it("should have top margin and padding", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("mt-16");
      expect(wrapper).toHaveClass("pt-8");
    });

    it("should have gradient background on AI icon", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const iconContainer = container.querySelector(".bg-gradient-to-br");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("from-violet-600");
      expect(iconContainer).toHaveClass("to-blue-600");
    });

    it("should have rounded info box", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const infoBox = container.querySelector(".rounded-lg");
      expect(infoBox).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on decorative icons", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("should render sources as a list", () => {
      render(<ContentMeta {...defaultProps} />);

      const list = document.querySelector("ul");
      expect(list).toBeInTheDocument();

      const listItems = document.querySelectorAll("li");
      expect(listItems).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty sources array", () => {
      render(<ContentMeta sources={[]} generatedDate="2024-01-01" />);

      expect(screen.getByText("Sources")).toBeInTheDocument();
      const list = document.querySelector("ul");
      expect(list?.children).toHaveLength(0);
    });

    it("should handle single source", () => {
      render(
        <ContentMeta
          sources={[{ title: "Single Source", url: "https://example.com" }]}
          generatedDate="2024-01-01"
        />
      );

      expect(screen.getByText("Single Source")).toBeInTheDocument();
      const listItems = document.querySelectorAll("li");
      expect(listItems).toHaveLength(1);
    });

    it("should handle many sources", () => {
      const manySources = Array.from({ length: 10 }, (_, i) => ({
        title: `Source ${i + 1}`,
        url: `https://example.com/${i}`,
      }));

      render(<ContentMeta sources={manySources} generatedDate="2024-01-01" />);

      const listItems = document.querySelectorAll("li");
      expect(listItems).toHaveLength(10);
    });

    it("should handle special characters in source title", () => {
      render(
        <ContentMeta
          sources={[
            { title: "What's New in Claude 4.5?", url: "https://example.com" },
          ]}
          generatedDate="2024-01-01"
        />
      );

      expect(screen.getByText("What's New in Claude 4.5?")).toBeInTheDocument();
    });

    it("should handle URLs with query parameters", () => {
      render(
        <ContentMeta
          sources={[
            { title: "Docs", url: "https://example.com/docs?version=4.5&lang=en" },
          ]}
          generatedDate="2024-01-01"
        />
      );

      const link = screen.getByRole("link", { name: /Docs/i });
      expect(link).toHaveAttribute(
        "href",
        "https://example.com/docs?version=4.5&lang=en"
      );
    });
  });

  describe("SVG Icons", () => {
    it("should have link icon in sources header", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const header = screen.getByText("Sources").closest("h4");
      const svg = header?.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("w-4", "h-4");
    });

    it("should have computer icon in generation info", () => {
      const { container } = render(<ContentMeta {...defaultProps} />);

      const gradientCircle = container.querySelector(".bg-gradient-to-br");
      const svg = gradientCircle?.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-white");
    });
  });
});
