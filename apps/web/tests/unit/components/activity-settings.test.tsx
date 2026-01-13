/**
 * ActivitySettings Component Tests
 *
 * Tests for the activity settings component:
 * - Initial rendering
 * - Data fetching
 * - Stats display
 * - Activity timeline
 * - Show more/less toggle
 * - Quick links
 * - Loading state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActivitySettings } from "@/components/settings/activity-settings";

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

// Mock activity components
vi.mock("@/components/activity", () => ({
  ActivityTimeline: ({ activities, isLoading, emptyMessage, compact, showLoadMore, onLoadMore }: {
    activities: unknown[];
    isLoading: boolean;
    emptyMessage: string;
    compact?: boolean;
    showLoadMore?: boolean;
    onLoadMore?: () => void;
  }) => (
    <div data-testid="activity-timeline" data-loading={isLoading} data-compact={compact}>
      {isLoading ? (
        <div data-testid="loading">Loading...</div>
      ) : activities.length === 0 ? (
        <div data-testid="empty">{emptyMessage}</div>
      ) : (
        <>
          <div data-testid="activity-count">{activities.length} activities</div>
          {showLoadMore && (
            <button data-testid="load-more" onClick={onLoadMore}>Load More</button>
          )}
        </>
      )}
    </div>
  ),
  ActivityStats: ({ stats, showPrivate }: { stats: unknown; showPrivate?: boolean }) => (
    <div data-testid="activity-stats" data-show-private={showPrivate}>
      Stats: {JSON.stringify(stats)}
    </div>
  ),
}));

// Mock user activity actions
const mockGetOwnActivity = vi.fn();
const mockGetActivityStats = vi.fn();

vi.mock("@/app/actions/user-activity", () => ({
  getOwnActivity: (...args: unknown[]) => mockGetOwnActivity(...args),
  getActivityStats: (...args: unknown[]) => mockGetActivityStats(...args),
}));

describe("ActivitySettings", () => {
  const mockActivities = [
    { id: "1", type: "view", resourceId: "r1", createdAt: new Date().toISOString() },
    { id: "2", type: "save", resourceId: "r2", createdAt: new Date().toISOString() },
    { id: "3", type: "comment", resourceId: "r3", createdAt: new Date().toISOString() },
  ];

  const mockStats = {
    totalViews: 150,
    totalSaves: 42,
    totalComments: 15,
    streak: 7,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnActivity.mockResolvedValue({
      success: true,
      activities: mockActivities,
    });
    mockGetActivityStats.mockResolvedValue({
      success: true,
      stats: mockStats,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", async () => {
      expect(() => render(<ActivitySettings />)).not.toThrow();

      await waitFor(() => {
        expect(screen.getByTestId("activity-timeline")).toBeInTheDocument();
      });
    });

    it("should show 'Recent Activity' title", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      });
    });

    it("should render quick links", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Favorites")).toBeInTheDocument();
        expect(screen.getByText("Reading Lists")).toBeInTheDocument();
        expect(screen.getByText("Achievements")).toBeInTheDocument();
        expect(screen.getByText("View Profile")).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch activities on mount", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(mockGetOwnActivity).toHaveBeenCalledWith(10);
      });
    });

    it("should fetch stats on mount", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(mockGetActivityStats).toHaveBeenCalled();
      });
    });

    it("should show loading state while fetching", async () => {
      mockGetOwnActivity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          activities: mockActivities,
        }), 100))
      );

      render(<ActivitySettings />);

      expect(screen.getByTestId("activity-timeline").getAttribute("data-loading")).toBe("true");
    });

    it("should show activities after fetch", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByTestId("activity-count")).toHaveTextContent("3 activities");
      });
    });

    it("should show stats after fetch", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByTestId("activity-stats")).toBeInTheDocument();
      });
    });
  });

  describe("Stats Component", () => {
    it("should pass stats to ActivityStats component", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const statsElement = screen.getByTestId("activity-stats");
        expect(statsElement).toHaveTextContent("totalViews");
        expect(statsElement).toHaveTextContent("150");
      });
    });

    it("should show private stats", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const statsElement = screen.getByTestId("activity-stats");
        expect(statsElement.getAttribute("data-show-private")).toBe("true");
      });
    });

    it("should not render stats when null", async () => {
      mockGetActivityStats.mockResolvedValue({
        success: false,
        stats: null,
      });

      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.queryByTestId("activity-stats")).not.toBeInTheDocument();
      });
    });
  });

  describe("Activity Timeline", () => {
    it("should pass compact mode by default", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const timeline = screen.getByTestId("activity-timeline");
        expect(timeline.getAttribute("data-compact")).toBe("true");
      });
    });

    it("should show empty message when no activities", async () => {
      mockGetOwnActivity.mockResolvedValue({
        success: true,
        activities: [],
      });

      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByTestId("empty")).toHaveTextContent(
          "No activity recorded yet. Start exploring!"
        );
      });
    });

    it("should show load more button when 10+ activities", async () => {
      const manyActivities = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        type: "view",
        resourceId: `r${i}`,
        createdAt: new Date().toISOString(),
      }));

      mockGetOwnActivity.mockResolvedValue({
        success: true,
        activities: manyActivities,
      });

      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByTestId("load-more")).toBeInTheDocument();
      });
    });
  });

  describe("Show More/Less Toggle", () => {
    it("should show 'Show all' button when activities exist", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Show all")).toBeInTheDocument();
      });
    });

    it("should not show 'Show all' button when no activities", async () => {
      mockGetOwnActivity.mockResolvedValue({
        success: true,
        activities: [],
      });

      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.queryByText("Show all")).not.toBeInTheDocument();
      });
    });

    it("should toggle to 'Show less' when clicked", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Show all")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Show all"));

      expect(screen.getByText("Show less")).toBeInTheDocument();
    });

    it("should fetch more activities when show all clicked", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Show all")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Show all"));

      await waitFor(() => {
        expect(mockGetOwnActivity).toHaveBeenCalledWith(100);
      });
    });

    it("should toggle compact mode off when showing all", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Show all")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Show all"));

      await waitFor(() => {
        const timeline = screen.getByTestId("activity-timeline");
        expect(timeline.getAttribute("data-compact")).toBe("false");
      });
    });

    it("should toggle back to compact when show less clicked", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("Show all")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Show all"));

      await waitFor(() => {
        expect(screen.getByText("Show less")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Show less"));

      await waitFor(() => {
        const timeline = screen.getByTestId("activity-timeline");
        expect(timeline.getAttribute("data-compact")).toBe("true");
      });
    });
  });

  describe("Quick Links", () => {
    it("should link to favorites page", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const link = screen.getByText("Favorites").closest("a");
        expect(link?.getAttribute("href")).toBe("/favorites");
      });
    });

    it("should link to reading lists page", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const link = screen.getByText("Reading Lists").closest("a");
        expect(link?.getAttribute("href")).toBe("/reading-lists");
      });
    });

    it("should link to achievements page", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const link = screen.getByText("Achievements").closest("a");
        expect(link?.getAttribute("href")).toBe("/profile/achievements");
      });
    });

    it("should link to profile page", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const link = screen.getByText("View Profile").closest("a");
        expect(link?.getAttribute("href")).toBe("/profile");
      });
    });

    it("should show emoji icons for quick links", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("❤️")).toBeInTheDocument();
        expect(screen.getByText("📚")).toBeInTheDocument();
        expect(screen.getByText("🏆")).toBeInTheDocument();
        expect(screen.getByText("👤")).toBeInTheDocument();
      });
    });
  });

  describe("View Full Stats Link", () => {
    it("should show 'View full stats' link", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByText("View full stats")).toBeInTheDocument();
      });
    });

    it("should link to stats page", async () => {
      render(<ActivitySettings />);

      await waitFor(() => {
        const link = screen.getByText("View full stats").closest("a");
        expect(link?.getAttribute("href")).toBe("/profile/stats");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle activity fetch failure gracefully", async () => {
      mockGetOwnActivity.mockResolvedValue({
        success: false,
        activities: null,
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<ActivitySettings />);

      await waitFor(() => {
        expect(screen.getByTestId("activity-timeline")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should handle network error gracefully", async () => {
      mockGetOwnActivity.mockRejectedValue(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<ActivitySettings />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to fetch activity:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Styling", () => {
    it("should have rounded corners on activity section", async () => {
      const { container } = render(<ActivitySettings />);

      await waitFor(() => {
        const section = container.querySelector(".rounded-xl");
        expect(section).toBeInTheDocument();
      });
    });

    it("should have border on activity section", async () => {
      const { container } = render(<ActivitySettings />);

      await waitFor(() => {
        const section = container.querySelector(".border");
        expect(section).toBeInTheDocument();
      });
    });

    it("should have 2-column grid on mobile", async () => {
      const { container } = render(<ActivitySettings />);

      await waitFor(() => {
        const grid = container.querySelector(".grid-cols-2");
        expect(grid).toBeInTheDocument();
      });
    });

    it("should have 4-column grid on larger screens", async () => {
      const { container } = render(<ActivitySettings />);

      await waitFor(() => {
        const grid = container.querySelector(".sm\\:grid-cols-4");
        expect(grid).toBeInTheDocument();
      });
    });
  });
});
