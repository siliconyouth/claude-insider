/**
 * AchievementBadge Component Tests
 *
 * Tests for the achievement badge display:
 * - Tier colors (bronze, silver, gold, platinum)
 * - Size variants (sm, md, lg)
 * - Icon rendering
 * - Tooltip display
 * - Click handling
 * - Featured state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AchievementBadge } from "@/components/achievements/achievement-badge";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("AchievementBadge", () => {
  const defaultProps = {
    name: "First Steps",
    description: "Send your first message",
    icon: "chat",
    tier: "bronze" as const,
    points: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<AchievementBadge {...defaultProps} />)).not.toThrow();
    });

    it("should render a button element", () => {
      render(<AchievementBadge {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render an SVG icon", () => {
      const { container } = render(<AchievementBadge {...defaultProps} />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render small size", () => {
      render(<AchievementBadge {...defaultProps} size="sm" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-10");
      expect(button.className).toContain("h-10");
    });

    it("should render medium size by default", () => {
      render(<AchievementBadge {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-14");
      expect(button.className).toContain("h-14");
    });

    it("should render large size", () => {
      render(<AchievementBadge {...defaultProps} size="lg" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-20");
      expect(button.className).toContain("h-20");
    });

    it("should have small icon for small size", () => {
      const { container } = render(<AchievementBadge {...defaultProps} size="sm" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("w-5");
      expect(svg?.getAttribute("class")).toContain("h-5");
    });

    it("should have medium icon for medium size", () => {
      const { container } = render(<AchievementBadge {...defaultProps} size="md" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("w-7");
      expect(svg?.getAttribute("class")).toContain("h-7");
    });

    it("should have large icon for large size", () => {
      const { container } = render(<AchievementBadge {...defaultProps} size="lg" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("w-10");
      expect(svg?.getAttribute("class")).toContain("h-10");
    });
  });

  describe("Tier Colors", () => {
    it("should have bronze styling", () => {
      render(<AchievementBadge {...defaultProps} tier="bronze" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-amber-100");
      expect(button.className).toContain("border-amber-300");
    });

    it("should have silver styling", () => {
      render(<AchievementBadge {...defaultProps} tier="silver" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-gray-100");
      expect(button.className).toContain("border-gray-300");
    });

    it("should have gold styling", () => {
      render(<AchievementBadge {...defaultProps} tier="gold" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-yellow-100");
      expect(button.className).toContain("border-yellow-400");
    });

    it("should have platinum gradient styling", () => {
      render(<AchievementBadge {...defaultProps} tier="platinum" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("from-violet-100");
      expect(button.className).toContain("border-violet-400");
    });

    it("should have bronze icon color", () => {
      const { container } = render(<AchievementBadge {...defaultProps} tier="bronze" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("text-amber-600");
    });

    it("should have silver icon color", () => {
      const { container } = render(<AchievementBadge {...defaultProps} tier="silver" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("text-gray-600");
    });

    it("should have gold icon color", () => {
      const { container } = render(<AchievementBadge {...defaultProps} tier="gold" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("text-yellow-600");
    });

    it("should have platinum icon color", () => {
      const { container } = render(<AchievementBadge {...defaultProps} tier="platinum" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("text-violet-600");
    });
  });

  describe("Tooltip", () => {
    it("should render tooltip by default", () => {
      render(<AchievementBadge {...defaultProps} />);

      expect(screen.getByText("First Steps")).toBeInTheDocument();
    });

    it("should show description in tooltip", () => {
      render(<AchievementBadge {...defaultProps} />);

      expect(screen.getByText("Send your first message")).toBeInTheDocument();
    });

    it("should show tier badge in tooltip", () => {
      render(<AchievementBadge {...defaultProps} tier="bronze" />);

      expect(screen.getByText("bronze")).toBeInTheDocument();
    });

    it("should show points in tooltip", () => {
      render(<AchievementBadge {...defaultProps} points={25} />);

      expect(screen.getByText("+25 pts")).toBeInTheDocument();
    });

    it("should show earned date when provided", () => {
      const earnedAt = "2024-01-15T10:00:00Z";
      render(<AchievementBadge {...defaultProps} earnedAt={earnedAt} />);

      // Should contain "Earned" text
      expect(screen.getByText(/Earned/)).toBeInTheDocument();
    });

    it("should not show tooltip when showTooltip is false", () => {
      render(<AchievementBadge {...defaultProps} showTooltip={false} />);

      // Name should not be visible (it's only in tooltip)
      expect(screen.queryByText("First Steps")).not.toBeInTheDocument();
    });
  });

  describe("Click Handling", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<AchievementBadge {...defaultProps} onClick={handleClick} />);

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should have hover styles when onClick is provided", () => {
      const handleClick = vi.fn();
      render(<AchievementBadge {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("cursor-pointer");
      expect(button.className).toContain("hover:scale-110");
    });

    it("should not call onClick when not provided", () => {
      render(<AchievementBadge {...defaultProps} />);

      // Should not throw
      expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
    });
  });

  describe("Featured State", () => {
    it("should have ring styling when featured", () => {
      render(<AchievementBadge {...defaultProps} isFeatured={true} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("ring-2");
      expect(button.className).toContain("ring-offset-2");
    });

    it("should not have ring styling when not featured", () => {
      render(<AchievementBadge {...defaultProps} isFeatured={false} />);

      const button = screen.getByRole("button");
      expect(button.className).not.toContain("ring-offset-2");
    });
  });

  describe("Icon Types", () => {
    it("should render chat icon", () => {
      const { container } = render(<AchievementBadge {...defaultProps} icon="chat" />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render star icon", () => {
      const { container } = render(<AchievementBadge {...defaultProps} icon="star" />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render heart icon", () => {
      const { container } = render(<AchievementBadge {...defaultProps} icon="heart" />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render trophy icon", () => {
      const { container } = render(<AchievementBadge {...defaultProps} icon="trophy" />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render shield-check icon", () => {
      const { container } = render(<AchievementBadge {...defaultProps} icon="shield-check" />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render default icon for unknown type", () => {
      const { container } = render(<AchievementBadge {...defaultProps} icon="unknown-icon" />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should be rounded full", () => {
      render(<AchievementBadge {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-full");
    });

    it("should have border-2", () => {
      render(<AchievementBadge {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("border-2");
    });

    it("should have transition for animation", () => {
      render(<AchievementBadge {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("transition-all");
    });

    it("should have group class for tooltip hover", () => {
      const { container } = render(<AchievementBadge {...defaultProps} />);

      expect(container.querySelector(".group")).toBeInTheDocument();
    });
  });
});
