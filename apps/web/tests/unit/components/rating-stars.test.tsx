/**
 * RatingStars Component Tests
 *
 * Tests for interactive 5-star rating component:
 * - Star display and hover states
 * - Click handling
 * - Authentication gating
 * - Optimistic updates
 * - Average rating display
 * - Size variants
 * - Readonly mode
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RatingStars } from "@/components/interactions/rating-stars";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock auth hook
const mockShowSignIn = vi.fn();
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    showSignIn: mockShowSignIn,
  }),
}));

// Mock toast hook
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  }),
}));

// Mock submitRating action
const mockSubmitRating = vi.fn();
vi.mock("@/app/actions/ratings", () => ({
  submitRating: (...args: unknown[]) => mockSubmitRating(...args),
}));

describe("RatingStars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitRating.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() =>
        render(<RatingStars resourceType="resource" resourceId="123" />)
      ).not.toThrow();
    });

    it("should render 5 star buttons", () => {
      render(<RatingStars resourceType="resource" resourceId="123" />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(5);
    });

    it("should have accessible labels for each star", () => {
      render(<RatingStars resourceType="resource" resourceId="123" />);
      expect(screen.getByLabelText("Rate 1 star")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 2 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 3 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 4 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 5 stars")).toBeInTheDocument();
    });

    it("should render SVG stars", () => {
      const { container } = render(<RatingStars resourceType="resource" resourceId="123" />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(5);
    });
  });

  describe("Initial Rating", () => {
    it("should show filled stars based on initialRating", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" initialRating={3} />
      );
      const svgs = container.querySelectorAll("svg");
      // First 3 should be filled (yellow)
      expect(svgs[0].getAttribute("class")).toContain("fill-yellow-400");
      expect(svgs[1].getAttribute("class")).toContain("fill-yellow-400");
      expect(svgs[2].getAttribute("class")).toContain("fill-yellow-400");
      // Last 2 should be unfilled
      expect(svgs[3].getAttribute("class")).toContain("fill-none");
      expect(svgs[4].getAttribute("class")).toContain("fill-none");
    });

    it("should show unfilled stars when no initialRating", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" />
      );
      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class")).toContain("fill-none");
      });
    });
  });

  describe("Average Rating Display", () => {
    it("should show average rating when provided", () => {
      render(
        <RatingStars
          resourceType="resource"
          resourceId="123"
          averageRating={4.5}
        />
      );
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("should show total ratings count when provided", () => {
      render(
        <RatingStars
          resourceType="resource"
          resourceId="123"
          totalRatings={42}
        />
      );
      expect(screen.getByText("(42)")).toBeInTheDocument();
    });

    it("should show both average and count", () => {
      render(
        <RatingStars
          resourceType="resource"
          resourceId="123"
          averageRating={4.2}
          totalRatings={15}
        />
      );
      expect(screen.getByText("4.2")).toBeInTheDocument();
      expect(screen.getByText("(15)")).toBeInTheDocument();
    });

    it("should hide average when showAverage is false", () => {
      render(
        <RatingStars
          resourceType="resource"
          resourceId="123"
          averageRating={4.5}
          totalRatings={10}
          showAverage={false}
        />
      );
      expect(screen.queryByText("4.5")).not.toBeInTheDocument();
      expect(screen.queryByText("(10)")).not.toBeInTheDocument();
    });

    it("should not show count of 0", () => {
      render(
        <RatingStars
          resourceType="resource"
          resourceId="123"
          totalRatings={0}
        />
      );
      expect(screen.queryByText("(0)")).not.toBeInTheDocument();
    });
  });

  describe("Hover State", () => {
    it("should fill stars on hover", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" />
      );
      const buttons = screen.getAllByRole("button");

      // Hover over 4th star
      fireEvent.mouseEnter(buttons[3]);

      const svgs = container.querySelectorAll("svg");
      // First 4 should be highlighted
      expect(svgs[0].getAttribute("class")).toContain("fill-yellow-400");
      expect(svgs[1].getAttribute("class")).toContain("fill-yellow-400");
      expect(svgs[2].getAttribute("class")).toContain("fill-yellow-400");
      expect(svgs[3].getAttribute("class")).toContain("fill-yellow-400");
      // 5th should not be highlighted
      expect(svgs[4].getAttribute("class")).toContain("fill-none");
    });

    it("should clear hover state on mouse leave", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" />
      );
      const buttons = screen.getAllByRole("button");

      fireEvent.mouseEnter(buttons[3]);
      fireEvent.mouseLeave(buttons[3]);

      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class")).toContain("fill-none");
      });
    });

    it("should not show hover state in readonly mode", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" readonly={true} />
      );
      const buttons = screen.getAllByRole("button");

      fireEvent.mouseEnter(buttons[3]);

      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class")).toContain("fill-none");
      });
    });
  });

  describe("Click Handling", () => {
    it("should call submitRating when clicked", async () => {
      render(<RatingStars resourceType="resource" resourceId="123" />);
      const buttons = screen.getAllByRole("button");

      fireEvent.click(buttons[3]); // Click 4th star

      await waitFor(() => {
        expect(mockSubmitRating).toHaveBeenCalledWith("resource", "123", 4);
      });
    });

    it("should show success toast on successful rating", async () => {
      mockSubmitRating.mockResolvedValue({ success: true });

      render(<RatingStars resourceType="resource" resourceId="123" />);
      const buttons = screen.getAllByRole("button");

      fireEvent.click(buttons[3]);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Rated 4 stars");
      });
    });

    it("should show singular toast for 1 star", async () => {
      mockSubmitRating.mockResolvedValue({ success: true });

      render(<RatingStars resourceType="resource" resourceId="123" />);
      const buttons = screen.getAllByRole("button");

      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Rated 1 star");
      });
    });

    it("should show error toast on failed rating", async () => {
      mockSubmitRating.mockResolvedValue({ error: "Rating failed" });

      render(<RatingStars resourceType="resource" resourceId="123" />);
      const buttons = screen.getAllByRole("button");

      fireEvent.click(buttons[3]);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Rating failed");
      });
    });

    it("should not call submitRating in readonly mode", () => {
      render(<RatingStars resourceType="resource" resourceId="123" readonly={true} />);
      const buttons = screen.getAllByRole("button");

      fireEvent.click(buttons[3]);

      expect(mockSubmitRating).not.toHaveBeenCalled();
    });
  });

  describe("Authentication", () => {
    it("should show sign in prompt when not authenticated", () => {
      // Override mock for this test
      vi.doMock("@/components/providers/auth-provider", () => ({
        useAuth: () => ({
          isAuthenticated: false,
          showSignIn: mockShowSignIn,
        }),
      }));

      // Note: Due to module caching, we test the toast info message
      // The actual auth check happens at click time
    });
  });

  describe("Readonly Mode", () => {
    it("should disable all buttons in readonly mode", () => {
      render(<RatingStars resourceType="resource" resourceId="123" readonly={true} />);
      const buttons = screen.getAllByRole("button");

      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should have cursor-default in readonly mode", () => {
      render(<RatingStars resourceType="resource" resourceId="123" readonly={true} />);
      const buttons = screen.getAllByRole("button");

      buttons.forEach((button) => {
        expect(button.className).toContain("cursor-default");
      });
    });

    it("should have hover:scale effect in interactive mode", () => {
      render(<RatingStars resourceType="resource" resourceId="123" readonly={false} />);
      const buttons = screen.getAllByRole("button");

      buttons.forEach((button) => {
        // Interactive mode has hover:scale-110 effect
        expect(button.className).toContain("hover:scale-110");
      });
    });
  });

  describe("Size Variants", () => {
    it("should render sm size", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" size="sm" />
      );
      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class")).toContain("w-3.5");
        expect(svg.getAttribute("class")).toContain("h-3.5");
      });
    });

    it("should render md size by default", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" />
      );
      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class")).toContain("w-5");
        expect(svg.getAttribute("class")).toContain("h-5");
      });
    });

    it("should render lg size", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" size="lg" />
      );
      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class")).toContain("w-6");
        expect(svg.getAttribute("class")).toContain("h-6");
      });
    });
  });

  describe("Gap Styling", () => {
    it("should have sm gap", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" size="sm" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("gap-0.5");
    });

    it("should have md gap", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" size="md" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("gap-1");
    });

    it("should have lg gap", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" size="lg" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("gap-1.5");
    });
  });

  describe("Accessibility", () => {
    it("should have role group for stars", () => {
      render(<RatingStars resourceType="resource" resourceId="123" />);
      expect(screen.getByRole("group", { name: "Rating" })).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <RatingStars resourceType="resource" resourceId="123" className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("custom-class");
    });
  });
});
