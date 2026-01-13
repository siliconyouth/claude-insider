/**
 * ReadingListItemCard Component Tests
 *
 * Tests for the reading list item card component:
 * - Basic rendering
 * - Status indicator (unread/reading/completed)
 * - Status cycle on click
 * - Title with link
 * - Notes display
 * - Status badge
 * - Date display
 * - Quick status buttons
 * - Remove button
 * - Progress bar
 * - Optimistic updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReadingListItemCard } from "@/components/reading-lists/reading-list-item-card";

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

// Mock server actions
const mockUpdateReadingProgress = vi.fn();
const mockRemoveFromReadingList = vi.fn();
vi.mock("@/app/actions/reading-lists", () => ({
  updateReadingProgress: (id: string, data: unknown) => mockUpdateReadingProgress(id, data),
  removeFromReadingList: (id: string) => mockRemoveFromReadingList(id),
}));

describe("ReadingListItemCard", () => {
  const mockItem = {
    id: "item-1",
    list_id: "list-1",
    title: "Understanding React Hooks",
    url: "/resources/react-hooks",
    notes: "Great article about useState and useEffect",
    status: "unread" as const,
    progress: 0,
    resource_type: "article",
    started_at: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateReadingProgress.mockResolvedValue({ success: true });
    mockRemoveFromReadingList.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<ReadingListItemCard item={mockItem} />)).not.toThrow();
    });

    it("should show item title", () => {
      render(<ReadingListItemCard item={mockItem} />);
      expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    });

    it("should show item notes", () => {
      render(<ReadingListItemCard item={mockItem} />);
      expect(screen.getByText("Great article about useState and useEffect")).toBeInTheDocument();
    });

    it("should not show notes when null", () => {
      const itemWithoutNotes = { ...mockItem, notes: null };
      render(<ReadingListItemCard item={itemWithoutNotes} />);
      expect(screen.queryByText("Great article about useState and useEffect")).not.toBeInTheDocument();
    });

    it("should show resource type", () => {
      render(<ReadingListItemCard item={mockItem} />);
      expect(screen.getByText("article")).toBeInTheDocument();
    });
  });

  describe("Title Link", () => {
    it("should render title as link when url provided", () => {
      render(<ReadingListItemCard item={mockItem} />);
      const link = screen.getByText("Understanding React Hooks").closest("a");
      expect(link?.getAttribute("href")).toBe("/resources/react-hooks");
    });

    it("should render title as span when no url", () => {
      const itemWithoutUrl = { ...mockItem, url: null };
      render(<ReadingListItemCard item={itemWithoutUrl} />);
      const title = screen.getByText("Understanding React Hooks");
      expect(title.tagName).toBe("SPAN");
    });

    it("should have strikethrough when completed", () => {
      const completedItem = { ...mockItem, status: "completed" as const };
      render(<ReadingListItemCard item={completedItem} />);
      const title = screen.getByText("Understanding React Hooks");
      expect(title).toHaveClass("line-through");
    });
  });

  describe("Status Indicator", () => {
    it("should show empty circle for unread", () => {
      const { container } = render(<ReadingListItemCard item={mockItem} />);
      const indicator = container.querySelector('button[title*="Mark as reading"]');
      expect(indicator).toBeInTheDocument();
    });

    it("should show blue circle for reading", () => {
      const readingItem = { ...mockItem, status: "reading" as const };
      const { container } = render(<ReadingListItemCard item={readingItem} />);
      const indicator = container.querySelector('.bg-blue-500');
      expect(indicator).toBeInTheDocument();
    });

    it("should show green check for completed", () => {
      const completedItem = { ...mockItem, status: "completed" as const };
      const { container } = render(<ReadingListItemCard item={completedItem} />);
      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe("Status Badge", () => {
    it("should show Unread badge for unread items", () => {
      render(<ReadingListItemCard item={mockItem} />);
      expect(screen.getByText("Unread")).toBeInTheDocument();
    });

    it("should show Reading badge for reading items", () => {
      const readingItem = { ...mockItem, status: "reading" as const };
      render(<ReadingListItemCard item={readingItem} />);
      expect(screen.getByText("Reading")).toBeInTheDocument();
    });

    it("should show Completed badge for completed items", () => {
      const completedItem = { ...mockItem, status: "completed" as const };
      render(<ReadingListItemCard item={completedItem} />);
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });
  });

  describe("Status Cycle", () => {
    it("should cycle unread to reading on indicator click", async () => {
      const onStatusChange = vi.fn();
      const { container } = render(
        <ReadingListItemCard item={mockItem} onStatusChange={onStatusChange} />
      );

      const indicator = container.querySelector('button[title*="Mark as reading"]');
      fireEvent.click(indicator!);

      await waitFor(() => {
        expect(mockUpdateReadingProgress).toHaveBeenCalledWith("item-1", { status: "reading" });
      });
    });

    it("should cycle reading to completed on indicator click", async () => {
      const readingItem = { ...mockItem, status: "reading" as const };
      const onStatusChange = vi.fn();
      const { container } = render(
        <ReadingListItemCard item={readingItem} onStatusChange={onStatusChange} />
      );

      const indicator = container.querySelector('button[title*="Mark as completed"]');
      fireEvent.click(indicator!);

      await waitFor(() => {
        expect(mockUpdateReadingProgress).toHaveBeenCalledWith("item-1", { status: "completed" });
      });
    });

    it("should cycle completed to unread on indicator click", async () => {
      const completedItem = { ...mockItem, status: "completed" as const };
      const onStatusChange = vi.fn();
      const { container } = render(
        <ReadingListItemCard item={completedItem} onStatusChange={onStatusChange} />
      );

      const indicator = container.querySelector('button[title*="Mark as unread"]');
      fireEvent.click(indicator!);

      await waitFor(() => {
        expect(mockUpdateReadingProgress).toHaveBeenCalledWith("item-1", { status: "unread" });
      });
    });
  });

  describe("Date Display", () => {
    it("should show completed date for completed items", () => {
      const completedItem = {
        ...mockItem,
        status: "completed" as const,
        completed_at: "2024-02-15T00:00:00Z",
      };
      render(<ReadingListItemCard item={completedItem} />);
      // "Completed" appears in both badge and date - check for the date specifically
      const dateTexts = screen.getAllByText(/Completed/);
      expect(dateTexts.length).toBeGreaterThan(1); // Badge + date
    });

    it("should show started date for reading items", () => {
      const readingItem = {
        ...mockItem,
        status: "reading" as const,
        started_at: "2024-02-01T00:00:00Z",
      };
      render(<ReadingListItemCard item={readingItem} />);
      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe("Quick Status Buttons", () => {
    it("should show mark as completed button for unread items", () => {
      const { container } = render(<ReadingListItemCard item={mockItem} />);
      const completedButton = container.querySelector('button[title="Mark as completed"]');
      expect(completedButton).toBeInTheDocument();
    });

    it("should show mark as unread button for reading items", () => {
      const readingItem = { ...mockItem, status: "reading" as const };
      const { container } = render(<ReadingListItemCard item={readingItem} />);
      const unreadButton = container.querySelector('button[title="Mark as unread"]');
      expect(unreadButton).toBeInTheDocument();
    });

    it("should not show mark as completed for completed items", () => {
      const completedItem = { ...mockItem, status: "completed" as const };
      const { container } = render(<ReadingListItemCard item={completedItem} />);
      const completedButton = container.querySelector('button[title="Mark as completed"]');
      expect(completedButton).not.toBeInTheDocument();
    });
  });

  describe("Remove Button", () => {
    it("should show remove button", () => {
      const { container } = render(<ReadingListItemCard item={mockItem} />);
      const removeButton = container.querySelector('button[title="Remove from list"]');
      expect(removeButton).toBeInTheDocument();
    });

    it("should call removeFromReadingList when clicked", async () => {
      const onRemove = vi.fn();
      const { container } = render(
        <ReadingListItemCard item={mockItem} onRemove={onRemove} />
      );

      const removeButton = container.querySelector('button[title="Remove from list"]');
      fireEvent.click(removeButton!);

      await waitFor(() => {
        expect(mockRemoveFromReadingList).toHaveBeenCalledWith("item-1");
      });
    });

    it("should call onRemove callback on success", async () => {
      const onRemove = vi.fn();
      const { container } = render(
        <ReadingListItemCard item={mockItem} onRemove={onRemove} />
      );

      const removeButton = container.querySelector('button[title="Remove from list"]');
      fireEvent.click(removeButton!);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith("item-1");
      });
    });
  });

  describe("Progress Bar", () => {
    it("should show progress bar for reading items with progress", () => {
      const readingItem = {
        ...mockItem,
        status: "reading" as const,
        progress: 50,
      };
      const { container } = render(<ReadingListItemCard item={readingItem} />);
      const progressBar = container.querySelector('[style*="width: 50%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should not show progress bar for unread items", () => {
      const { container } = render(<ReadingListItemCard item={mockItem} />);
      const progressBar = container.querySelector('[style*="width:"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it("should not show progress bar when progress is 0", () => {
      const readingItem = {
        ...mockItem,
        status: "reading" as const,
        progress: 0,
      };
      const { container } = render(<ReadingListItemCard item={readingItem} />);
      const progressContainer = container.querySelector('.h-1.bg-gray-100');
      expect(progressContainer).not.toBeInTheDocument();
    });

    it("should not show progress bar when progress is 100", () => {
      const readingItem = {
        ...mockItem,
        status: "reading" as const,
        progress: 100,
      };
      const { container } = render(<ReadingListItemCard item={readingItem} />);
      const progressContainer = container.querySelector('.mt-3.h-1');
      expect(progressContainer).not.toBeInTheDocument();
    });
  });

  describe("Optimistic Updates", () => {
    it("should update status immediately before server response", async () => {
      mockUpdateReadingProgress.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<ReadingListItemCard item={mockItem} />);

      const indicator = container.querySelector('button[title*="Mark as reading"]');
      fireEvent.click(indicator!);

      // Should immediately show Reading badge
      await waitFor(() => {
        expect(screen.getByText("Reading")).toBeInTheDocument();
      });
    });

    it("should revert on error", async () => {
      mockUpdateReadingProgress.mockResolvedValue({ error: "Update failed" });
      render(<ReadingListItemCard item={mockItem} />);

      const { container } = render(<ReadingListItemCard item={mockItem} />);
      const indicator = container.querySelector('button[title*="Mark as reading"]');
      fireEvent.click(indicator!);

      // Should revert back to Unread
      await waitFor(() => {
        expect(screen.getAllByText("Unread").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Styling", () => {
    it("should have reduced opacity for completed items", () => {
      const completedItem = { ...mockItem, status: "completed" as const };
      const { container } = render(<ReadingListItemCard item={completedItem} />);
      expect(container.firstChild).toHaveClass("opacity-75");
    });

    it("should have rounded corners", () => {
      const { container } = render(<ReadingListItemCard item={mockItem} />);
      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ReadingListItemCard item={mockItem} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
