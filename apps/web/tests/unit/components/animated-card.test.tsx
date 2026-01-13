/**
 * Animated Card Component Tests
 *
 * Tests for cards with 3D tilt, glow effects, and smooth interactions.
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import {
  AnimatedCard,
  AnimatedCardLink,
  FeatureCard,
  StatsCard,
  ImageCard,
  CardGrid,
} from "@/components/animated-card";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    target,
    rel,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} target={target} rel={rel} {...props}>
      {children}
    </a>
  ),
}));

// Mock use-animations hooks
const mockUseReducedMotion = vi.fn().mockReturnValue(false);
const mockUseTilt = vi.fn().mockReturnValue({
  tiltStyle: { transform: "perspective(1000px)" },
  handlers: {
    onMouseMove: vi.fn(),
    onMouseLeave: vi.fn(),
  },
});
const mockUseHoverGlow = vi.fn().mockReturnValue({
  glowStyle: { position: "absolute", background: "blue" },
  handlers: {
    onMouseMove: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
  },
});

vi.mock("@/hooks/use-animations", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
  useTilt: (config: unknown) => mockUseTilt(config),
  useHoverGlow: (config: unknown) => mockUseHoverGlow(config),
}));

describe("Animated Card Components", () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("AnimatedCard", () => {
    describe("Rendering", () => {
      it("should render children", () => {
        render(
          <AnimatedCard>
            <div data-testid="content">Card content</div>
          </AnimatedCard>
        );

        expect(screen.getByTestId("content")).toBeInTheDocument();
      });

      it("should have rounded-xl class", () => {
        const { container } = render(<AnimatedCard>Content</AnimatedCard>);

        expect(container.firstChild).toHaveClass("rounded-xl");
      });

      it("should have overflow-hidden class", () => {
        const { container } = render(<AnimatedCard>Content</AnimatedCard>);

        expect(container.firstChild).toHaveClass("overflow-hidden");
      });

      it("should support forwardRef", () => {
        const ref = createRef<HTMLDivElement>();
        render(<AnimatedCard ref={ref}>Content</AnimatedCard>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });

      it("should pass additional props to container", () => {
        render(
          <AnimatedCard data-testid="card" aria-label="Test card">
            Content
          </AnimatedCard>
        );

        expect(screen.getByTestId("card")).toHaveAttribute(
          "aria-label",
          "Test card"
        );
      });
    });

    describe("Variants", () => {
      it("should apply default variant styles", () => {
        const { container } = render(
          <AnimatedCard variant="default">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("bg-white");
        expect(container.firstChild).toHaveClass("dark:bg-[#111111]");
      });

      it("should apply elevated variant styles", () => {
        const { container } = render(
          <AnimatedCard variant="elevated">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("shadow-lg");
      });

      it("should apply bordered variant styles", () => {
        const { container } = render(
          <AnimatedCard variant="bordered">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("bg-transparent");
        expect(container.firstChild).toHaveClass("border-2");
      });

      it("should apply glass variant styles", () => {
        const { container } = render(
          <AnimatedCard variant="glass">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("backdrop-blur-lg");
      });
    });

    describe("Padding", () => {
      it("should apply no padding", () => {
        const { container } = render(
          <AnimatedCard padding="none">Content</AnimatedCard>
        );

        expect(container.firstChild).not.toHaveClass("p-4");
        expect(container.firstChild).not.toHaveClass("p-6");
        expect(container.firstChild).not.toHaveClass("p-8");
      });

      it("should apply sm padding", () => {
        const { container } = render(
          <AnimatedCard padding="sm">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("p-4");
      });

      it("should apply md padding (default)", () => {
        const { container } = render(<AnimatedCard>Content</AnimatedCard>);

        expect(container.firstChild).toHaveClass("p-6");
      });

      it("should apply lg padding", () => {
        const { container } = render(
          <AnimatedCard padding="lg">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("p-8");
      });
    });

    describe("Tilt Effect", () => {
      it("should not apply tilt by default", () => {
        render(<AnimatedCard>Content</AnimatedCard>);

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: true })
        );
      });

      it("should apply tilt when enabled", () => {
        render(<AnimatedCard tilt>Content</AnimatedCard>);

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });

      it("should pass maxTilt to useTilt", () => {
        render(
          <AnimatedCard tilt maxTilt={15}>
            Content
          </AnimatedCard>
        );

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ maxTilt: 15 })
        );
      });

      it("should pass hoverScale to useTilt", () => {
        render(
          <AnimatedCard tilt hoverScale={1.05}>
            Content
          </AnimatedCard>
        );

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ scale: 1.05 })
        );
      });

      it("should disable tilt when reduced motion preferred", () => {
        mockUseReducedMotion.mockReturnValue(true);
        render(<AnimatedCard tilt>Content</AnimatedCard>);

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: true })
        );
      });
    });

    describe("Glow Effect", () => {
      it("should not apply glow by default", () => {
        render(<AnimatedCard>Content</AnimatedCard>);

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: true })
        );
      });

      it("should apply glow when enabled", () => {
        render(<AnimatedCard glow>Content</AnimatedCard>);

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });

      it("should pass glowColor to useHoverGlow", () => {
        render(
          <AnimatedCard glow glowColor="rgba(255, 0, 0, 0.2)">
            Content
          </AnimatedCard>
        );

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ color: "rgba(255, 0, 0, 0.2)" })
        );
      });

      it("should render glow overlay when glow enabled", () => {
        const { container } = render(<AnimatedCard glow>Content</AnimatedCard>);

        const glowOverlay = container.querySelector('[aria-hidden="true"]');
        expect(glowOverlay).toBeInTheDocument();
      });

      it("should not render glow overlay when reduced motion preferred", () => {
        mockUseReducedMotion.mockReturnValue(true);
        const { container } = render(<AnimatedCard glow>Content</AnimatedCard>);

        const glowOverlay = container.querySelector('[aria-hidden="true"]');
        expect(glowOverlay).not.toBeInTheDocument();
      });
    });

    describe("Interactive Mode", () => {
      it("should not have cursor-pointer by default", () => {
        const { container } = render(<AnimatedCard>Content</AnimatedCard>);

        expect(container.firstChild).not.toHaveClass("cursor-pointer");
      });

      it("should have cursor-pointer when interactive", () => {
        const { container } = render(
          <AnimatedCard interactive>Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("cursor-pointer");
      });
    });

    describe("Reduced Motion", () => {
      it("should have transition-none when reduced motion preferred", () => {
        mockUseReducedMotion.mockReturnValue(true);
        const { container } = render(<AnimatedCard>Content</AnimatedCard>);

        expect(container.firstChild).toHaveClass("transition-none");
      });

      it("should have transition-all when motion allowed", () => {
        const { container } = render(<AnimatedCard>Content</AnimatedCard>);

        expect(container.firstChild).toHaveClass("transition-all");
      });
    });

    describe("className Prop", () => {
      it("should merge custom className", () => {
        const { container } = render(
          <AnimatedCard className="custom-class">Content</AnimatedCard>
        );

        expect(container.firstChild).toHaveClass("custom-class");
        expect(container.firstChild).toHaveClass("rounded-xl");
      });
    });
  });

  describe("AnimatedCardLink", () => {
    describe("Rendering", () => {
      it("should render as a link", () => {
        render(<AnimatedCardLink href="/test">Content</AnimatedCardLink>);

        expect(screen.getByRole("link")).toBeInTheDocument();
      });

      it("should have correct href", () => {
        render(<AnimatedCardLink href="/test">Content</AnimatedCardLink>);

        expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
      });

      it("should render children", () => {
        render(
          <AnimatedCardLink href="/test">
            <div data-testid="content">Link content</div>
          </AnimatedCardLink>
        );

        expect(screen.getByTestId("content")).toBeInTheDocument();
      });

      it("should support forwardRef", () => {
        const ref = createRef<HTMLAnchorElement>();
        render(
          <AnimatedCardLink ref={ref} href="/test">
            Content
          </AnimatedCardLink>
        );

        expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      });
    });

    describe("External Links", () => {
      it("should not have target/rel for internal links", () => {
        render(<AnimatedCardLink href="/test">Content</AnimatedCardLink>);

        const link = screen.getByRole("link");
        expect(link).not.toHaveAttribute("target");
      });

      it("should have target=_blank for external links", () => {
        render(
          <AnimatedCardLink href="https://example.com" external>
            Content
          </AnimatedCardLink>
        );

        expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
      });

      it("should have rel=noopener noreferrer for external links", () => {
        render(
          <AnimatedCardLink href="https://example.com" external>
            Content
          </AnimatedCardLink>
        );

        expect(screen.getByRole("link")).toHaveAttribute(
          "rel",
          "noopener noreferrer"
        );
      });
    });

    describe("Default Effects", () => {
      it("should have tilt enabled by default", () => {
        render(<AnimatedCardLink href="/test">Content</AnimatedCardLink>);

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });

      it("should have glow enabled by default", () => {
        render(<AnimatedCardLink href="/test">Content</AnimatedCardLink>);

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });
    });

    describe("Focus Styles", () => {
      it("should have focus-visible ring styles", () => {
        render(<AnimatedCardLink href="/test">Content</AnimatedCardLink>);

        expect(screen.getByRole("link")).toHaveClass("focus-visible:ring-2");
        expect(screen.getByRole("link")).toHaveClass("focus-visible:ring-blue-500");
      });
    });
  });

  describe("FeatureCard", () => {
    const requiredProps = {
      title: "Feature Title",
      description: "Feature description text",
    };

    describe("Rendering", () => {
      it("should render title", () => {
        render(<FeatureCard {...requiredProps} />);

        expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
          "Feature Title"
        );
      });

      it("should render description", () => {
        render(<FeatureCard {...requiredProps} />);

        expect(screen.getByText("Feature description text")).toBeInTheDocument();
      });

      it("should render Learn more text", () => {
        render(<FeatureCard {...requiredProps} />);

        expect(screen.getByText("Learn more")).toBeInTheDocument();
      });

      it("should have arrow icon", () => {
        const { container } = render(<FeatureCard {...requiredProps} />);

        expect(container.querySelector("svg")).toBeInTheDocument();
      });
    });

    describe("Icon", () => {
      it("should render icon when provided", () => {
        render(
          <FeatureCard
            {...requiredProps}
            icon={<span data-testid="icon">🎯</span>}
          />
        );

        expect(screen.getByTestId("icon")).toBeInTheDocument();
      });

      it("should not render icon container when not provided", () => {
        const { container } = render(<FeatureCard {...requiredProps} />);

        expect(container.querySelector(".w-12.h-12")).not.toBeInTheDocument();
      });
    });

    describe("Badge", () => {
      it("should render badge when provided", () => {
        render(<FeatureCard {...requiredProps} badge="New" />);

        expect(screen.getByText("New")).toBeInTheDocument();
      });

      it("should apply default badge variant", () => {
        render(<FeatureCard {...requiredProps} badge="Default" />);

        const badge = screen.getByText("Default");
        expect(badge).toHaveClass("bg-gray-100");
      });

      it("should apply new badge variant", () => {
        render(
          <FeatureCard {...requiredProps} badge="New" badgeVariant="new" />
        );

        const badge = screen.getByText("New");
        expect(badge).toHaveClass("bg-emerald-100");
      });

      it("should apply popular badge variant", () => {
        render(
          <FeatureCard {...requiredProps} badge="Popular" badgeVariant="popular" />
        );

        const badge = screen.getByText("Popular");
        expect(badge).toHaveClass("bg-violet-100");
      });

      it("should apply updated badge variant", () => {
        render(
          <FeatureCard {...requiredProps} badge="Updated" badgeVariant="updated" />
        );

        const badge = screen.getByText("Updated");
        expect(badge).toHaveClass("bg-blue-100");
      });
    });

    describe("Effects", () => {
      it("should have tilt enabled by default", () => {
        render(<FeatureCard {...requiredProps} />);

        // Check that AnimatedCard received tilt prop
        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });

      it("should have glow enabled by default", () => {
        render(<FeatureCard {...requiredProps} />);

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });
    });
  });

  describe("StatsCard", () => {
    const requiredProps = {
      label: "Total Users",
      value: "1,234",
    };

    describe("Rendering", () => {
      it("should render label", () => {
        render(<StatsCard {...requiredProps} />);

        expect(screen.getByText("Total Users")).toBeInTheDocument();
      });

      it("should render value", () => {
        render(<StatsCard {...requiredProps} />);

        expect(screen.getByText("1,234")).toBeInTheDocument();
      });

      it("should render numeric value", () => {
        render(<StatsCard label="Count" value={42} />);

        expect(screen.getByText("42")).toBeInTheDocument();
      });
    });

    describe("Change Indicator", () => {
      it("should render change when provided", () => {
        render(<StatsCard {...requiredProps} change="+12%" />);

        expect(screen.getByText("+12%")).toBeInTheDocument();
      });

      it("should have positive color by default", () => {
        render(<StatsCard {...requiredProps} change="+12%" />);

        expect(screen.getByText("+12%")).toHaveClass("text-emerald-600");
      });

      it("should have negative color when not positive", () => {
        render(
          <StatsCard {...requiredProps} change="-5%" changePositive={false} />
        );

        expect(screen.getByText("-5%")).toHaveClass("text-red-600");
      });
    });

    describe("Icon", () => {
      it("should render icon when provided", () => {
        render(
          <StatsCard
            {...requiredProps}
            icon={<span data-testid="stat-icon">📊</span>}
          />
        );

        expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
      });
    });

    describe("Effects", () => {
      it("should have tilt disabled by default", () => {
        render(<StatsCard {...requiredProps} />);

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: true })
        );
      });

      it("should have glow disabled by default", () => {
        render(<StatsCard {...requiredProps} />);

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: true })
        );
      });
    });
  });

  describe("ImageCard", () => {
    const requiredProps = {
      src: "/test-image.jpg",
      alt: "Test image",
    };

    describe("Rendering", () => {
      it("should render image", () => {
        render(<ImageCard {...requiredProps} />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "/test-image.jpg");
        expect(img).toHaveAttribute("alt", "Test image");
      });

      it("should render title when provided", () => {
        render(<ImageCard {...requiredProps} title="Image Title" />);

        expect(
          screen.getByRole("heading", { level: 3 })
        ).toHaveTextContent("Image Title");
      });

      it("should render description when provided", () => {
        render(<ImageCard {...requiredProps} description="Image description" />);

        expect(screen.getByText("Image description")).toBeInTheDocument();
      });
    });

    describe("Aspect Ratios", () => {
      it("should apply video aspect ratio by default", () => {
        const { container } = render(<ImageCard {...requiredProps} />);

        expect(container.querySelector(".aspect-video")).toBeInTheDocument();
      });

      it("should apply square aspect ratio", () => {
        const { container } = render(
          <ImageCard {...requiredProps} aspectRatio="square" />
        );

        expect(container.querySelector(".aspect-square")).toBeInTheDocument();
      });

      it("should apply portrait aspect ratio", () => {
        const { container } = render(
          <ImageCard {...requiredProps} aspectRatio="portrait" />
        );

        expect(container.querySelector(".aspect-\\[3\\/4\\]")).toBeInTheDocument();
      });

      it("should apply landscape aspect ratio", () => {
        const { container } = render(
          <ImageCard {...requiredProps} aspectRatio="landscape" />
        );

        expect(container.querySelector(".aspect-\\[4\\/3\\]")).toBeInTheDocument();
      });
    });

    describe("Overlay", () => {
      it("should render gradient overlay when title provided", () => {
        const { container } = render(
          <ImageCard {...requiredProps} title="Title" />
        );

        expect(
          container.querySelector(".bg-gradient-to-t")
        ).toBeInTheDocument();
      });

      it("should render custom overlay", () => {
        render(
          <ImageCard
            {...requiredProps}
            overlay={<div data-testid="custom-overlay">Custom</div>}
          />
        );

        expect(screen.getByTestId("custom-overlay")).toBeInTheDocument();
      });
    });

    describe("Defaults", () => {
      it("should have tilt enabled by default", () => {
        render(<ImageCard {...requiredProps} />);

        expect(mockUseTilt).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });

      it("should have glow enabled by default", () => {
        render(<ImageCard {...requiredProps} />);

        expect(mockUseHoverGlow).toHaveBeenCalledWith(
          expect.objectContaining({ disabled: false })
        );
      });

      it("should have no padding by default", () => {
        const { container } = render(<ImageCard {...requiredProps} />);

        expect(container.firstChild).not.toHaveClass("p-4");
        expect(container.firstChild).not.toHaveClass("p-6");
        expect(container.firstChild).not.toHaveClass("p-8");
      });
    });
  });

  describe("CardGrid", () => {
    describe("Rendering", () => {
      it("should render children", () => {
        render(
          <CardGrid>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </CardGrid>
        );

        expect(screen.getByTestId("child-1")).toBeInTheDocument();
        expect(screen.getByTestId("child-2")).toBeInTheDocument();
      });

      it("should have grid class", () => {
        const { container } = render(
          <CardGrid>
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("grid");
      });
    });

    describe("Columns", () => {
      it("should default to 3 columns", () => {
        const { container } = render(
          <CardGrid>
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("lg:grid-cols-3");
      });

      it("should apply 1 column", () => {
        const { container } = render(
          <CardGrid columns={1}>
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("grid-cols-1");
      });

      it("should apply 2 columns", () => {
        const { container } = render(
          <CardGrid columns={2}>
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("sm:grid-cols-2");
      });

      it("should apply 4 columns", () => {
        const { container } = render(
          <CardGrid columns={4}>
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("xl:grid-cols-4");
      });
    });

    describe("Gap", () => {
      it("should default to md gap", () => {
        const { container } = render(
          <CardGrid>
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("gap-6");
      });

      it("should apply sm gap", () => {
        const { container } = render(
          <CardGrid gap="sm">
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("gap-4");
      });

      it("should apply lg gap", () => {
        const { container } = render(
          <CardGrid gap="lg">
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("gap-8");
      });
    });

    describe("className Prop", () => {
      it("should merge custom className", () => {
        const { container } = render(
          <CardGrid className="custom-grid">
            <div>Child</div>
          </CardGrid>
        );

        expect(container.firstChild).toHaveClass("custom-grid");
        expect(container.firstChild).toHaveClass("grid");
      });
    });

    describe("Props Passthrough", () => {
      it("should pass additional props", () => {
        render(
          <CardGrid data-testid="grid" aria-label="Cards">
            <div>Child</div>
          </CardGrid>
        );

        expect(screen.getByTestId("grid")).toHaveAttribute(
          "aria-label",
          "Cards"
        );
      });
    });
  });

  describe("Mouse Event Handlers", () => {
    it("AnimatedCard should call tilt handlers on mouse events", () => {
      const { container } = render(
        <AnimatedCard tilt>Content</AnimatedCard>
      );

      const card = container.firstChild as HTMLElement;

      fireEvent.mouseMove(card);
      fireEvent.mouseLeave(card);

      expect(mockUseTilt).toHaveBeenCalled();
    });

    it("AnimatedCard should call glow handlers on mouse events", () => {
      const { container } = render(
        <AnimatedCard glow>Content</AnimatedCard>
      );

      const card = container.firstChild as HTMLElement;

      fireEvent.mouseMove(card);
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      expect(mockUseHoverGlow).toHaveBeenCalled();
    });
  });

  describe("DisplayName", () => {
    it("AnimatedCard should have displayName", () => {
      expect(AnimatedCard.displayName).toBe("AnimatedCard");
    });

    it("AnimatedCardLink should have displayName", () => {
      expect(AnimatedCardLink.displayName).toBe("AnimatedCardLink");
    });
  });
});
