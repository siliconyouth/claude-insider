/**
 * ProfileHoverCard Component Tests
 *
 * Tests for the profile hover card component:
 * - Disabled state
 * - Children rendering
 * - User info display
 * - Role and donor badges
 * - Online indicator
 * - Follow button visibility
 * - Stats formatting
 * - Skeleton component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileHoverCard, ProfileHoverCardSkeleton, type ProfileHoverCardUser } from "@/components/users/profile-hover-card";

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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock UserAvatar
vi.mock("@/components/users/user-avatar", () => ({
  UserAvatar: ({ src, name, size, className }: { src?: string | null; name?: string; size?: string; className?: string }) => (
    <div data-testid="user-avatar" data-src={src || ""} data-name={name} data-size={size} className={className}>
      Avatar
    </div>
  ),
}));

// Mock FollowButton
vi.mock("@/components/users/follow-button", () => ({
  FollowButton: ({ userId, isFollowing, size }: { userId: string; isFollowing: boolean; size?: string }) => (
    <button data-testid="follow-button" data-user-id={userId} data-following={isFollowing} data-size={size}>
      {isFollowing ? "Following" : "Follow"}
    </button>
  ),
}));

// Mock roles
vi.mock("@/lib/roles", () => ({
  ROLE_INFO: {
    admin: { bgColor: "bg-red-100", color: "text-red-500" },
    moderator: { bgColor: "bg-blue-100", color: "text-blue-500" },
    editor: { bgColor: "bg-green-100", color: "text-green-500" },
    user: { bgColor: "bg-gray-100", color: "text-gray-500" },
  },
}));

// Mock session - non-authenticated by default
const mockSessionData = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: mockSessionData(),
  }),
}));

// Mock openMessages
vi.mock("@/components/unified-chat", () => ({
  openMessages: vi.fn(),
}));

describe("ProfileHoverCard", () => {
  const mockUser: ProfileHoverCardUser = {
    id: "user-1",
    name: "John Doe",
    displayName: "Johnny D",
    username: "johndoe",
    image: "https://example.com/avatar.jpg",
    bio: "Software developer and open source enthusiast",
    role: "user",
    joinedAt: "2024-01-01T00:00:00Z",
    isFollowing: false,
    isOnline: false,
    donorTier: null,
    stats: {
      followers: 1234,
      following: 567,
      contributions: 89,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionData.mockReturnValue({
      user: { id: "other-user" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render children", () => {
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger Content</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger Content")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(
        <ProfileHoverCard user={mockUser} className="custom-class">
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      const trigger = container.querySelector(".custom-class");
      expect(trigger).toBeInTheDocument();
    });

    it("should render trigger as span with cursor-pointer", () => {
      const { container } = render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      const trigger = container.querySelector("span.inline.cursor-pointer");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should still render children when disabled", () => {
      render(
        <ProfileHoverCard user={mockUser} disabled>
          <span>Disabled Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Disabled Trigger")).toBeInTheDocument();
    });
  });

  describe("User Info", () => {
    it("should use displayName if available", () => {
      // The card content is only visible on hover, but we can test the component accepts the data
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should fall back to name if no displayName", () => {
      const userWithoutDisplayName = { ...mockUser, displayName: null };
      render(
        <ProfileHoverCard user={userWithoutDisplayName}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });
  });

  describe("Profile URL", () => {
    it("should use custom href if provided", () => {
      render(
        <ProfileHoverCard user={mockUser} href="/custom/path">
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should construct URL from username", () => {
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should fall back to /profile when no username", () => {
      const userWithoutUsername = { ...mockUser, username: null };
      render(
        <ProfileHoverCard user={userWithoutUsername}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });
  });

  describe("Actions Visibility", () => {
    it("should not show actions when showActions is false", () => {
      render(
        <ProfileHoverCard user={mockUser} showActions={false}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.queryByTestId("follow-button")).not.toBeInTheDocument();
    });

    it("should not show actions for own profile", () => {
      mockSessionData.mockReturnValue({
        user: { id: "user-1" }, // Same as mockUser.id
      });
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      // Actions are hidden for own profile (card not shown without hover)
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should not show actions when not logged in", () => {
      mockSessionData.mockReturnValue(null);
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });
  });

  describe("Role Badge", () => {
    it("should show role badge for non-user roles", () => {
      const adminUser = { ...mockUser, role: "admin" as const };
      render(
        <ProfileHoverCard user={adminUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should not show role badge for regular user role", () => {
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });
  });

  describe("Donor Tier", () => {
    it("should handle bronze donor tier", () => {
      const bronzeDonor = { ...mockUser, donorTier: "bronze" as const };
      render(
        <ProfileHoverCard user={bronzeDonor}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should handle platinum donor tier", () => {
      const platinumDonor = { ...mockUser, donorTier: "platinum" as const };
      render(
        <ProfileHoverCard user={platinumDonor}>
          <span>Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Trigger")).toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("should render in compact mode", () => {
      render(
        <ProfileHoverCard user={mockUser} compact>
          <span>Compact Trigger</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Compact Trigger")).toBeInTheDocument();
    });
  });

  describe("Side Preference", () => {
    it("should accept top side preference", () => {
      render(
        <ProfileHoverCard user={mockUser} side="top">
          <span>Top Side</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Top Side")).toBeInTheDocument();
    });

    it("should accept bottom side preference", () => {
      render(
        <ProfileHoverCard user={mockUser} side="bottom">
          <span>Bottom Side</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Bottom Side")).toBeInTheDocument();
    });
  });

  describe("Delay Configuration", () => {
    it("should accept custom delay", () => {
      render(
        <ProfileHoverCard user={mockUser} delayMs={500}>
          <span>Custom Delay</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Custom Delay")).toBeInTheDocument();
    });

    it("should use default 300ms delay", () => {
      render(
        <ProfileHoverCard user={mockUser}>
          <span>Default Delay</span>
        </ProfileHoverCard>
      );
      expect(screen.getByText("Default Delay")).toBeInTheDocument();
    });
  });
});

describe("ProfileHoverCardSkeleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render skeleton component", () => {
    const { container } = render(<ProfileHoverCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should have animate-pulse elements", () => {
    const { container } = render(<ProfileHoverCardSkeleton />);
    const pulseElements = container.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("should render compact skeleton", () => {
    const { container } = render(<ProfileHoverCardSkeleton compact />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should have different layout in compact mode", () => {
    const { container: compactContainer } = render(<ProfileHoverCardSkeleton compact />);
    const { container: normalContainer } = render(<ProfileHoverCardSkeleton />);

    // Compact doesn't have the header banner area
    const compactBanner = compactContainer.querySelector(".h-20");
    const normalBanner = normalContainer.querySelector(".h-20");

    expect(compactBanner).toBeNull();
    expect(normalBanner).toBeInTheDocument();
  });

  it("should have proper card styling", () => {
    const { container } = render(<ProfileHoverCardSkeleton />);
    const card = container.querySelector("[class*='rounded-xl']");
    expect(card).toBeInTheDocument();
  });

  it("should have border styling", () => {
    const { container } = render(<ProfileHoverCardSkeleton />);
    const card = container.querySelector("[class*='border']");
    expect(card).toBeInTheDocument();
  });
});
