/**
 * FavoriteButton Component Tests
 *
 * Tests for the favorite/heart button:
 * - Initial rendering
 * - Authentication requirement
 * - Optimistic updates
 * - Different sizes
 * - Count display
 * - Error handling
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FavoriteButton } from "@/components/interactions/favorite-button";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock auth provider
const mockShowSignIn = vi.fn();
const mockIsAuthenticated = { value: true };
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated.value,
    showSignIn: mockShowSignIn,
  }),
}));

// Mock toggleFavorite action
const mockToggleFavorite = vi.fn();
vi.mock("@/app/actions/favorites", () => ({
  toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
}));

// Mock toast
const mockToastInfo = vi.fn();
const mockToastError = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    info: mockToastInfo,
    error: mockToastError,
  }),
}));

describe("FavoriteButton", () => {
  const defaultProps = {
    resourceType: "resource" as const,
    resourceId: "test-resource-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.value = true;
    mockToggleFavorite.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render button", () => {
      render(<FavoriteButton {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render heart icon", () => {
      const { container } = render(<FavoriteButton {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have accessible label for unfavorited state", () => {
      render(<FavoriteButton {...defaultProps} />);

      expect(screen.getByLabelText("Add to favorites")).toBeInTheDocument();
    });

    it("should have accessible label for favorited state", () => {
      render(<FavoriteButton {...defaultProps} initialIsFavorited={true} />);

      expect(screen.getByLabelText("Remove from favorites")).toBeInTheDocument();
    });

    it("should have aria-pressed attribute", () => {
      render(<FavoriteButton {...defaultProps} initialIsFavorited={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Size Variants", () => {
    it("should render small size", () => {
      render(<FavoriteButton {...defaultProps} size="sm" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("h-7");
      expect(button.className).toContain("w-7");
    });

    it("should render medium size by default", () => {
      render(<FavoriteButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("h-9");
      expect(button.className).toContain("w-9");
    });

    it("should render large size", () => {
      render(<FavoriteButton {...defaultProps} size="lg" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("h-11");
      expect(button.className).toContain("w-11");
    });

    it("should have small icon for small size", () => {
      const { container } = render(<FavoriteButton {...defaultProps} size="sm" />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("w-4");
      expect(svg?.getAttribute("class")).toContain("h-4");
    });

    it("should have large icon for large size", () => {
      const { container } = render(<FavoriteButton {...defaultProps} size="lg" />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("w-6");
      expect(svg?.getAttribute("class")).toContain("h-6");
    });
  });

  describe("Visual States", () => {
    it("should show unfilled heart when not favorited", () => {
      const { container } = render(<FavoriteButton {...defaultProps} />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("fill-none");
    });

    it("should show filled red heart when favorited", () => {
      const { container } = render(<FavoriteButton {...defaultProps} initialIsFavorited={true} />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("fill-red-500");
    });

    it("should scale up heart when favorited", () => {
      const { container } = render(<FavoriteButton {...defaultProps} initialIsFavorited={true} />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("scale-110");
    });

    it("should have gray color when not favorited", () => {
      const { container } = render(<FavoriteButton {...defaultProps} />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("text-gray-400");
    });

    it("should have red color when favorited", () => {
      const { container } = render(<FavoriteButton {...defaultProps} initialIsFavorited={true} />);

      const svg = container.querySelector("svg");
      // SVG className is SVGAnimatedString, use getAttribute
      expect(svg?.getAttribute("class")).toContain("text-red-500");
    });
  });

  describe("Count Display", () => {
    it("should not show count by default", () => {
      render(<FavoriteButton {...defaultProps} count={5} />);

      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });

    it("should show count when showCount is true", () => {
      render(<FavoriteButton {...defaultProps} showCount={true} count={5} />);

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should not show count when count is 0", () => {
      render(<FavoriteButton {...defaultProps} showCount={true} count={0} />);

      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("should have count styling", () => {
      render(<FavoriteButton {...defaultProps} showCount={true} count={5} />);

      const countElement = screen.getByText("5");
      expect(countElement.className).toContain("text-xs");
      expect(countElement.className).toContain("text-gray-500");
    });
  });

  describe("Authentication", () => {
    it("should show sign in prompt when not authenticated", () => {
      mockIsAuthenticated.value = false;

      render(<FavoriteButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockToastInfo).toHaveBeenCalledWith("Sign in to save favorites");
      expect(mockShowSignIn).toHaveBeenCalled();
    });

    it("should not call toggleFavorite when not authenticated", () => {
      mockIsAuthenticated.value = false;

      render(<FavoriteButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockToggleFavorite).not.toHaveBeenCalled();
    });
  });

  describe("Optimistic Updates", () => {
    it("should toggle favorited state immediately on click", () => {
      render(<FavoriteButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      // Should immediately show favorited state
      expect(screen.getByLabelText("Remove from favorites")).toBeInTheDocument();
    });

    it("should increment count optimistically", () => {
      render(<FavoriteButton {...defaultProps} showCount={true} count={5} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("6")).toBeInTheDocument();
    });

    it("should decrement count when unfavoriting", () => {
      render(<FavoriteButton {...defaultProps} showCount={true} count={5} initialIsFavorited={true} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should not go below 0 for count", () => {
      render(<FavoriteButton {...defaultProps} showCount={true} count={0} initialIsFavorited={true} />);

      fireEvent.click(screen.getByRole("button"));

      // Count should not be negative (stays at 0)
      expect(screen.queryByText("-1")).not.toBeInTheDocument();
    });
  });

  describe("API Interaction", () => {
    it("should call toggleFavorite with correct params", async () => {
      render(<FavoriteButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockToggleFavorite).toHaveBeenCalledWith("resource", "test-resource-123");
      });
    });

    it("should work with doc resourceType", async () => {
      render(<FavoriteButton {...defaultProps} resourceType="doc" />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockToggleFavorite).toHaveBeenCalledWith("doc", "test-resource-123");
      });
    });
  });

  describe("Error Handling", () => {
    it("should revert state on error", async () => {
      mockToggleFavorite.mockResolvedValue({ error: "Failed to toggle" });

      render(<FavoriteButton {...defaultProps} />);

      // Click to favorite
      fireEvent.click(screen.getByRole("button"));

      // Wait for error to be processed
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to toggle");
      });

      // Should revert to unfavorited
      expect(screen.getByLabelText("Add to favorites")).toBeInTheDocument();
    });

    it("should revert count on error", async () => {
      mockToggleFavorite.mockResolvedValue({ error: "Failed" });

      render(<FavoriteButton {...defaultProps} showCount={true} count={5} />);

      fireEvent.click(screen.getByRole("button"));

      // Initially shows optimistic count
      expect(screen.getByText("6")).toBeInTheDocument();

      await waitFor(() => {
        // Should revert to original count
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });
  });

  describe("Disabled State", () => {
    it("should show pending state during transition", async () => {
      // Make the promise never resolve to see pending state
      mockToggleFavorite.mockReturnValue(new Promise(() => {}));

      render(<FavoriteButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button.className).toContain("opacity-50");
    });
  });

  describe("Styling", () => {
    it("should be rounded full", () => {
      render(<FavoriteButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-full");
    });

    it("should have hover background", () => {
      render(<FavoriteButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("hover:bg-gray-100");
    });

    it("should have focus ring", () => {
      render(<FavoriteButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("focus-visible:ring-2");
    });

    it("should apply custom className", () => {
      render(<FavoriteButton {...defaultProps} className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("custom-class");
    });

    it("should have transition for smooth animation", () => {
      render(<FavoriteButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("transition-all");
    });
  });
});
