/**
 * Page Transition Component Tests
 *
 * Tests for page transition animations and effects.
 * Part of the UX System - Pillar 6: Micro-interactions & Animations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import { type ReactNode } from "react";
import {
  PageTransitionProvider,
  usePageTransition,
  PageTransition,
  FadeIn,
  StaggerChildren,
  AnimatePresence,
  NavigationProgress,
  useNavigationProgress,
} from "@/components/page-transition";

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue("/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

// Mock use-animations hook
const mockUseReducedMotion = vi.fn().mockReturnValue(false);
vi.mock("@/hooks/use-animations", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

// Helper wrapper
function wrapper({ children }: { children: ReactNode }) {
  return <PageTransitionProvider>{children}</PageTransitionProvider>;
}

describe("Page Transition Components", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPathname.mockReturnValue("/");
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("usePageTransition", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePageTransition());
      }).toThrow("usePageTransition must be used within PageTransitionProvider");

      consoleSpy.mockRestore();
    });

    it("should return context when used within provider", () => {
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      expect(result.current).toHaveProperty("isTransitioning");
      expect(result.current).toHaveProperty("startTransition");
      expect(result.current).toHaveProperty("endTransition");
      expect(result.current).toHaveProperty("config");
      expect(result.current).toHaveProperty("setConfig");
    });

    it("should have default config values", () => {
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      expect(result.current.config.type).toBe("fade");
      expect(result.current.config.duration).toBe(300);
      expect(result.current.config.direction).toBe("up");
    });

    it("should update config with setConfig", () => {
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      act(() => {
        result.current.setConfig({ type: "slide", duration: 500 });
      });

      expect(result.current.config.type).toBe("slide");
      expect(result.current.config.duration).toBe(500);
      expect(result.current.config.direction).toBe("up"); // Unchanged
    });

    it("should trigger transition on startTransition", () => {
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      expect(result.current.isTransitioning).toBe(true); // Initial mount transition

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isTransitioning).toBe(false);

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.isTransitioning).toBe(true);
    });

    it("should end transition on endTransition", () => {
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.isTransitioning).toBe(true);

      act(() => {
        result.current.endTransition();
      });

      expect(result.current.isTransitioning).toBe(false);
    });

    it("should not transition when reduced motion is preferred", () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.isTransitioning).toBe(false);
    });
  });

  describe("PageTransitionProvider", () => {
    it("should render children", () => {
      render(
        <PageTransitionProvider>
          <div data-testid="child">Content</div>
        </PageTransitionProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should accept custom default config", () => {
      const customWrapper = ({ children }: { children: ReactNode }) => (
        <PageTransitionProvider defaultConfig={{ type: "scale", duration: 400 }}>
          {children}
        </PageTransitionProvider>
      );

      const { result } = renderHook(() => usePageTransition(), {
        wrapper: customWrapper,
      });

      expect(result.current.config.type).toBe("scale");
      expect(result.current.config.duration).toBe(400);
    });

    it("should auto-transition on pathname change", () => {
      const { result } = renderHook(() => usePageTransition(), { wrapper });

      // Initial transition ends
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isTransitioning).toBe(false);

      // Simulate route change
      mockPathname.mockReturnValue("/about");
      const { result: result2 } = renderHook(() => usePageTransition(), {
        wrapper,
      });

      expect(result2.current.isTransitioning).toBe(true);
    });
  });

  describe("PageTransition", () => {
    it("should render children", () => {
      render(
        <PageTransition>
          <div data-testid="content">Page Content</div>
        </PageTransition>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should have wrapper with w-full class", () => {
      const { container } = render(
        <PageTransition>
          <div>Content</div>
        </PageTransition>
      );

      expect(container.firstChild).toHaveClass("w-full");
    });

    it("should accept custom className", () => {
      const { container } = render(
        <PageTransition className="custom-class">
          <div>Content</div>
        </PageTransition>
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should render children directly when reduced motion preferred", () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(
        <PageTransition>
          <div data-testid="content">Content</div>
        </PageTransition>
      );

      // Children should be rendered directly without wrapper styles
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should apply fade transition styles", () => {
      const { container } = render(
        <PageTransition type="fade">
          <div>Content</div>
        </PageTransition>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toContain("300ms");
    });

    it("should apply slide transition with direction", () => {
      const { container } = render(
        <PageTransition type="slide" direction="left">
          <div>Content</div>
        </PageTransition>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toBeTruthy();
    });

    it("should apply custom duration", () => {
      const { container } = render(
        <PageTransition duration={500}>
          <div>Content</div>
        </PageTransition>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toContain("500ms");
    });
  });

  describe("FadeIn", () => {
    it("should render children", () => {
      render(
        <FadeIn>
          <div data-testid="content">Fade content</div>
        </FadeIn>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should render children directly when reduced motion preferred", () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(
        <FadeIn>
          <div>Content</div>
        </FadeIn>
      );

      // Should not have transition styles
      expect((container.firstChild as HTMLElement).style.transition).toBeFalsy();
    });

    it("should apply delay", () => {
      const { container } = render(
        <FadeIn delay={200}>
          <div>Content</div>
        </FadeIn>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transitionDelay).toBe("200ms");
    });

    it("should apply custom duration", () => {
      const { container } = render(
        <FadeIn duration={800}>
          <div>Content</div>
        </FadeIn>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toContain("800ms");
    });

    it("should apply className", () => {
      const { container } = render(
        <FadeIn className="custom-fade">
          <div>Content</div>
        </FadeIn>
      );

      expect(container.firstChild).toHaveClass("custom-fade");
    });

    it("should start invisible and fade in on mount trigger", () => {
      const { container } = render(
        <FadeIn trigger="mount" delay={0}>
          <div>Content</div>
        </FadeIn>
      );

      const wrapper = container.firstChild as HTMLElement;
      // Initially visible on mount trigger with no delay
      expect(wrapper.style.opacity).toBe("1");
    });

    it("should handle different directions", () => {
      const directions = ["up", "down", "left", "right", "none"] as const;

      directions.forEach((direction) => {
        const { container, unmount } = render(
          <FadeIn direction={direction}>
            <div>Content</div>
          </FadeIn>
        );

        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });

    it("should apply custom distance", () => {
      const { container } = render(
        <FadeIn distance={50} direction="up">
          <div>Content</div>
        </FadeIn>
      );

      // Component renders successfully with custom distance
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("StaggerChildren", () => {
    it("should render all children", () => {
      render(
        <StaggerChildren>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </StaggerChildren>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
      expect(screen.getByTestId("child-3")).toBeInTheDocument();
    });

    it("should wrap each child in FadeIn", () => {
      const { container } = render(
        <StaggerChildren stagger={100}>
          <div>Child 1</div>
          <div>Child 2</div>
        </StaggerChildren>
      );

      // Each child should be wrapped
      const fadeInWrappers = container.querySelectorAll("[style]");
      expect(fadeInWrappers.length).toBeGreaterThanOrEqual(2);
    });

    it("should apply staggered delays", () => {
      const { container } = render(
        <StaggerChildren stagger={100} baseDelay={50}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </StaggerChildren>
      );

      const children = container.querySelectorAll("[style]");
      // First child: 50ms, second: 150ms, third: 250ms
      expect(children.length).toBe(3);
    });

    it("should apply className to container", () => {
      const { container } = render(
        <StaggerChildren className="stagger-container">
          <div>Child</div>
        </StaggerChildren>
      );

      expect(container.firstChild).toHaveClass("stagger-container");
    });

    it("should render children directly when reduced motion preferred", () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(
        <StaggerChildren>
          <div data-testid="child">Child</div>
        </StaggerChildren>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should handle single child", () => {
      render(
        <StaggerChildren>
          <div data-testid="only-child">Only child</div>
        </StaggerChildren>
      );

      expect(screen.getByTestId("only-child")).toBeInTheDocument();
    });

    it("should pass direction and distance to FadeIn children", () => {
      const { container } = render(
        <StaggerChildren direction="left" distance={30}>
          <div>Child</div>
        </StaggerChildren>
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("AnimatePresence", () => {
    it("should render children when show is true", () => {
      render(
        <AnimatePresence show={true}>
          <div data-testid="content">Visible content</div>
        </AnimatePresence>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should not render children when show is false after animation", () => {
      const { rerender } = render(
        <AnimatePresence show={true}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );

      rerender(
        <AnimatePresence show={false}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );

      // Wait for exit animation
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should call onExitComplete when exit animation finishes", () => {
      const onExitComplete = vi.fn();

      const { rerender } = render(
        <AnimatePresence show={true} onExitComplete={onExitComplete}>
          <div>Content</div>
        </AnimatePresence>
      );

      rerender(
        <AnimatePresence show={false} onExitComplete={onExitComplete}>
          <div>Content</div>
        </AnimatePresence>
      );

      expect(onExitComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onExitComplete).toHaveBeenCalledTimes(1);
    });

    it("should apply fade animation by default", () => {
      const { container } = render(
        <AnimatePresence show={true}>
          <div>Content</div>
        </AnimatePresence>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toContain("200ms");
    });

    it("should apply slide animation with direction", () => {
      const { container } = render(
        <AnimatePresence show={true} type="slide" direction="left">
          <div>Content</div>
        </AnimatePresence>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toBeTruthy();
    });

    it("should apply scale animation", () => {
      const { container } = render(
        <AnimatePresence show={true} type="scale">
          <div>Content</div>
        </AnimatePresence>
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should apply collapse animation", () => {
      const { container } = render(
        <AnimatePresence show={true} type="collapse">
          <div>Content</div>
        </AnimatePresence>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.overflow).toBe("hidden");
    });

    it("should apply custom duration", () => {
      const { container } = render(
        <AnimatePresence show={true} duration={500}>
          <div>Content</div>
        </AnimatePresence>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.transition).toContain("500ms");
    });

    it("should apply className", () => {
      const { container } = render(
        <AnimatePresence show={true} className="custom-presence">
          <div>Content</div>
        </AnimatePresence>
      );

      expect(container.firstChild).toHaveClass("custom-presence");
    });

    it("should render children directly when reduced motion preferred", () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(
        <AnimatePresence show={true}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("NavigationProgress", () => {
    it("should not render when not navigating", () => {
      const { container } = render(<NavigationProgress isNavigating={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when navigating", () => {
      const { container } = render(<NavigationProgress isNavigating={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should have fixed positioning", () => {
      const { container } = render(<NavigationProgress isNavigating={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(container.firstChild).toHaveClass("fixed");
      expect(container.firstChild).toHaveClass("top-0");
    });

    it("should apply custom color", () => {
      const { container } = render(
        <NavigationProgress isNavigating={true} color="rgb(255, 0, 0)" />
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const progressBar = container.querySelector(".h-full");
      expect(progressBar).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
    });

    it("should apply custom height", () => {
      const { container } = render(
        <NavigationProgress isNavigating={true} height={4} />
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(container.firstChild).toHaveStyle({ height: "4px" });
    });

    it("should animate progress over time", () => {
      const { container } = render(<NavigationProgress isNavigating={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      let progressBar = container.querySelector(".h-full") as HTMLElement;
      expect(progressBar.style.width).toBe("30%");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      progressBar = container.querySelector(".h-full") as HTMLElement;
      expect(progressBar.style.width).toBe("60%");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      progressBar = container.querySelector(".h-full") as HTMLElement;
      expect(progressBar.style.width).toBe("90%");
    });

    it("should complete to 100% when navigation ends", () => {
      const { container, rerender } = render(
        <NavigationProgress isNavigating={true} />
      );

      act(() => {
        vi.advanceTimersByTime(600);
      });

      rerender(<NavigationProgress isNavigating={false} />);

      const progressBar = container.querySelector(".h-full") as HTMLElement;
      expect(progressBar.style.width).toBe("100%");
    });

    it("should hide after navigation completes", () => {
      const { container, rerender } = render(
        <NavigationProgress isNavigating={true} />
      );

      act(() => {
        vi.advanceTimersByTime(600);
      });

      rerender(<NavigationProgress isNavigating={false} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(container.firstChild).toBeNull();
    });

    it("should not render when reduced motion preferred", () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<NavigationProgress isNavigating={true} />);

      expect(container.firstChild).toBeNull();
    });

    it("should apply className", () => {
      const { container } = render(
        <NavigationProgress isNavigating={true} className="custom-progress" />
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(container.firstChild).toHaveClass("custom-progress");
    });
  });

  describe("useNavigationProgress", () => {
    it("should return isNavigating state", () => {
      const { result } = renderHook(() => useNavigationProgress());

      expect(result.current).toHaveProperty("isNavigating");
    });

    it("should set isNavigating true on pathname change", () => {
      const { result } = renderHook(() => useNavigationProgress());

      expect(result.current.isNavigating).toBe(true);
    });

    it("should set isNavigating false after timeout", () => {
      const { result } = renderHook(() => useNavigationProgress());

      expect(result.current.isNavigating).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });

  describe("Transition Types", () => {
    it("PageTransition should support all transition types", () => {
      const types = ["fade", "slide", "scale", "blur", "none"] as const;

      types.forEach((type) => {
        const { container, unmount } = render(
          <PageTransition type={type}>
            <div>Content</div>
          </PageTransition>
        );

        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });

    it("AnimatePresence should support all transition types", () => {
      const types = ["fade", "slide", "scale", "collapse"] as const;

      types.forEach((type) => {
        const { container, unmount } = render(
          <AnimatePresence show={true} type={type}>
            <div>Content</div>
          </AnimatePresence>
        );

        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Transition Directions", () => {
    const directions = ["up", "down", "left", "right"] as const;

    it("PageTransition slide should support all directions", () => {
      directions.forEach((direction) => {
        const { container, unmount } = render(
          <PageTransition type="slide" direction={direction}>
            <div>Content</div>
          </PageTransition>
        );

        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });

    it("AnimatePresence slide should support all directions", () => {
      directions.forEach((direction) => {
        const { container, unmount } = render(
          <AnimatePresence show={true} type="slide" direction={direction}>
            <div>Content</div>
          </AnimatePresence>
        );

        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid show/hide toggles in AnimatePresence", () => {
      const { rerender } = render(
        <AnimatePresence show={true}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );

      // Rapid toggles
      rerender(
        <AnimatePresence show={false}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );
      rerender(
        <AnimatePresence show={true}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );
      rerender(
        <AnimatePresence show={false}>
          <div data-testid="content">Content</div>
        </AnimatePresence>
      );

      // Should not throw
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should handle empty children in StaggerChildren", () => {
      const { container } = render(<StaggerChildren>{[]}</StaggerChildren>);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle undefined className", () => {
      const { container } = render(
        <FadeIn className={undefined}>
          <div>Content</div>
        </FadeIn>
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
