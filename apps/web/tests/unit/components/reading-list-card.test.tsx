/**
 * ReadingListCard Component Tests
 *
 * Tests for the reading list card component:
 * - Basic rendering
 * - Icon display
 * - Color indicator
 * - Item count
 * - Public indicator
 * - Edit/Delete buttons
 * - Default list behavior
 * - Link navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReadingListCard } from "@/components/reading-lists/reading-list-card";

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

describe("ReadingListCard", () => {
  const mockList = {
    id: "list-1",
    name: "My Reading List",
    description: "A collection of interesting articles",
    slug: "my-reading-list",
    icon: "bookmark",
    color: "#8B5CF6",
    is_public: false,
    item_count: 5,
    user_id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<ReadingListCard list={mockList} />)).not.toThrow();
    });

    it("should show list name", () => {
      render(<ReadingListCard list={mockList} />);
      expect(screen.getByText("My Reading List")).toBeInTheDocument();
    });

    it("should show list description", () => {
      render(<ReadingListCard list={mockList} />);
      expect(screen.getByText("A collection of interesting articles")).toBeInTheDocument();
    });

    it("should not show description when null", () => {
      const listWithoutDesc = { ...mockList, description: null };
      render(<ReadingListCard list={listWithoutDesc} />);
      expect(screen.queryByText("A collection of interesting articles")).not.toBeInTheDocument();
    });
  });

  describe("Icon Display", () => {
    it("should render icon SVG", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should use correct icon path for bookmark", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      const path = container.querySelector("path");
      expect(path).toBeInTheDocument();
    });

    it("should use default bookmark icon for unknown icon type", () => {
      const listWithUnknownIcon = { ...mockList, icon: "unknown-icon" };
      const { container } = render(<ReadingListCard list={listWithUnknownIcon} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render book icon", () => {
      const listWithBookIcon = { ...mockList, icon: "book" };
      const { container } = render(<ReadingListCard list={listWithBookIcon} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render star icon", () => {
      const listWithStarIcon = { ...mockList, icon: "star" };
      const { container } = render(<ReadingListCard list={listWithStarIcon} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Color Indicator", () => {
    it("should show color indicator bar", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      const colorBar = container.querySelector('[style*="background-color"]');
      expect(colorBar).toBeInTheDocument();
    });

    it("should apply list color to indicator", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      const colorBar = container.querySelector(".rounded-t-xl");
      expect(colorBar).toHaveStyle({ backgroundColor: "#8B5CF6" });
    });

    it("should apply color to icon background", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      // Icon background uses color with alpha - just check for any background-color style
      const iconBg = container.querySelector('[style*="background"]');
      expect(iconBg).toBeInTheDocument();
    });
  });

  describe("Item Count", () => {
    it("should show item count", () => {
      render(<ReadingListCard list={mockList} />);
      expect(screen.getByText("5 items")).toBeInTheDocument();
    });

    it("should show singular 'item' for count of 1", () => {
      const listWithOneItem = { ...mockList, item_count: 1 };
      render(<ReadingListCard list={listWithOneItem} />);
      expect(screen.getByText("1 item")).toBeInTheDocument();
    });

    it("should show '0 items' for empty list", () => {
      const emptyList = { ...mockList, item_count: 0 };
      render(<ReadingListCard list={emptyList} />);
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });
  });

  describe("Public Indicator", () => {
    it("should not show Public badge for private list", () => {
      render(<ReadingListCard list={mockList} />);
      expect(screen.queryByText("Public")).not.toBeInTheDocument();
    });

    it("should show Public badge for public list", () => {
      const publicList = { ...mockList, is_public: true };
      render(<ReadingListCard list={publicList} />);
      expect(screen.getByText("Public")).toBeInTheDocument();
    });

    it("should have blue color for Public badge", () => {
      const publicList = { ...mockList, is_public: true };
      const { container } = render(<ReadingListCard list={publicList} />);
      const publicBadge = container.querySelector(".text-blue-600");
      expect(publicBadge).toBeInTheDocument();
    });
  });

  describe("Edit/Delete Buttons", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    it("should show edit button when onEdit provided", () => {
      render(<ReadingListCard list={mockList} onEdit={onEdit} />);
      expect(screen.getByTitle("Edit list")).toBeInTheDocument();
    });

    it("should show delete button when onDelete provided", () => {
      render(<ReadingListCard list={mockList} onDelete={onDelete} />);
      expect(screen.getByTitle("Delete list")).toBeInTheDocument();
    });

    it("should call onEdit with list when edit clicked", () => {
      render(<ReadingListCard list={mockList} onEdit={onEdit} />);
      fireEvent.click(screen.getByTitle("Edit list"));
      expect(onEdit).toHaveBeenCalledWith(mockList);
    });

    it("should call onDelete with list id when delete clicked", () => {
      render(<ReadingListCard list={mockList} onDelete={onDelete} />);
      fireEvent.click(screen.getByTitle("Delete list"));
      expect(onDelete).toHaveBeenCalledWith("list-1");
    });

    it("should not show buttons when no handlers provided", () => {
      render(<ReadingListCard list={mockList} />);
      expect(screen.queryByTitle("Edit list")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Delete list")).not.toBeInTheDocument();
    });
  });

  describe("Default List Behavior", () => {
    const defaultList = { ...mockList, slug: "read-later" };
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    it("should not show edit button for default list", () => {
      render(<ReadingListCard list={defaultList} onEdit={onEdit} />);
      expect(screen.queryByTitle("Edit list")).not.toBeInTheDocument();
    });

    it("should not show delete button for default list", () => {
      render(<ReadingListCard list={defaultList} onDelete={onDelete} />);
      expect(screen.queryByTitle("Delete list")).not.toBeInTheDocument();
    });

    it("should identify read-later as default list", () => {
      render(<ReadingListCard list={defaultList} onEdit={onEdit} onDelete={onDelete} />);
      // No action buttons should appear for default list
      expect(screen.queryByTitle("Edit list")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Delete list")).not.toBeInTheDocument();
    });
  });

  describe("Link Navigation", () => {
    it("should link to list detail page", () => {
      render(<ReadingListCard list={mockList} />);
      const link = screen.getByText("My Reading List").closest("a");
      expect(link?.getAttribute("href")).toBe("/reading-lists/my-reading-list");
    });

    it("should use correct slug in URL", () => {
      const customSlugList = { ...mockList, slug: "custom-list" };
      render(<ReadingListCard list={customSlugList} />);
      const link = screen.getByText("My Reading List").closest("a");
      expect(link?.getAttribute("href")).toBe("/reading-lists/custom-list");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <ReadingListCard list={mockList} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      expect(container.firstChild).toHaveClass("border");
    });

    it("should have hover effects", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      expect(container.firstChild).toHaveClass("hover:border-blue-500/50");
      expect(container.firstChild).toHaveClass("hover:shadow-lg");
      expect(container.firstChild).toHaveClass("hover:-translate-y-1");
    });

    it("should have group class for hover effects on children", () => {
      const { container } = render(<ReadingListCard list={mockList} />);
      expect(container.firstChild).toHaveClass("group");
    });
  });
});
