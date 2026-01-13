/**
 * MonochromeLogo Component Tests
 *
 * Tests for the monochrome "Ci" logo SVG component.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MonochromeLogo } from "@/components/monochrome-logo";

describe("MonochromeLogo", () => {
  describe("Rendering", () => {
    it("should render an SVG element", () => {
      const { container } = render(<MonochromeLogo />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have aria-hidden for accessibility", () => {
      const { container } = render(<MonochromeLogo />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("should render the 'Ci' text", () => {
      const { container } = render(<MonochromeLogo />);

      const text = container.querySelector("text");
      expect(text).toBeInTheDocument();
      expect(text?.textContent).toBe("Ci");
    });

    it("should have rounded rectangle background", () => {
      const { container } = render(<MonochromeLogo />);

      const rect = container.querySelector("rect");
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute("rx", "80");
    });
  });

  describe("Size Prop", () => {
    it("should default to 14px size", () => {
      const { container } = render(<MonochromeLogo />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "14");
      expect(svg).toHaveAttribute("height", "14");
    });

    it("should accept custom size", () => {
      const { container } = render(<MonochromeLogo size={32} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "32");
    });

    it("should render correctly at small sizes", () => {
      const { container } = render(<MonochromeLogo size={10} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "10");
      expect(svg).toHaveAttribute("height", "10");
    });

    it("should render correctly at large sizes", () => {
      const { container } = render(<MonochromeLogo size={128} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "128");
      expect(svg).toHaveAttribute("height", "128");
    });

    it("should maintain 512x512 viewBox regardless of size", () => {
      const { container } = render(<MonochromeLogo size={50} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 512 512");
    });
  });

  describe("Variant Prop", () => {
    describe("muted variant (default)", () => {
      it("should use muted variant by default", () => {
        const { container } = render(<MonochromeLogo />);

        const rect = container.querySelector("rect");
        expect(rect).toHaveClass("fill-gray-900");
        expect(rect).toHaveClass("dark:fill-gray-500");
      });

      it("should have muted text fill", () => {
        const { container } = render(<MonochromeLogo variant="muted" />);

        const text = container.querySelector("text");
        expect(text).toHaveClass("fill-gray-500");
        expect(text).toHaveClass("dark:fill-gray-900");
      });
    });

    describe("contrast variant", () => {
      it("should use high contrast background", () => {
        const { container } = render(<MonochromeLogo variant="contrast" />);

        const rect = container.querySelector("rect");
        expect(rect).toHaveClass("fill-gray-900");
        expect(rect).toHaveClass("dark:fill-white");
      });

      it("should have high contrast text fill", () => {
        const { container } = render(<MonochromeLogo variant="contrast" />);

        const text = container.querySelector("text");
        expect(text).toHaveClass("fill-white");
        expect(text).toHaveClass("dark:fill-gray-900");
      });
    });
  });

  describe("className Prop", () => {
    it("should accept custom className", () => {
      const { container } = render(<MonochromeLogo className="custom-class" />);

      const svg = container.querySelector("svg");
      expect(svg?.className.baseVal).toContain("custom-class");
    });

    it("should have flex-shrink-0 class", () => {
      const { container } = render(<MonochromeLogo />);

      const svg = container.querySelector("svg");
      expect(svg?.className.baseVal).toContain("flex-shrink-0");
    });

    it("should merge with default classes", () => {
      const { container } = render(<MonochromeLogo className="my-logo" />);

      const svg = container.querySelector("svg");
      expect(svg?.className.baseVal).toContain("flex-shrink-0");
      expect(svg?.className.baseVal).toContain("my-logo");
    });
  });

  describe("SVG Structure", () => {
    it("should have correct text positioning", () => {
      const { container } = render(<MonochromeLogo />);

      const text = container.querySelector("text");
      expect(text).toHaveAttribute("x", "256"); // Center
      expect(text).toHaveAttribute("y", "355");
      expect(text).toHaveAttribute("text-anchor", "middle");
    });

    it("should have correct font properties", () => {
      const { container } = render(<MonochromeLogo />);

      const text = container.querySelector("text");
      expect(text).toHaveAttribute("font-size", "300");
      expect(text).toHaveAttribute("font-weight", "800");
    });

    it("should use Inter font family", () => {
      const { container } = render(<MonochromeLogo />);

      const text = container.querySelector("text");
      const fontFamily = text?.getAttribute("font-family");
      expect(fontFamily).toContain("Inter");
    });

    it("should have full-size rectangle background", () => {
      const { container } = render(<MonochromeLogo />);

      const rect = container.querySelector("rect");
      expect(rect).toHaveAttribute("width", "512");
      expect(rect).toHaveAttribute("height", "512");
    });
  });

  describe("Multiple Instances", () => {
    it("should render multiple logos correctly", () => {
      const { container } = render(
        <>
          <MonochromeLogo size={14} />
          <MonochromeLogo size={28} />
          <MonochromeLogo size={42} />
        </>
      );

      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(3);

      expect(svgs[0]).toHaveAttribute("width", "14");
      expect(svgs[1]).toHaveAttribute("width", "28");
      expect(svgs[2]).toHaveAttribute("width", "42");
    });

    it("should render different variants correctly", () => {
      const { container } = render(
        <>
          <MonochromeLogo variant="muted" />
          <MonochromeLogo variant="contrast" />
        </>
      );

      const rects = container.querySelectorAll("rect");
      expect(rects.length).toBe(2);

      // First is muted, second is contrast
      expect(rects[0]).toHaveClass("dark:fill-gray-500");
      expect(rects[1]).toHaveClass("dark:fill-white");
    });
  });
});
