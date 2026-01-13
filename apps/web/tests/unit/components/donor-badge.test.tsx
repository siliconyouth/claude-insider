/**
 * DonorBadge Components Tests
 *
 * Tests for donor badge display components:
 * - DonorBadge (main badge with tier styling)
 * - DonorBadgeCompact (icon-only compact version)
 * - DonorBadgeProgress (badge with progress bar)
 * - DonorCard (full donor wall card)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DonorBadge,
  DonorBadgeCompact,
  DonorBadgeProgress,
  DonorCard,
} from "@/components/donations/donor-badge";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock BADGE_CONFIG
vi.mock("@/lib/donations/types", () => ({
  BADGE_CONFIG: {
    bronze: {
      label: "Bronze",
      icon: "🥉",
      bgColor: "bg-amber-100",
      color: "text-amber-700",
      borderColor: "border-amber-300",
      minAmount: 10,
    },
    silver: {
      label: "Silver",
      icon: "🥈",
      bgColor: "bg-gray-100",
      color: "text-gray-700",
      borderColor: "border-gray-300",
      minAmount: 50,
    },
    gold: {
      label: "Gold",
      icon: "🥇",
      bgColor: "bg-yellow-100",
      color: "text-yellow-700",
      borderColor: "border-yellow-400",
      minAmount: 100,
    },
    platinum: {
      label: "Platinum",
      icon: "💎",
      bgColor: "bg-cyan-100",
      color: "text-cyan-700",
      borderColor: "border-cyan-400",
      minAmount: 500,
    },
  },
}));

describe("DonorBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<DonorBadge tier="bronze" />)).not.toThrow();
    });

    it("should render a span element", () => {
      const { container } = render(<DonorBadge tier="bronze" />);
      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });

  describe("Tier Display", () => {
    it("should show bronze label and icon", () => {
      render(<DonorBadge tier="bronze" />);
      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("should show silver label and icon", () => {
      render(<DonorBadge tier="silver" />);
      expect(screen.getByText("Silver")).toBeInTheDocument();
      expect(screen.getByText("🥈")).toBeInTheDocument();
    });

    it("should show gold label and icon", () => {
      render(<DonorBadge tier="gold" />);
      expect(screen.getByText("Gold")).toBeInTheDocument();
      expect(screen.getByText("🥇")).toBeInTheDocument();
    });

    it("should show platinum label and icon", () => {
      render(<DonorBadge tier="platinum" />);
      expect(screen.getByText("Platinum")).toBeInTheDocument();
      expect(screen.getByText("💎")).toBeInTheDocument();
    });
  });

  describe("Tier Colors", () => {
    it("should have bronze styling", () => {
      const { container } = render(<DonorBadge tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-amber-100");
      expect(badge?.className).toContain("text-amber-700");
      expect(badge?.className).toContain("border-amber-300");
    });

    it("should have silver styling", () => {
      const { container } = render(<DonorBadge tier="silver" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-gray-100");
      expect(badge?.className).toContain("text-gray-700");
    });

    it("should have gold styling", () => {
      const { container } = render(<DonorBadge tier="gold" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-yellow-100");
      expect(badge?.className).toContain("text-yellow-700");
    });

    it("should have platinum styling", () => {
      const { container } = render(<DonorBadge tier="platinum" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-cyan-100");
      expect(badge?.className).toContain("text-cyan-700");
    });
  });

  describe("Size Variants", () => {
    it("should render sm size", () => {
      const { container } = render(<DonorBadge tier="bronze" size="sm" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-xs");
      expect(badge?.className).toContain("px-1.5");
      expect(badge?.className).toContain("py-0.5");
    });

    it("should render md size by default", () => {
      const { container } = render(<DonorBadge tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-sm");
      expect(badge?.className).toContain("px-2");
      expect(badge?.className).toContain("py-1");
    });

    it("should render lg size", () => {
      const { container } = render(<DonorBadge tier="bronze" size="lg" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("text-base");
      expect(badge?.className).toContain("px-3");
      expect(badge?.className).toContain("py-1.5");
    });
  });

  describe("Label and Icon Visibility", () => {
    it("should show both label and icon by default", () => {
      render(<DonorBadge tier="bronze" />);
      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("should hide label when showLabel is false", () => {
      render(<DonorBadge tier="bronze" showLabel={false} />);
      expect(screen.queryByText("Bronze")).not.toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("should hide icon when showIcon is false", () => {
      render(<DonorBadge tier="bronze" showIcon={false} />);
      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.queryByText("🥉")).not.toBeInTheDocument();
    });

    it("should show neither when both are false", () => {
      render(<DonorBadge tier="bronze" showLabel={false} showIcon={false} />);
      expect(screen.queryByText("Bronze")).not.toBeInTheDocument();
      expect(screen.queryByText("🥉")).not.toBeInTheDocument();
    });
  });

  describe("Title Attribute", () => {
    it("should show tier and min amount in title", () => {
      render(<DonorBadge tier="bronze" />);
      expect(screen.getByTitle("Bronze - Contributed $10+")).toBeInTheDocument();
    });

    it("should show correct amounts for each tier", () => {
      const { rerender } = render(<DonorBadge tier="silver" />);
      expect(screen.getByTitle("Silver - Contributed $50+")).toBeInTheDocument();

      rerender(<DonorBadge tier="gold" />);
      expect(screen.getByTitle("Gold - Contributed $100+")).toBeInTheDocument();

      rerender(<DonorBadge tier="platinum" />);
      expect(screen.getByTitle("Platinum - Contributed $500+")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<DonorBadge tier="bronze" className="custom-class" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("custom-class");
    });
  });

  describe("Styling", () => {
    it("should be rounded-full", () => {
      const { container } = render(<DonorBadge tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("rounded-full");
    });

    it("should have border", () => {
      const { container } = render(<DonorBadge tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("border");
    });

    it("should have transition", () => {
      const { container } = render(<DonorBadge tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("transition-all");
    });
  });
});

describe("DonorBadgeCompact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<DonorBadgeCompact tier="bronze" />)).not.toThrow();
    });

    it("should show only icon", () => {
      render(<DonorBadgeCompact tier="bronze" />);
      expect(screen.getByText("🥉")).toBeInTheDocument();
      expect(screen.queryByText("Bronze")).not.toBeInTheDocument();
    });
  });

  describe("Tier Icons", () => {
    it("should show bronze icon", () => {
      render(<DonorBadgeCompact tier="bronze" />);
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("should show silver icon", () => {
      render(<DonorBadgeCompact tier="silver" />);
      expect(screen.getByText("🥈")).toBeInTheDocument();
    });

    it("should show gold icon", () => {
      render(<DonorBadgeCompact tier="gold" />);
      expect(screen.getByText("🥇")).toBeInTheDocument();
    });

    it("should show platinum icon", () => {
      render(<DonorBadgeCompact tier="platinum" />);
      expect(screen.getByText("💎")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should be fixed size (w-5 h-5)", () => {
      const { container } = render(<DonorBadgeCompact tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("w-5");
      expect(badge?.className).toContain("h-5");
    });

    it("should be rounded-full", () => {
      const { container } = render(<DonorBadgeCompact tier="bronze" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("rounded-full");
    });

    it("should have tier background color", () => {
      const { container } = render(<DonorBadgeCompact tier="gold" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("bg-yellow-100");
    });
  });

  describe("Title Attribute", () => {
    it("should show tier label as title", () => {
      render(<DonorBadgeCompact tier="gold" />);
      expect(screen.getByTitle("Gold")).toBeInTheDocument();
    });
  });
});

describe("DonorBadgeProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() =>
        render(<DonorBadgeProgress tier="bronze" totalDonated={25} amountToNextTier={25} />)
      ).not.toThrow();
    });

    it("should render the DonorBadge", () => {
      render(<DonorBadgeProgress tier="bronze" totalDonated={25} amountToNextTier={25} />);
      expect(screen.getByText("Bronze")).toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("should show progress bar when not platinum", () => {
      const { container } = render(
        <DonorBadgeProgress tier="bronze" totalDonated={25} amountToNextTier={25} />
      );
      expect(container.querySelector(".bg-gray-200")).toBeInTheDocument();
    });

    it("should not show progress bar for platinum tier", () => {
      const { container } = render(
        <DonorBadgeProgress tier="platinum" totalDonated={600} amountToNextTier={null} />
      );
      // Platinum has no progress bar
      expect(container.querySelector(".h-1\\.5.rounded-full.transition-all")).not.toBeInTheDocument();
    });

    it("should show amount to next tier", () => {
      render(<DonorBadgeProgress tier="bronze" totalDonated={25} amountToNextTier={25} />);
      expect(screen.getByText(/\$25 to/)).toBeInTheDocument();
      expect(screen.getByText(/silver/)).toBeInTheDocument();
    });
  });

  describe("Platinum Tier Message", () => {
    it("should show highest tier message for platinum", () => {
      render(<DonorBadgeProgress tier="platinum" totalDonated={600} amountToNextTier={null} />);
      expect(screen.getByText(/highest tier/)).toBeInTheDocument();
    });
  });
});

describe("DonorCard", () => {
  const defaultProps = {
    displayName: "John Doe",
    tier: "gold" as const,
    totalDonated: 150,
    donationCount: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<DonorCard {...defaultProps} />)).not.toThrow();
    });

    it("should render display name", () => {
      render(<DonorCard {...defaultProps} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should render compact badge", () => {
      render(<DonorCard {...defaultProps} />);
      expect(screen.getByText("🥇")).toBeInTheDocument();
    });
  });

  describe("Donation Info", () => {
    it("should show total donated amount", () => {
      render(<DonorCard {...defaultProps} />);
      expect(screen.getByText("$150")).toBeInTheDocument();
    });

    it("should show donation count (singular)", () => {
      render(<DonorCard {...defaultProps} donationCount={1} />);
      expect(screen.getByText("1 donation")).toBeInTheDocument();
    });

    it("should show donation count (plural)", () => {
      render(<DonorCard {...defaultProps} donationCount={5} />);
      expect(screen.getByText("5 donations")).toBeInTheDocument();
    });
  });

  describe("Avatar", () => {
    it("should show initial when no avatar", () => {
      render(<DonorCard {...defaultProps} />);
      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("should show image when avatarUrl provided", () => {
      const { container } = render(
        <DonorCard {...defaultProps} avatarUrl="https://example.com/avatar.jpg" />
      );
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img?.getAttribute("src")).toBe("https://example.com/avatar.jpg");
    });
  });

  describe("Message", () => {
    it("should show message when provided", () => {
      render(<DonorCard {...defaultProps} message="Great project!" />);
      // Message is wrapped with smart quotes (&ldquo; and &rdquo;)
      expect(screen.getByText(/Great project!/)).toBeInTheDocument();
    });

    it("should not show message when not provided", () => {
      render(<DonorCard {...defaultProps} />);
      expect(screen.queryByText(/"/)).not.toBeInTheDocument();
    });
  });

  describe("Last Donation Date", () => {
    it("should show last donation date when provided", () => {
      render(<DonorCard {...defaultProps} lastDonationAt="2024-01-15T10:00:00Z" />);
      expect(screen.getByText(/Last donation:/)).toBeInTheDocument();
    });

    it("should not show last donation when not provided", () => {
      render(<DonorCard {...defaultProps} />);
      expect(screen.queryByText(/Last donation:/)).not.toBeInTheDocument();
    });
  });

  describe("Tier Styling", () => {
    it("should have ring for platinum tier", () => {
      const { container } = render(<DonorCard {...defaultProps} tier="platinum" />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("ring-2");
      expect(card.className).toContain("ring-cyan-400/30");
    });

    it("should not have ring for non-platinum tiers", () => {
      const { container } = render(<DonorCard {...defaultProps} tier="gold" />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain("ring-2");
    });
  });
});
