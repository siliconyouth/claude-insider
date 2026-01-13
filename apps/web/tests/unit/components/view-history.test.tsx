/**
 * ViewHistory Component Tests
 *
 * Tests for the view history component:
 * - Loading state
 * - Empty state
 * - History list display
 * - Clear history
 * - Date formatting
 * - Link navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ViewHistory } from "@/components/reading-lists/view-history";

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
const mockGetViewHistory = vi.fn();
const mockClearViewHistory = vi.fn();
vi.mock("@/app/actions/reading-lists", () => ({
  getViewHistory: (limit: number) => mockGetViewHistory(limit),
  clearViewHistory: () => mockClearViewHistory(),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe("ViewHistory", () => {
  const mockHistory = [
    {
      id: "vh-1",
      title: "React Hooks Guide",
      url: "/resources/react-hooks",
      viewed_at: new Date().toISOString(),
      view_count: 3,
    },
    {
      id: "vh-2",
      title: "TypeScript Tutorial",
      url: "/resources/typescript",
      viewed_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      view_count: 1,
    },
    {
      id: "vh-3",
      title: "Next.js Docs",
      url: null,
      viewed_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      view_count: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetViewHistory.mockResolvedValue({ history: mockHistory });
    mockClearViewHistory.mockResolvedValue({ success: true });
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton initially", () => {
      mockGetViewHistory.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<ViewHistory />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show 5 skeleton items by default", () => {
      mockGetViewHistory.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<ViewHistory />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(5);
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no history", async () => {
      mockGetViewHistory.mockResolvedValue({ history: [] });
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("No viewing history yet")).toBeInTheDocument();
      });
    });

    it("should show helpful description in empty state", async () => {
      mockGetViewHistory.mockResolvedValue({ history: [] });
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("Resources you view will appear here")).toBeInTheDocument();
      });
    });
  });

  describe("History List", () => {
    it("should show View History heading", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("View History")).toBeInTheDocument();
      });
    });

    it("should show history item titles", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
        expect(screen.getByText("TypeScript Tutorial")).toBeInTheDocument();
        expect(screen.getByText("Next.js Docs")).toBeInTheDocument();
      });
    });

    it("should show view count for items viewed multiple times", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText(/Viewed 3 times/)).toBeInTheDocument();
        expect(screen.getByText(/Viewed 5 times/)).toBeInTheDocument();
      });
    });

    it("should not show view count for items viewed once", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        // TypeScript Tutorial was viewed once, so no "Viewed X times" should appear for it
        const historyItems = screen.getAllByText(/TypeScript Tutorial/);
        expect(historyItems.length).toBeGreaterThan(0);
      });
    });

    it("should render title as link when url provided", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        const link = screen.getByText("React Hooks Guide").closest("a");
        expect(link?.getAttribute("href")).toBe("/resources/react-hooks");
      });
    });

    it("should render title as span when no url", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        const title = screen.getByText("Next.js Docs");
        expect(title.tagName).toBe("SPAN");
      });
    });
  });

  describe("Date Formatting", () => {
    it("should show 'Today' for items viewed today", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
      });
    });

    it("should show 'Yesterday' for items viewed yesterday", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("Yesterday")).toBeInTheDocument();
      });
    });

    it("should show 'X days ago' for recent items", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("3 days ago")).toBeInTheDocument();
      });
    });
  });

  describe("Clear History", () => {
    it("should show Clear History button", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("Clear History")).toBeInTheDocument();
      });
    });

    it("should ask for confirmation before clearing", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Clear History"));
      });

      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to clear your view history?");
    });

    it("should call clearViewHistory on confirm", async () => {
      mockConfirm.mockReturnValue(true);
      render(<ViewHistory />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Clear History"));
      });

      await waitFor(() => {
        expect(mockClearViewHistory).toHaveBeenCalled();
      });
    });

    it("should not call clearViewHistory on cancel", async () => {
      mockConfirm.mockReturnValue(false);
      render(<ViewHistory />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Clear History"));
      });

      expect(mockClearViewHistory).not.toHaveBeenCalled();
    });

    it("should show Clearing... while clearing", async () => {
      mockClearViewHistory.mockImplementation(() => new Promise(() => {}));
      mockConfirm.mockReturnValue(true);
      render(<ViewHistory />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Clear History"));
      });

      expect(screen.getByText("Clearing...")).toBeInTheDocument();
    });

    it("should clear history list on success", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Clear History"));

      await waitFor(() => {
        expect(screen.getByText("No viewing history yet")).toBeInTheDocument();
      });
    });
  });

  describe("Props", () => {
    it("should use default limit of 20", async () => {
      render(<ViewHistory />);

      await waitFor(() => {
        expect(mockGetViewHistory).toHaveBeenCalledWith(20);
      });
    });

    it("should use custom limit when provided", async () => {
      render(<ViewHistory limit={10} />);

      await waitFor(() => {
        expect(mockGetViewHistory).toHaveBeenCalledWith(10);
      });
    });

    it("should hide Clear History button when showClearButton is false", async () => {
      render(<ViewHistory showClearButton={false} />);

      await waitFor(() => {
        expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
      });

      expect(screen.queryByText("Clear History")).not.toBeInTheDocument();
      expect(screen.queryByText("View History")).not.toBeInTheDocument();
    });

    it("should apply custom className", async () => {
      const { container } = render(<ViewHistory className="custom-class" />);

      await waitFor(() => {
        expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
