/**
 * BlockedUsers Component Tests
 *
 * Tests for the blocked users management component:
 * - Loading state
 * - Empty state
 * - User list display
 * - Unblock functionality
 * - User avatars
 * - User links
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BlockedUsers } from "@/components/settings/blocked-users";

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

// Mock toast hook
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

// Mock user actions
const mockGetBlockedUsers = vi.fn();
const mockUnblockUser = vi.fn();
vi.mock("@/app/actions/users", () => ({
  getBlockedUsers: () => mockGetBlockedUsers(),
  unblockUser: (userId: string) => mockUnblockUser(userId),
}));

describe("BlockedUsers", () => {
  const mockUsers = [
    {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
      image: "https://example.com/avatar1.jpg",
      blockedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "user-2",
      name: "Jane Smith",
      username: "janesmith",
      image: null,
      blockedAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "user-3",
      name: "Bob Wilson",
      username: null,
      image: null,
      blockedAt: "2024-01-03T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlockedUsers.mockResolvedValue({ users: mockUsers });
    mockUnblockUser.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeletons initially", () => {
      mockGetBlockedUsers.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ users: mockUsers }), 100))
      );

      const { container } = render(<BlockedUsers />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show 3 skeleton items", () => {
      mockGetBlockedUsers.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ users: mockUsers }), 100))
      );

      const { container } = render(<BlockedUsers />);

      const skeletonItems = container.querySelectorAll(".animate-pulse");
      expect(skeletonItems.length).toBe(3);
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no blocked users", async () => {
      mockGetBlockedUsers.mockResolvedValue({ users: [] });

      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("You haven't blocked any users")).toBeInTheDocument();
      });
    });

    it("should show helpful message in empty state", async () => {
      mockGetBlockedUsers.mockResolvedValue({ users: [] });

      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("Blocked users won't be able to interact with you")).toBeInTheDocument();
      });
    });

    it("should show icon in empty state", async () => {
      mockGetBlockedUsers.mockResolvedValue({ users: [] });

      const { container } = render(<BlockedUsers />);

      await waitFor(() => {
        const icon = container.querySelector("svg");
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe("User List Display", () => {
    it("should render all blocked users", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
      });
    });

    it("should show usernames with @ prefix", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("@johndoe")).toBeInTheDocument();
        expect(screen.getByText("@janesmith")).toBeInTheDocument();
      });
    });

    it("should not show username when null", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.queryByText("@bobwilson")).not.toBeInTheDocument();
      });
    });

    it("should show blocked date", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText(/Blocked 1\/1\/2024/)).toBeInTheDocument();
      });
    });
  });

  describe("User Avatars", () => {
    it("should show image avatar when image exists", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        const img = screen.getByAltText("John Doe");
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toBe("https://example.com/avatar1.jpg");
      });
    });

    it("should show initial avatar when no image", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("J")).toBeInTheDocument(); // Jane's initial
        expect(screen.getByText("B")).toBeInTheDocument(); // Bob's initial
      });
    });

    it("should have gradient background for initial avatars", async () => {
      const { container } = render(<BlockedUsers />);

      await waitFor(() => {
        const initialAvatars = container.querySelectorAll(".from-violet-500");
        expect(initialAvatars.length).toBeGreaterThan(0);
      });
    });
  });

  describe("User Links", () => {
    it("should link to user profile when username exists", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        const link = screen.getByText("John Doe").closest("a");
        expect(link?.getAttribute("href")).toBe("/users/johndoe");
      });
    });

    it("should link to # when username is null", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        const link = screen.getByText("Bob Wilson").closest("a");
        expect(link?.getAttribute("href")).toBe("#");
      });
    });
  });

  describe("Unblock Functionality", () => {
    it("should show Unblock button for each user", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        const unblockButtons = screen.getAllByText("Unblock");
        expect(unblockButtons.length).toBe(3);
      });
    });

    it("should call unblockUser when Unblock clicked", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      await waitFor(() => {
        expect(mockUnblockUser).toHaveBeenCalledWith("user-1");
      });
    });

    it("should show success toast after unblock", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("User unblocked");
      });
    });

    it("should remove user from list after unblock", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      });
    });

    it("should show error toast on unblock failure", async () => {
      mockUnblockUser.mockResolvedValue({ error: "Failed to unblock user" });

      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Failed to unblock user");
      });
    });

    it("should not remove user from list on unblock failure", async () => {
      mockUnblockUser.mockResolvedValue({ error: "Failed" });

      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should show loading state on button while unblocking", async () => {
      mockUnblockUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      // Should show "..." during loading
      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("should disable button while unblocking", async () => {
      mockUnblockUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const unblockButtons = screen.getAllByText("Unblock");
      fireEvent.click(unblockButtons[0]);

      // The clicked button should be disabled
      const loadingButton = screen.getByText("...");
      expect(loadingButton.closest("button")).toBeDisabled();
    });
  });

  describe("Data Fetching", () => {
    it("should fetch blocked users on mount", async () => {
      render(<BlockedUsers />);

      await waitFor(() => {
        expect(mockGetBlockedUsers).toHaveBeenCalled();
      });
    });

    it("should handle fetch returning null users", async () => {
      mockGetBlockedUsers.mockResolvedValue({ users: null });

      render(<BlockedUsers />);

      await waitFor(() => {
        // Should show empty state when users is null
        expect(screen.getByText("You haven't blocked any users")).toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("should have rounded corners on user cards", async () => {
      const { container } = render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const cards = container.querySelectorAll(".rounded-xl");
      expect(cards.length).toBeGreaterThan(0);
    });

    it("should have border on user cards", async () => {
      const { container } = render(<BlockedUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const cards = container.querySelectorAll(".border");
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
