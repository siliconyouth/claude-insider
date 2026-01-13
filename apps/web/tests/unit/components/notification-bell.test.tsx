/**
 * NotificationBell Component Tests
 *
 * Tests for the notification bell component:
 * - Authentication gating
 * - Unread badge display
 * - Dropdown behavior
 * - Loading and empty states
 * - Notification list
 * - Mark all as read
 * - Time formatting
 * - Keyboard/click interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationBell } from "@/components/notifications/notification-bell";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock auth provider
const mockIsAuthenticated = vi.fn();
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated(),
  }),
}));

// Mock browser notifications hook
vi.mock("@/hooks/use-browser-notifications", () => ({
  useBrowserNotifications: () => ({
    isEnabled: false,
    sendNotification: vi.fn(),
  }),
}));

// Mock realtime notifications hook
const mockUnreadCount = vi.fn();
vi.mock("@/hooks/use-realtime-notifications", () => ({
  useRealtimeNotifications: () => ({
    unreadCount: mockUnreadCount(),
    recentNotifications: [],
    refreshCount: vi.fn(),
  }),
}));

// Mock sound hook
vi.mock("@/hooks/use-sound-effects", () => ({
  useSound: () => ({
    playNotification: vi.fn(),
    playComplete: vi.fn(),
  }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

// Mock notification content
vi.mock("@/components/notifications/notification-content", () => ({
  NotificationContent: ({ content }: { content: string }) => <span>{content}</span>,
}));

// Mock notification links
vi.mock("@/lib/notification-links", () => ({
  getNotificationUrl: () => "/notifications",
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("NotificationBell", () => {
  const mockNotifications = [
    {
      id: "notif-1",
      title: "New comment on your post",
      message: "John replied to your comment",
      read: false,
      created_at: new Date().toISOString(),
      type: "comment",
    },
    {
      id: "notif-2",
      title: "You have a new follower",
      message: null,
      read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      type: "follow",
    },
    {
      id: "notif-3",
      title: "Your suggestion was approved",
      message: null,
      read: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      type: "suggestion_approved",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
    mockUnreadCount.mockReturnValue(3);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: mockNotifications }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication Gating", () => {
    it("should render nothing when not authenticated", () => {
      mockIsAuthenticated.mockReturnValue(false);
      const { container } = render(<NotificationBell />);
      expect(container.firstChild).toBeNull();
    });

    it("should render bell when authenticated", () => {
      render(<NotificationBell />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Unread Badge", () => {
    it("should show unread count badge when count > 0", () => {
      mockUnreadCount.mockReturnValue(5);
      render(<NotificationBell />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should not show badge when count is 0", () => {
      mockUnreadCount.mockReturnValue(0);
      render(<NotificationBell />);
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("should show 99+ when count exceeds 99", () => {
      mockUnreadCount.mockReturnValue(150);
      render(<NotificationBell />);
      expect(screen.getByText("99+")).toBeInTheDocument();
    });

    it("should include unread count in aria-label", () => {
      mockUnreadCount.mockReturnValue(5);
      render(<NotificationBell />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Notifications (5 unread)");
    });

    it("should have simple aria-label when no unread", () => {
      mockUnreadCount.mockReturnValue(0);
      render(<NotificationBell />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Notifications");
    });
  });

  describe("Dropdown Behavior", () => {
    it("should open dropdown on click", async () => {
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Notifications")).toBeInTheDocument();
      });
    });

    it("should close dropdown on second click", async () => {
      render(<NotificationBell />);
      const button = screen.getByRole("button");

      // Open
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText("Notifications")).toBeInTheDocument();
      });

      // Close
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: "Notifications" })).not.toBeInTheDocument();
      });
    });

    it("should close on escape key", async () => {
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByText("Notifications")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: "Notifications" })).not.toBeInTheDocument();
      });
    });

    it("should fetch notifications when dropdown opens", async () => {
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/notifications?limit=5");
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading skeletons while fetching", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const skeletons = container.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no notifications", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: [] }),
      });
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("No notifications yet")).toBeInTheDocument();
      });
    });
  });

  describe("Notification List", () => {
    it("should display notification titles", async () => {
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("New comment on your post")).toBeInTheDocument();
        expect(screen.getByText("You have a new follower")).toBeInTheDocument();
      });
    });

    it("should show View all notifications link", async () => {
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("View all notifications")).toBeInTheDocument();
      });
    });

    it("should show unread indicator for unread notifications", async () => {
      const { container } = render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        // Unread notifications have a blue dot
        const unreadDots = container.querySelectorAll(".bg-blue-600.rounded-full");
        expect(unreadDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Mark All as Read", () => {
    it("should show Mark all as read when there are unread", async () => {
      mockUnreadCount.mockReturnValue(3);
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Mark all as read")).toBeInTheDocument();
      });
    });

    it("should call API when Mark all as read clicked", async () => {
      mockUnreadCount.mockReturnValue(3);
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        fireEvent.click(screen.getByText("Mark all as read"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/notifications", expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ markAll: true }),
        }));
      });
    });

    it("should not show Mark all as read when count is 0", async () => {
      mockUnreadCount.mockReturnValue(0);
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Notifications")).toBeInTheDocument();
      });

      expect(screen.queryByText("Mark all as read")).not.toBeInTheDocument();
    });
  });

  describe("Time Formatting", () => {
    it("should show 'just now' for recent notifications", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{ ...mockNotifications[0], created_at: new Date().toISOString() }],
        }),
      });
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("just now")).toBeInTheDocument();
      });
    });

    it("should show minutes for recent notifications", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            ...mockNotifications[0],
            created_at: new Date(Date.now() - 5 * 60000).toISOString(),
          }],
        }),
      });
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("5m")).toBeInTheDocument();
      });
    });

    it("should show hours for older notifications", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            ...mockNotifications[0],
            created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
          }],
        }),
      });
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("3h")).toBeInTheDocument();
      });
    });

    it("should show days for old notifications", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            ...mockNotifications[0],
            created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          }],
        }),
      });
      render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("3d")).toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("should have rounded button", () => {
      const { container } = render(<NotificationBell />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("rounded");
    });

    it("should have gradient badge", () => {
      mockUnreadCount.mockReturnValue(5);
      const { container } = render(<NotificationBell />);
      const badge = container.querySelector("[class*='from-violet-600']");
      expect(badge).toBeInTheDocument();
    });

    it("should have rounded dropdown", async () => {
      const { container } = render(<NotificationBell />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const dropdown = container.querySelector("[class*='rounded-xl']");
        expect(dropdown).toBeInTheDocument();
      });
    });
  });
});
