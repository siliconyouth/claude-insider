/**
 * GradientLogo Component Tests
 *
 * Tests for the gradient "Ci" logo SVG component.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GradientLogo } from "@/components/gradient-logo";

describe("GradientLogo", () => {
  describe("Rendering", () => {
    it("should render an SVG element", () => {
      render(<GradientLogo />);

      // SVG is hidden from accessibility tree, so query by container
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have aria-hidden for accessibility", () => {
      render(<GradientLogo />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("should render the 'Ci' text", () => {
      render(<GradientLogo />);

      const text = document.querySelector("text");
      expect(text).toBeInTheDocument();
      expect(text?.textContent).toBe("Ci");
    });

    it("should have gradient definition", () => {
      render(<GradientLogo />);

      const gradient = document.querySelector("#logoGradient");
      expect(gradient).toBeInTheDocument();
    });

    it("should have gradient stops with correct colors", () => {
      render(<GradientLogo />);

      const stops = document.querySelectorAll("#logoGradient stop");
      expect(stops.length).toBe(3);

      // Violet -> Blue -> Cyan
      expect(stops[0]).toHaveAttribute("stop-color", "#A855F7");
      expect(stops[1]).toHaveAttribute("stop-color", "#3B82F6");
      expect(stops[2]).toHaveAttribute("stop-color", "#06B6D4");
    });

    it("should have rounded rectangle background", () => {
      render(<GradientLogo />);

      const rect = document.querySelector("rect");
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute("rx", "80");
    });
  });

  describe("Size Prop", () => {
    it("should default to 32px size", () => {
      render(<GradientLogo />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "32");
    });

    it("should accept custom size", () => {
      render(<GradientLogo size={64} />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("width", "64");
      expect(svg).toHaveAttribute("height", "64");
    });

    it("should render correctly at small sizes", () => {
      render(<GradientLogo size={16} />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("width", "16");
      expect(svg).toHaveAttribute("height", "16");
    });

    it("should render correctly at large sizes", () => {
      render(<GradientLogo size={256} />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("width", "256");
      expect(svg).toHaveAttribute("height", "256");
    });

    it("should maintain 512x512 viewBox regardless of size", () => {
      render(<GradientLogo size={100} />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 512 512");
    });
  });

  describe("withGlow Prop", () => {
    it("should not have glow by default", () => {
      render(<GradientLogo />);

      const svg = document.querySelector("svg");
      expect(svg?.className).not.toContain("drop-shadow");
    });

    it("should have glow effect when withGlow is true", () => {
      render(<GradientLogo withGlow />);

      const svg = document.querySelector("svg");
      expect(svg?.className.baseVal).toContain("drop-shadow");
    });

    it("should not have glow when withGlow is false", () => {
      render(<GradientLogo withGlow={false} />);

      const svg = document.querySelector("svg");
      expect(svg?.className.baseVal).not.toContain("drop-shadow");
    });
  });

  describe("className Prop", () => {
    it("should accept custom className", () => {
      render(<GradientLogo className="custom-class" />);

      const svg = document.querySelector("svg");
      expect(svg?.className.baseVal).toContain("custom-class");
    });

    it("should merge with default classes", () => {
      render(<GradientLogo className="my-logo" />);

      const svg = document.querySelector("svg");
      expect(svg?.className.baseVal).toContain("shrink-0");
      expect(svg?.className.baseVal).toContain("aspect-square");
      expect(svg?.className.baseVal).toContain("my-logo");
    });
  });

  describe("SVG Structure", () => {
    it("should have correct text positioning", () => {
      render(<GradientLogo />);

      const text = document.querySelector("text");
      expect(text).toHaveAttribute("x", "256"); // Center
      expect(text).toHaveAttribute("y", "355");
      expect(text).toHaveAttribute("text-anchor", "middle");
    });

    it("should have correct font properties", () => {
      render(<GradientLogo />);

      const text = document.querySelector("text");
      expect(text).toHaveAttribute("font-size", "300");
      expect(text).toHaveAttribute("font-weight", "800");
      expect(text).toHaveAttribute("fill", "#ffffff");
    });

    it("should use Inter font family", () => {
      render(<GradientLogo />);

      const text = document.querySelector("text");
      const fontFamily = text?.getAttribute("font-family");
      expect(fontFamily).toContain("Inter");
    });

    it("should have gradient fill on background rect", () => {
      render(<GradientLogo />);

      const rect = document.querySelector("rect");
      expect(rect).toHaveAttribute("fill", "url(#logoGradient)");
    });
  });

  describe("Accessibility", () => {
    it("should be decorative (aria-hidden)", () => {
      render(<GradientLogo />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("should not have any accessible text content", () => {
      render(<GradientLogo />);

      // Since it's aria-hidden, there should be no accessible name
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("Multiple Instances", () => {
    it("should render multiple logos correctly", () => {
      render(
        <>
          <GradientLogo size={32} />
          <GradientLogo size={64} />
          <GradientLogo size={96} />
        </>
      );

      const svgs = document.querySelectorAll("svg");
      expect(svgs.length).toBe(3);

      expect(svgs[0]).toHaveAttribute("width", "32");
      expect(svgs[1]).toHaveAttribute("width", "64");
      expect(svgs[2]).toHaveAttribute("width", "96");
    });
  });
});
