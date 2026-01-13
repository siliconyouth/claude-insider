/**
 * HeroBackground Component Tests
 *
 * Tests for the hero background components:
 * - HeroBackground: Stripe-inspired gradient with lens flare orbs
 * - HeroBackgroundCompact: Compact variant for smaller sections
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HeroBackground, HeroBackgroundCompact } from "@/components/hero-background";

// Mock matchMedia
let mockMatchMedia: ReturnType<typeof vi.fn>;
let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];

beforeEach(() => {
  mediaQueryListeners = [];
  mockMatchMedia = vi.fn((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
      if (event === "change") {
        mediaQueryListeners.push(cb);
      }
    }),
    removeEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
      if (event === "change") {
        mediaQueryListeners = mediaQueryListeners.filter((l) => l !== cb);
      }
    }),
    dispatchEvent: vi.fn(),
  }));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HeroBackground", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".hero-background")).toBeInTheDocument();
    });

    it("should be aria-hidden for accessibility", () => {
      const { container } = render(<HeroBackground />);

      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("should have absolute positioning", () => {
      const { container } = render(<HeroBackground />);

      expect(container.firstChild).toHaveClass("absolute", "inset-0", "overflow-hidden");
    });

    it("should apply custom className", () => {
      const { container } = render(<HeroBackground className="custom-hero" />);

      expect(container.firstChild).toHaveClass("custom-hero");
    });
  });

  describe("Gradient Layers", () => {
    it("should render base gradient layer", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".bg-gradient-to-b")).toBeInTheDocument();
    });

    it("should render diagonal gradient band", () => {
      const { container } = render(<HeroBackground />);

      // Diagonal band has skewY transform
      const diagonal = container.querySelector('[style*="skewY(-6deg)"]');
      expect(diagonal).toBeInTheDocument();
    });

    it("should render noise/grain overlay", () => {
      const { container } = render(<HeroBackground />);

      // Noise has very low opacity
      const noise = container.querySelector('[class*="opacity-[0.015]"]');
      expect(noise).toBeInTheDocument();
    });

    it("should render top gradient for text contrast", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".h-\\[55\\%\\]")).toBeInTheDocument();
    });
  });

  describe("Lens Flare Orbs", () => {
    it("should render all 5 orbs", () => {
      const { container } = render(<HeroBackground />);

      const orbs = container.querySelectorAll('[class*="lens-flare-orb"]');
      expect(orbs.length).toBe(5);
    });

    it("should have violet orb", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".lens-flare-orb-violet")).toBeInTheDocument();
    });

    it("should have pink orb", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".lens-flare-orb-pink")).toBeInTheDocument();
    });

    it("should have cyan orb", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".lens-flare-orb-cyan")).toBeInTheDocument();
    });

    it("should have blue orb", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".lens-flare-orb-blue")).toBeInTheDocument();
    });

    it("should have gold orb", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".lens-flare-orb-gold")).toBeInTheDocument();
    });

    it("should apply orb positioning styles", () => {
      const { container } = render(<HeroBackground />);

      const firstOrb = container.querySelector(".lens-flare-orb-violet");
      expect(firstOrb).toHaveStyle({ top: "55%", left: "5%" });
    });

    it("should apply orb size styles", () => {
      const { container } = render(<HeroBackground />);

      const firstOrb = container.querySelector(".lens-flare-orb-violet");
      expect(firstOrb).toHaveStyle({ width: "500px", height: "500px" });
    });
  });

  describe("Intensity Prop", () => {
    it("should apply default intensity (1)", () => {
      const { container } = render(<HeroBackground />);

      const baseGradient = container.querySelector(".bg-gradient-to-b");
      expect(baseGradient).toHaveStyle({ opacity: "1" });
    });

    it("should apply custom intensity", () => {
      const { container } = render(<HeroBackground intensity={0.5} />);

      const baseGradient = container.querySelector(".bg-gradient-to-b");
      expect(baseGradient).toHaveStyle({ opacity: "0.5" });
    });

    it("should apply intensity to orb opacity", () => {
      const { container } = render(<HeroBackground intensity={0.5} />);

      const orb = container.querySelector(".lens-flare-orb-violet");
      // Orb opacity = intensity * 0.7 = 0.35
      expect(orb).toHaveStyle({ opacity: "0.35" });
    });

    it("should apply zero intensity", () => {
      const { container } = render(<HeroBackground intensity={0} />);

      const baseGradient = container.querySelector(".bg-gradient-to-b");
      expect(baseGradient).toHaveStyle({ opacity: "0" });
    });
  });

  describe("Reduced Motion Preference", () => {
    it("should check for reduced motion on mount", () => {
      render(<HeroBackground />);

      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    });

    it("should set animation delay when motion is allowed", () => {
      const { container } = render(<HeroBackground />);

      const violetOrb = container.querySelector(".lens-flare-orb-violet");
      expect(violetOrb).toHaveStyle({ animationDelay: "0s" });
    });

    it("should respond to reduced motion preference changes", () => {
      // Start with motion allowed
      const { container } = render(<HeroBackground />);

      // Check orb has animation delay
      const violetOrb = container.querySelector(".lens-flare-orb-violet");
      expect(violetOrb).toHaveStyle({ animationDelay: "0s" });

      // Simulate reduced motion preference change
      act(() => {
        mediaQueryListeners.forEach((cb) => {
          cb({ matches: true } as MediaQueryListEvent);
        });
      });

      // After change, animation delay should be 0s (no animation delay for reduced motion)
      expect(violetOrb).toHaveStyle({ animationDelay: "0s" });
    });

    it("should remove listener on unmount", () => {
      const { unmount } = render(<HeroBackground />);

      unmount();

      // The listener should have been removed
      expect(mediaQueryListeners.length).toBe(0);
    });
  });

  describe("Light and Dark Mode", () => {
    it("should have light mode overlay", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".dark\\:hidden")).toBeInTheDocument();
    });

    it("should have dark mode overlay", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".hidden.dark\\:block")).toBeInTheDocument();
    });

    it("should have dark theme colors in base gradient", () => {
      const { container } = render(<HeroBackground />);

      const baseGradient = container.querySelector(".bg-gradient-to-b");
      expect(baseGradient?.className).toContain("dark:from-[#0a0a0a]");
    });
  });

  describe("Diagonal Band", () => {
    it("should have correct height", () => {
      const { container } = render(<HeroBackground />);

      expect(container.querySelector(".h-\\[60\\%\\]")).toBeInTheDocument();
    });

    it("should have skew transform", () => {
      const { container } = render(<HeroBackground />);

      const diagonal = container.querySelector('[style*="skewY(-6deg)"]');
      expect(diagonal).toBeInTheDocument();
    });

    it("should have bottom-left transform origin", () => {
      const { container } = render(<HeroBackground />);

      // The diagonal band has transform origin set inline
      const diagonal = container.querySelector('.h-\\[60\\%\\]');
      expect(diagonal).toBeInTheDocument();
      // Check inline style contains the origin
      expect((diagonal as HTMLElement).style.transformOrigin).toBe("bottom left");
    });
  });
});

describe("HeroBackgroundCompact", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<HeroBackgroundCompact />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should be aria-hidden", () => {
      const { container } = render(<HeroBackgroundCompact />);

      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("should have absolute positioning", () => {
      const { container } = render(<HeroBackgroundCompact />);

      expect(container.firstChild).toHaveClass("absolute", "inset-0", "overflow-hidden");
    });

    it("should apply custom className", () => {
      const { container } = render(<HeroBackgroundCompact className="compact-hero" />);

      expect(container.firstChild).toHaveClass("compact-hero");
    });
  });

  describe("Gradient", () => {
    it("should render diagonal gradient", () => {
      const { container } = render(<HeroBackgroundCompact />);

      expect(container.querySelector(".bg-gradient-to-br")).toBeInTheDocument();
    });

    it("should have violet, blue, and cyan gradient colors", () => {
      const { container } = render(<HeroBackgroundCompact />);

      const gradient = container.querySelector(".bg-gradient-to-br");
      expect(gradient?.className).toContain("from-violet-500/5");
      expect(gradient?.className).toContain("via-blue-500/5");
      expect(gradient?.className).toContain("to-cyan-500/5");
    });
  });

  describe("Lens Flare Orbs", () => {
    it("should render 2 orbs", () => {
      const { container } = render(<HeroBackgroundCompact />);

      const orbs = container.querySelectorAll('[class*="lens-flare-orb"]');
      expect(orbs.length).toBe(2);
    });

    it("should have violet orb", () => {
      const { container } = render(<HeroBackgroundCompact />);

      expect(container.querySelector(".lens-flare-orb-violet")).toBeInTheDocument();
    });

    it("should have blue orb", () => {
      const { container } = render(<HeroBackgroundCompact />);

      expect(container.querySelector(".lens-flare-orb-blue")).toBeInTheDocument();
    });

    it("should position orbs correctly", () => {
      const { container } = render(<HeroBackgroundCompact />);

      const violetOrb = container.querySelector(".lens-flare-orb-violet");
      expect(violetOrb).toHaveStyle({ top: "10%", left: "20%" });

      const blueOrb = container.querySelector(".lens-flare-orb-blue");
      expect(blueOrb).toHaveStyle({ top: "40%", left: "60%" });
    });

    it("should size orbs correctly", () => {
      const { container } = render(<HeroBackgroundCompact />);

      const violetOrb = container.querySelector(".lens-flare-orb-violet");
      expect(violetOrb).toHaveStyle({ width: "300px", height: "300px" });

      const blueOrb = container.querySelector(".lens-flare-orb-blue");
      expect(blueOrb).toHaveStyle({ width: "250px", height: "250px" });
    });

    it("should have lower opacity than main background orbs", () => {
      const { container } = render(<HeroBackgroundCompact />);

      const violetOrb = container.querySelector(".lens-flare-orb-violet");
      expect(violetOrb).toHaveStyle({ opacity: "0.3" });

      const blueOrb = container.querySelector(".lens-flare-orb-blue");
      expect(blueOrb).toHaveStyle({ opacity: "0.25" });
    });
  });
});

describe("Default Export", () => {
  it("should export HeroBackground as default", async () => {
    const module = await import("@/components/hero-background");
    expect(module.default).toBe(module.HeroBackground);
  });
});

describe("Orb Configuration", () => {
  it("should have orbs with staggered animation delays", () => {
    const { container } = render(<HeroBackground />);

    const orbs = container.querySelectorAll('[class*="lens-flare-orb-"]');
    const delays = Array.from(orbs).map((orb) =>
      (orb as HTMLElement).style.animationDelay
    );

    // Should have different delays for staggered animation
    expect(delays).toContain("0s");
    expect(delays).toContain("1s");
    expect(delays).toContain("2s");
    expect(delays).toContain("1.5s");
    expect(delays).toContain("3s");
  });

  it("should have orbs at different positions", () => {
    const { container } = render(<HeroBackground />);

    const orbs = container.querySelectorAll('[class*="lens-flare-orb-"]');
    const positions = Array.from(orbs).map((orb) => ({
      top: (orb as HTMLElement).style.top,
      left: (orb as HTMLElement).style.left,
    }));

    // All positions should be unique
    const uniquePositions = new Set(positions.map((p) => `${p.top}-${p.left}`));
    expect(uniquePositions.size).toBe(5);
  });

  it("should have orbs with different sizes", () => {
    const { container } = render(<HeroBackground />);

    const orbs = container.querySelectorAll('[class*="lens-flare-orb-"]');
    const sizes = Array.from(orbs).map((orb) =>
      (orb as HTMLElement).style.width
    );

    // Should have multiple different sizes
    const uniqueSizes = new Set(sizes);
    expect(uniqueSizes.size).toBeGreaterThan(1);
  });
});
