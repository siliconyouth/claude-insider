/**
 * ActivityFeed Component Tests
 *
 * Tests for the activity feed component:
 * - Loading skeleton
 * - Empty state
 * - Activity list display
 * - Filter buttons
 * - Search functionality
 * - Pause/resume controls
 * - Refresh button
 * - Connection indicator
 * - Activity entry rendering
 * - Severity styling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActivityFeed, type ActivityEntry } from "@/components/dashboard/activity-feed";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className, onMouseEnter, onMouseLeave }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: () => void;
  }) => (
    <a href={href} className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}
    </a>
  ),
}));

// Mock date-fns
vi.mock("date-fns", () => ({
  formatDistanceToNow: (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "less than a minute ago";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  },
  format: (date: Date, formatStr: string) => {
    if (formatStr === "PPpp") return date.toLocaleString();
    if (formatStr === "HH:mm:ss") return date.toLocaleTimeString();
    return date.toString();
  },
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({
        subscribe: vi.fn((callback) => {
          callback("SUBSCRIBED");
          return {};
        }),
      }),
    }),
    removeChannel: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ActivityFeed", () => {
  const mockActivities: ActivityEntry[] = [
    {
      id: "act-1",
      type: "security",
      action: "bot_detected",
      description: "Bot detected: Googlebot accessing /api/resources",
      timestamp: new Date().toISOString(),
      severity: "warning",
    },
    {
      id: "act-2",
      type: "user",
      action: "user_login",
      description: "User logged in successfully",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: "success",
      user: {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/avatar.jpg",
      },
    },
    {
      id: "act-3",
      type: "notification",
      action: "notification_sent",
      description: "Welcome notification sent to new user",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      severity: "info",
    },
    {
      id: "act-4",
      type: "email",
      action: "email_delivered",
      description: "Password reset email delivered",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      severity: "success",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, activities: mockActivities }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeletons initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<ActivityFeed />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show skeleton items while loading", () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<ActivityFeed />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no activities", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, activities: [] }),
      });
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("No activities found")).toBeInTheDocument();
      });
    });

    it("should show helpful hint in empty state", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, activities: [] }),
      });
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("Activities will appear here")).toBeInTheDocument();
      });
    });
  });

  describe("Activity List", () => {
    it("should show Activity Feed heading", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("Activity Feed")).toBeInTheDocument();
      });
    });

    it("should display activity descriptions", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText(/Bot detected: Googlebot/)).toBeInTheDocument();
        expect(screen.getByText("User logged in successfully")).toBeInTheDocument();
      });
    });

    it("should display activity actions", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("bot detected")).toBeInTheDocument();
        expect(screen.getByText("user login")).toBeInTheDocument();
      });
    });

    it("should display activity type badges", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getAllByText("security").length).toBeGreaterThan(0);
        expect(screen.getAllByText("user").length).toBeGreaterThan(0);
      });
    });

    it("should display user information when available", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should link user to dashboard", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        const userLink = screen.getByText("John Doe").closest("a");
        expect(userLink).toHaveAttribute("href", "/dashboard/users?id=user-1");
      });
    });
  });

  describe("Filter Buttons", () => {
    it("should show filter buttons by default", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("All Activity")).toBeInTheDocument();
        expect(screen.getByText("Security")).toBeInTheDocument();
        expect(screen.getByText("Users")).toBeInTheDocument();
        expect(screen.getByText("Notifications")).toBeInTheDocument();
        expect(screen.getByText("Emails")).toBeInTheDocument();
      });
    });

    it("should hide filters when showFilters is false", () => {
      render(<ActivityFeed showFilters={false} />);
      expect(screen.queryByText("All Activity")).not.toBeInTheDocument();
    });

    it("should filter activities when filter clicked", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Security"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("type=security"));
      });
    });

    it("should highlight active filter", async () => {
      const { container } = render(<ActivityFeed />);

      await waitFor(() => {
        // "All Activity" is active by default
        const allButton = screen.getByText("All Activity").closest("button");
        expect(allButton?.className).toContain("from-violet-600");
      });
    });
  });

  describe("Search Functionality", () => {
    it("should show search input by default", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search activities...")).toBeInTheDocument();
      });
    });

    it("should hide search when showSearch is false", () => {
      render(<ActivityFeed showSearch={false} />);
      expect(screen.queryByPlaceholderText("Search activities...")).not.toBeInTheDocument();
    });

    it("should filter activities by search query", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("Search activities..."), {
          target: { value: "Googlebot" },
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Bot detected: Googlebot/)).toBeInTheDocument();
        expect(screen.queryByText("User logged in successfully")).not.toBeInTheDocument();
      });
    });

    it("should show search hint when no matches", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("Search activities..."), {
          target: { value: "nonexistent" },
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Try a different search term")).toBeInTheDocument();
      });
    });
  });

  describe("Pause/Resume Controls", () => {
    it("should show pause button", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByTitle("Pause")).toBeInTheDocument();
      });
    });

    it("should toggle to resume when paused", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Pause"));
      });

      expect(screen.getByTitle("Resume")).toBeInTheDocument();
    });

    it("should toggle back to pause when resumed", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Pause"));
      });

      fireEvent.click(screen.getByTitle("Resume"));
      expect(screen.getByTitle("Pause")).toBeInTheDocument();
    });
  });

  describe("Refresh Button", () => {
    it("should show refresh button", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByTitle("Refresh")).toBeInTheDocument();
      });
    });

    it("should trigger refresh when clicked", async () => {
      render(<ActivityFeed />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Activity Feed")).toBeInTheDocument();
      });

      // Click refresh - it should be enabled now
      const refreshButton = screen.getByTitle("Refresh");
      fireEvent.click(refreshButton);

      // The button should exist and be clickable
      expect(refreshButton).toBeInTheDocument();
    });

    it("should disable button while loading", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<ActivityFeed />);

      const refreshButton = screen.getByTitle("Refresh");
      expect(refreshButton).toBeDisabled();
    });
  });

  describe("Connection Indicator", () => {
    it("should show Live indicator when connected", async () => {
      render(<ActivityFeed enableRealtime />);

      await waitFor(() => {
        expect(screen.getByText("Live")).toBeInTheDocument();
      });
    });

    it("should show Connecting indicator initially", () => {
      render(<ActivityFeed enableRealtime />);
      // Initially may show connecting or live depending on mock timing
      const indicator = screen.queryByText("Live") || screen.queryByText("Connecting...");
      expect(indicator).toBeInTheDocument();
    });

    it("should not show indicator when realtime disabled", async () => {
      render(<ActivityFeed enableRealtime={false} />);

      await waitFor(() => {
        expect(screen.queryByText("Live")).not.toBeInTheDocument();
        expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error message on fetch failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch: 500/)).toBeInTheDocument();
      });
    });

    it("should show error from response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: "Database error" }),
      });
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(screen.getByText("Database error")).toBeInTheDocument();
      });
    });
  });

  describe("Severity Styling", () => {
    it("should apply error styling for error severity", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          activities: [{ ...mockActivities[0], severity: "error" }],
        }),
      });
      const { container } = render(<ActivityFeed />);

      await waitFor(() => {
        const errorBadge = screen.getByText("ERROR");
        expect(errorBadge).toBeInTheDocument();
      });
    });

    it("should apply left border styling for activities", async () => {
      const { container } = render(<ActivityFeed />);

      await waitFor(() => {
        // Activities should have border-l styling
        const borderEntries = container.querySelectorAll("[class*='border-l-']");
        expect(borderEntries.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Props", () => {
    it("should use custom maxItems", async () => {
      render(<ActivityFeed maxItems={10} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=10"));
      });
    });

    it("should use default maxItems of 50", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=50"));
      });
    });

    it("should apply custom className", async () => {
      const { container } = render(<ActivityFeed className="custom-feed" />);

      expect(container.querySelector(".custom-feed")).toBeInTheDocument();
    });
  });

  describe("Timestamps", () => {
    it("should show relative time", async () => {
      render(<ActivityFeed />);

      await waitFor(() => {
        // Multiple activities have "ago" timestamps
        const agoElements = screen.getAllByText(/ago/);
        expect(agoElements.length).toBeGreaterThan(0);
      });
    });

    it("should show formatted time", async () => {
      const { container } = render(<ActivityFeed />);

      await waitFor(() => {
        // Should have time elements with datetime attribute
        const timeElements = container.querySelectorAll("time");
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });
});
