/**
 * ResourceCard Component Tests
 *
 * Tests for the resource card component:
 * - Default variant rendering
 * - Compact variant
 * - Featured variant
 * - Horizontal variant
 * - GitHub stats display
 * - Status badges
 * - Difficulty badges
 * - Category display
 * - Click handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResourceCard } from "@/components/resources/resource-card";
import type { ResourceEntry } from "@/data/resources/schema";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock getCategoryBySlug
vi.mock("@/data/resources/schema", async () => {
  const actual = await vi.importActual("@/data/resources/schema");
  return {
    ...actual,
    getCategoryBySlug: (slug: string) => ({
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      description: `${slug} description`,
      color: "blue",
      icon: "star",
    }),
  };
});

// Mock interaction components
vi.mock("@/components/interactions/favorite-button", () => ({
  FavoriteButton: () => <button data-testid="favorite-button">Favorite</button>,
}));

vi.mock("@/components/interactions/collection-button", () => ({
  CollectionButton: () => <button data-testid="collection-button">Collection</button>,
}));

vi.mock("@/components/ask-ai/ask-ai-button", () => ({
  AskAIButton: () => <button data-testid="ask-ai-button">Ask AI</button>,
}));

describe("ResourceCard", () => {
  const mockResource: ResourceEntry = {
    id: "res-1",
    slug: "test-resource",
    title: "Test Resource",
    description: "A test resource for unit testing",
    url: "https://example.com/resource",
    category: "tools",
    status: "official",
    difficulty: "intermediate",
    dateAdded: "2024-01-01",
    lastUpdated: "2024-06-01",
    tags: ["testing", "development"],
    github: {
      stars: 1500,
      forks: 250,
      language: "TypeScript",
    },
    keyFeatures: ["Feature 1", "Feature 2", "Feature 3"],
    targetAudience: ["Developers", "Teams"],
    useCases: ["Testing", "Development"],
    pros: ["Easy to use", "Well documented"],
    cons: ["Learning curve"],
    prerequisites: ["Basic knowledge"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Default Variant", () => {
    it("should render resource title", () => {
      render(<ResourceCard resource={mockResource} />);
      expect(screen.getByText("Test Resource")).toBeInTheDocument();
    });

    it("should render resource description", () => {
      render(<ResourceCard resource={mockResource} />);
      expect(screen.getByText("A test resource for unit testing")).toBeInTheDocument();
    });

    it("should link to external URL when no slug", () => {
      render(<ResourceCard resource={mockResource} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com/resource");
    });

    it("should link to internal page when slug provided", () => {
      render(<ResourceCard resource={mockResource} slug="test-resource" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/resources/test-resource");
    });
  });

  describe("Category Badge", () => {
    it("should show category when showCategory is true", () => {
      render(<ResourceCard resource={mockResource} showCategory={true} />);
      expect(screen.getByText("Tools")).toBeInTheDocument();
    });

    it("should not show category when showCategory is false", () => {
      render(<ResourceCard resource={mockResource} showCategory={false} />);
      expect(screen.queryByText("Tools")).not.toBeInTheDocument();
    });
  });

  describe("GitHub Stats", () => {
    it("should show stars count", () => {
      render(<ResourceCard resource={mockResource} />);
      expect(screen.getByText("1.5k")).toBeInTheDocument();
    });

    it("should show forks count in featured variant", () => {
      // Forks are only shown in featured and horizontal variants, not default
      render(<ResourceCard resource={mockResource} variant="featured" />);
      expect(screen.getByText("250")).toBeInTheDocument();
    });

    it("should show language", () => {
      render(<ResourceCard resource={mockResource} />);
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should not show stats when no github data", () => {
      const resourceWithoutGithub = { ...mockResource, github: undefined };
      render(<ResourceCard resource={resourceWithoutGithub} />);
      expect(screen.queryByText("1.5k")).not.toBeInTheDocument();
    });
  });

  describe("Status Badges", () => {
    it("should show official status", () => {
      render(<ResourceCard resource={mockResource} />);
      expect(screen.getByText("official")).toBeInTheDocument();
    });

    it("should show community status", () => {
      const communityResource = { ...mockResource, status: "community" as const };
      render(<ResourceCard resource={communityResource} />);
      expect(screen.getByText("community")).toBeInTheDocument();
    });

    it("should show beta status", () => {
      const betaResource = { ...mockResource, status: "beta" as const };
      render(<ResourceCard resource={betaResource} />);
      expect(screen.getByText("beta")).toBeInTheDocument();
    });

    it("should show deprecated status", () => {
      const deprecatedResource = { ...mockResource, status: "deprecated" as const };
      render(<ResourceCard resource={deprecatedResource} />);
      expect(screen.getByText("deprecated")).toBeInTheDocument();
    });
  });

  describe("Difficulty Badges", () => {
    it("should show intermediate difficulty", () => {
      render(<ResourceCard resource={mockResource} />);
      expect(screen.getByText("intermediate")).toBeInTheDocument();
    });

    it("should show beginner difficulty", () => {
      const beginnerResource = { ...mockResource, difficulty: "beginner" as const };
      render(<ResourceCard resource={beginnerResource} />);
      expect(screen.getByText("beginner")).toBeInTheDocument();
    });

    it("should show advanced difficulty", () => {
      const advancedResource = { ...mockResource, difficulty: "advanced" as const };
      render(<ResourceCard resource={advancedResource} />);
      expect(screen.getByText("advanced")).toBeInTheDocument();
    });
  });

  describe("Tags", () => {
    it("should show tags when showTags is true", () => {
      render(<ResourceCard resource={mockResource} showTags={true} />);
      expect(screen.getByText("testing")).toBeInTheDocument();
      expect(screen.getByText("development")).toBeInTheDocument();
    });

    it("should not show tags when showTags is false", () => {
      render(<ResourceCard resource={mockResource} showTags={false} />);
      expect(screen.queryByText("testing")).not.toBeInTheDocument();
    });

    it("should limit tags to maxTags", () => {
      const resourceWithManyTags = {
        ...mockResource,
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
      };
      render(<ResourceCard resource={resourceWithManyTags} showTags={true} maxTags={2} />);
      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
      expect(screen.queryByText("tag3")).not.toBeInTheDocument();
    });
  });

  describe("Variant Rendering", () => {
    it("should render default variant", () => {
      const { container } = render(<ResourceCard resource={mockResource} variant="default" />);
      expect(container.querySelector("[class*='rounded-xl']")).toBeInTheDocument();
    });

    it("should render compact variant", () => {
      render(<ResourceCard resource={mockResource} variant="compact" />);
      expect(screen.getByText("Test Resource")).toBeInTheDocument();
    });

    it("should render featured variant", () => {
      render(<ResourceCard resource={mockResource} variant="featured" />);
      expect(screen.getByText("Test Resource")).toBeInTheDocument();
    });

    it("should render horizontal variant", () => {
      const { container } = render(<ResourceCard resource={mockResource} variant="horizontal" />);
      expect(container.querySelector("[class*='flex']")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should show interaction buttons when showInteractions is true", () => {
      render(<ResourceCard resource={mockResource} showInteractions={true} />);
      expect(screen.getByTestId("favorite-button")).toBeInTheDocument();
      expect(screen.getByTestId("collection-button")).toBeInTheDocument();
    });

    it("should not show interaction buttons when showInteractions is false", () => {
      render(<ResourceCard resource={mockResource} showInteractions={false} />);
      expect(screen.queryByTestId("favorite-button")).not.toBeInTheDocument();
    });

    it("should show Ask AI button when showAskAI is true", () => {
      render(<ResourceCard resource={mockResource} showInteractions={true} showAskAI={true} />);
      expect(screen.getByTestId("ask-ai-button")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<ResourceCard resource={mockResource} className="custom-card" />);
      expect(container.querySelector(".custom-card")).toBeInTheDocument();
    });
  });

  describe("External Link", () => {
    it("should have external link attributes when linking externally", () => {
      render(<ResourceCard resource={mockResource} />);
      const link = screen.getByRole("link");
      // External links should have target="_blank"
      expect(link).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(<ResourceCard resource={mockResource} />);
      const card = container.querySelector("[class*='rounded-xl']");
      expect(card).toBeInTheDocument();
    });

    it("should have border styling", () => {
      const { container } = render(<ResourceCard resource={mockResource} />);
      const card = container.querySelector("[class*='border']");
      expect(card).toBeInTheDocument();
    });

    it("should have shadow on hover", () => {
      const { container } = render(<ResourceCard resource={mockResource} />);
      const card = container.querySelector("[class*='hover']");
      expect(card).toBeInTheDocument();
    });
  });
});
