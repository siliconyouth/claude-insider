/**
 * ActivityTimeline Component Tests
 *
 * Tests for the activity timeline display:
 * - Loading state
 * - Empty state
 * - Activity rendering
 * - Grouping by date
 * - Expand/collapse descriptions
 * - Load more button
 * - ActivityStats component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityTimeline, ActivityStats } from "@/components/activity/activity-timeline";
import type { ActivityItem } from "@/app/actions/user-activity";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Helper to create activity items
function createActivity(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: `activity-${Math.random().toString(36).slice(2)}`,
    type: "view_doc",
    title: "Test Activity",
    description: "This is a test activity",
    createdAt: new Date().toISOString(),
    link: "/test",
    ...overrides,
  };
}

describe("ActivityTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should render loading skeleton", () => {
      const { container } = render(<ActivityTimeline activities={[]} isLoading={true} />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should render multiple skeleton items", () => {
      const { container } = render(<ActivityTimeline activities={[]} isLoading={true} />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show skeleton avatar", () => {
      const { container } = render(<ActivityTimeline activities={[]} isLoading={true} />);

      const avatar = container.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no activities", () => {
      render(<ActivityTimeline activities={[]} />);

      expect(screen.getByText("📭")).toBeInTheDocument();
    });

    it("should show default empty message", () => {
      render(<ActivityTimeline activities={[]} />);

      expect(screen.getByText("No activity yet")).toBeInTheDocument();
    });

    it("should show custom empty message", () => {
      render(<ActivityTimeline activities={[]} emptyMessage="Nothing to show" />);

      expect(screen.getByText("Nothing to show")).toBeInTheDocument();
    });
  });

  describe("Activity Rendering", () => {
    it("should render activity title", () => {
      const activities = [createActivity({ title: "Viewed Documentation" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("Viewed Documentation")).toBeInTheDocument();
    });

    it("should render activity description", () => {
      const activities = [createActivity({ description: "Read the getting started guide" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("Read the getting started guide")).toBeInTheDocument();
    });

    it("should render activity icon", () => {
      const activities = [createActivity({ type: "favorite" })];
      render(<ActivityTimeline activities={activities} />);

      // Favorite icon is ❤️
      expect(screen.getByText("❤️")).toBeInTheDocument();
    });

    it("should render link when provided", () => {
      const activities = [createActivity({ link: "/docs/test" })];
      render(<ActivityTimeline activities={activities} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/docs/test");
    });

    it("should render span when no link", () => {
      const activities = [createActivity({ link: undefined })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should show relative time", () => {
      const activities = [createActivity({ createdAt: new Date().toISOString() })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("just now")).toBeInTheDocument();
    });
  });

  describe("Activity Types", () => {
    it("should render view_doc icon", () => {
      const activities = [createActivity({ type: "view_doc" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("📄")).toBeInTheDocument();
    });

    it("should render view_resource icon", () => {
      const activities = [createActivity({ type: "view_resource" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("📦")).toBeInTheDocument();
    });

    it("should render search icon", () => {
      const activities = [createActivity({ type: "search" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("🔍")).toBeInTheDocument();
    });

    it("should render favorite icon", () => {
      const activities = [createActivity({ type: "favorite" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("❤️")).toBeInTheDocument();
    });

    it("should render unfavorite icon", () => {
      const activities = [createActivity({ type: "unfavorite" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("💔")).toBeInTheDocument();
    });

    it("should render rate icon", () => {
      const activities = [createActivity({ type: "rate" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("⭐")).toBeInTheDocument();
    });

    it("should render comment icon", () => {
      const activities = [createActivity({ type: "comment" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("💬")).toBeInTheDocument();
    });

    it("should render achievement_earned icon", () => {
      const activities = [createActivity({ type: "achievement_earned" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("should render account_created icon", () => {
      const activities = [createActivity({ type: "account_created" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("🎂")).toBeInTheDocument();
    });
  });

  describe("Rating Display", () => {
    it("should show rating stars for rate activity", () => {
      const activities = [
        createActivity({
          type: "rate",
          metadata: { rating: 4 },
        }),
      ];
      render(<ActivityTimeline activities={activities} />);

      // Should have 4 filled stars and 1 empty
      expect(screen.getByText("★★★★☆")).toBeInTheDocument();
    });

    it("should show 5 stars for perfect rating", () => {
      const activities = [
        createActivity({
          type: "rate",
          metadata: { rating: 5 },
        }),
      ];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("★★★★★")).toBeInTheDocument();
    });
  });

  describe("Achievement Tier Badge", () => {
    it("should show tier badge for achievement", () => {
      const activities = [
        createActivity({
          type: "achievement_earned",
          metadata: { tier: "gold" },
        }),
      ];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("Gold")).toBeInTheDocument();
    });

    it("should show platinum tier with gradient style", () => {
      const activities = [
        createActivity({
          type: "achievement_earned",
          metadata: { tier: "platinum" },
        }),
      ];
      const { container } = render(<ActivityTimeline activities={activities} />);

      const badge = screen.getByText("Platinum");
      expect(badge.className).toContain("from-violet-500");
    });
  });

  describe("Report Status Badge", () => {
    it("should show status badge for report", () => {
      const activities = [
        createActivity({
          type: "report_submitted",
          metadata: { status: "investigating" },
        }),
      ];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("investigating")).toBeInTheDocument();
    });

    it("should show action_taken with green styling", () => {
      const activities = [
        createActivity({
          type: "report_submitted",
          metadata: { status: "action_taken" },
        }),
      ];
      render(<ActivityTimeline activities={activities} />);

      const badge = screen.getByText("action taken");
      expect(badge.className).toContain("bg-green-100");
    });
  });

  describe("Expand/Collapse Description", () => {
    it("should truncate long descriptions", () => {
      const longDescription = "A".repeat(150);
      const activities = [createActivity({ description: longDescription })];
      const { container } = render(<ActivityTimeline activities={activities} />);

      const description = container.querySelector(".line-clamp-2");
      expect(description).toBeInTheDocument();
    });

    it("should show more button for long descriptions", () => {
      const longDescription = "A".repeat(150);
      const activities = [createActivity({ description: longDescription })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText("more")).toBeInTheDocument();
    });

    it("should expand description when more is clicked", () => {
      const longDescription = "A".repeat(150);
      const activities = [createActivity({ description: longDescription })];
      render(<ActivityTimeline activities={activities} />);

      fireEvent.click(screen.getByText("more"));

      expect(screen.getByText("less")).toBeInTheDocument();
    });

    it("should collapse description when less is clicked", () => {
      const longDescription = "A".repeat(150);
      const activities = [createActivity({ description: longDescription })];
      render(<ActivityTimeline activities={activities} />);

      // Expand
      fireEvent.click(screen.getByText("more"));
      // Collapse
      fireEvent.click(screen.getByText("less"));

      expect(screen.getByText("more")).toBeInTheDocument();
    });

    it("should not show more button for short descriptions", () => {
      const activities = [createActivity({ description: "Short description" })];
      render(<ActivityTimeline activities={activities} />);

      expect(screen.queryByText("more")).not.toBeInTheDocument();
    });
  });

  describe("Load More", () => {
    it("should render load more button when showLoadMore is true", () => {
      const activities = [createActivity()];
      const onLoadMore = vi.fn();

      render(
        <ActivityTimeline activities={activities} showLoadMore={true} onLoadMore={onLoadMore} />
      );

      expect(screen.getByText("Load more activity")).toBeInTheDocument();
    });

    it("should not render load more when showLoadMore is false", () => {
      const activities = [createActivity()];

      render(<ActivityTimeline activities={activities} showLoadMore={false} />);

      expect(screen.queryByText("Load more activity")).not.toBeInTheDocument();
    });

    it("should call onLoadMore when clicked", () => {
      const activities = [createActivity()];
      const onLoadMore = vi.fn();

      render(
        <ActivityTimeline activities={activities} showLoadMore={true} onLoadMore={onLoadMore} />
      );

      fireEvent.click(screen.getByText("Load more activity"));

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  describe("Compact Mode", () => {
    it("should not show date headers in compact mode", () => {
      const activities = [createActivity()];
      const { container } = render(<ActivityTimeline activities={activities} compact={true} />);

      // Date headers have sticky class
      expect(container.querySelector(".sticky")).not.toBeInTheDocument();
    });

    it("should have smaller spacing in compact mode", () => {
      const activities = [createActivity()];
      const { container } = render(<ActivityTimeline activities={activities} compact={true} />);

      expect(container.querySelector(".space-y-2")).toBeInTheDocument();
    });

    it("should not show description in compact mode", () => {
      const activities = [createActivity({ description: "This should be hidden" })];
      render(<ActivityTimeline activities={activities} compact={true} />);

      expect(screen.queryByText("This should be hidden")).not.toBeInTheDocument();
    });
  });

  describe("Date Grouping", () => {
    it("should group activities by date", () => {
      const today = new Date();
      const activities = [
        createActivity({ createdAt: today.toISOString() }),
        createActivity({ createdAt: today.toISOString() }),
      ];

      const { container } = render(<ActivityTimeline activities={activities} />);

      // Should have one date header for today
      const headers = container.querySelectorAll(".sticky");
      expect(headers.length).toBe(1);
    });

    it("should show date in header", () => {
      const activities = [createActivity()];
      render(<ActivityTimeline activities={activities} />);

      // Should contain day of week
      const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
      expect(screen.getByText(new RegExp(dayOfWeek))).toBeInTheDocument();
    });
  });
});

describe("ActivityStats", () => {
  const defaultStats = {
    totalComments: 10,
    totalFavorites: 25,
    totalRatings: 15,
    totalCollections: 5,
    totalAchievements: 8,
    totalReports: 2,
    totalFollowing: 50,
    totalFollowers: 100,
    memberSince: "2023-01-15T00:00:00Z",
    lastActive: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Public Stats", () => {
    it("should render comments count", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Comments")).toBeInTheDocument();
    });

    it("should render ratings count", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("Ratings")).toBeInTheDocument();
    });

    it("should render collections count", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Collections")).toBeInTheDocument();
    });

    it("should render achievements count", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("Achievements")).toBeInTheDocument();
    });

    it("should render following count", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("Following")).toBeInTheDocument();
    });

    it("should render followers count", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("Followers")).toBeInTheDocument();
    });

    it("should render member since date", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("Jan 2023")).toBeInTheDocument();
      expect(screen.getByText("Member since")).toBeInTheDocument();
    });
  });

  describe("Private Stats", () => {
    it("should not show favorites by default", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    });

    it("should not show reports by default", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    });

    it("should show favorites when showPrivate is true", () => {
      render(<ActivityStats stats={defaultStats} showPrivate={true} />);

      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Favorites")).toBeInTheDocument();
    });

    it("should show reports when showPrivate is true", () => {
      render(<ActivityStats stats={defaultStats} showPrivate={true} />);

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    it("should show last active when showPrivate is true", () => {
      render(<ActivityStats stats={defaultStats} showPrivate={true} />);

      expect(screen.getByText("Last active")).toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("should render comment icon", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("💬")).toBeInTheDocument();
    });

    it("should render rating icon", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("⭐")).toBeInTheDocument();
    });

    it("should render collection icon", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("📁")).toBeInTheDocument();
    });

    it("should render achievement icon", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("should render following icon", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("👤")).toBeInTheDocument();
    });

    it("should render followers icon", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("🎉")).toBeInTheDocument();
    });

    it("should render calendar icon for member since", () => {
      render(<ActivityStats stats={defaultStats} />);

      expect(screen.getByText("📅")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have grid layout", () => {
      const { container } = render(<ActivityStats stats={defaultStats} />);

      expect(container.querySelector(".grid")).toBeInTheDocument();
    });

    it("should have rounded card styling", () => {
      const { container } = render(<ActivityStats stats={defaultStats} />);

      expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
    });

    it("should have border styling", () => {
      const { container } = render(<ActivityStats stats={defaultStats} />);

      expect(container.querySelector(".border")).toBeInTheDocument();
    });
  });

  describe("Number Formatting", () => {
    it("should format large numbers with locale string", () => {
      const stats = {
        ...defaultStats,
        totalFollowers: 10000,
      };
      render(<ActivityStats stats={stats} />);

      expect(screen.getByText("10,000")).toBeInTheDocument();
    });
  });
});
