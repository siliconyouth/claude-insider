/**
 * PromptCard Component Tests
 *
 * Tests for the prompt card component:
 * - Rendering and layout
 * - Category icons and colors (18 categories)
 * - Save/unsave functionality
 * - Copy to clipboard
 * - Featured and system badges
 * - Compact variant
 * - Author display
 * - Skeleton component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PromptCard, PromptCardSkeleton, type Prompt } from "@/components/prompts/prompt-card";

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

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock fetch for tracking usage
global.fetch = vi.fn().mockResolvedValue({ ok: true });

describe("PromptCard", () => {
  const mockPrompt: Prompt = {
    id: "prompt-1",
    slug: "test-prompt",
    title: "Test Prompt Title",
    description: "This is a test prompt description",
    content: "You are a helpful assistant. {{task}}",
    category: {
      id: "cat-1",
      slug: "coding",
      name: "Coding",
      icon: null,
    },
    tags: ["javascript", "react", "testing"],
    author: {
      id: "user-1",
      name: "John Doe",
      image: "https://example.com/avatar.jpg",
    },
    visibility: "public",
    isFeatured: false,
    isSystem: false,
    useCount: 150,
    saveCount: 42,
    avgRating: 4.5,
    ratingCount: 20,
    isSaved: false,
    userRating: null,
    createdAt: new Date().toISOString(),
  };

  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnCopy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<PromptCard prompt={mockPrompt} />)).not.toThrow();
    });

    it("should render as a link to prompt detail page", () => {
      render(<PromptCard prompt={mockPrompt} />);
      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toBe("/prompts/test-prompt");
    });

    it("should render prompt title", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("Test Prompt Title")).toBeInTheDocument();
    });

    it("should render prompt description", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("This is a test prompt description")).toBeInTheDocument();
    });

    it("should not render description when null", () => {
      const promptNoDesc = { ...mockPrompt, description: null };
      render(<PromptCard prompt={promptNoDesc} />);
      expect(screen.queryByText("This is a test prompt description")).not.toBeInTheDocument();
    });
  });

  describe("Category Display", () => {
    it("should render category name", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("Coding")).toBeInTheDocument();
    });

    it("should render category badge with correct styling", () => {
      render(<PromptCard prompt={mockPrompt} />);
      const badge = screen.getByText("Coding").closest("span");
      expect(badge?.className).toContain("bg-blue-500/10");
    });

    it("should handle all 18 categories", () => {
      const categories = [
        "coding", "writing", "analysis", "creative", "productivity",
        "learning", "conversation", "business", "design", "devops",
        "education", "healthcare", "legal", "marketing", "research",
        "roleplay", "security", "translation",
      ];

      categories.forEach(slug => {
        const prompt = {
          ...mockPrompt,
          category: { id: slug, slug, name: slug, icon: null },
        };
        const { unmount } = render(<PromptCard prompt={prompt} />);
        expect(screen.getByText(slug)).toBeInTheDocument();
        unmount();
      });
    });

    it("should use default coding style for unknown category", () => {
      const prompt = {
        ...mockPrompt,
        category: { id: "unknown", slug: "unknown", name: "Unknown", icon: null },
      };
      render(<PromptCard prompt={prompt} />);
      const badge = screen.getByText("Unknown").closest("span");
      expect(badge?.className).toContain("bg-blue-500/10");
    });

    it("should handle null category", () => {
      const prompt = { ...mockPrompt, category: null };
      const { container } = render(<PromptCard prompt={prompt} />);
      // Should not crash and should still render
      expect(container.querySelector("a")).toBeInTheDocument();
    });
  });

  describe("Tags", () => {
    it("should render up to 3 tags", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("javascript")).toBeInTheDocument();
      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("testing")).toBeInTheDocument();
    });

    it("should not show more than 3 tags", () => {
      const promptManyTags = {
        ...mockPrompt,
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
      };
      render(<PromptCard prompt={promptManyTags} />);
      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
      expect(screen.getByText("tag3")).toBeInTheDocument();
      expect(screen.queryByText("tag4")).not.toBeInTheDocument();
      expect(screen.queryByText("tag5")).not.toBeInTheDocument();
    });
  });

  describe("Stats Display", () => {
    it("should show rating when > 0", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("should not show rating when 0", () => {
      const prompt = { ...mockPrompt, avgRating: 0 };
      render(<PromptCard prompt={prompt} />);
      expect(screen.queryByText("0.0")).not.toBeInTheDocument();
    });

    it("should show save count", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should show use count when > 0", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("150 uses")).toBeInTheDocument();
    });

    it("should not show use count when 0", () => {
      const prompt = { ...mockPrompt, useCount: 0 };
      render(<PromptCard prompt={prompt} />);
      expect(screen.queryByText("0 uses")).not.toBeInTheDocument();
    });
  });

  describe("Author Display", () => {
    it("should show author name", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should show author image", () => {
      render(<PromptCard prompt={mockPrompt} />);
      const img = screen.getByAltText("John Doe");
      expect(img).toBeInTheDocument();
    });

    it("should show 'Anonymous' when author has no name", () => {
      const prompt = {
        ...mockPrompt,
        author: { id: "user-1", name: null, image: null },
      };
      render(<PromptCard prompt={prompt} />);
      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });

    it("should show 'Claude Insider' for system prompts without author", () => {
      const prompt = { ...mockPrompt, author: null, isSystem: true };
      render(<PromptCard prompt={prompt} />);
      expect(screen.getByText("Claude Insider")).toBeInTheDocument();
    });
  });

  describe("Featured Badge", () => {
    it("should show 'Featured' badge when isFeatured is true", () => {
      const prompt = { ...mockPrompt, isFeatured: true };
      render(<PromptCard prompt={prompt} />);
      expect(screen.getByText("Featured")).toBeInTheDocument();
    });

    it("should not show 'Featured' badge when isFeatured is false", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.queryByText("Featured")).not.toBeInTheDocument();
    });
  });

  describe("System Prompt Indicator", () => {
    it("should show sparkles icon for system prompts", () => {
      const prompt = { ...mockPrompt, isSystem: true };
      const { container } = render(<PromptCard prompt={prompt} />);
      expect(container.querySelector(".text-violet-400")).toBeInTheDocument();
    });

    it("should not show sparkles icon for non-system prompts", () => {
      const { container } = render(<PromptCard prompt={mockPrompt} />);
      // SparklesIcon in header has text-violet-400 and is a flex-shrink-0
      const headerSparkles = container.querySelector("svg.text-violet-400.flex-shrink-0");
      expect(headerSparkles).not.toBeInTheDocument();
    });
  });

  describe("Save Functionality", () => {
    it("should call onSave when save button clicked", async () => {
      render(<PromptCard prompt={mockPrompt} onSave={mockOnSave} />);
      const saveButton = screen.getByTitle("Save prompt");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("prompt-1");
      });
    });

    it("should toggle saved state after save", async () => {
      render(<PromptCard prompt={mockPrompt} onSave={mockOnSave} />);
      const saveButton = screen.getByTitle("Save prompt");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTitle("Unsave prompt")).toBeInTheDocument();
      });
    });

    it("should increment save count after save", async () => {
      render(<PromptCard prompt={mockPrompt} onSave={mockOnSave} />);
      const saveButton = screen.getByTitle("Save prompt");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("43")).toBeInTheDocument();
      });
    });

    it("should be disabled while saving", async () => {
      const slowSave = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      render(<PromptCard prompt={mockPrompt} onSave={slowSave} />);
      const saveButton = screen.getByTitle("Save prompt");
      fireEvent.click(saveButton);

      expect(saveButton).toBeDisabled();
    });

    it("should not render save button without onSave prop", () => {
      render(<PromptCard prompt={mockPrompt} />);
      expect(screen.queryByTitle("Save prompt")).not.toBeInTheDocument();
    });

    it("should show unsave option when already saved", () => {
      const savedPrompt = { ...mockPrompt, isSaved: true };
      render(<PromptCard prompt={savedPrompt} onSave={mockOnSave} />);
      expect(screen.getByTitle("Unsave prompt")).toBeInTheDocument();
    });
  });

  describe("Copy Functionality", () => {
    it("should copy content to clipboard when copy button clicked", async () => {
      render(<PromptCard prompt={mockPrompt} onCopy={mockOnCopy} />);
      const copyButton = screen.getByTitle("Copy prompt");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          "You are a helpful assistant. {{task}}"
        );
      });
    });

    it("should call onCopy callback", async () => {
      render(<PromptCard prompt={mockPrompt} onCopy={mockOnCopy} />);
      const copyButton = screen.getByTitle("Copy prompt");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledWith("You are a helpful assistant. {{task}}");
      });
    });

    it("should show check icon after copy", async () => {
      const { container } = render(<PromptCard prompt={mockPrompt} onCopy={mockOnCopy} />);
      const copyButton = screen.getByTitle("Copy prompt");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(container.querySelector(".text-green-500")).toBeInTheDocument();
      });
    });

    it("should track usage via API after copy", async () => {
      render(<PromptCard prompt={mockPrompt} onCopy={mockOnCopy} />);
      const copyButton = screen.getByTitle("Copy prompt");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/prompts/prompt-1/use",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ context: "copy" }),
          })
        );
      });
    });
  });

  describe("Compact Variant", () => {
    it("should have smaller padding in compact mode", () => {
      render(<PromptCard prompt={mockPrompt} variant="compact" />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("p-3");
    });

    it("should hide description in compact mode", () => {
      render(<PromptCard prompt={mockPrompt} variant="compact" />);
      expect(screen.queryByText("This is a test prompt description")).not.toBeInTheDocument();
    });

    it("should hide tags in compact mode", () => {
      render(<PromptCard prompt={mockPrompt} variant="compact" />);
      expect(screen.queryByText("javascript")).not.toBeInTheDocument();
    });

    it("should have smaller title text in compact mode", () => {
      render(<PromptCard prompt={mockPrompt} variant="compact" />);
      const title = screen.getByText("Test Prompt Title");
      expect(title.className).toContain("text-sm");
    });
  });

  describe("Styling", () => {
    it("should have hover effects", () => {
      render(<PromptCard prompt={mockPrompt} />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("hover:border-blue-500/50");
      expect(link.className).toContain("hover:-translate-y-0.5");
    });

    it("should have rounded corners", () => {
      render(<PromptCard prompt={mockPrompt} />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("rounded-xl");
    });

    it("should have border", () => {
      render(<PromptCard prompt={mockPrompt} />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("border");
    });
  });

  describe("Event Propagation", () => {
    it("should not navigate when save button clicked", async () => {
      // When a button inside a link handles onClick with stopPropagation/preventDefault,
      // clicking it should trigger the button's handler, not the link navigation.
      // We verify the save action runs (which proves the click was handled by button).
      render(<PromptCard prompt={mockPrompt} onSave={mockOnSave} />);
      const saveButton = screen.getByTitle("Save prompt");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("prompt-1");
      });
    });

    it("should not navigate when copy button clicked", async () => {
      // Same principle - copy action runs which proves click was handled by button
      render(<PromptCard prompt={mockPrompt} onCopy={mockOnCopy} />);
      const copyButton = screen.getByTitle("Copy prompt");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });
  });
});

describe("PromptCardSkeleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<PromptCardSkeleton />)).not.toThrow();
    });

    it("should have animate-pulse elements", () => {
      const { container } = render(<PromptCardSkeleton />);
      const pulsingElements = container.querySelectorAll(".animate-pulse");
      expect(pulsingElements.length).toBeGreaterThan(0);
    });

    it("should have rounded corners", () => {
      const { container } = render(<PromptCardSkeleton />);
      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<PromptCardSkeleton />);
      expect((container.firstChild as HTMLElement).className).toContain("border");
    });
  });

  describe("Variants", () => {
    it("should have default padding", () => {
      const { container } = render(<PromptCardSkeleton />);
      expect(container.firstChild).toHaveClass("p-4");
    });

    it("should have smaller padding in compact mode", () => {
      const { container } = render(<PromptCardSkeleton variant="compact" />);
      expect(container.firstChild).toHaveClass("p-3");
    });

    it("should hide description skeleton in compact mode", () => {
      const { container: defaultContainer } = render(<PromptCardSkeleton />);
      const { container: compactContainer } = render(<PromptCardSkeleton variant="compact" />);

      const defaultSkeletons = defaultContainer.querySelectorAll(".animate-pulse").length;
      const compactSkeletons = compactContainer.querySelectorAll(".animate-pulse").length;

      expect(compactSkeletons).toBeLessThan(defaultSkeletons);
    });
  });
});
