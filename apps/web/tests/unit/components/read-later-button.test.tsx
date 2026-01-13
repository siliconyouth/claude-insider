/**
 * ReadLaterButton Component Tests
 *
 * Tests for the read later button:
 * - Initial rendering
 * - Size variants
 * - Label visibility
 * - Add/remove from list
 * - Loading state
 * - Animation state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReadLaterButton } from "@/components/reading-lists/read-later-button";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock reading list actions
const mockQuickAddToReadLater = vi.fn();
const mockRemoveFromReadingList = vi.fn();
const mockIsInReadingList = vi.fn();

vi.mock("@/app/actions/reading-lists", () => ({
  quickAddToReadLater: (...args: unknown[]) => mockQuickAddToReadLater(...args),
  removeFromReadingList: (...args: unknown[]) => mockRemoveFromReadingList(...args),
  isInReadingList: (...args: unknown[]) => mockIsInReadingList(...args),
}));

describe("ReadLaterButton", () => {
  const defaultProps = {
    resourceType: "resource",
    resourceId: "123",
    title: "Test Resource",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsInReadingList.mockResolvedValue({ inList: false });
    mockQuickAddToReadLater.mockResolvedValue({ item: { id: "item-1" } });
    mockRemoveFromReadingList.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<ReadLaterButton {...defaultProps} />)).not.toThrow();
    });

    it("should render a button element", () => {
      render(<ReadLaterButton {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render bookmark icon", () => {
      const { container } = render(<ReadLaterButton {...defaultProps} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should show 'Read Later' label by default", () => {
      render(<ReadLaterButton {...defaultProps} />);
      expect(screen.getByText("Read Later")).toBeInTheDocument();
    });

    it("should have correct title when not in list", () => {
      render(<ReadLaterButton {...defaultProps} />);
      expect(screen.getByTitle("Add to reading list")).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render sm size", () => {
      render(<ReadLaterButton {...defaultProps} size="sm" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("p-1.5");
    });

    it("should render md size by default", () => {
      render(<ReadLaterButton {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("p-2");
    });

    it("should render lg size", () => {
      render(<ReadLaterButton {...defaultProps} size="lg" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("p-3");
    });

    it("should have sm icon size", () => {
      const { container } = render(<ReadLaterButton {...defaultProps} size="sm" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("w-4");
      expect(svg?.getAttribute("class")).toContain("h-4");
    });

    it("should have md icon size", () => {
      const { container } = render(<ReadLaterButton {...defaultProps} size="md" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("w-5");
      expect(svg?.getAttribute("class")).toContain("h-5");
    });

    it("should have lg icon size", () => {
      const { container } = render(<ReadLaterButton {...defaultProps} size="lg" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("w-6");
      expect(svg?.getAttribute("class")).toContain("h-6");
    });
  });

  describe("Label Visibility", () => {
    it("should show label by default", () => {
      render(<ReadLaterButton {...defaultProps} />);
      expect(screen.getByText("Read Later")).toBeInTheDocument();
    });

    it("should hide label when showLabel is false", () => {
      render(<ReadLaterButton {...defaultProps} showLabel={false} />);
      expect(screen.queryByText("Read Later")).not.toBeInTheDocument();
    });
  });

  describe("Initial State Check", () => {
    it("should check if resource is in reading list on mount", async () => {
      render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        expect(mockIsInReadingList).toHaveBeenCalledWith("resource", "123");
      });
    });

    it("should show 'Saved' when item is already in list", async () => {
      mockIsInReadingList.mockResolvedValue({ inList: true, itemId: "item-1" });

      render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Saved")).toBeInTheDocument();
      });
    });

    it("should have 'Remove' title when in list", async () => {
      mockIsInReadingList.mockResolvedValue({ inList: true, itemId: "item-1" });

      render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTitle("Remove from reading list")).toBeInTheDocument();
      });
    });
  });

  describe("Add to List", () => {
    it("should call quickAddToReadLater when clicked", async () => {
      render(<ReadLaterButton {...defaultProps} url="https://example.com" />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockQuickAddToReadLater).toHaveBeenCalledWith({
          resourceType: "resource",
          resourceId: "123",
          title: "Test Resource",
          url: "https://example.com",
        });
      });
    });

    it("should update to 'Saved' after successful add", async () => {
      render(<ReadLaterButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Saved")).toBeInTheDocument();
      });
    });
  });

  describe("Remove from List", () => {
    it("should call removeFromReadingList when clicked while in list", async () => {
      mockIsInReadingList.mockResolvedValue({ inList: true, itemId: "item-1" });

      render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Saved")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockRemoveFromReadingList).toHaveBeenCalledWith("item-1");
      });
    });

    it("should update to 'Read Later' after successful remove", async () => {
      mockIsInReadingList.mockResolvedValue({ inList: true, itemId: "item-1" });

      render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Saved")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Read Later")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should be disabled while loading", async () => {
      mockQuickAddToReadLater.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ item: { id: "1" } }), 100))
      );

      render(<ReadLaterButton {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should have opacity class while loading", async () => {
      mockQuickAddToReadLater.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ item: { id: "1" } }), 100))
      );

      render(<ReadLaterButton {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));

      const button = screen.getByRole("button");
      expect(button.className).toContain("opacity-50");
    });
  });

  describe("Styling", () => {
    it("should have rounded-lg", () => {
      render(<ReadLaterButton {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-lg");
    });

    it("should have transition", () => {
      render(<ReadLaterButton {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("transition-all");
    });

    it("should have blue styling when in list", async () => {
      mockIsInReadingList.mockResolvedValue({ inList: true, itemId: "item-1" });

      render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("text-blue-600");
        expect(button.className).toContain("bg-blue-50");
      });
    });

    it("should have gray styling when not in list", () => {
      render(<ReadLaterButton {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("text-gray-500");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(<ReadLaterButton {...defaultProps} className="custom-class" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("custom-class");
    });
  });

  describe("Icon Fill", () => {
    it("should have unfilled icon when not in list", () => {
      const { container } = render(<ReadLaterButton {...defaultProps} />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("fill")).toBe("none");
    });

    it("should have filled icon when in list", async () => {
      mockIsInReadingList.mockResolvedValue({ inList: true, itemId: "item-1" });

      const { container } = render(<ReadLaterButton {...defaultProps} />);

      await waitFor(() => {
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("fill")).toBe("currentColor");
      });
    });
  });
});
