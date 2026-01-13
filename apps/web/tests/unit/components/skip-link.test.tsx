/**
 * SkipLink Component Tests
 *
 * Tests for the accessibility skip link component.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkipLink } from "@/components/skip-link";

describe("SkipLink", () => {
  describe("Rendering", () => {
    it("should render a link element", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("should have correct text content", () => {
      render(<SkipLink />);

      expect(screen.getByText("Skip to main content")).toBeInTheDocument();
    });

    it("should link to #main-content", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "#main-content");
    });
  });

  describe("Visibility", () => {
    it("should have sr-only class for screen reader visibility", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("sr-only");
    });

    it("should become visible on focus with focus:not-sr-only", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:not-sr-only");
    });

    it("should have absolute positioning on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:absolute");
    });

    it("should be positioned at top-left on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:top-4");
      expect(link).toHaveClass("focus:left-4");
    });

    it("should have high z-index on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:z-[10000]");
    });
  });

  describe("Styling on Focus", () => {
    it("should have gradient background on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:bg-gradient-to-r");
      expect(link).toHaveClass("focus:from-violet-600");
      expect(link).toHaveClass("focus:to-blue-600");
    });

    it("should have white text on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:text-white");
    });

    it("should have padding on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:px-4");
      expect(link).toHaveClass("focus:py-2");
    });

    it("should have rounded corners on focus", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:rounded-lg");
    });

    it("should have focus ring styling", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:outline-none");
      expect(link).toHaveClass("focus:ring-2");
      expect(link).toHaveClass("focus:ring-blue-300");
    });
  });

  describe("Accessibility", () => {
    it("should be focusable via keyboard", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      link.focus();

      expect(document.activeElement).toBe(link);
    });

    it("should be discoverable by screen readers", () => {
      render(<SkipLink />);

      // The link should be in the document and accessible
      const link = screen.getByRole("link", { name: /skip to main content/i });
      expect(link).toBeInTheDocument();
    });

    it("should provide meaningful link text", () => {
      render(<SkipLink />);

      const link = screen.getByRole("link");
      expect(link.textContent).toBe("Skip to main content");
    });
  });
});
